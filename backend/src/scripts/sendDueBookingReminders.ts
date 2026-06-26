import 'dotenv/config'

import { getPrimaryAdminEmail } from '../lib/adminSession.js'
import { sendDueBookingReminderEmails } from '../lib/bookingEmailDelivery.js'
import { listDueReminderBookings } from '../lib/bookingStore.js'
import { getBusinessNotificationEmails } from '../lib/notificationEmails.js'
import { retryPendingServiceRequestEmails } from '../lib/serviceRequestEmailDelivery.js'
import { pingSupabaseKeepAlive } from '../lib/supabaseKeepAlive.js'

async function main() {
  const keepAlive = await pingSupabaseKeepAlive()
  console.log(
    `Supabase keep-alive query succeeded for ${keepAlive.tableName} in ${keepAlive.durationMs}ms.`,
  )

  const bookings = await listDueReminderBookings()

  const options = {
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.FROM_EMAIL,
    businessNotificationEmails: getBusinessNotificationEmails(getPrimaryAdminEmail()),
  }

  if (bookings.length === 0) {
    console.log('No booking reminders are due right now.')
  } else {
    console.log(`Sending ${bookings.length} due booking reminder(s).`)
  }

  for (const booking of bookings) {
    await sendDueBookingReminderEmails(booking.id, booking, options)
  }

  await retryPendingServiceRequestEmails(options)
}

main().catch((error) => {
  console.error('Unable to send due booking reminders.', error)
  process.exitCode = 1
})
