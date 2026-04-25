export function getBusinessNotificationEmails(...fallbackEmails: string[]) {
  const configuredEmails = [
    process.env.BUSINESS_NOTIFICATION_EMAILS || '',
    process.env.BUSINESS_NOTIFICATION_EMAIL || '',
    ...fallbackEmails,
  ]
    .join(',')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  return configuredEmails.filter(
    (email, index) => configuredEmails.findIndex((candidate) => candidate === email) === index,
  )
}
