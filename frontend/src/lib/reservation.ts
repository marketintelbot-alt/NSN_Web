import { z } from 'zod'

import type { PublicSlot } from '../types/booking'

export const serviceTimeZone = 'America/Chicago'

const slotDateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  timeZone: serviceTimeZone,
  weekday: 'long',
})

const slotTimeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: serviceTimeZone,
})

const shortWeekdayFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  timeZone: serviceTimeZone,
  weekday: 'short',
})

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`)

const phonePattern = /^[0-9+().\-\s]{7,20}$/
const returnTimePattern = /^([01]\d|2[0-2]):[03]0$/

function buildSelectableTimeValues(startHour: number, endHour: number, intervalMinutes: number) {
  const values: string[] = []

  for (
    let minutes = startHour * 60;
    minutes <= endHour * 60;
    minutes += intervalMinutes
  ) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    values.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`)
  }

  return values
}

export function formatClockTime(value: string) {
  const [hoursString, minutesString] = value.split(':')
  const hours = Number(hoursString)
  const minutes = Number(minutesString)

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value
  }

  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = ((hours + 11) % 12) + 1
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
}

export const returnTimeValues = buildSelectableTimeValues(8, 22, 30)

export const returnTimeOptions = returnTimeValues.map((value) => ({
  value,
  label: formatClockTime(value),
}))

export const reservationSchema = z.object({
  slotId: z.string().trim().min(1, 'Please choose an available time slot.'),
  returnTime: z
    .string()
    .trim()
    .refine((value) => returnTimePattern.test(value), 'Choose a return time.'),
  fullName: requiredText('Full name', 80),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required.')
    .refine((value) => phonePattern.test(value), 'Enter a valid phone number.'),
  notes: z
    .string()
    .trim()
    .max(1000, 'Notes must be 1000 characters or fewer.')
    .optional()
    .or(z.literal('')),
  companyWebsite: z.string().trim().max(0).optional().or(z.literal('')),
})

export type ReservationFormValues = z.infer<typeof reservationSchema>

export function formatSlotDate(startsAt: string) {
  return slotDateFormatter.format(new Date(startsAt))
}

export function formatSlotTime(startsAt: string) {
  return slotTimeFormatter.format(new Date(startsAt))
}

export function formatSlotDateTime(startsAt: string) {
  return `${formatSlotDate(startsAt)} at ${formatSlotTime(startsAt)}`
}

export function formatShortSlotDay(startsAt: string) {
  return shortWeekdayFormatter.format(new Date(startsAt))
}

export function formatReturnTime(returnTime: string | null | undefined) {
  return returnTime ? formatClockTime(returnTime) : 'Return time not set'
}

export function suggestReturnTime(startsAt: string) {
  if (!startsAt) {
    return returnTimeOptions[0]?.value || '08:00'
  }

  const launchDate = new Date(startsAt)
  const suggestedDate = new Date(launchDate.getTime() + 4 * 60 * 60 * 1000)
  const suggestedTime = new Intl.DateTimeFormat('en-CA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: serviceTimeZone,
  }).format(suggestedDate)

  return (
    returnTimeValues.find((value) => value >= suggestedTime) ||
    returnTimeValues[returnTimeValues.length - 1] ||
    '08:00'
  )
}

export type SlotDayGroup = {
  label: string
  slots: PublicSlot[]
}

export function groupSlotsByDate(slots: PublicSlot[]) {
  const groupedSlots = new Map<string, PublicSlot[]>()

  for (const slot of slots) {
    const dayLabel = formatSlotDate(slot.startsAt)
    groupedSlots.set(dayLabel, [...(groupedSlots.get(dayLabel) || []), slot])
  }

  return [...groupedSlots.entries()].map(([label, daySlots]) => ({
    label,
    slots: daySlots,
  })) satisfies SlotDayGroup[]
}

export const reservationInitialValues: ReservationFormValues = {
  slotId: '',
  returnTime: '',
  fullName: '',
  email: '',
  phone: '',
  notes: '',
  companyWebsite: '',
}
