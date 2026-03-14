import { z } from 'zod'

import { normalizeMultilineText, normalizeText } from './sanitize.js'
import { createLaunchDateTime, has24HourLeadTime, reservationWindowMessage } from './time.js'

const launchLocations = ['Lloyd Boat Launch', 'Evanston Boat Launch'] as const
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

export const reservationSchema = z
  .object({
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
    boatName: requiredText('Boat name', 80),
    boatType: requiredText('Boat type / model', 80),
    boatLength: requiredText('Boat length', 30),
    requestedLaunchDate: z.string().trim().min(1, 'Requested launch date is required.'),
    requestedLaunchTime: z.string().trim().min(1, 'Requested launch time is required.'),
    launchLocation: z.enum(launchLocations),
    cleaningRequested: z.enum(['yes', 'no']),
    specialInstructions: z
      .string()
      .optional()
      .transform((value) =>
        value && value.trim().length > 0 ? normalizeMultilineText(value).slice(0, 1000) : '',
      ),
    companyWebsite: z
      .string()
      .optional()
      .transform((value) => (value ? normalizeText(value) : ''))
      .refine((value) => value.length === 0, 'Invalid request.'),
    policyAcknowledged: z
      .boolean()
      .refine(
        (value) => value,
        'Please acknowledge the 24-hour reservation policy before submitting.',
      ),
  })
  .superRefine((value, context) => {
    const requestedLaunchDateTime = createLaunchDateTime(
      value.requestedLaunchDate,
      value.requestedLaunchTime,
    )

    if (Number.isNaN(requestedLaunchDateTime.getTime())) {
      context.addIssue({
        code: 'custom',
        path: ['requestedLaunchDate'],
        message: 'Enter a valid launch date and time.',
      })
      return
    }

    if (!has24HourLeadTime(value.requestedLaunchDate, value.requestedLaunchTime)) {
      context.addIssue({
        code: 'custom',
        path: ['requestedLaunchDate'],
        message: reservationWindowMessage,
      })
    }
  })

export type ReservationPayload = z.infer<typeof reservationSchema>
