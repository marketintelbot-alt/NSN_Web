import { Resend } from 'resend'

import {
  createAuthorizationReceivedEmail,
  createBookingApprovedEmail,
  createCanceledBookingEmail,
  createChangesRequestedEmail,
  createCompletedServiceEmail,
  createDeclinedRequestEmail,
  createInquiryReceivedEmail,
  createInternalNewRequestEmail,
  createPaymentLinkEmail,
  createRefundedBookingEmail,
} from './serviceRequestEmails.js'
import {
  listAdminServiceRequests,
  markCustomerEmailSent,
  markInternalEmailSent,
  type CustomerEmailType,
  type InternalEmailType,
  type ServiceRequestRecord,
} from './serviceRequests.js'

export type ServiceRequestEmailOptions = {
  resendApiKey?: string
  fromEmail?: string
  businessNotificationEmails?: string[]
  throwOnFailure?: boolean
}

function isEmailConfigured(options: ServiceRequestEmailOptions) {
  return Boolean(
    options.resendApiKey &&
      options.fromEmail &&
      options.businessNotificationEmails &&
      options.businessNotificationEmails.length > 0,
  )
}

async function sendCustomerEmail(
  request: ServiceRequestRecord,
  emailType: CustomerEmailType,
  emailFactory: (request: ServiceRequestRecord) => { subject: string; html: string; text: string },
  options: ServiceRequestEmailOptions,
) {
  if (request.lastCustomerEmailType === emailType || !isEmailConfigured(options)) {
    return
  }

  const resend = new Resend(options.resendApiKey)
  const email = emailFactory(request)
  const result = await resend.emails.send(
    {
      from: options.fromEmail!,
      to: request.customerEmail,
      replyTo: options.businessNotificationEmails,
      subject: email.subject,
      html: email.html,
      text: email.text,
    },
    {
      idempotencyKey: `service-request/${request.id}/customer/${emailType}`,
    },
  )

  if (result.error) {
    throw new Error(result.error.message || 'Unable to send the customer email.')
  }

  await markCustomerEmailSent(request.id, emailType)
}

async function sendInternalEmail(
  request: ServiceRequestRecord,
  emailType: InternalEmailType,
  emailFactory: (request: ServiceRequestRecord) => { subject: string; html: string; text: string },
  options: ServiceRequestEmailOptions,
) {
  if (request.lastInternalEmailType === emailType || !isEmailConfigured(options)) {
    return
  }

  const resend = new Resend(options.resendApiKey)
  const email = emailFactory(request)
  const result = await resend.emails.send(
    {
      from: options.fromEmail!,
      to: options.businessNotificationEmails!,
      replyTo: request.customerEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
    },
    {
      idempotencyKey: `service-request/${request.id}/internal/${emailType}`,
    },
  )

  if (result.error) {
    throw new Error(result.error.message || 'Unable to send the internal email.')
  }

  await markInternalEmailSent(request.id, emailType)
}

async function safelySendEmail(
  task: Promise<void>,
  requestId: string,
  label: string,
  throwOnFailure = false,
) {
  try {
    await task
  } catch (error) {
    console.error(`Failed to send ${label} email.`, {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })

    if (throwOnFailure) {
      throw error
    }
  }
}

export async function sendInquiryReceivedEmails(
  request: ServiceRequestRecord,
  options: ServiceRequestEmailOptions,
) {
  await Promise.all([
    safelySendEmail(
      sendCustomerEmail(request, 'inquiry_received', createInquiryReceivedEmail, options),
      request.id,
      'inquiry_received customer',
      options.throwOnFailure,
    ),
    safelySendEmail(
      sendInternalEmail(request, 'new_inquiry', createInternalNewRequestEmail, options),
      request.id,
      'new_inquiry internal',
      options.throwOnFailure,
    ),
  ])
}

export async function sendAuthorizationReceivedEmails(
  request: ServiceRequestRecord,
  options: ServiceRequestEmailOptions,
) {
  await Promise.all([
    safelySendEmail(
      sendCustomerEmail(
        request,
        'authorization_received',
        createAuthorizationReceivedEmail,
        options,
      ),
      request.id,
      'authorization_received customer',
      options.throwOnFailure,
    ),
    safelySendEmail(
      sendInternalEmail(request, 'authorization_received', createInternalNewRequestEmail, options),
      request.id,
      'authorization_received internal',
      options.throwOnFailure,
    ),
  ])
}

export async function sendBookingApprovedEmail(
  request: ServiceRequestRecord,
  options: ServiceRequestEmailOptions,
) {
  await safelySendEmail(
    sendCustomerEmail(request, 'booking_approved', createBookingApprovedEmail, options),
    request.id,
    'booking_approved customer',
    options.throwOnFailure,
  )
}

export async function sendPaymentLinkEmail(
  request: ServiceRequestRecord,
  checkoutUrl: string,
  options: ServiceRequestEmailOptions,
) {
  await safelySendEmail(
    (async () => {
      if (!isEmailConfigured(options)) {
        return
      }

      const resend = new Resend(options.resendApiKey)
      const email = createPaymentLinkEmail(request, checkoutUrl)
      const result = await resend.emails.send(
        {
          from: options.fromEmail!,
          to: request.customerEmail,
          replyTo: options.businessNotificationEmails,
          subject: email.subject,
          html: email.html,
          text: email.text,
        },
        {
          idempotencyKey: `service-request/${request.id}/customer/payment-link/${request.stripeCheckoutSessionId || 'pending'}`,
        },
      )

      if (result.error) {
        throw new Error(result.error.message || 'Unable to send the payment link email.')
      }
    })(),
    request.id,
    'payment_link customer',
    options.throwOnFailure,
  )
}

export async function sendChangesRequestedEmail(
  request: ServiceRequestRecord,
  options: ServiceRequestEmailOptions,
) {
  await safelySendEmail(
    sendCustomerEmail(request, 'changes_requested', createChangesRequestedEmail, options),
    request.id,
    'changes_requested customer',
    options.throwOnFailure,
  )
}

export async function sendDeclinedRequestEmail(
  request: ServiceRequestRecord,
  options: ServiceRequestEmailOptions,
) {
  await safelySendEmail(
    sendCustomerEmail(request, 'request_declined', createDeclinedRequestEmail, options),
    request.id,
    'request_declined customer',
    options.throwOnFailure,
  )
}

export async function sendCanceledBookingEmail(
  request: ServiceRequestRecord,
  options: ServiceRequestEmailOptions,
) {
  await safelySendEmail(
    sendCustomerEmail(request, 'booking_canceled', createCanceledBookingEmail, options),
    request.id,
    'booking_canceled customer',
    options.throwOnFailure,
  )
}

export async function sendCompletedServiceEmail(
  request: ServiceRequestRecord,
  options: ServiceRequestEmailOptions,
) {
  await safelySendEmail(
    sendCustomerEmail(request, 'service_completed', createCompletedServiceEmail, options),
    request.id,
    'service_completed customer',
    options.throwOnFailure,
  )
}

export async function sendRefundedBookingEmail(
  request: ServiceRequestRecord,
  options: ServiceRequestEmailOptions,
) {
  await safelySendEmail(
    sendCustomerEmail(request, 'booking_refunded', createRefundedBookingEmail, options),
    request.id,
    'booking_refunded customer',
    options.throwOnFailure,
  )
}

export async function retryPendingServiceRequestEmails(
  options: ServiceRequestEmailOptions,
) {
  const requests = await listAdminServiceRequests()

  for (const request of requests) {
    if (request.bookingStatus === 'refunded') {
      await sendRefundedBookingEmail(request, options)
      continue
    }

    if (request.bookingStatus === 'completed') {
      await sendCompletedServiceEmail(request, options)
      continue
    }

    if (request.bookingStatus === 'canceled') {
      await sendCanceledBookingEmail(request, options)
      continue
    }

    if (request.bookingStatus === 'declined') {
      await sendDeclinedRequestEmail(request, options)
      continue
    }

    if (request.bookingStatus === 'changes_requested') {
      await sendChangesRequestedEmail(request, options)
      continue
    }

    if (request.bookingStatus === 'confirmed' && request.paymentStatus === 'captured') {
      await sendBookingApprovedEmail(request, options)
      continue
    }

    if (request.paymentStatus === 'authorized') {
      await sendAuthorizationReceivedEmails(request, options)
      continue
    }

    if (
      request.requestKind === 'inquiry' &&
      request.bookingStatus === 'pending_review'
    ) {
      await sendInquiryReceivedEmails(request, options)
    }
  }
}
