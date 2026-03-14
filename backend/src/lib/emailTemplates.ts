import type { ReservationPayload } from './reservationSchema.js'
import { escapeHtml } from './sanitize.js'
import { formatReservationDateTime } from './time.js'

function renderDetailRow(label: string, value: string) {
  return `<tr><td style="padding:10px 0;color:#5f7080;font-size:13px;vertical-align:top;width:220px;">${escapeHtml(label)}</td><td style="padding:10px 0;color:#06131f;font-size:14px;font-weight:600;">${escapeHtml(value)}</td></tr>`
}

export function createBusinessNotificationEmail(reservation: ReservationPayload) {
  const formattedLaunchTime = formatReservationDateTime(
    reservation.requestedLaunchDate,
    reservation.requestedLaunchTime,
  )

  const details = [
    ['Full Name', reservation.fullName],
    ['Email Address', reservation.email],
    ['Phone Number', reservation.phone],
    ['Boat Name', reservation.boatName],
    ['Boat Type / Model', reservation.boatType],
    ['Boat Length', reservation.boatLength],
    ['Requested Launch', formattedLaunchTime],
    ['Launch Location', reservation.launchLocation],
    ['Cleaning Requested', reservation.cleaningRequested === 'yes' ? 'Yes' : 'No'],
    [
      'Special Instructions',
      reservation.specialInstructions || 'No special instructions provided.',
    ],
  ]

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f4f8fa;padding:32px;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid rgba(6,19,31,0.08);">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#7fa4b8;font-weight:700;">North Shore Nautical</p>
        <h1 style="margin:0;color:#06131f;font-size:32px;line-height:1.1;">New Reservation Request</h1>
        <p style="margin:16px 0 0;color:#5f7080;font-size:15px;line-height:1.8;">
          A new stored-client launch delivery reservation has been submitted through the website.
        </p>
        <table style="width:100%;border-collapse:collapse;margin-top:28px;">
          ${details.map(([label, value]) => renderDetailRow(label, value)).join('')}
        </table>
      </div>
    </div>
  `

  const text = [
    'New Reservation Request | North Shore Nautical',
    '',
    ...details.map(([label, value]) => `${label}: ${value}`),
  ].join('\n')

  return {
    subject: 'New Reservation Request | North Shore Nautical',
    html,
    text,
  }
}

export function createCustomerConfirmationEmail(reservation: ReservationPayload) {
  const formattedLaunchTime = formatReservationDateTime(
    reservation.requestedLaunchDate,
    reservation.requestedLaunchTime,
  )

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f4f8fa;padding:32px;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border-radius:24px;padding:36px;border:1px solid rgba(6,19,31,0.08);">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#7fa4b8;font-weight:700;">North Shore Nautical</p>
        <h1 style="margin:0;color:#06131f;font-size:34px;line-height:1.1;">Reservation Request Received</h1>
        <p style="margin:18px 0 0;color:#5f7080;font-size:15px;line-height:1.8;">
          Thank you for your request. North Shore Nautical has received your launch delivery reservation submission for <strong style="color:#06131f;">${escapeHtml(formattedLaunchTime)}</strong>.
        </p>
        <p style="margin:16px 0 0;color:#5f7080;font-size:15px;line-height:1.8;">
          Reservation requests are reviewed for scheduling confirmation and delivery availability. A member of North Shore Nautical will follow up if any timing, launch, cleaning, or handling details need clarification.
        </p>
        <div style="margin-top:28px;padding:20px 22px;border-radius:18px;background:#f4f8fa;border:1px solid rgba(6,19,31,0.08);">
          <p style="margin:0;color:#06131f;font-size:14px;font-weight:700;">Request Summary</p>
          <p style="margin:10px 0 0;color:#5f7080;font-size:14px;line-height:1.8;">
            Boat: <strong style="color:#06131f;">${escapeHtml(reservation.boatName)}</strong><br />
            Launch Location: <strong style="color:#06131f;">${escapeHtml(reservation.launchLocation)}</strong><br />
            Cleaning Requested: <strong style="color:#06131f;">${reservation.cleaningRequested === 'yes' ? 'Yes' : 'No'}</strong>
          </p>
        </div>
        <p style="margin:24px 0 0;color:#5f7080;font-size:14px;line-height:1.8;">
          Please note that launch delivery reservations must be submitted at least 24 hours before the requested launch time. If conditions or details change before confirmation, reply directly to this email or contact North Shore Nautical.
        </p>
      </div>
    </div>
  `

  const text = [
    'Reservation Request Received | North Shore Nautical',
    '',
    `Requested launch: ${formattedLaunchTime}`,
    'Your reservation request has been received and is pending scheduling confirmation.',
    'North Shore Nautical will follow up if any details require clarification.',
  ].join('\n')

  return {
    subject: 'Reservation Request Received | North Shore Nautical',
    html,
    text,
  }
}
