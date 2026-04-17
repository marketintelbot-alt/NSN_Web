const defaultBusinessNotificationEmails = [
  'johnny@ellismarinegroup.com',
  'carter@ellismarinegroup.com',
]

export function getBusinessNotificationEmails(...fallbackEmails: string[]) {
  const configuredEmails = [
    process.env.BUSINESS_NOTIFICATION_EMAILS || '',
    process.env.BUSINESS_NOTIFICATION_EMAIL || '',
    ...fallbackEmails,
    ...defaultBusinessNotificationEmails,
  ]
    .join(',')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  return configuredEmails.filter(
    (email, index) => configuredEmails.findIndex((candidate) => candidate === email) === index,
  )
}
