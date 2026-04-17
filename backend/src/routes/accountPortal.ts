import type { NextFunction, Request, Response } from 'express'

import { ZodError } from 'zod'

import { readAdminSessionCookie } from '../lib/adminCookie.js'
import { getPrimaryAdminEmail, verifyAccountSessionToken } from '../lib/adminSession.js'
import {
  readClientAccountById,
  type ClientAccount,
  updateClientProfile,
} from '../lib/clientAccounts.js'
import {
  SlotConflictError,
  SlotNotFoundError,
  createClientBooking,
  listClientPortal,
  updateClientBooking,
} from '../lib/bookingStore.js'
import { sendBookingEmails } from '../lib/bookingEmailDelivery.js'
import {
  clientBookingSchema,
  clientBookingUpdateSchema,
  clientProfileSchema,
} from '../lib/bookingSchemas.js'
import { getBusinessNotificationEmails } from '../lib/notificationEmails.js'
import { hasSupabaseAdminConfig } from '../lib/supabaseAdmin.js'

function getEmailOptions() {
  return {
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.FROM_EMAIL,
    businessNotificationEmails: getBusinessNotificationEmails(getPrimaryAdminEmail()),
  }
}

function respondWithPortalError(error: unknown, response: Response) {
  if (error instanceof ZodError) {
    return response.status(400).json({
      message: error.issues[0]?.message || 'Please review the submitted fields and try again.',
    })
  }

  if (error instanceof SlotConflictError) {
    return response.status(409).json({
      message: error.message,
    })
  }

  if (error instanceof SlotNotFoundError) {
    return response.status(404).json({
      message: error.message,
    })
  }

  if (error instanceof Error) {
    return response.status(400).json({
      message: error.message,
    })
  }

  return response.status(500).json({
    message: 'An unexpected client account error occurred.',
  })
}

export async function requireClientSession(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const token = readAdminSessionCookie(request)
  const session = token ? verifyAccountSessionToken(token) : null

  if (!session || session.role !== 'client' || !session.clientAccountId) {
    return response.status(401).json({
      message: 'Client authorization is required.',
    })
  }

  if (!hasSupabaseAdminConfig()) {
    return response.status(503).json({
      message: 'Booking management is not configured yet.',
    })
  }

  const clientAccount = await readClientAccountById(session.clientAccountId)

  if (!clientAccount || !clientAccount.isActive) {
    return response.status(401).json({
      message: 'This client account is not available right now.',
    })
  }

  response.locals.clientAccount = clientAccount
  next()
}

function getClientAccount(response: Response) {
  return response.locals.clientAccount as ClientAccount
}

export async function readClientPortalHandler(_request: Request, response: Response) {
  try {
    const portal = await listClientPortal(getClientAccount(response))
    return response.status(200).json(portal)
  } catch (error) {
    return respondWithPortalError(error, response)
  }
}

export async function createClientBookingHandler(request: Request, response: Response) {
  try {
    const booking = await createClientBooking(
      getClientAccount(response),
      clientBookingSchema.parse(request.body),
    )

    void sendBookingEmails(booking.id, booking, getEmailOptions())

    return response.status(200).json({
      bookingId: booking.id,
      message: 'Booking confirmed.',
      slot: booking.slot,
    })
  } catch (error) {
    return respondWithPortalError(error, response)
  }
}

function getRouteParam(request: Request, key: string) {
  const value = request.params[key]
  return Array.isArray(value) ? value[0] || '' : value || ''
}

export async function updateClientBookingHandler(request: Request, response: Response) {
  try {
    const booking = await updateClientBooking(
      getClientAccount(response),
      getRouteParam(request, 'bookingId'),
      clientBookingUpdateSchema.parse({
        ...request.body,
        bookingId: getRouteParam(request, 'bookingId'),
      }),
    )

    return response.status(200).json({
      bookingId: booking.id,
      booking,
      message: booking.status === 'cancelled' ? 'Reservation cancelled.' : 'Reservation updated.',
    })
  } catch (error) {
    return respondWithPortalError(error, response)
  }
}

export async function updateClientProfileHandler(request: Request, response: Response) {
  try {
    const client = await updateClientProfile(
      getClientAccount(response).id,
      clientProfileSchema.parse(request.body),
    )

    return response.status(200).json({
      client,
      message: 'Profile updated.',
    })
  } catch (error) {
    return respondWithPortalError(error, response)
  }
}
