import type { Request, Response } from 'express'

import { ZodError } from 'zod'

import { getPrimaryAdminEmail } from '../lib/adminSession.js'
import { getBusinessNotificationEmails } from '../lib/notificationEmails.js'
import { listPublicServiceCatalog } from '../lib/serviceCatalog.js'
import {
  sendInquiryReceivedEmails,
  type ServiceRequestEmailOptions,
} from '../lib/serviceRequestEmailDelivery.js'
import { publicServiceRequestSchema } from '../lib/serviceRequestSchemas.js'
import {
  createPublicServiceRequest,
  readPublicServiceRequestConfirmation,
} from '../lib/serviceRequests.js'

function getEmailOptions(): ServiceRequestEmailOptions {
  return {
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.FROM_EMAIL,
    businessNotificationEmails: getBusinessNotificationEmails(getPrimaryAdminEmail()),
  }
}

function getQueryStringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function getRouteParam(request: Request, key: string) {
  const value = request.params[key]
  return Array.isArray(value) ? value[0] || '' : value || ''
}

function getErrorField(error: unknown, key: 'code' | 'details' | 'hint' | 'message') {
  if (!error || typeof error !== 'object' || !(key in error)) {
    return ''
  }

  const value = error[key as keyof typeof error]
  return typeof value === 'string' ? value : ''
}

function summarizeRequestError(error: unknown) {
  return {
    name: error instanceof Error ? error.name : getErrorField(error, 'code') || 'UnknownError',
    message:
      error instanceof Error
        ? error.message
        : getErrorField(error, 'message') || 'Unknown service request error.',
    code: getErrorField(error, 'code'),
    details: getErrorField(error, 'details'),
    hint: getErrorField(error, 'hint'),
  }
}

function isServiceDependencyError(error: unknown) {
  const summary = summarizeRequestError(error)
  const searchableError = [
    summary.message,
    summary.code,
    summary.details,
    summary.hint,
  ].join(' ')

  return /SUPABASE|service_requests|schema cache|relation .* does not exist|fetch failed|ENOTFOUND|JWT|permission denied|row-level security/i.test(
    searchableError,
  )
}

function isCheckoutConfigurationError(error: unknown) {
  const summary = summarizeRequestError(error)
  const searchableError = [
    summary.message,
    summary.code,
    summary.details,
    summary.hint,
  ].join(' ')

  return /Stripe is not configured|site URL is not configured|Online checkout .* not configured|Stripe price|checkout URL/i.test(
    searchableError,
  )
}

function logRequestError(context: string, error: unknown) {
  console.error(context, summarizeRequestError(error))
}

function respondWithRequestError(error: unknown, response: Response) {
  if (error instanceof ZodError) {
    return response.status(400).json({
      message: error.issues[0]?.message || 'Please review the submitted details and try again.',
    })
  }

  if (isServiceDependencyError(error)) {
    logRequestError('Service request dependency failure.', error)

    return response.status(503).json({
      message:
        'Online requests are temporarily unavailable. Please call or email North Shore Nautical and we will help directly.',
    })
  }

  if (isCheckoutConfigurationError(error)) {
    logRequestError('Service request checkout configuration failure.', error)

    return response.status(503).json({
      message:
        'Secure checkout is temporarily unavailable. Please submit the request for review or contact North Shore Nautical directly.',
    })
  }

  if (error instanceof Error) {
    logRequestError('Service request validation failure.', error)

    return response.status(400).json({
      message: error.message,
    })
  }

  logRequestError('Unexpected service request failure.', error)

  return response.status(500).json({
    message: 'An unexpected service request error occurred.',
  })
}

export function listServiceCatalogHandler(_request: Request, response: Response) {
  return response.status(200).json({
    services: listPublicServiceCatalog(),
  })
}

export async function createServiceRequestHandler(request: Request, response: Response) {
  try {
    if (!request.is('application/json')) {
      return response.status(415).json({
        message: 'Requests must be submitted as JSON.',
      })
    }

    const honeypotValue =
      typeof request.body?.companyWebsite === 'string'
        ? request.body.companyWebsite.trim()
        : ''

    if (honeypotValue) {
      return response.status(200).json({
        outcome: 'ignored',
        message: 'Request received.',
      })
    }

    const result = await createPublicServiceRequest(publicServiceRequestSchema.parse(request.body))

    if (result.kind === 'inquiry') {
      void sendInquiryReceivedEmails(result.request, getEmailOptions())

      return response.status(200).json({
        outcome: 'inquiry',
        requestId: result.request.id,
        message:
          'Thanks — your inquiry has been received. North Shore Nautical will review your details and follow up shortly.',
      })
    }

    return response.status(200).json({
      outcome: 'checkout',
      requestId: result.request.id,
      checkoutUrl: result.checkoutUrl,
    })
  } catch (error) {
    return respondWithRequestError(error, response)
  }
}

export async function readServiceRequestConfirmationHandler(request: Request, response: Response) {
  try {
    const requestId = getRouteParam(request, 'requestId')
    const sessionId = getQueryStringValue(request.query.session_id)
    const serviceRequest = await readPublicServiceRequestConfirmation(requestId, sessionId)

    if (!serviceRequest) {
      return response.status(404).json({
        message: 'That request could not be found.',
      })
    }

    return response.status(200).json({
      request: {
        id: serviceRequest.id,
        requestKind: serviceRequest.requestKind,
        bookingStatus: serviceRequest.bookingStatus,
        paymentStatus: serviceRequest.paymentStatus,
        selectedServiceName: serviceRequest.selectedServiceName,
        requestedDateTimeLabel: serviceRequest.requestedDateTimeLabel,
        calculatedPriceCents: serviceRequest.calculatedPriceCents,
        customerName: serviceRequest.customerName,
      },
    })
  } catch (error) {
    return respondWithRequestError(error, response)
  }
}
