import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'

import { formatInTimeZone } from 'date-fns-tz'
import {
  CalendarClock,
  CheckCircle2,
  LogOut,
  Mail,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
  UserRound,
} from 'lucide-react'

import { FadeIn } from '../ui/FadeIn'
import { adminApiRequest, destroyAdminSession, type AdminSession } from '../../lib/adminSession'
import { formatSlotDateTime } from '../../lib/reservation'
import type { AdminBooking, AdminDashboardResponse, AdminSlot, BookingStatus } from '../../types/booking'

const launchLocations = ['Lloyd Boat Launch', 'Evanston Boat Launch'] as const

type AdminDashboardProps = {
  adminSession: AdminSession
  onSignedOut: () => void
}

type SlotFormState = {
  slotId: string
  slotDate: string
  slotTime: string
  launchLocation: string
  notes: string
  isActive: boolean
}

type BookingFormState = {
  bookingId: string
  slotId: string
  fullName: string
  email: string
  phone: string
  notes: string
  status: BookingStatus
}

type ClientProfile = {
  id: string
  fullName: string
  email: string
  phone: string
  bookingCount: number
  activeBookings: number
  completedBookings: number
  cancelledBookings: number
  nextLaunchAt: string | null
  latestLaunchAt: string | null
  latestLaunchLocation: string
  latestStatus: BookingStatus
  latestNote: string | null
  bookings: AdminBooking[]
}

function emptySlotForm(): SlotFormState {
  return {
    slotId: '',
    slotDate: '',
    slotTime: '',
    launchLocation: launchLocations[0],
    notes: '',
    isActive: true,
  }
}

function emptyBookingForm(): BookingFormState {
  return {
    bookingId: '',
    slotId: '',
    fullName: '',
    email: '',
    phone: '',
    notes: '',
    status: 'confirmed',
  }
}

function statusLabel(status: BookingStatus) {
  switch (status) {
    case 'confirmed':
      return 'Confirmed'
    case 'completed':
      return 'Completed'
    case 'cancelled':
      return 'Cancelled'
  }
}

function emailStatusLabel(status: AdminBooking['emailCustomerStatus']) {
  switch (status) {
    case 'sent':
      return 'Sent'
    case 'failed':
      return 'Failed'
    case 'pending':
    default:
      return 'Pending'
  }
}

function formatSlotDateInput(startsAt: string) {
  return formatInTimeZone(new Date(startsAt), 'America/Chicago', 'yyyy-MM-dd')
}

function formatSlotTimeInput(startsAt: string) {
  return formatInTimeZone(new Date(startsAt), 'America/Chicago', 'HH:mm')
}

function getClientProfileId(booking: AdminBooking) {
  return booking.email.trim().toLowerCase()
}

function formatControlPanelDateTime(startsAt: string) {
  return formatInTimeZone(new Date(startsAt), 'America/Chicago', "MMM d 'at' h:mm a")
}

function buildClientProfiles(bookings: AdminBooking[]) {
  const groupedClients = new Map<string, ClientProfile>()

  bookings.forEach((booking) => {
    const clientId = getClientProfileId(booking)
    const existingClient = groupedClients.get(clientId)

    if (!existingClient) {
      groupedClients.set(clientId, {
        id: clientId,
        fullName: booking.fullName,
        email: booking.email,
        phone: booking.phone,
        bookingCount: 1,
        activeBookings: booking.status === 'confirmed' ? 1 : 0,
        completedBookings: booking.status === 'completed' ? 1 : 0,
        cancelledBookings: booking.status === 'cancelled' ? 1 : 0,
        nextLaunchAt:
          booking.status !== 'cancelled' && new Date(booking.slot.startsAt).getTime() > Date.now()
            ? booking.slot.startsAt
            : null,
        latestLaunchAt: booking.slot.startsAt,
        latestLaunchLocation: booking.slot.launchLocation,
        latestStatus: booking.status,
        latestNote: booking.notes,
        bookings: [booking],
      })
      return
    }

    existingClient.bookingCount += 1
    existingClient.fullName = booking.fullName
    existingClient.phone = booking.phone
    existingClient.latestNote = booking.notes || existingClient.latestNote
    existingClient.bookings.push(booking)

    if (booking.status === 'confirmed') {
      existingClient.activeBookings += 1
    } else if (booking.status === 'completed') {
      existingClient.completedBookings += 1
    } else {
      existingClient.cancelledBookings += 1
    }

    if (
      booking.status !== 'cancelled' &&
      new Date(booking.slot.startsAt).getTime() > Date.now() &&
      (!existingClient.nextLaunchAt ||
        new Date(booking.slot.startsAt).getTime() < new Date(existingClient.nextLaunchAt).getTime())
    ) {
      existingClient.nextLaunchAt = booking.slot.startsAt
    }

    if (new Date(booking.slot.startsAt).getTime() >= new Date(existingClient.latestLaunchAt || 0).getTime()) {
      existingClient.latestLaunchAt = booking.slot.startsAt
      existingClient.latestLaunchLocation = booking.slot.launchLocation
      existingClient.latestStatus = booking.status
    }
  })

  return Array.from(groupedClients.values())
    .map((client) => ({
      ...client,
      bookings: [...client.bookings].sort(
        (left, right) =>
          new Date(right.slot.startsAt).getTime() - new Date(left.slot.startsAt).getTime(),
      ),
    }))
    .sort((left, right) => {
      if (left.nextLaunchAt && right.nextLaunchAt) {
        return new Date(left.nextLaunchAt).getTime() - new Date(right.nextLaunchAt).getTime()
      }

      if (left.nextLaunchAt) {
        return -1
      }

      if (right.nextLaunchAt) {
        return 1
      }

      return (
        new Date(right.latestLaunchAt || 0).getTime() - new Date(left.latestLaunchAt || 0).getTime()
      )
    })
}

export function AdminDashboard({ adminSession, onSignedOut }: AdminDashboardProps) {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse>({ slots: [], bookings: [] })
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardMessage, setDashboardMessage] = useState('')
  const [slotForm, setSlotForm] = useState<SlotFormState>(emptySlotForm())
  const [bookingForm, setBookingForm] = useState<BookingFormState>(emptyBookingForm())
  const [selectedBookingId, setSelectedBookingId] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [savingState, setSavingState] = useState<'idle' | 'saving'>('idle')
  const [availabilityCutoffMs, setAvailabilityCutoffMs] = useState(() => Date.now())

  const loadDashboard = useCallback(async () => {
    const refreshedAt = Date.now()
    const response = await adminApiRequest<AdminDashboardResponse>('/api/admin/dashboard')
    setDashboardLoading(false)

    if (response.status === 401) {
      onSignedOut()
      return
    }

    if (!response.ok) {
      setDashboardMessage(response.payload.message || 'Unable to load the admin dashboard right now.')
      return
    }

    setDashboard(response.payload)
    setAvailabilityCutoffMs(refreshedAt)
  }, [onSignedOut])

  useEffect(() => {
    let isMounted = true

    async function hydrateDashboard() {
      const refreshedAt = Date.now()
      const response = await adminApiRequest<AdminDashboardResponse>('/api/admin/dashboard')

      if (!isMounted) {
        return
      }

      setDashboardLoading(false)

      if (response.status === 401) {
        onSignedOut()
        return
      }

      if (!response.ok) {
        setDashboardMessage(response.payload.message || 'Unable to load the admin dashboard right now.')
        return
      }

      setDashboard(response.payload)
      setAvailabilityCutoffMs(refreshedAt)
    }

    void hydrateDashboard()

    return () => {
      isMounted = false
    }
  }, [onSignedOut])

  const activeBookingSlotIds = useMemo(
    () =>
      new Set(
        dashboard.bookings
          .filter((booking) => booking.status !== 'cancelled')
          .map((booking) => booking.slotId),
      ),
    [dashboard.bookings],
  )

  const availableSlots = useMemo(
    () =>
      dashboard.slots.filter(
        (slot) =>
          slot.isActive &&
          new Date(slot.startsAt).getTime() > availabilityCutoffMs &&
          !activeBookingSlotIds.has(slot.id),
      ),
    [activeBookingSlotIds, availabilityCutoffMs, dashboard.slots],
  )

  const selectedBooking = useMemo(
    () => dashboard.bookings.find((booking) => booking.id === selectedBookingId) || null,
    [dashboard.bookings, selectedBookingId],
  )

  const clientProfiles = useMemo(
    () => buildClientProfiles(dashboard.bookings),
    [dashboard.bookings],
  )

  const effectiveSelectedClientId = useMemo(() => {
    const hasExplicitSelection = clientProfiles.some((client) => client.id === selectedClientId)

    if (hasExplicitSelection) {
      return selectedClientId
    }

    return clientProfiles[0]?.id || ''
  }, [clientProfiles, selectedClientId])

  const selectedClient = useMemo(
    () => clientProfiles.find((client) => client.id === effectiveSelectedClientId) || null,
    [clientProfiles, effectiveSelectedClientId],
  )

  const bookingSlotOptions = useMemo(() => {
    if (!selectedBooking) {
      return availableSlots
    }

    const currentSlot = dashboard.slots.find((slot) => slot.id === selectedBooking.slotId)
    return currentSlot
      ? [currentSlot, ...availableSlots.filter((slot) => slot.id !== currentSlot.id)]
      : availableSlots
  }, [availableSlots, dashboard.slots, selectedBooking])

  async function handleSignOut() {
    await destroyAdminSession()
    onSignedOut()
  }

  async function handleSaveSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavingState('saving')
    setDashboardMessage('')

    const path = slotForm.slotId ? `/api/admin/slots/${slotForm.slotId}` : '/api/admin/slots'
    const method = slotForm.slotId ? 'PUT' : 'POST'
    const response = await adminApiRequest(path, {
      method,
      body: JSON.stringify({
        slotDate: slotForm.slotDate,
        slotTime: slotForm.slotTime,
        launchLocation: slotForm.launchLocation,
        notes: slotForm.notes,
        isActive: slotForm.isActive,
      }),
    })

    setSavingState('idle')

    if (!response.ok) {
      setDashboardMessage(response.payload.message || 'Unable to save the slot.')
      return
    }

    setSlotForm(emptySlotForm())
    setDashboardMessage(slotForm.slotId ? 'Slot updated.' : 'Slot added.')
    setDashboardLoading(true)
    await loadDashboard()
  }

  async function handleDeleteSlot(slotId: string) {
    setSavingState('saving')
    setDashboardMessage('')

    const response = await adminApiRequest(`/api/admin/slots/${slotId}`, {
      method: 'DELETE',
    })

    setSavingState('idle')

    if (!response.ok && response.status !== 204) {
      setDashboardMessage(response.payload.message || 'Unable to delete the slot.')
      return
    }

    if (slotForm.slotId === slotId) {
      setSlotForm(emptySlotForm())
    }

    setDashboardMessage('Slot deleted.')
    setDashboardLoading(true)
    await loadDashboard()
  }

  function startEditingSlot(slot: AdminSlot) {
    setSlotForm({
      slotId: slot.id,
      slotDate: formatSlotDateInput(slot.startsAt),
      slotTime: formatSlotTimeInput(slot.startsAt),
      launchLocation: slot.launchLocation,
      notes: slot.notes || '',
      isActive: slot.isActive,
    })
  }

  function startEditingBooking(booking: AdminBooking) {
    setSelectedBookingId(booking.id)
    setSelectedClientId(getClientProfileId(booking))
    setBookingForm({
      bookingId: booking.id,
      slotId: booking.slotId,
      fullName: booking.fullName,
      email: booking.email,
      phone: booking.phone,
      notes: booking.notes || '',
      status: booking.status,
    })
  }

  async function handleSaveBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavingState('saving')
    setDashboardMessage('')

    const path = bookingForm.bookingId
      ? `/api/admin/bookings/${bookingForm.bookingId}`
      : '/api/admin/bookings'
    const method = bookingForm.bookingId ? 'PUT' : 'POST'
    const response = await adminApiRequest(path, {
      method,
      body: JSON.stringify({
        slotId: bookingForm.slotId,
        fullName: bookingForm.fullName,
        email: bookingForm.email,
        phone: bookingForm.phone,
        notes: bookingForm.notes,
        status: bookingForm.status,
      }),
    })

    setSavingState('idle')

    if (!response.ok) {
      setDashboardMessage(response.payload.message || 'Unable to save the booking.')
      return
    }

    setBookingForm(emptyBookingForm())
    setSelectedBookingId('')
    setDashboardMessage(bookingForm.bookingId ? 'Booking updated.' : 'Booking created.')
    setDashboardLoading(true)
    await loadDashboard()
  }

  async function handleResendEmails(bookingId: string) {
    setSavingState('saving')
    setDashboardMessage('')

    const response = await adminApiRequest(`/api/admin/bookings/${bookingId}/resend-emails`, {
      method: 'POST',
    })

    setSavingState('idle')

    if (!response.ok) {
      setDashboardMessage(response.payload.message || 'Unable to retry booking emails.')
      return
    }

    setDashboardMessage('Email retry started.')
    setDashboardLoading(true)
    await loadDashboard()
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="grid gap-6 self-start">
        <FadeIn className="panel p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="section-label w-fit">Secure Admin Session</span>
              <h2 className="section-title text-3xl">Operations control panel</h2>
              <p className="mt-4 text-base leading-8 text-slate">{adminSession.email}</p>
            </div>
            <button className="button-dark" type="button" onClick={() => void handleSignOut()}>
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              { label: 'Open Slots', value: availableSlots.length.toString() },
              {
                label: 'Active Bookings',
                value: dashboard.bookings.filter((booking) => booking.status !== 'cancelled').length.toString(),
              },
              {
                label: 'Client Profiles',
                value: clientProfiles.length.toString(),
              },
              {
                label: 'Failed Emails',
                value: dashboard.bookings
                  .filter(
                    (booking) =>
                      booking.emailCustomerStatus === 'failed' ||
                      booking.emailAdminStatus === 'failed',
                  )
                  .length.toString(),
              },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-ink/10 bg-[#f7fbfc] px-5 py-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">{item.label}</p>
                <p className="mt-3 font-display text-4xl font-semibold text-ink">{item.value}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn className="panel p-8" delay={0.05}>
          <div className="flex items-center gap-3">
            <Plus className="h-5 w-5 text-lake" />
            <h3 className="text-2xl font-semibold text-ink">Available slots</h3>
          </div>

          <div className="mt-6 grid gap-3">
            {dashboardLoading ? (
              <p className="text-sm text-slate">Loading slot inventory...</p>
            ) : availableSlots.length === 0 ? (
              <p className="text-sm text-slate">No open slots at the moment.</p>
            ) : (
              availableSlots.map((slot) => (
                <div key={slot.id} className="soft-panel p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-ink">{formatSlotDateTime(slot.startsAt)}</p>
                      <p className="mt-1 text-sm leading-7 text-slate">{slot.launchLocation}</p>
                      {slot.notes ? <p className="mt-1 text-sm leading-7 text-slate">{slot.notes}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink"
                        type="button"
                        onClick={() => startEditingSlot(slot)}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink"
                        type="button"
                        onClick={() => void handleDeleteSlot(slot.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <form className="mt-6 grid gap-4" onSubmit={handleSaveSlot}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="field-label">
                Date
                <input
                  className="input-field"
                  type="date"
                  value={slotForm.slotDate}
                  onChange={(event) =>
                    setSlotForm((current) => ({ ...current, slotDate: event.target.value }))
                  }
                />
              </label>
              <label className="field-label">
                Time
                <input
                  className="input-field"
                  type="time"
                  value={slotForm.slotTime}
                  onChange={(event) =>
                    setSlotForm((current) => ({ ...current, slotTime: event.target.value }))
                  }
                />
              </label>
              <label className="field-label">
                Launch Location
                <select
                  className="input-field"
                  value={slotForm.launchLocation}
                  onChange={(event) =>
                    setSlotForm((current) => ({
                      ...current,
                      launchLocation: event.target.value,
                    }))
                  }
                >
                  {launchLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Active
                <select
                  className="input-field"
                  value={slotForm.isActive ? 'true' : 'false'}
                  onChange={(event) =>
                    setSlotForm((current) => ({
                      ...current,
                      isActive: event.target.value === 'true',
                    }))
                  }
                >
                  <option value="true">Visible online</option>
                  <option value="false">Hidden online</option>
                </select>
              </label>
            </div>
            <label className="field-label">
              Internal Note
              <textarea
                className="text-area"
                placeholder="Optional note shown alongside the slot."
                value={slotForm.notes}
                onChange={(event) =>
                  setSlotForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button className="button-dark" type="submit">
                <Save className="h-4 w-4" />
                {savingState === 'saving' ? 'Saving...' : slotForm.slotId ? 'Update Slot' : 'Add Slot'}
              </button>
              {slotForm.slotId ? (
                <button
                  className="rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold text-ink"
                  type="button"
                  onClick={() => setSlotForm(emptySlotForm())}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </FadeIn>

        <FadeIn className="panel p-8" delay={0.1}>
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-lake" />
            <h3 className="text-2xl font-semibold text-ink">Manual booking</h3>
          </div>

          <form className="mt-6 grid gap-4" onSubmit={handleSaveBooking}>
            <label className="field-label">
              Slot
              <select
                className="input-field"
                value={bookingForm.slotId}
                onChange={(event) =>
                  setBookingForm((current) => ({ ...current, slotId: event.target.value }))
                }
              >
                <option value="">Choose an available slot</option>
                {bookingSlotOptions.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {formatSlotDateTime(slot.startsAt)} · {slot.launchLocation}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="field-label">
                Client Name
                <input
                  className="input-field"
                  value={bookingForm.fullName}
                  onChange={(event) =>
                    setBookingForm((current) => ({ ...current, fullName: event.target.value }))
                  }
                />
              </label>
              <label className="field-label">
                Email
                <input
                  className="input-field"
                  type="email"
                  value={bookingForm.email}
                  onChange={(event) =>
                    setBookingForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </label>
              <label className="field-label">
                Phone
                <input
                  className="input-field"
                  value={bookingForm.phone}
                  onChange={(event) =>
                    setBookingForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </label>
              <label className="field-label">
                Status
                <select
                  className="input-field"
                  value={bookingForm.status}
                  onChange={(event) =>
                    setBookingForm((current) => ({
                      ...current,
                      status: event.target.value as BookingStatus,
                    }))
                  }
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
            </div>
            <label className="field-label">
              Notes
              <textarea
                className="text-area"
                placeholder="Client note, dock note, or scheduling detail."
                value={bookingForm.notes}
                onChange={(event) =>
                  setBookingForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button className="button-dark" type="submit">
                <Save className="h-4 w-4" />
                {savingState === 'saving' ? 'Saving...' : bookingForm.bookingId ? 'Update Booking' : 'Create Booking'}
              </button>
              {bookingForm.bookingId ? (
                <button
                  className="rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold text-ink"
                  type="button"
                  onClick={() => {
                    setBookingForm(emptyBookingForm())
                    setSelectedBookingId('')
                  }}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </FadeIn>
      </div>

      <div className="grid gap-6">
        {dashboardMessage ? (
          <div className="rounded-2xl border border-ink/10 bg-[#f7fbfc] px-4 py-4 text-sm text-slate">
            {dashboardMessage}
          </div>
        ) : null}

        <FadeIn className="panel p-8" delay={0.03}>
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-lake" />
            <h3 className="text-2xl font-semibold text-ink">Client profiles</h3>
          </div>

          <div className="mt-6 grid gap-4">
            {dashboardLoading ? (
              <p className="text-sm text-slate">Loading client profiles...</p>
            ) : clientProfiles.length === 0 ? (
              <p className="text-sm text-slate">Client profiles appear here as bookings come in.</p>
            ) : (
              clientProfiles.map((client) => (
                <button
                  key={client.id}
                  className={`soft-panel w-full p-5 text-left transition ${
                    effectiveSelectedClientId === client.id ? 'border-lake/50 bg-lake/5' : ''
                  }`}
                  type="button"
                  onClick={() => setSelectedClientId(client.id)}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-semibold text-ink">{client.fullName}</p>
                        <span className="status-pill status-pill-neutral">
                          {client.bookingCount} {client.bookingCount === 1 ? 'booking' : 'bookings'}
                        </span>
                        {client.nextLaunchAt ? (
                          <span className="status-pill status-pill-active">Upcoming launch scheduled</span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-7 text-slate">
                        {client.email} · {client.phone}
                      </p>
                      <p className="text-sm leading-7 text-slate">
                        Last launch activity: {formatControlPanelDateTime(client.latestLaunchAt || client.bookings[0].slot.startsAt)}
                      </p>
                    </div>

                    <div className="grid gap-2 text-sm text-slate md:text-right">
                      <span>Confirmed: {client.activeBookings}</span>
                      <span>Completed: {client.completedBookings}</span>
                      <span>Cancelled: {client.cancelledBookings}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </FadeIn>

        <FadeIn className="panel p-8" delay={0.04}>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-lake" />
            <h3 className="text-2xl font-semibold text-ink">Selected client</h3>
          </div>

          {selectedClient ? (
            <div className="mt-6 grid gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-ink/10 bg-[#f7fbfc] px-5 py-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">Client</p>
                  <p className="mt-3 text-2xl font-semibold text-ink">{selectedClient.fullName}</p>
                  <p className="mt-2 text-sm leading-7 text-slate">{selectedClient.email}</p>
                  <p className="text-sm leading-7 text-slate">{selectedClient.phone}</p>
                </div>
                <div className="rounded-3xl border border-ink/10 bg-[#f7fbfc] px-5 py-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">Next launch</p>
                  <p className="mt-3 text-lg font-semibold text-ink">
                    {selectedClient.nextLaunchAt
                      ? formatControlPanelDateTime(selectedClient.nextLaunchAt)
                      : 'No upcoming launch scheduled'}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate">
                    Latest launch location: {selectedClient.latestLaunchLocation}
                  </p>
                  <p className="text-sm leading-7 text-slate">
                    Current status: {statusLabel(selectedClient.latestStatus)}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-ink/10 bg-white px-5 py-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">Profile notes</p>
                <p className="mt-3 text-sm leading-7 text-slate">
                  {selectedClient.latestNote ||
                    'No client-specific note is stored yet. The latest booking note will surface here automatically.'}
                </p>
              </div>

              <div className="grid gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">Booking history</p>
                {selectedClient.bookings.map((booking) => (
                  <div key={booking.id} className="soft-panel p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-base font-semibold text-ink">
                            {formatControlPanelDateTime(booking.slot.startsAt)}
                          </p>
                          <span
                            className={`status-pill ${
                              booking.status === 'cancelled'
                                ? 'status-pill-failed'
                                : booking.status === 'completed'
                                  ? 'status-pill-neutral'
                                  : 'status-pill-active'
                            }`}
                          >
                            {statusLabel(booking.status)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-slate">{booking.slot.launchLocation}</p>
                        <p className="text-sm leading-7 text-slate">
                          Created from: {booking.createdBy === 'admin' ? 'Admin entry' : 'Website booking'}
                        </p>
                        {booking.notes ? (
                          <p className="mt-2 text-sm leading-7 text-slate">{booking.notes}</p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink"
                          type="button"
                          onClick={() => startEditingBooking(booking)}
                        >
                          Edit booking
                        </button>
                        <button
                          className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink"
                          type="button"
                          onClick={() => void handleResendEmails(booking.id)}
                        >
                          <RefreshCcw className="h-4 w-4" />
                          Retry emails
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate">Select a client to review their profile and booking history.</p>
          )}
        </FadeIn>

        <FadeIn className="panel p-8" delay={0.05}>
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-lake" />
            <h3 className="text-2xl font-semibold text-ink">Booking queue</h3>
          </div>

          <div className="mt-6 grid gap-4">
            {dashboardLoading ? (
              <p className="text-sm text-slate">Loading bookings...</p>
            ) : dashboard.bookings.length === 0 ? (
              <p className="text-sm text-slate">No bookings yet.</p>
            ) : (
              dashboard.bookings.map((booking) => (
                <div key={booking.id} className="soft-panel p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-semibold text-ink">{booking.fullName}</p>
                        <span
                          className={`status-pill ${
                            booking.status === 'cancelled'
                              ? 'status-pill-failed'
                              : booking.status === 'completed'
                                ? 'status-pill-neutral'
                                : 'status-pill-active'
                          }`}
                        >
                          {statusLabel(booking.status)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-slate">
                        {formatSlotDateTime(booking.slot.startsAt)} · {booking.slot.launchLocation}
                      </p>
                      <p className="text-sm leading-7 text-slate">
                        {booking.email} · {booking.phone}
                      </p>
                      {booking.notes ? (
                        <p className="mt-2 text-sm leading-7 text-slate">{booking.notes}</p>
                      ) : null}
                      <div className="mt-3 grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate/80 md:grid-cols-2">
                        <span>Customer Email: {emailStatusLabel(booking.emailCustomerStatus)}</span>
                        <span>Admin Email: {emailStatusLabel(booking.emailAdminStatus)}</span>
                      </div>
                      {booking.emailCustomerError || booking.emailAdminError ? (
                        <p className="mt-2 text-sm leading-7 text-[#8a3b34]">
                          {booking.emailCustomerError || booking.emailAdminError}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink"
                        type="button"
                        onClick={() => startEditingBooking(booking)}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink"
                        type="button"
                        onClick={() => void handleResendEmails(booking.id)}
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Retry Emails
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </FadeIn>

        <FadeIn className="panel p-8" delay={0.1}>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-lake" />
            <h3 className="text-2xl font-semibold text-ink">Email reliability</h3>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              {
                title: 'Customer confirmations',
                value: dashboard.bookings.filter((booking) => booking.emailCustomerStatus === 'sent').length,
              },
              {
                title: 'Internal notifications',
                value: dashboard.bookings.filter((booking) => booking.emailAdminStatus === 'sent').length,
              },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-ink/10 bg-[#f7fbfc] px-5 py-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">{item.title}</p>
                <p className="mt-3 flex items-center gap-3 text-3xl font-semibold text-ink">
                  <CheckCircle2 className="h-5 w-5 text-lake" />
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </div>
  )
}
