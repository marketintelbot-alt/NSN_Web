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

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`)

const phonePattern = /^[0-9+().\-\s]{7,20}$/

export const reservationSchema = z.object({
  slotId: z.string().trim().min(1, 'Please choose an available time slot.'),
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
  fullName: '',
  email: '',
  phone: '',
  notes: '',
  companyWebsite: '',
}
