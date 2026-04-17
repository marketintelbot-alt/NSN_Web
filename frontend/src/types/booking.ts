import type { AdminSession } from '../lib/adminSession'

export type PublicSlot = {
  id: string
  startsAt: string
  launchLocation: string
  notes: string | null
  label: string
}

export type AdminSlot = PublicSlot & {
  isActive: boolean
}

export type BookingStatus = 'confirmed' | 'completed' | 'cancelled'
export type BookingEmailStatus = 'pending' | 'sent' | 'failed'

export type AdminBooking = {
  id: string
  slotId: string
  fullName: string
  email: string
  phone: string
  notes: string | null
  status: BookingStatus
  createdBy: 'public' | 'admin'
  emailCustomerStatus: BookingEmailStatus
  emailCustomerError: string | null
  emailCustomerSentAt: string | null
  emailAdminStatus: BookingEmailStatus
  emailAdminError: string | null
  emailAdminSentAt: string | null
  createdAt: string
  updatedAt: string
  slot: PublicSlot
}

export type AdminDashboardResponse = {
  slots: AdminSlot[]
  bookings: AdminBooking[]
}

export type AdminPageState = {
  session: AdminSession | null
  loading: boolean
}
