import type { AdminBooking } from './bookingStore.js'
import { escapeHtml } from './sanitize.js'
import { formatStoredDateTime } from './time.js'

function renderDetailRow(label: string, value: string) {
  return `<tr><td style="padding:10px 0;color:#5f7080;font-size:13px;vertical-align:top;width:220px;">${escapeHtml(label)}</td><td style="padding:10px 0;color:#06131f;font-size:14px;font-weight:600;">${escapeHtml(value)}</td></tr>`
}

function getSiteUrl() {
  return (
    process.env.SITE_URL?.replace(/\/$/, '') ||
    process.env.VITE_SITE_URL?.replace(/\/$/, '') ||
    'https://north-shore-nautical.onrender.com'
  )
}

function getClientFirstName(fullName: string) {
  const [firstName] = fullName.trim().split(/\s+/)
  return firstName || fullName
}

function renderEmailShell(title: string, intro: string, content: string) {
  const logoUrl = `${getSiteUrl()}/icons/apple-touch-icon.png`

  return `
    <div style="font-family:Arial,sans-serif;background:#edf3f6;padding:32px;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border-radius:28px;padding:36px;border:1px solid rgba(6,19,31,0.08);box-shadow:0 18px 40px rgba(6,19,31,0.08);">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;">
          <img src="${logoUrl}" alt="North Shore Nautical" width="54" height="54" style="width:54px;height:54px;border-radius:16px;display:block;" />
          <div>
            <p style="margin:0;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#7fa4b8;font-weight:700;">North Shore Nautical</p>
            <p style="margin:6px 0 0;color:#516474;font-size:13px;">Chicago&apos;s North Shore</p>
          </div>
        </div>
        <h1 style="margin:0;color:#06131f;font-size:34px;line-height:1.08;">${escapeHtml(title)}</h1>
        <p style="margin:16px 0 0;color:#516474;font-size:15px;line-height:1.8;">${intro}</p>
        ${content}
      </div>
    </div>
  `
}

export function createBusinessNotificationEmail(booking: AdminBooking) {
  const formattedLaunchTime = formatStoredDateTime(booking.slot.startsAt)
  const details = [
    ['Client', booking.fullName],
    ['Email Address', booking.email],
    ['Phone Number', booking.phone],
    ['Booked Time', formattedLaunchTime],
    ['Launch Location', booking.slot.launchLocation],
    ...(booking.serviceName ? [['Reserved Service', booking.serviceName]] : []),
    ...(booking.addOnServices.length > 0
      ? [['A La Carte Services', booking.addOnServices.join(', ')]]
      : []),
    [
      'Booking Source',
      booking.createdBy === 'admin'
        ? 'Admin dashboard'
        : booking.createdBy === 'client'
          ? 'Client portal'
          : 'Website booking page',
    ],
    ['Client Notes', booking.notes || 'No notes provided.'],
  ]

  const html = renderEmailShell(
    'New Booking Confirmed',
    `${escapeHtml(booking.fullName)} reserved an available North Shore Nautical slot.`,
    `
      <table style="width:100%;border-collapse:collapse;margin-top:28px;">
        ${details.map(([label, value]) => renderDetailRow(label, value)).join('')}
      </table>
    `,
  )

  const text = [
    'New Booking Confirmed | North Shore Nautical',
    '',
    ...details.map(([label, value]) => `${label}: ${value}`),
  ].join('\n')

  return {
    subject: `New Booking: ${booking.fullName} — ${formattedLaunchTime}`,
    html,
    text,
  }
}

export function createCustomerConfirmationEmail(booking: AdminBooking) {
  const formattedLaunchTime = formatStoredDateTime(booking.slot.startsAt)
  const firstName = getClientFirstName(booking.fullName)

  const html = renderEmailShell(
    'Your Booking Is Confirmed',
    `Thank you for booking with North Shore Nautical, <strong style="color:#06131f;">${escapeHtml(firstName)}</strong>. Your reservation is confirmed for <strong style="color:#06131f;">${escapeHtml(formattedLaunchTime)}</strong>.`,
    `
      <div style="margin-top:28px;padding:22px 24px;border-radius:20px;background:#f4f8fa;border:1px solid rgba(6,19,31,0.08);">
        <p style="margin:0;color:#06131f;font-size:14px;font-weight:700;">Booking Summary</p>
        <p style="margin:12px 0 0;color:#516474;font-size:14px;line-height:1.8;">
          Time: <strong style="color:#06131f;">${escapeHtml(formattedLaunchTime)}</strong><br />
          Launch Location: <strong style="color:#06131f;">${escapeHtml(booking.slot.launchLocation)}</strong><br />
          Reserved For: <strong style="color:#06131f;">${escapeHtml(booking.fullName)}</strong>${booking.serviceName ? `<br />Service Reserved: <strong style="color:#06131f;">${escapeHtml(booking.serviceName)}</strong>` : ''}${booking.addOnServices.length > 0 ? `<br />A La Carte Services: <strong style="color:#06131f;">${escapeHtml(booking.addOnServices.join(', '))}</strong>` : ''}
        </p>
      </div>
      <p style="margin:24px 0 0;color:#516474;font-size:14px;line-height:1.8;">
        Thank you again for booking with North Shore Nautical. If any details change, simply reply to this email and the reservation can be updated for you.
      </p>
    `,
  )

  const text = [
    'Your Booking Is Confirmed | North Shore Nautical',
    '',
    `Thank you for booking with North Shore Nautical, ${firstName}.`,
    `Booked time: ${formattedLaunchTime}`,
    `Launch location: ${booking.slot.launchLocation}`,
    ...(booking.serviceName ? [`Reserved service: ${booking.serviceName}`] : []),
    ...(booking.addOnServices.length > 0
      ? [`A la carte services: ${booking.addOnServices.join(', ')}`]
      : []),
    'Your reservation is confirmed and on file with North Shore Nautical.',
    'Reply to this email if anything needs to change.',
  ].join('\n')

  return {
    subject: `Booking Confirmed: ${formattedLaunchTime} | North Shore Nautical`,
    html,
    text,
  }
}
