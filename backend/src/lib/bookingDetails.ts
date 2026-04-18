export const operationalBookingStatuses = [
  'confirmed',
  'on_the_water',
  'delayed',
  'returned',
] as const

export type OperationalBookingStatus = (typeof operationalBookingStatuses)[number]

const metadataPatterns = {
  returnTime: /\[\[NSN_RETURN_TIME=([0-2]\d:[0-5]\d)\]\]/g,
  operationalStatus:
    /\[\[NSN_OPS_STATUS=(confirmed|on_the_water|delayed|returned)\]\]/g,
  reminderCustomerSentAt: /\[\[NSN_REMINDER_CUSTOMER_SENT_AT=([^\]]+)\]\]/g,
  reminderAdminSentAt: /\[\[NSN_REMINDER_ADMIN_SENT_AT=([^\]]+)\]\]/g,
} as const

function stripMetadata(rawNotes: string) {
  return Object.values(metadataPatterns)
    .reduce((notes, pattern) => notes.replace(pattern, ''), rawNotes)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function findLastMatch(pattern: RegExp, value: string) {
  let matchedValue: string | null = null

  for (const match of value.matchAll(pattern)) {
    matchedValue = match[1] || null
  }

  return matchedValue
}

export function parseStoredBookingNotes(rawNotes?: string | null) {
  if (!rawNotes) {
    return {
      notes: null,
      operationalStatus: null,
      reminderAdminSentAt: null,
      reminderCustomerSentAt: null,
      returnTime: null,
    }
  }

  const cleanedNotes = stripMetadata(rawNotes)

  return {
    notes: cleanedNotes || null,
    returnTime: findLastMatch(metadataPatterns.returnTime, rawNotes),
    operationalStatus: findLastMatch(
      metadataPatterns.operationalStatus,
      rawNotes,
    ) as OperationalBookingStatus | null,
    reminderCustomerSentAt: findLastMatch(metadataPatterns.reminderCustomerSentAt, rawNotes),
    reminderAdminSentAt: findLastMatch(metadataPatterns.reminderAdminSentAt, rawNotes),
  }
}

export function serializeBookingNotes(input: {
  notes?: string | null
  returnTime?: string | null
  operationalStatus?: OperationalBookingStatus | null
  reminderCustomerSentAt?: string | null
  reminderAdminSentAt?: string | null
}) {
  const cleanedNotes = input.notes ? stripMetadata(input.notes) : ''
  const metadata = [
    input.returnTime ? `[[NSN_RETURN_TIME=${input.returnTime}]]` : '',
    input.operationalStatus ? `[[NSN_OPS_STATUS=${input.operationalStatus}]]` : '',
    input.reminderCustomerSentAt
      ? `[[NSN_REMINDER_CUSTOMER_SENT_AT=${input.reminderCustomerSentAt}]]`
      : '',
    input.reminderAdminSentAt
      ? `[[NSN_REMINDER_ADMIN_SENT_AT=${input.reminderAdminSentAt}]]`
      : '',
  ].filter((value) => value.length > 0)

  const storedValue = [cleanedNotes, ...metadata].filter((value) => value.length > 0).join('\n\n')
  return storedValue || null
}
