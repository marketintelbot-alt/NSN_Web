import { z } from 'zod'

import { launchLocations } from './time.js'
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

export type PublicBookingInput = z.infer<typeof publicBookingSchema>
export type AdminSlotInput = z.infer<typeof adminSlotSchema>
export type AdminBookingInput = z.infer<typeof adminBookingSchema>
