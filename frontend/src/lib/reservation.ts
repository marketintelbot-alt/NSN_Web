import { parse } from 'date-fns'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { z } from 'zod'

import { launchLocations } from '../content/site'

export const serviceTimeZone = 'America/Chicago'
export const reservationWindowMessage =
  'This request falls outside our 24-hour scheduling window. Please choose a later launch time or contact us directly for urgent inquiries.'
const cleaningOptions = ['yes', 'no'] as const
type LaunchLocation = (typeof launchLocations)[number]
type CleaningOption = (typeof cleaningOptions)[number]

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`)

const requiredLaunchLocation = z
  .string()
  .trim()
  .refine(
    (value) => launchLocations.includes(value as LaunchLocation),
    'Please choose Lloyd Boat Launch or Evanston Boat Launch.',
  )

const requiredCleaningOption = z
  .string()
  .trim()
  .refine(
    (value) => cleaningOptions.includes(value as CleaningOption),
    'Please choose whether you would like pre-launch cleaning.',
  )

const phonePattern = /^[0-9+().\-\s]{7,20}$/

export const reservationSchema = z
  .object({
    fullName: requiredText('Full name', 80),
    email: z.string().trim().email('Enter a valid email address.'),
    phone: z
      .string()
      .trim()
      .min(1, 'Phone number is required.')
      .refine((value) => phonePattern.test(value), 'Enter a valid phone number.'),
    boatName: requiredText('Boat name', 80),
    boatType: requiredText('Boat type / model', 80),
    boatLength: requiredText('Boat length', 30),
    requestedLaunchDate: z
      .string()
      .trim()
      .min(1, 'Requested launch date is required.'),
    requestedLaunchTime: z
      .string()
      .trim()
      .min(1, 'Requested launch time is required.'),
    launchLocation: requiredLaunchLocation,
    cleaningRequested: requiredCleaningOption,
    specialInstructions: z
      .string()
      .trim()
      .max(1000, 'Special instructions must be 1000 characters or fewer.')
      .optional()
      .or(z.literal('')),
    companyWebsite: z.string().trim().max(0).optional().or(z.literal('')),
    policyAcknowledged: z
      .boolean()
      .refine(
        (value) => value,
        'Please acknowledge the 24-hour reservation policy before submitting.',
      ),
  })
  .superRefine((value, context) => {
    if (!value.requestedLaunchDate || !value.requestedLaunchTime) {
      return
    }

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

export type ReservationFormValues = z.infer<typeof reservationSchema>

export function createLaunchDateTime(date: string, time: string) {
  const parsedDate = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date())
  return fromZonedTime(parsedDate, serviceTimeZone)
}

export function has24HourLeadTime(
  date: string,
  time: string,
  currentDate = new Date(),
) {
  const requestedLaunchDateTime = createLaunchDateTime(date, time)
  return requestedLaunchDateTime.getTime() - currentDate.getTime() >= 24 * 60 * 60 * 1000
}

export function formatReservationDateTime(date: string, time: string) {
  return formatInTimeZone(
    createLaunchDateTime(date, time),
    serviceTimeZone,
    "EEEE, MMMM d 'at' h:mm a zzz",
  )
}

export const reservationInitialValues: ReservationFormValues = {
  fullName: '',
  email: '',
  phone: '',
  boatName: '',
  boatType: '',
  boatLength: '',
  requestedLaunchDate: '',
  requestedLaunchTime: '',
  launchLocation: '',
  cleaningRequested: '',
  specialInstructions: '',
  companyWebsite: '',
  policyAcknowledged: false,
}
