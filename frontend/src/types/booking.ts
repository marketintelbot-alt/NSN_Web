export type AccountRole = 'admin' | 'client'

export type AccountSession = {
  authenticated: boolean
  role: AccountRole
  email: string
  clientAccountId?: string | null
  fullName?: string | null
  expiresAt?: string
}

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

export type BookingStatus =
  | 'confirmed'
  | 'on_the_water'
  | 'delayed'
  | 'returned'
  | 'cancelled'
export type BookingEmailStatus = 'pending' | 'sent' | 'failed'

export type ClientAccount = {
  id: string
  email: string
  fullName: string
  phone: string
  boatName: string | null
  boatMakeModel: string | null
  boatLengthFeet: number | null
  preferredLaunchLocation: string
  notes: string | null
  isActive: boolean
  services: ClientServiceEntitlement[]
  createdAt: string
  updatedAt: string
}

export type ClientServiceEntitlement = {
  id: string
  clientAccountId: string
  serviceKey: string
  serviceName: string
  totalUnits: number
  reservedUnits: number
  remainingUnits: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type AdminBooking = {
  id: string
  slotId: string
  clientAccountId: string | null
  serviceEntitlementId: string | null
  serviceName: string | null
  addOnServices: string[]
  fullName: string
  email: string
  phone: string
  notes: string | null
  returnTime: string | null
  status: BookingStatus
  createdBy: 'public' | 'admin' | 'client'
  emailCustomerStatus: BookingEmailStatus
  emailCustomerError: string | null
  emailCustomerSentAt: string | null
  emailAdminStatus: BookingEmailStatus
  emailAdminError: string | null
  emailAdminSentAt: string | null
  reminderCustomerSentAt?: string | null
  reminderAdminSentAt?: string | null
  createdAt: string
  updatedAt: string
  slot: PublicSlot
}

export type AdminDashboardResponse = {
  slots: AdminSlot[]
  bookings: AdminBooking[]
  clients: ClientAccount[]
}

export type ClientPortalResponse = {
  client: ClientAccount
  availableSlots: PublicSlot[]
  upcomingBookings: AdminBooking[]
  bookingHistory: AdminBooking[]
}
