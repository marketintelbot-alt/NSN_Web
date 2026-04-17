import type { NextFunction, Request, Response } from 'express'

import { ZodError } from 'zod'

import { clearAdminSessionCookie, readAdminSessionCookie } from '../lib/adminCookie.js'
import { getPrimaryAdminEmail, verifyAdminSessionToken } from '../lib/adminSession.js'
import { sendBookingEmails } from '../lib/bookingEmailDelivery.js'
import {
  SlotConflictError,
  SlotNotFoundError,
  createAdminBooking,
  deleteAdminSlot,
  listAdminDashboard,
  resendBookingEmails,
  updateAdminBooking,
  upsertAdminSlot,
} from '../lib/bookingStore.js'
import { adminBookingSchema, adminSlotSchema } from '../lib/bookingSchemas.js'
import { hasSupabaseAdminConfig } from '../lib/supabaseAdmin.js'

type EmailOptions = {
  resendApiKey?: string
  fromEmail?: string
  businessNotificationEmail?: string
}

function getRouteParam(request: Request, key: string) {
  const value = request.params[key]
  return Array.isArray(value) ? value[0] || '' : value || ''
}

function getEmailOptions(): EmailOptions {
  return {
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.FROM_EMAIL,
    businessNotificationEmail: process.env.BUSINESS_NOTIFICATION_EMAIL?.trim() || getPrimaryAdminEmail(),
  }
}

export function requireAdminSession(request: Request, response: Response, next: NextFunction) {
  const token = readAdminSessionCookie(request)
  const session = token ? verifyAdminSessionToken(token) : null

  if (!session) {
    clearAdminSessionCookie(response)
    return response.status(401).json({
      message: 'Admin authorization is required.',
    })
  }

  if (!hasSupabaseAdminConfig()) {
    return response.status(503).json({
      message: 'Booking management is not configured yet.',
    })
  }

  response.locals.adminEmail = session.email
  next()
}

function respondWithAdminError(error: unknown, response: Response) {
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
    message: 'An unexpected admin dashboard error occurred.',
  })
}

export async function readAdminDashboard(_request: Request, response: Response) {
  try {
    const dashboard = await listAdminDashboard()
    return response.status(200).json(dashboard)
  } catch (error) {
    return respondWithAdminError(error, response)
  }
}

export async function createAdminSlot(request: Request, response: Response) {
  try {
    const result = await upsertAdminSlot(adminSlotSchema.parse(request.body))
    return response.status(200).json(result)
  } catch (error) {
    return respondWithAdminError(error, response)
  }
}

export async function updateAdminSlot(request: Request, response: Response) {
  try {
    const result = await upsertAdminSlot(
      adminSlotSchema.parse({
        ...request.body,
        slotId: getRouteParam(request, 'slotId'),
      }),
    )
    return response.status(200).json(result)
  } catch (error) {
    return respondWithAdminError(error, response)
  }
}

export async function removeAdminSlot(request: Request, response: Response) {
  try {
    await deleteAdminSlot(getRouteParam(request, 'slotId'))
    return response.status(204).send()
  } catch (error) {
    return respondWithAdminError(error, response)
  }
}

export async function createAdminBookingHandler(request: Request, response: Response) {
  try {
    const booking = await createAdminBooking(adminBookingSchema.parse(request.body))

    void sendBookingEmails(booking.id, booking, getEmailOptions())

    return response.status(200).json({
      bookingId: booking.id,
      message: 'Booking created.',
    })
  } catch (error) {
    return respondWithAdminError(error, response)
  }
}

export async function updateAdminBookingHandler(request: Request, response: Response) {
  try {
    const booking = await updateAdminBooking(
      getRouteParam(request, 'bookingId'),
      adminBookingSchema.parse({
        ...request.body,
        bookingId: getRouteParam(request, 'bookingId'),
      }),
    )

    return response.status(200).json({
      bookingId: booking.id,
      message: 'Booking updated.',
    })
  } catch (error) {
    return respondWithAdminError(error, response)
  }
}

export async function resendAdminBookingEmails(request: Request, response: Response) {
  try {
    const bookingId = getRouteParam(request, 'bookingId')
    const booking = await resendBookingEmails(bookingId)

    void sendBookingEmails(bookingId, booking, getEmailOptions())

    return response.status(202).json({
      bookingId,
      message: 'Confirmation email retry queued.',
    })
  } catch (error) {
    return respondWithAdminError(error, response)
  }
}
