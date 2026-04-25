import type { ServiceRequestRecord } from './serviceRequests.js'
import { escapeHtml } from './sanitize.js'

function getSiteUrl() {
  return (
    process.env.SITE_URL?.replace(/\/$/, '') ||
    process.env.VITE_SITE_URL?.replace(/\/$/, '') ||
    'https://nsnautical.com'
  )
}

function formatCurrency(amountCents: number | null) {
  if (typeof amountCents !== 'number') {
    return 'Pending review'
  }

  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  }).format(amountCents / 100)
}

function renderDetailRow(label: string, value: string) {
  return `<tr><td style="padding:10px 0;color:#557085;font-size:13px;vertical-align:top;width:210px;">${escapeHtml(label)}</td><td style="padding:10px 0;color:#0d2740;font-size:14px;font-weight:600;">${escapeHtml(value)}</td></tr>`
}

function renderEmailShell(title: string, intro: string, body: string) {
  const logoUrl = `${getSiteUrl()}/icons/apple-touch-icon.png`

  return `
    <div style="font-family:Arial,sans-serif;background:#f6fbff;padding:28px;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border-radius:28px;padding:34px;border:1px solid rgba(13,39,64,0.08);box-shadow:0 20px 50px rgba(13,39,64,0.08);">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;">
          <img src="${logoUrl}" alt="North Shore Nautical" width="54" height="54" style="width:54px;height:54px;border-radius:16px;display:block;" />
          <div>
            <p style="margin:0;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#6f91aa;font-weight:700;">North Shore Nautical</p>
            <p style="margin:6px 0 0;color:#5c7386;font-size:13px;">Premium Marine Care &amp; Advisory</p>
          </div>
        </div>
        <h1 style="margin:0;color:#0d2740;font-size:32px;line-height:1.08;">${escapeHtml(title)}</h1>
        <p style="margin:16px 0 0;color:#5c7386;font-size:15px;line-height:1.8;">${intro}</p>
        ${body}
      </div>
    </div>
  `
}

function renderRequestSummary(request: ServiceRequestRecord) {
  const details = [
    ['Service', request.selectedServiceName || 'Not sure what I need'],
    ['Requested Date', request.requestedDateTimeLabel || 'Pending review'],
    ['Boat Length', request.boatLengthRounded ? `${request.boatLengthRounded} ft` : 'Not provided'],
    ['Boat Details', request.boatMakeModelYear || 'Not provided'],
    ['Location / Marina', request.boatLocationMarina || 'Not provided'],
    ['Estimate', formatCurrency(request.calculatedPriceCents)],
  ]

  return `
    <div style="margin-top:26px;padding:22px 24px;border-radius:22px;background:#f4f9fd;border:1px solid rgba(13,39,64,0.08);">
      <p style="margin:0;color:#0d2740;font-size:14px;font-weight:700;">Request Summary</p>
      <table style="width:100%;border-collapse:collapse;margin-top:14px;">
        ${details.map(([label, value]) => renderDetailRow(label, value)).join('')}
      </table>
    </div>
  `
}

function buildInternalDetails(request: ServiceRequestRecord) {
  return [
    ['Client', request.customerName],
    ['Email', request.customerEmail],
    ['Phone', request.customerPhone],
    ['Request Type', request.requestKind === 'booking' ? 'Booking request' : 'Inquiry'],
    ['Service', request.selectedServiceName || 'Not sure what I need'],
    ['Requested Date', request.requestedDateTimeLabel || 'Pending review'],
    ['Boat Length', request.boatLengthRounded ? `${request.boatLengthRounded} ft` : 'Not provided'],
    ['Boat Details', request.boatMakeModelYear || 'Not provided'],
    ['Location / Marina', request.boatLocationMarina || 'Not provided'],
    ['Estimate', formatCurrency(request.calculatedPriceCents)],
    ['Booking Status', request.bookingStatus.replaceAll('_', ' ')],
    ['Payment Status', request.paymentStatus.replaceAll('_', ' ')],
    [
      'Quote Review Reasons',
      request.quoteTriggerReasons.length > 0 ? request.quoteTriggerReasons.join(', ') : 'None',
    ],
    ['Customer Notes', request.customerNotes || 'No notes provided.'],
  ]
}

export function createInquiryReceivedEmail(request: ServiceRequestRecord) {
  const html = renderEmailShell(
    'Inquiry Received',
    `Thanks, <strong style="color:#0d2740;">${escapeHtml(request.customerName)}</strong>. Your inquiry has been received and is now with the North Shore Nautical team for review.`,
    `
      ${renderRequestSummary(request)}
      <p style="margin:22px 0 0;color:#5c7386;font-size:14px;line-height:1.8;">
        Thanks — your inquiry has been received. North Shore Nautical will review your details and follow up shortly.
      </p>
      <p style="margin:16px 0 0;color:#5c7386;font-size:14px;line-height:1.8;">
        A North Shore Nautical team member will follow up directly if additional access details are needed.
      </p>
    `,
  )

  const text = [
    'Inquiry Received | North Shore Nautical',
    '',
    'Thanks — your inquiry has been received. North Shore Nautical will review your details and follow up shortly.',
    `Service: ${request.selectedServiceName || 'Not sure what I need'}`,
    `Requested date: ${request.requestedDateTimeLabel || 'Pending review'}`,
    `Estimate: ${formatCurrency(request.calculatedPriceCents)}`,
  ].join('\n')

  return {
    subject: 'Inquiry Received | North Shore Nautical',
    html,
    text,
  }
}

export function createAuthorizationReceivedEmail(request: ServiceRequestRecord) {
  const html = renderEmailShell(
    'Appointment Request Received',
    `Thanks, <strong style="color:#0d2740;">${escapeHtml(request.customerName)}</strong>. Your appointment request is in review.`,
    `
      ${renderRequestSummary(request)}
      <p style="margin:22px 0 0;color:#5c7386;font-size:14px;line-height:1.8;">
        Your appointment request has been received. Your payment method has been authorized, but payment will not be captured until North Shore Nautical reviews and approves your request. You will hear from us shortly.
      </p>
      <p style="margin:16px 0 0;color:#5c7386;font-size:14px;line-height:1.8;">
        A North Shore Nautical team member will follow up directly if additional access details are needed.
      </p>
    `,
  )

  const text = [
    'Appointment Request Received | North Shore Nautical',
    '',
    'Your appointment request has been received. Your payment method has been authorized, but payment will not be captured until North Shore Nautical reviews and approves your request. You will hear from us shortly.',
    `Service: ${request.selectedServiceName || 'Not sure what I need'}`,
    `Requested date: ${request.requestedDateTimeLabel || 'Pending review'}`,
    `Estimate: ${formatCurrency(request.calculatedPriceCents)}`,
  ].join('\n')

  return {
    subject: 'Appointment Request Received | North Shore Nautical',
    html,
    text,
  }
}

export function createBookingApprovedEmail(request: ServiceRequestRecord) {
  const html = renderEmailShell(
    'Appointment Approved',
    `Your request has been reviewed and approved by North Shore Nautical.`,
    `
      ${renderRequestSummary(request)}
      <p style="margin:22px 0 0;color:#5c7386;font-size:14px;line-height:1.8;">
        Your appointment has been approved and your payment has been processed. Your service window is now confirmed.
      </p>
    `,
  )

  const text = [
    'Appointment Approved | North Shore Nautical',
    '',
    'Your appointment has been approved and your payment has been processed. Your service window is now confirmed.',
    `Service: ${request.selectedServiceName || 'Not sure what I need'}`,
    `Requested date: ${request.requestedDateTimeLabel || 'Pending review'}`,
  ].join('\n')

  return {
    subject: 'Appointment Approved | North Shore Nautical',
    html,
    text,
  }
}

export function createChangesRequestedEmail(request: ServiceRequestRecord) {
  const html = renderEmailShell(
    'More Information Needed',
    `North Shore Nautical needs a bit more detail before approving your request.`,
    `
      ${renderRequestSummary(request)}
      <p style="margin:22px 0 0;color:#5c7386;font-size:14px;line-height:1.8;">
        More information is needed before your request can be approved. A North Shore Nautical team member will follow up directly to review the next step.
      </p>
      ${
        request.adminNotes
          ? `<p style="margin:16px 0 0;color:#0d2740;font-size:14px;line-height:1.8;"><strong>Team note:</strong> ${escapeHtml(request.adminNotes)}</p>`
          : ''
      }
    `,
  )

  const text = [
    'More Information Needed | North Shore Nautical',
    '',
    'More information is needed before your request can be approved. A North Shore Nautical team member will follow up directly to review the next step.',
    ...(request.adminNotes ? [`Team note: ${request.adminNotes}`] : []),
  ].join('\n')

  return {
    subject: 'More Information Needed | North Shore Nautical',
    html,
    text,
  }
}

export function createDeclinedRequestEmail(request: ServiceRequestRecord) {
  const html = renderEmailShell(
    'Request Not Approved',
    `North Shore Nautical reviewed your request and could not approve it in its current form.`,
    `
      ${renderRequestSummary(request)}
      <p style="margin:22px 0 0;color:#5c7386;font-size:14px;line-height:1.8;">
        Your appointment request could not be approved at this time. No payment was captured.
      </p>
      ${
        request.adminNotes
          ? `<p style="margin:16px 0 0;color:#0d2740;font-size:14px;line-height:1.8;"><strong>Team note:</strong> ${escapeHtml(request.adminNotes)}</p>`
          : ''
      }
    `,
  )

  const text = [
    'Request Not Approved | North Shore Nautical',
    '',
    'Your appointment request could not be approved at this time. No payment was captured.',
    ...(request.adminNotes ? [`Team note: ${request.adminNotes}`] : []),
  ].join('\n')

  return {
    subject: 'Request Not Approved | North Shore Nautical',
    html,
    text,
  }
}

export function createCanceledBookingEmail(request: ServiceRequestRecord) {
  const refundLine =
    request.cancellationWindowStatus === 'open'
      ? 'Your request was canceled within the current cancellation window. North Shore Nautical will confirm any applicable refund handling directly.'
      : 'If you have refund questions, North Shore Nautical will review them according to the Service Agreement and Cancellation Policy.'

  const html = renderEmailShell(
    'Request Canceled',
    `Your North Shore Nautical request has been marked canceled.`,
    `
      ${renderRequestSummary(request)}
      <p style="margin:22px 0 0;color:#5c7386;font-size:14px;line-height:1.8;">
        ${escapeHtml(refundLine)}
      </p>
    `,
  )

  const text = [
    'Request Canceled | North Shore Nautical',
    '',
    refundLine,
  ].join('\n')

  return {
    subject: 'Request Canceled | North Shore Nautical',
    html,
    text,
  }
}

export function createCompletedServiceEmail(request: ServiceRequestRecord) {
  const html = renderEmailShell(
    'Service Completed',
    `North Shore Nautical has marked your marine care request complete.`,
    `
      ${renderRequestSummary(request)}
      <p style="margin:22px 0 0;color:#5c7386;font-size:14px;line-height:1.8;">
        Thank you for choosing North Shore Nautical. If there is anything you would like us to review after service, reply to this email and our team will follow up.
      </p>
    `,
  )

  const text = [
    'Service Completed | North Shore Nautical',
    '',
    'Your marine care request has been marked complete. Thank you for choosing North Shore Nautical.',
  ].join('\n')

  return {
    subject: 'Service Completed | North Shore Nautical',
    html,
    text,
  }
}

export function createRefundedBookingEmail(request: ServiceRequestRecord) {
  const html = renderEmailShell(
    'Payment Refunded',
    `North Shore Nautical has recorded a refund on your request.`,
    `
      ${renderRequestSummary(request)}
      <p style="margin:22px 0 0;color:#5c7386;font-size:14px;line-height:1.8;">
        A refund has been recorded for your request. Your bank’s posting timeline may vary depending on your payment method.
      </p>
    `,
  )

  const text = [
    'Payment Refunded | North Shore Nautical',
    '',
    'A refund has been recorded for your request. Your bank’s posting timeline may vary depending on your payment method.',
  ].join('\n')

  return {
    subject: 'Payment Refunded | North Shore Nautical',
    html,
    text,
  }
}

export function createInternalNewRequestEmail(request: ServiceRequestRecord) {
  const details = buildInternalDetails(request)
  const html = renderEmailShell(
    request.requestKind === 'booking' ? 'New Pending Booking Request' : 'New Inquiry Received',
    `${escapeHtml(request.customerName)} submitted a ${escapeHtml(request.requestKind)} through the public site.`,
    `
      <table style="width:100%;border-collapse:collapse;margin-top:26px;">
        ${details.map(([label, value]) => renderDetailRow(label, value)).join('')}
      </table>
    `,
  )

  const text = [
    'New Service Request | North Shore Nautical',
    '',
    ...details.map(([label, value]) => `${label}: ${value}`),
  ].join('\n')

  return {
    subject: `${request.requestKind === 'booking' ? 'Pending Booking' : 'Inquiry'}: ${request.customerName}`,
    html,
    text,
  }
}
