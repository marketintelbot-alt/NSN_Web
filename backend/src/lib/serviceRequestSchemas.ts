import { parse } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'
import { z } from 'zod'

import { businessTimeZone, SERVICE_AGREEMENT_POLICY_VERSION } from './serviceCatalog.js'
import { normalizeMultilineText, normalizeText } from './sanitize.js'

const phonePattern = /^[0-9+().\-\s]{7,20}$/
const maxSchedulingHorizonDays = 400

const requiredText = (label: string, max: number) =>
  z
    .string()
    .transform(normalizeText)
    .pipe(
      z
        .string()
        .min(1, `${label} is required.`)
        .max(max, `${label} must be ${max} characters or fewer.`),
    )

const optionalText = (max: number) =>
  z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? normalizeText(value).slice(0, max) : ''))

const optionalNotes = z
  .string()
  .optional()
  .transform((value) =>
    value && value.trim().length > 0 ? normalizeMultilineText(value).slice(0, 1500) : '',
  )

const booleanish = z.preprocess((value) => {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    return value.trim().toLowerCase() === 'true'
  }

  return Boolean(value)
}, z.boolean())

const optionalBoatLength = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined
  }

  if (typeof value === 'number') {
    return value
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : value
}, z.number().positive('Boat length must be greater than zero.').max(200, 'Boat length must be 200 feet or fewer.').optional())

export function parseRequestedDateTimeLocal(value: string) {
  const parsed = parse(value, "yyyy-MM-dd'T'HH:mm", new Date())
  return fromZonedTime(parsed, businessTimeZone)
}

function isReasonableRequestedDateTime(value: string, currentDate = new Date()) {
  const requestedDateTime = parseRequestedDateTimeLocal(value)

  if (Number.isNaN(requestedDateTime.getTime())) {
    return false
  }

  const earliestAllowedDateTime = new Date(currentDate.getTime() + 60 * 60 * 1000)
  const latestAllowedDateTime = new Date(
    currentDate.getTime() + maxSchedulingHorizonDays * 24 * 60 * 60 * 1000,
  )

  return (
    requestedDateTime.getTime() >= earliestAllowedDateTime.getTime() &&
    requestedDateTime.getTime() <= latestAllowedDateTime.getTime()
  )
}

export const publicServiceRequestSchema = z.object({
  submissionIntent: z.enum(['checkout', 'inquiry']),
  selectedServiceId: z
    .string()
    .optional()
    .transform((value) => (value ? normalizeText(value).slice(0, 120) : '')),
  notSureWhatINeed: booleanish.default(false),
  heavyOxidation: booleanish.default(false),
  moldMildew: booleanish.default(false),
  severeStaining: booleanish.default(false),
  neglectedCondition: booleanish.default(false),
  unusualAccessIssue: booleanish.default(false),
  majorRestorationNeed: booleanish.default(false),
  customerName: requiredText('Name', 120),
  customerEmail: z.string().trim().email('Enter a valid email address.'),
  customerPhone: z
    .string()
    .transform(normalizeText)
    .pipe(
      z
        .string()
        .min(1, 'Phone number is required.')
        .refine((value) => phonePattern.test(value), 'Enter a valid phone number.'),
    ),
  boatLengthFeet: optionalBoatLength,
  boatMakeModelYear: optionalText(160),
  boatLocationMarina: requiredText('Boat location or marina', 160),
  requestedDateTimeLocal: z
    .string()
    .trim()
    .min(1, 'Requested date and time is required.')
    .refine(
      (value) => isReasonableRequestedDateTime(value),
      'Choose a requested date and time within a reasonable future window.',
    ),
  customerNotes: optionalNotes,
  agreementAccepted: booleanish.refine((value) => value, {
    message:
      'You must agree to the Service Agreement, Cancellation Policy, and Refund Policy before submitting.',
  }),
  agreementPolicyVersion: z
    .string()
    .optional()
    .transform((value) =>
      value && value.trim().length > 0 ? normalizeText(value).slice(0, 64) : SERVICE_AGREEMENT_POLICY_VERSION,
    ),
  companyWebsite: z
    .string()
    .optional()
    .transform((value) => (value ? normalizeText(value) : ''))
    .refine((value) => value.length === 0, 'Invalid request.'),
})

export const adminRequestNoteSchema = z.object({
  adminNotes: z
    .string()
    .optional()
    .transform((value) =>
      value && value.trim().length > 0 ? normalizeMultilineText(value).slice(0, 1500) : '',
    ),
})

export const adminPaymentLinkSchema = adminRequestNoteSchema.extend({
  amountCents: z.number().int().min(100, 'Enter a quote amount of at least $1.'),
})

export type PublicServiceRequestInput = z.infer<typeof publicServiceRequestSchema>
export type AdminRequestNoteInput = z.infer<typeof adminRequestNoteSchema>
export type AdminPaymentLinkInput = z.infer<typeof adminPaymentLinkSchema>
