import { Resend } from 'resend'

import type { AdminBooking } from './bookingStore.js'
import {
  createBusinessNotificationEmail,
  createCustomerConfirmationEmail,
} from './emailTemplates.js'
import { updateBookingEmailStatus } from './bookingStore.js'

export type BookingEmailOptions = {
  resendApiKey?: string
  fromEmail?: string
  businessNotificationEmails?: string[]
}

function getResultErrorMessage(result: PromiseSettledResult<{ error: { message?: string } | null }>) {
  if (result.status === 'rejected') {
    return result.reason instanceof Error ? result.reason.message : 'Unknown email delivery error.'
  }

  return result.value.error?.message || null
}

export async function sendBookingEmails(
  bookingId: string,
  booking: AdminBooking,
  options: BookingEmailOptions,
) {
  try {
    if (
      !options.resendApiKey ||
      !options.fromEmail ||
      !options.businessNotificationEmails ||
      options.businessNotificationEmails.length === 0
    ) {
      const configurationMessage = 'Email delivery is not configured on the server.'

      await updateBookingEmailStatus(bookingId, {
        emailCustomerStatus: 'failed',
        emailCustomerError: configurationMessage,
        emailAdminStatus: 'failed',
        emailAdminError: configurationMessage,
      })

      console.error('Booking email delivery skipped.', {
        bookingId,
        reason: configurationMessage,
      })

      return
    }

    const resend = new Resend(options.resendApiKey)
    const adminEmail = createBusinessNotificationEmail(booking)
    const customerEmail = createCustomerConfirmationEmail(booking)

    const [adminResult, customerResult] = await Promise.allSettled([
      resend.emails.send({
        from: options.fromEmail,
        to: options.businessNotificationEmails,
        replyTo: booking.email,
        subject: adminEmail.subject,
        html: adminEmail.html,
        text: adminEmail.text,
      }),
      resend.emails.send({
        from: options.fromEmail,
        to: booking.email,
        replyTo: options.businessNotificationEmails,
        subject: customerEmail.subject,
        html: customerEmail.html,
        text: customerEmail.text,
      }),
    ])

    const adminError = getResultErrorMessage(adminResult)
    const customerError = getResultErrorMessage(customerResult)
    const nowIso = new Date().toISOString()

    await updateBookingEmailStatus(bookingId, {
      emailCustomerStatus: customerError ? 'failed' : 'sent',
      emailCustomerError: customerError,
      emailCustomerSentAt: customerError ? null : nowIso,
      emailAdminStatus: adminError ? 'failed' : 'sent',
      emailAdminError: adminError,
      emailAdminSentAt: adminError ? null : nowIso,
    })

    if (adminError || customerError) {
      console.error('Booking email delivery failed.', {
        bookingId,
        adminError,
        customerError,
      })
    }
  } catch (error) {
    const failureMessage =
      error instanceof Error ? error.message : 'Unknown booking email delivery error.'

    try {
      await updateBookingEmailStatus(bookingId, {
        emailCustomerStatus: 'failed',
        emailCustomerError: failureMessage,
        emailAdminStatus: 'failed',
        emailAdminError: failureMessage,
      })
    } catch (statusError) {
      console.error('Failed to record booking email delivery status.', {
        bookingId,
        error: statusError instanceof Error ? statusError.message : String(statusError),
      })
    }

    console.error('Booking email delivery crashed.', {
      bookingId,
      error: failureMessage,
    })
  }
}
