import type { Request, Response } from 'express'

import { ZodError } from 'zod'

import {
  SlotConflictError,
  SlotNotFoundError,
  createPublicBooking,
  listAvailableSlots,
} from '../lib/bookingStore.js'
import { sendBookingEmails } from '../lib/bookingEmailDelivery.js'
import { publicBookingSchema } from '../lib/bookingSchemas.js'

type PublicBookingRouteOptions = {
  resendApiKey?: string
  fromEmail?: string
  businessNotificationEmails?: string[]
}

function respondWithBookingError(error: unknown, response: Response) {
  if (error instanceof ZodError) {
    return response.status(400).json({
      message: error.issues[0]?.message || 'Please review the submitted details and try again.',
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
    message: 'An unexpected booking error occurred.',
  })
}

export function createPublicBookingRouter(options: PublicBookingRouteOptions) {
  return {
    async listSlots(_request: Request, response: Response) {
      try {
        const slots = await listAvailableSlots()
        return response.status(200).json({ slots })
      } catch (error) {
        return respondWithBookingError(error, response)
      }
    },

    async createBooking(request: Request, response: Response) {
      try {
        if (!request.is('application/json')) {
          return response.status(415).json({
            message: 'Bookings must be submitted as JSON.',
          })
        }

        const honeypotValue =
          typeof request.body?.companyWebsite === 'string'
            ? request.body.companyWebsite.trim()
            : ''

        if (honeypotValue) {
          return response.status(200).json({
            message: 'Booking confirmed.',
          })
        }

        const booking = await createPublicBooking(publicBookingSchema.parse(request.body))

        void sendBookingEmails(booking.id, booking, options)

        return response.status(200).json({
          bookingId: booking.id,
          message: 'Booking confirmed.',
          slot: booking.slot,
        })
      } catch (error) {
        return respondWithBookingError(error, response)
      }
    },
  }
}
