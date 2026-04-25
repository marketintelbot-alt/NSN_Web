import type { Request, Response } from 'express'

import { ZodError } from 'zod'

import { getPrimaryAdminEmail } from '../lib/adminSession.js'
import { getBusinessNotificationEmails } from '../lib/notificationEmails.js'
import { listPublicServiceCatalog } from '../lib/serviceCatalog.js'
import {
  sendAuthorizationReceivedEmails,
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

function respondWithRequestError(error: unknown, response: Response) {
  if (error instanceof ZodError) {
    return response.status(400).json({
      message: error.issues[0]?.message || 'Please review the submitted details and try again.',
    })
  }

  if (error instanceof Error) {
    return response.status(400).json({
      message: error.message,
    })
  }

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

    if (
      serviceRequest.paymentStatus === 'authorized' &&
      serviceRequest.lastCustomerEmailType !== 'authorization_received'
    ) {
      void sendAuthorizationReceivedEmails(serviceRequest, getEmailOptions())
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
