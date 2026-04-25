import type { Request, Response } from 'express'

import { ZodError } from 'zod'

import { getPrimaryAdminEmail } from '../lib/adminSession.js'
import { getBusinessNotificationEmails } from '../lib/notificationEmails.js'
import {
  sendBookingApprovedEmail,
  sendCanceledBookingEmail,
  sendChangesRequestedEmail,
  sendCompletedServiceEmail,
  sendDeclinedRequestEmail,
  type ServiceRequestEmailOptions,
} from '../lib/serviceRequestEmailDelivery.js'
import { adminRequestNoteSchema } from '../lib/serviceRequestSchemas.js'
import {
  cancelServiceRequest,
  captureAuthorizedServiceRequest,
  completeServiceRequest,
  declineServiceRequest,
  listAdminServiceRequests,
  requestServiceChanges,
} from '../lib/serviceRequests.js'

function getRouteParam(request: Request, key: string) {
  const value = request.params[key]
  return Array.isArray(value) ? value[0] || '' : value || ''
}

function getEmailOptions(): ServiceRequestEmailOptions {
  return {
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.FROM_EMAIL,
    businessNotificationEmails: getBusinessNotificationEmails(getPrimaryAdminEmail()),
  }
}

function respondWithAdminRequestError(error: unknown, response: Response) {
  if (error instanceof ZodError) {
    return response.status(400).json({
      message: error.issues[0]?.message || 'Please review the submitted fields and try again.',
    })
  }

  if (error instanceof Error) {
    return response.status(400).json({
      message: error.message,
    })
  }

  return response.status(500).json({
    message: 'An unexpected admin request error occurred.',
  })
}

export async function readAdminServiceRequestsHandler(_request: Request, response: Response) {
  try {
    const requests = await listAdminServiceRequests()
    return response.status(200).json({
      requests,
    })
  } catch (error) {
    return respondWithAdminRequestError(error, response)
  }
}

export async function approveServiceRequestHandler(request: Request, response: Response) {
  try {
    const payload = adminRequestNoteSchema.parse(request.body)
    const updatedRequest = await captureAuthorizedServiceRequest(
      getRouteParam(request, 'requestId'),
      payload.adminNotes,
    )

    void sendBookingApprovedEmail(updatedRequest, getEmailOptions())

    return response.status(200).json({
      request: updatedRequest,
      message: 'Payment captured and request confirmed.',
    })
  } catch (error) {
    return respondWithAdminRequestError(error, response)
  }
}

export async function requestServiceChangesHandler(request: Request, response: Response) {
  try {
    const payload = adminRequestNoteSchema.parse(request.body)
    const updatedRequest = await requestServiceChanges(
      getRouteParam(request, 'requestId'),
      payload.adminNotes,
    )

    void sendChangesRequestedEmail(updatedRequest, getEmailOptions())

    return response.status(200).json({
      request: updatedRequest,
      message: 'The request has been moved to changes requested.',
    })
  } catch (error) {
    return respondWithAdminRequestError(error, response)
  }
}

export async function declineServiceRequestHandler(request: Request, response: Response) {
  try {
    const payload = adminRequestNoteSchema.parse(request.body)
    const updatedRequest = await declineServiceRequest(
      getRouteParam(request, 'requestId'),
      payload.adminNotes,
    )

    void sendDeclinedRequestEmail(updatedRequest, getEmailOptions())

    return response.status(200).json({
      request: updatedRequest,
      message: 'The request has been declined and any authorization was canceled.',
    })
  } catch (error) {
    return respondWithAdminRequestError(error, response)
  }
}

export async function completeServiceRequestHandler(request: Request, response: Response) {
  try {
    const payload = adminRequestNoteSchema.parse(request.body)
    const updatedRequest = await completeServiceRequest(
      getRouteParam(request, 'requestId'),
      payload.adminNotes,
    )

    void sendCompletedServiceEmail(updatedRequest, getEmailOptions())

    return response.status(200).json({
      request: updatedRequest,
      message: 'The request has been marked complete.',
    })
  } catch (error) {
    return respondWithAdminRequestError(error, response)
  }
}

export async function cancelServiceRequestHandler(request: Request, response: Response) {
  try {
    const payload = adminRequestNoteSchema.parse(request.body)
    const updatedRequest = await cancelServiceRequest(
      getRouteParam(request, 'requestId'),
      payload.adminNotes,
    )

    void sendCanceledBookingEmail(updatedRequest, getEmailOptions())

    return response.status(200).json({
      request: updatedRequest,
      message: 'The request has been marked canceled.',
    })
  } catch (error) {
    return respondWithAdminRequestError(error, response)
  }
}
