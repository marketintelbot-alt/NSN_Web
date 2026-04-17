import { z } from 'zod'

import { launchLocations, preferredLaunchLocationOptions } from './time.js'
import { normalizeMultilineText, normalizeText } from './sanitize.js'
import { createLaunchDateTime, has24HourLeadTime, reservationWindowMessage } from './time.js'

const bookingStatuses = ['confirmed', 'completed', 'cancelled'] as const
const phonePattern = /^[0-9+().\-\s]{7,20}$/

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

const optionalNotes = z
  .string()
  .optional()
  .transform((value) =>
    value && value.trim().length > 0 ? normalizeMultilineText(value).slice(0, 1000) : '',
  )

const optionalText = (max: number) =>
  z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? normalizeText(value).slice(0, max) : ''))

const optionalBoatLength = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined
  }

  if (typeof value === 'number') {
    return value
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : value
}, z.number().min(1, 'Boat length must be at least 1 foot.').max(120, 'Boat length must be 120 feet or fewer.').optional())

const optionalUuidField = z.string().uuid().optional().or(z.literal(''))

const clientServiceSchema = z.object({
  serviceName: requiredText('Service name', 120),
  totalUnits: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) {
      return 0
    }

    if (typeof value === 'number') {
      return value
    }

    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : value
  }, z.number().int('Service quantities must be whole numbers.').min(0, 'Service quantities cannot be negative.').max(1000, 'Service quantities must be 1000 or fewer.')),
  notes: z
    .string()
    .optional()
    .transform((value) =>
      value && value.trim().length > 0 ? normalizeMultilineText(value).slice(0, 500) : '',
    ),
})

const addOnServicesSchema = z
  .array(
    z
      .string()
      .transform(normalizeText)
      .pipe(z.string().min(1).max(120, 'Add-on services must be 120 characters or fewer.')),
  )
  .max(12, 'Choose 12 add-on services or fewer.')
  .default([])
  .transform((services) =>
    services.filter(
      (service, index) => services.findIndex((candidate) => candidate === service) === index,
    ),
  )

export const publicBookingSchema = z.object({
  slotId: z.string().uuid('Please choose a valid time slot.'),
  fullName: requiredText('Full name', 80),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z
    .string()
    .transform(normalizeText)
    .pipe(
      z
        .string()
        .min(1, 'Phone number is required.')
        .refine((value) => phonePattern.test(value), 'Enter a valid phone number.'),
    ),
  notes: optionalNotes,
  companyWebsite: z
    .string()
    .optional()
    .transform((value) => (value ? normalizeText(value) : ''))
    .refine((value) => value.length === 0, 'Invalid request.'),
})

export const clientBookingSchema = z.object({
  slotId: z.string().uuid('Please choose a valid time slot.'),
  serviceEntitlementId: optionalUuidField,
  addOnServices: addOnServicesSchema,
  notes: optionalNotes,
})

export const clientBookingUpdateSchema = z
  .object({
    bookingId: z.string().uuid().optional(),
    slotId: optionalUuidField,
    serviceEntitlementId: optionalUuidField,
    addOnServices: addOnServicesSchema,
    notes: optionalNotes,
    status: z.enum(['confirmed', 'cancelled']).default('confirmed'),
  })
  .superRefine((value, context) => {
    if (value.status === 'confirmed' && !value.slotId) {
      context.addIssue({
        code: 'custom',
        path: ['slotId'],
        message: 'Choose a new time slot to reschedule this reservation.',
      })
    }
  })

export const clientProfileSchema = z.object({
  fullName: requiredText('Full name', 80),
  phone: z
    .string()
    .transform(normalizeText)
    .pipe(
      z
        .string()
        .min(1, 'Phone number is required.')
        .refine((value) => phonePattern.test(value), 'Enter a valid phone number.'),
    ),
  boatName: optionalText(120),
  boatMakeModel: optionalText(120),
  boatLengthFeet: optionalBoatLength,
  preferredLaunchLocation: z.enum(preferredLaunchLocationOptions),
  notes: optionalNotes,
})

export const adminSlotSchema = z
  .object({
    slotId: z.string().uuid().optional(),
    slotDate: z.string().trim().min(1, 'Choose a slot date.'),
    slotTime: z.string().trim().min(1, 'Choose a slot time.'),
    launchLocation: z.enum(launchLocations),
    notes: z
      .string()
      .optional()
      .transform((value) =>
        value && value.trim().length > 0 ? normalizeMultilineText(value).slice(0, 500) : '',
      ),
    isActive: z.boolean().default(true),
  })
  .superRefine((value, context) => {
    const slotDateTime = createLaunchDateTime(value.slotDate, value.slotTime)

    if (Number.isNaN(slotDateTime.getTime())) {
      context.addIssue({
        code: 'custom',
        path: ['slotDate'],
        message: 'Enter a valid slot date and time.',
      })
      return
    }

    if (value.isActive && !has24HourLeadTime(value.slotDate, value.slotTime)) {
      context.addIssue({
        code: 'custom',
        path: ['slotDate'],
        message: reservationWindowMessage,
      })
    }
  })

export const adminBookingSchema = z.object({
  bookingId: z.string().uuid().optional(),
  clientAccountId: optionalUuidField,
  serviceEntitlementId: optionalUuidField,
  addOnServices: addOnServicesSchema,
  slotId: z.string().uuid('Choose a valid time slot.'),
  fullName: requiredText('Client name', 80),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z
    .string()
    .transform(normalizeText)
    .pipe(
      z
        .string()
        .min(1, 'Phone number is required.')
        .refine((value) => phonePattern.test(value), 'Enter a valid phone number.'),
    ),
  notes: optionalNotes,
  status: z.enum(bookingStatuses),
})

export const adminClientAccountSchema = z
  .object({
    clientId: z.string().uuid().optional(),
    email: z.string().trim().email('Enter a valid email address.'),
    password: z.string().trim().optional(),
    fullName: requiredText('Client name', 80),
    phone: z
      .string()
      .transform(normalizeText)
      .pipe(
        z
          .string()
          .min(1, 'Phone number is required.')
          .refine((value) => phonePattern.test(value), 'Enter a valid phone number.'),
      ),
    boatName: optionalText(120),
    boatMakeModel: optionalText(120),
    boatLengthFeet: optionalBoatLength,
    preferredLaunchLocation: z.enum(preferredLaunchLocationOptions),
    notes: optionalNotes,
    isActive: z.boolean().default(true),
    services: z.array(clientServiceSchema).default([]),
  })
  .superRefine((value, context) => {
    const password = value.password?.trim() || ''

    if (!value.clientId && password.length < 8) {
      context.addIssue({
        code: 'custom',
        path: ['password'],
        message: 'Passwords must be at least 8 characters long.',
      })
    }

    if (value.clientId && password.length > 0 && password.length < 8) {
      context.addIssue({
        code: 'custom',
        path: ['password'],
        message: 'If you set a new password, it must be at least 8 characters long.',
      })
    }
  })

export type PublicBookingInput = z.infer<typeof publicBookingSchema>
export type ClientBookingInput = z.infer<typeof clientBookingSchema>
export type ClientBookingUpdateInput = z.infer<typeof clientBookingUpdateSchema>
export type ClientProfileInput = z.infer<typeof clientProfileSchema>
export type AdminSlotInput = z.infer<typeof adminSlotSchema>
export type AdminBookingInput = z.infer<typeof adminBookingSchema>
export type AdminClientAccountInput = z.infer<typeof adminClientAccountSchema>
