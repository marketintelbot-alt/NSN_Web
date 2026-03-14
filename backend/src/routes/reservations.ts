import type { Request, Response } from 'express'

import { Resend } from 'resend'

import { createBusinessNotificationEmail, createCustomerConfirmationEmail } from '../lib/emailTemplates.js'
import { reservationSchema } from '../lib/reservationSchema.js'

type ReservationRouteOptions = {
  resendApiKey?: string
  fromEmail?: string
  businessNotificationEmail?: string
}

export function createReservationsHandler(options: ReservationRouteOptions) {
  return async function reservationsHandler(request: Request, response: Response) {
    if (!request.is('application/json')) {
      return response.status(415).json({
        message: 'Reservation requests must be submitted as JSON.',
      })
    }

    const honeypotValue =
      typeof request.body?.companyWebsite === 'string'
        ? request.body.companyWebsite.trim()
        : ''

    if (honeypotValue) {
      return response.status(200).json({
        message: 'Reservation request received.',
      })
    }

    const parsedReservation = reservationSchema.safeParse(request.body)

    if (!parsedReservation.success) {
      const fieldErrors = parsedReservation.error.flatten().fieldErrors
      return response.status(400).json({
        message: 'Please review the highlighted fields and try again.',
        fieldErrors,
      })
    }

    if (!options.resendApiKey || !options.fromEmail || !options.businessNotificationEmail) {
      return response.status(500).json({
        message:
          'The reservation service is not configured yet. Please add the required email environment variables and try again.',
      })
    }

    const resend = new Resend(options.resendApiKey)
    const reservation = parsedReservation.data

    const businessEmail = createBusinessNotificationEmail(reservation)
    const customerEmail = createCustomerConfirmationEmail(reservation)

    const [businessResult, customerResult] = await Promise.all([
      resend.emails.send({
        from: options.fromEmail,
        to: options.businessNotificationEmail,
        replyTo: reservation.email,
        subject: businessEmail.subject,
        html: businessEmail.html,
        text: businessEmail.text,
      }),
      resend.emails.send({
        from: options.fromEmail,
        to: reservation.email,
        replyTo: options.businessNotificationEmail,
        subject: customerEmail.subject,
        html: customerEmail.html,
        text: customerEmail.text,
      }),
    ])

    if (businessResult.error || customerResult.error) {
      console.error('Resend delivery error', {
        businessError: businessResult.error?.message || null,
        customerError: customerResult.error?.message || null,
      })

      return response.status(502).json({
        message:
          'The reservation request could not be finalized because email delivery failed. Please try again or contact North Shore Nautical directly.',
      })
    }

    return response.status(200).json({
      message: 'Reservation request received.',
    })
  }
}
