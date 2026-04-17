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
  ShipWheel,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react'

import { FadeIn } from '../ui/FadeIn'
import {
  adminApiRequest,
  destroyAccountSession,
  type AccountSession,
} from '../../lib/adminSession'
import { formatSlotDateTime } from '../../lib/reservation'
import type {
  AdminBooking,
  AdminDashboardResponse,
  AdminSlot,
  BookingStatus,
  ClientAccount,
  ClientServiceEntitlement,
} from '../../types/booking'

const launchLocations = ['Lloyd Boat Launch', 'Evanston Boat Launch'] as const

type AdminDashboardProps = {
  accountSession: AccountSession
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
  clientAccountId: string
  serviceEntitlementId: string
  slotId: string
  fullName: string
  email: string
  phone: string
  notes: string
  status: BookingStatus
}

type ServiceFormState = {
  id: string
  serviceName: string
  totalUnits: string
  notes: string
}

type ClientFormState = {
  clientId: string
  fullName: string
  email: string
  password: string
  phone: string
  boatName: string
  boatMakeModel: string
  boatLengthFeet: string
  preferredLaunchLocation: string
  notes: string
  isActive: boolean
  services: ServiceFormState[]
}

type ClientSummary = ClientAccount & {
  bookings: AdminBooking[]
  upcomingBookings: AdminBooking[]
  lastReservedAt: string | null
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
    clientAccountId: '',
    serviceEntitlementId: '',
    slotId: '',
    fullName: '',
    email: '',
    phone: '',
    notes: '',
    status: 'confirmed',
  }
}

function createServiceFormRow(overrides: Partial<Omit<ServiceFormState, 'id'>> = {}): ServiceFormState {
  return {
    id: `service-${Math.random().toString(36).slice(2, 10)}`,
    serviceName: '',
    totalUnits: '',
    notes: '',
    ...overrides,
  }
}

function emptyClientForm(): ClientFormState {
  return {
    clientId: '',
    fullName: '',
    email: '',
    password: '',
    phone: '',
    boatName: '',
    boatMakeModel: '',
    boatLengthFeet: '',
    preferredLaunchLocation: launchLocations[0],
    notes: '',
    isActive: true,
    services: [createServiceFormRow()],
  }
}

function formatSlotDateInput(startsAt: string) {
  return formatInTimeZone(new Date(startsAt), 'America/Chicago', 'yyyy-MM-dd')
}

function formatSlotTimeInput(startsAt: string) {
  return formatInTimeZone(new Date(startsAt), 'America/Chicago', 'HH:mm')
}

function bookingStatusClasses(status: BookingStatus) {
  if (status === 'cancelled') {
    return 'status-pill-failed'
  }

  if (status === 'completed') {
    return 'status-pill-neutral'
  }

  return 'status-pill-active'
}

function normalizeClientServicesForRequest(services: ServiceFormState[]) {
  return services
    .map((service) => ({
      serviceName: service.serviceName.trim(),
      totalUnits: Number(service.totalUnits) || 0,
      notes: service.notes.trim(),
    }))
    .filter((service) => service.serviceName.length > 0)
}

function buildClientSummaries(clients: ClientAccount[], bookings: AdminBooking[]) {
  return clients
    .map((client) => {
      const clientBookings = bookings
        .filter(
          (booking) =>
            booking.clientAccountId === client.id ||
            booking.email.trim().toLowerCase() === client.email.trim().toLowerCase(),
        )
        .sort(
          (left, right) =>
            new Date(right.slot.startsAt).getTime() - new Date(left.slot.startsAt).getTime(),
        )

      const upcomingBookings = [...clientBookings]
        .filter(
          (booking) =>
            booking.status !== 'cancelled' && new Date(booking.slot.startsAt).getTime() >= Date.now(),
        )
        .sort(
          (left, right) =>
            new Date(left.slot.startsAt).getTime() - new Date(right.slot.startsAt).getTime(),
        )

      return {
        ...client,
        bookings: clientBookings,
        upcomingBookings,
        lastReservedAt: clientBookings[0]?.slot.startsAt || null,
      } satisfies ClientSummary
    })
    .sort((left, right) => left.fullName.localeCompare(right.fullName))
}

function statusLabel(status: BookingStatus) {
  if (status === 'cancelled') {
    return 'Cancelled'
  }

  if (status === 'completed') {
    return 'Completed'
  }

  return 'Confirmed'
}

function serviceOptionLabel(service: ClientServiceEntitlement) {
  return `${service.serviceName} · ${service.remainingUnits} remaining`
}

export function AdminDashboard({ accountSession, onSignedOut }: AdminDashboardProps) {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse>({
    slots: [],
    bookings: [],
    clients: [],
  })
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardMessage, setDashboardMessage] = useState('')
  const [slotForm, setSlotForm] = useState<SlotFormState>(emptySlotForm())
  const [bookingForm, setBookingForm] = useState<BookingFormState>(emptyBookingForm())
  const [clientForm, setClientForm] = useState<ClientFormState>(emptyClientForm())
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedBookingId, setSelectedBookingId] = useState('')
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

  const clientSummaries = useMemo(
    () => buildClientSummaries(dashboard.clients, dashboard.bookings),
    [dashboard.bookings, dashboard.clients],
  )

  const selectedClient = useMemo(
    () => clientSummaries.find((client) => client.id === selectedClientId) || null,
    [clientSummaries, selectedClientId],
  )

  const activeBookingSlotIds = useMemo(
    () =>
      new Set(
        dashboard.bookings
          .filter(
            (booking) =>
              booking.status !== 'cancelled' &&
              (!selectedBookingId || booking.id !== selectedBookingId),
          )
          .map((booking) => booking.slotId),
      ),
    [dashboard.bookings, selectedBookingId],
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

  const bookingClient = useMemo(
    () => dashboard.clients.find((client) => client.id === bookingForm.clientAccountId) || null,
    [bookingForm.clientAccountId, dashboard.clients],
  )

  const bookingClientServices = useMemo(() => {
    if (!bookingClient) {
      return [] as ClientServiceEntitlement[]
    }

    return bookingClient.services.filter(
      (service) =>
        service.remainingUnits > 0 || service.id === bookingForm.serviceEntitlementId,
    )
  }, [bookingClient, bookingForm.serviceEntitlementId])

  const bookingSlotOptions = useMemo(() => {
    if (!selectedBooking && !bookingClient) {
      return availableSlots
    }

    const locationFiltered = bookingClient
      ? availableSlots.filter((slot) => slot.launchLocation === bookingClient.preferredLaunchLocation)
      : availableSlots

    if (!selectedBooking) {
      return locationFiltered
    }

    const currentSlot = dashboard.slots.find((slot) => slot.id === selectedBooking.slotId)
    return currentSlot
      ? [currentSlot, ...locationFiltered.filter((slot) => slot.id !== currentSlot.id)]
      : locationFiltered
  }, [availableSlots, bookingClient, dashboard.slots, selectedBooking])

  const visibleAvailableSlots = useMemo(() => bookingSlotOptions.slice(0, 14), [bookingSlotOptions])

  async function handleSignOut() {
    await destroyAccountSession()
    onSignedOut()
  }

  function jumpToClientComposer() {
    document.getElementById('client-profile-composer')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  function startNewClientProfile() {
    setSelectedClientId('')
    setClientForm(emptyClientForm())
    jumpToClientComposer()
  }

  function startEditingClient(client: ClientAccount) {
    setSelectedClientId(client.id)
    setClientForm({
      clientId: client.id,
      fullName: client.fullName,
      email: client.email,
      password: '',
      phone: client.phone,
      boatName: client.boatName || '',
      boatMakeModel: client.boatMakeModel || '',
      boatLengthFeet: client.boatLengthFeet ? String(client.boatLengthFeet) : '',
      preferredLaunchLocation: client.preferredLaunchLocation,
      notes: client.notes || '',
      isActive: client.isActive,
      services:
        client.services.length > 0
          ? client.services.map((service) => createServiceFormRow({
              serviceName: service.serviceName,
              totalUnits: String(service.totalUnits),
              notes: service.notes || '',
            }))
          : emptyClientForm().services,
    })
    jumpToClientComposer()
  }

  function addServiceRow() {
    setClientForm((current) => ({
      ...current,
      services: [...current.services, createServiceFormRow()],
    }))
  }

  function updateServiceRow(serviceId: string, field: keyof Omit<ServiceFormState, 'id'>, value: string) {
    setClientForm((current) => ({
      ...current,
      services: current.services.map((service) =>
        service.id === serviceId ? { ...service, [field]: value } : service,
      ),
    }))
  }

  function removeServiceRow(serviceId: string) {
    setClientForm((current) => ({
      ...current,
      services:
        current.services.length === 1
          ? [createServiceFormRow()]
          : current.services.filter((service) => service.id !== serviceId),
    }))
  }

  function findExistingClientByEmail(email: string, currentClientId = '') {
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      return null
    }

    return (
      dashboard.clients.find(
        (client) =>
          client.email.trim().toLowerCase() === normalizedEmail && client.id !== currentClientId,
      ) || null
    )
  }

  function startEditingBooking(booking: AdminBooking) {
    setSelectedBookingId(booking.id)
    setSelectedClientId(booking.clientAccountId || '')
    setBookingForm({
      bookingId: booking.id,
      clientAccountId: booking.clientAccountId || '',
      serviceEntitlementId: booking.serviceEntitlementId || '',
      slotId: booking.slotId,
      fullName: booking.fullName,
      email: booking.email,
      phone: booking.phone,
      notes: booking.notes || '',
      status: booking.status,
    })
  }

  function applyClientToBookingForm(client: ClientAccount) {
    setBookingForm((current) => ({
      ...current,
      clientAccountId: client.id,
      serviceEntitlementId:
        client.services.find((service) => service.remainingUnits > 0)?.id || current.serviceEntitlementId,
      fullName: client.fullName,
      email: client.email,
      phone: client.phone,
    }))
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

  async function handleSaveClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavingState('saving')
    setDashboardMessage('')

    const existingClient = findExistingClientByEmail(clientForm.email, clientForm.clientId)

    if (existingClient) {
      setSavingState('idle')
      startEditingClient(existingClient)
      setDashboardMessage(
        'A client profile already exists for that email. The saved profile is open now so you can review or edit it instead of creating a duplicate.',
      )
      return
    }

    const path = clientForm.clientId
      ? `/api/admin/clients/${clientForm.clientId}`
      : '/api/admin/clients'
    const method = clientForm.clientId ? 'PUT' : 'POST'
    const response = await adminApiRequest<{ message?: string; client?: ClientAccount }>(path, {
      method,
      body: JSON.stringify({
        email: clientForm.email,
        password: clientForm.password,
        fullName: clientForm.fullName,
        phone: clientForm.phone,
        boatName: clientForm.boatName,
        boatMakeModel: clientForm.boatMakeModel,
        boatLengthFeet: clientForm.boatLengthFeet ? Number(clientForm.boatLengthFeet) : undefined,
        preferredLaunchLocation: clientForm.preferredLaunchLocation,
        notes: clientForm.notes,
        isActive: clientForm.isActive,
        services: normalizeClientServicesForRequest(clientForm.services),
      }),
    })

    setSavingState('idle')

    if (!response.ok) {
      const matchedExistingClient = findExistingClientByEmail(clientForm.email, clientForm.clientId)

      if (
        response.payload.message?.toLowerCase().includes('already exists') &&
        matchedExistingClient
      ) {
        startEditingClient(matchedExistingClient)
      }

      setDashboardMessage(response.payload.message || 'Unable to save the client profile.')
      return
    }

    const savedClient = response.payload.client || null

    if (savedClient) {
      setDashboard((current) => ({
        ...current,
        clients: current.clients.some((client) => client.id === savedClient.id)
          ? current.clients.map((client) => (client.id === savedClient.id ? savedClient : client))
          : [...current.clients, savedClient].sort((left, right) =>
              left.fullName.localeCompare(right.fullName),
            ),
      }))
      startEditingClient(savedClient)
    }

    setDashboardMessage(
      clientForm.clientId
        ? `Client profile updated and saved to the admin portal. ${savedClient?.fullName || 'This client'} can use their email and password to sign in.`
        : `Client profile created and saved. ${savedClient?.fullName || 'This client'} now has their own client login account.`,
    )
    setDashboardLoading(true)
    await loadDashboard()
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
        clientAccountId: bookingForm.clientAccountId,
        serviceEntitlementId: bookingForm.serviceEntitlementId,
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
      setDashboardMessage(response.payload.message || 'Unable to save the reservation.')
      return
    }

    setDashboardMessage(bookingForm.bookingId ? 'Reservation updated.' : 'Reservation created.')
    setBookingForm(emptyBookingForm())
    setSelectedBookingId('')
    setDashboardLoading(true)
    await loadDashboard()
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

    setDashboardMessage(slotForm.slotId ? 'Slot updated.' : 'Slot added.')
    setSlotForm(emptySlotForm())
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

    setDashboardMessage('Slot removed.')
    setDashboardLoading(true)
    if (slotForm.slotId === slotId) {
      setSlotForm(emptySlotForm())
    }
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

    setDashboardMessage('Confirmation emails are being resent.')
    setDashboardLoading(true)
    await loadDashboard()
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[0.98fr_1.02fr]">
      <div className="grid gap-6 self-start">
        <FadeIn className="panel p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="section-label w-fit">Secure Admin Session</span>
              <h2 className="section-title text-3xl">Client and reservation control</h2>
              <p className="mt-4 text-base leading-8 text-slate">
                {accountSession.email}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="button-dark" type="button" onClick={startNewClientProfile}>
                <Plus className="h-4 w-4" />
                Create Client Profile
              </button>
              <button
                className="rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold text-ink"
                type="button"
                onClick={() => void loadDashboard()}
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>
              <button className="button-dark" type="button" onClick={() => void handleSignOut()}>
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              { label: 'Client Profiles', value: dashboard.clients.length.toString() },
              {
                label: 'Active Reservations',
                value: dashboard.bookings
                  .filter((booking) => booking.status !== 'cancelled')
                  .length.toString(),
              },
              { label: 'Open Slots', value: availableSlots.length.toString() },
              {
                label: 'Email Issues',
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
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">
                  {item.label}
                </p>
                <p className="mt-3 font-display text-4xl font-semibold text-ink">{item.value}</p>
              </div>
            ))}
          </div>

          {dashboardMessage ? (
            <div className="mt-6 rounded-3xl border border-ink/10 bg-white px-5 py-5 text-sm text-slate">
              {dashboardMessage}
            </div>
          ) : null}
        </FadeIn>

        <FadeIn className="panel p-8" delay={0.05}>
          <div id="client-profile-composer" className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-lake" />
            <h3 className="text-2xl font-semibold text-ink">Client profile composer</h3>
          </div>
          <p className="mt-4 text-base leading-8 text-slate">
            Create the client login here, store the boat details and desired launch spot, and load any contracted services directly onto the dashboard.
          </p>

          <form className="mt-6 grid gap-4" onSubmit={handleSaveClient}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="field-label">
                Full name
                <input
                  className="input-field"
                  value={clientForm.fullName}
                  onChange={(event) =>
                    setClientForm((current) => ({ ...current, fullName: event.target.value }))
                  }
                />
              </label>
              <label className="field-label">
                Email login
                <input
                  className="input-field"
                  type="email"
                  value={clientForm.email}
                  onChange={(event) =>
                    setClientForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </label>
              <label className="field-label">
                Password
                <input
                  className="input-field"
                  type="password"
                  placeholder={
                    clientForm.clientId ? 'Leave blank to keep current password' : 'Assign a password'
                  }
                  value={clientForm.password}
                  onChange={(event) =>
                    setClientForm((current) => ({ ...current, password: event.target.value }))
                  }
                />
              </label>
              <label className="field-label">
                Phone
                <input
                  className="input-field"
                  value={clientForm.phone}
                  onChange={(event) =>
                    setClientForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </label>
              <label className="field-label">
                Boat name
                <input
                  className="input-field"
                  value={clientForm.boatName}
                  onChange={(event) =>
                    setClientForm((current) => ({ ...current, boatName: event.target.value }))
                  }
                />
              </label>
              <label className="field-label">
                Make / model
                <input
                  className="input-field"
                  value={clientForm.boatMakeModel}
                  onChange={(event) =>
                    setClientForm((current) => ({ ...current, boatMakeModel: event.target.value }))
                  }
                />
              </label>
              <label className="field-label">
                Length (ft)
                <input
                  className="input-field"
                  inputMode="decimal"
                  value={clientForm.boatLengthFeet}
                  onChange={(event) =>
                    setClientForm((current) => ({
                      ...current,
                      boatLengthFeet: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="field-label">
                Desired launch location
                <select
                  className="input-field"
                  value={clientForm.preferredLaunchLocation}
                  onChange={(event) =>
                    setClientForm((current) => ({
                      ...current,
                      preferredLaunchLocation: event.target.value,
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
              <label className="field-label md:col-span-2">
                Profile status
                <select
                  className="input-field"
                  value={clientForm.isActive ? 'true' : 'false'}
                  onChange={(event) =>
                    setClientForm((current) => ({
                      ...current,
                      isActive: event.target.value === 'true',
                    }))
                  }
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </label>
            </div>

            <label className="field-label">
              Internal notes
              <textarea
                className="text-area"
                placeholder="Storage notes, access notes, or anything your team should keep on file."
                value={clientForm.notes}
                onChange={(event) =>
                  setClientForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </label>

            <div className="rounded-3xl border border-ink/10 bg-[#f8fbfc] px-5 py-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-lake" />
                  <div>
                    <p className="text-lg font-semibold text-ink">Contracted services</p>
                    <p className="text-sm leading-7 text-slate">
                      Add the services included in the client&apos;s agreement so they can simply redeem them by choosing a date and time.
                    </p>
                  </div>
                </div>
                <button
                  className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink"
                  type="button"
                  onClick={addServiceRow}
                >
                  <Plus className="h-4 w-4" />
                  Add Service
                </button>
              </div>

              <div className="mt-5 grid gap-4">
                {clientForm.services.map((service) => (
                  <div key={service.id} className="rounded-3xl border border-ink/10 bg-white px-4 py-4">
                    <div className="grid gap-4 md:grid-cols-[1.2fr_0.45fr_1fr_auto]">
                      <label className="field-label">
                        Service name
                        <input
                          className="input-field"
                          placeholder="Quick Reset"
                          value={service.serviceName}
                          onChange={(event) =>
                            updateServiceRow(service.id, 'serviceName', event.target.value)
                          }
                        />
                      </label>
                      <label className="field-label">
                        Total uses
                        <input
                          className="input-field"
                          inputMode="numeric"
                          placeholder="12"
                          value={service.totalUnits}
                          onChange={(event) =>
                            updateServiceRow(service.id, 'totalUnits', event.target.value)
                          }
                        />
                      </label>
                      <label className="field-label">
                        Note
                        <input
                          className="input-field"
                          placeholder="Optional contract note"
                          value={service.notes}
                          onChange={(event) =>
                            updateServiceRow(service.id, 'notes', event.target.value)
                          }
                        />
                      </label>
                      <div className="flex items-end">
                        <button
                          className="rounded-full border border-ink/10 px-4 py-3 text-sm font-semibold text-ink"
                          type="button"
                          onClick={() => removeServiceRow(service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="button-dark" type="submit">
                <Save className="h-4 w-4" />
                {savingState === 'saving'
                  ? 'Saving...'
                  : clientForm.clientId
                    ? 'Update Client Profile'
                    : 'Create Client Profile'}
              </button>
              {clientForm.clientId ? (
                <button
                  className="rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold text-ink"
                  type="button"
                  onClick={startNewClientProfile}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </FadeIn>

        <FadeIn className="panel p-8" delay={0.1}>
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-lake" />
            <h3 className="text-2xl font-semibold text-ink">Manual reservation</h3>
          </div>
          <p className="mt-4 text-base leading-8 text-slate">
            Use a saved client profile, attach one of their contracted services if needed, and place the reservation directly into the system.
          </p>

          <form className="mt-6 grid gap-4" onSubmit={handleSaveBooking}>
            <label className="field-label">
              Client profile
              <select
                className="input-field"
                value={bookingForm.clientAccountId}
                onChange={(event) => {
                  const nextClientId = event.target.value
                  const nextClient = dashboard.clients.find((client) => client.id === nextClientId)

                  setBookingForm((current) => ({
                    ...current,
                    clientAccountId: nextClientId,
                    serviceEntitlementId: '',
                  }))

                  if (nextClient) {
                    applyClientToBookingForm(nextClient)
                  }
                }}
              >
                <option value="">Choose a saved profile or enter manually</option>
                {dashboard.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.fullName} · {client.preferredLaunchLocation}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="field-label">
                Client name
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
                Booking status
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
              Contracted service
              <select
                className="input-field"
                value={bookingForm.serviceEntitlementId}
                onChange={(event) =>
                  setBookingForm((current) => ({
                    ...current,
                    serviceEntitlementId: event.target.value,
                  }))
                }
              >
                <option value="">No service selected</option>
                {bookingClientServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {serviceOptionLabel(service)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-label">
              Date / time slot
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

            <label className="field-label">
              Notes
              <textarea
                className="text-area"
                placeholder="Anything helpful to keep with the reservation."
                value={bookingForm.notes}
                onChange={(event) =>
                  setBookingForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button className="button-dark" type="submit">
                <Save className="h-4 w-4" />
                {savingState === 'saving'
                  ? 'Saving...'
                  : bookingForm.bookingId
                    ? 'Update Reservation'
                    : 'Create Reservation'}
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

        <FadeIn className="panel p-8" delay={0.14}>
          <div className="flex items-center gap-3">
            <ShipWheel className="h-5 w-5 text-lake" />
            <h3 className="text-2xl font-semibold text-ink">Availability controls</h3>
          </div>
          <p className="mt-4 text-base leading-8 text-slate">
            Slots auto-generate every 30 minutes from 8:00 AM through 7:00 PM, and anything inside the next 24 hours stays unavailable to clients. Use this panel to override or hide a slot when needed.
          </p>

          <div className="mt-6 grid gap-3">
            {dashboardLoading ? (
              <p className="text-sm text-slate">Loading slot inventory...</p>
            ) : visibleAvailableSlots.length === 0 ? (
              <p className="text-sm text-slate">No open slots are available right now.</p>
            ) : (
              visibleAvailableSlots.map((slot) => (
                <div key={slot.id} className="soft-panel p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-ink">
                        {formatSlotDateTime(slot.startsAt)}
                      </p>
                      <p className="text-sm leading-7 text-slate">{slot.launchLocation}</p>
                      {slot.notes ? (
                        <p className="text-sm leading-7 text-slate">{slot.notes}</p>
                      ) : null}
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
                  step={1800}
                  value={slotForm.slotTime}
                  onChange={(event) =>
                    setSlotForm((current) => ({ ...current, slotTime: event.target.value }))
                  }
                />
              </label>
              <label className="field-label">
                Launch location
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
                Slot visibility
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
              Internal note
              <textarea
                className="text-area"
                value={slotForm.notes}
                onChange={(event) =>
                  setSlotForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button className="button-dark" type="submit">
                <Save className="h-4 w-4" />
                {savingState === 'saving'
                  ? 'Saving...'
                  : slotForm.slotId
                    ? 'Update Slot'
                    : 'Add Slot'}
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
      </div>

      <div className="grid gap-6">
        <FadeIn className="panel p-8" delay={0.04}>
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-lake" />
            <h3 className="text-2xl font-semibold text-ink">Client profiles</h3>
          </div>
          <div className="mt-6 grid gap-4">
            {dashboardLoading ? (
              <p className="text-sm text-slate">Loading client profiles...</p>
            ) : clientSummaries.length === 0 ? (
              <p className="rounded-3xl border border-ink/10 bg-[#f7fbfc] px-5 py-5 text-sm leading-7 text-slate">
                No client profiles have been created yet.
              </p>
            ) : (
              clientSummaries.map((client) => (
                <button
                  key={client.id}
                  className={`rounded-3xl border px-5 py-5 text-left transition ${
                    selectedClientId === client.id
                      ? 'border-lake bg-lake/10'
                      : 'border-ink/10 bg-white hover:border-lake/30'
                  }`}
                  type="button"
                  onClick={() => startEditingClient(client)}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-ink">{client.fullName}</p>
                      <p className="mt-1 text-sm leading-7 text-slate">{client.email}</p>
                      <p className="text-sm leading-7 text-slate">
                        {client.preferredLaunchLocation}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="status-pill status-pill-active">
                        {client.services.reduce((total, service) => total + service.remainingUnits, 0)} remaining uses
                      </span>
                      <span className="status-pill">
                        {client.upcomingBookings.length} upcoming
                      </span>
                    </div>
                  </div>

                  {client.services.length > 0 ? (
                    <div className="mt-4 grid gap-2">
                      {client.services.map((service) => (
                        <div
                          key={service.id}
                          className="flex flex-col gap-1 rounded-2xl border border-ink/10 bg-[#f7fbfc] px-4 py-3 text-sm text-slate md:flex-row md:items-center md:justify-between"
                        >
                          <span className="font-semibold text-ink">{service.serviceName}</span>
                          <span>
                            {service.remainingUnits} remaining of {service.totalUnits}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm leading-7 text-slate">
                      No contracted services have been added yet.
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        </FadeIn>

        <FadeIn className="panel p-8" delay={0.08}>
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-lake" />
            <h3 className="text-2xl font-semibold text-ink">Reservations on file</h3>
          </div>
          <div className="mt-6 grid gap-4">
            {dashboardLoading ? (
              <p className="text-sm text-slate">Loading reservations...</p>
            ) : dashboard.bookings.length === 0 ? (
              <p className="rounded-3xl border border-ink/10 bg-[#f7fbfc] px-5 py-5 text-sm leading-7 text-slate">
                No reservations have been created yet.
              </p>
            ) : (
              dashboard.bookings.map((booking) => (
                <div key={booking.id} className="soft-panel p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-ink">{booking.fullName}</p>
                      <p className="mt-1 text-sm leading-7 text-slate">
                        {formatSlotDateTime(booking.slot.startsAt)}
                      </p>
                      <p className="text-sm leading-7 text-slate">{booking.slot.launchLocation}</p>
                      {booking.serviceName ? (
                        <p className="text-sm leading-7 text-slate">
                          Service reserved: {booking.serviceName}
                        </p>
                      ) : null}
                      {booking.notes ? (
                        <p className="mt-2 text-sm leading-7 text-slate">{booking.notes}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`status-pill ${bookingStatusClasses(booking.status)}`}>
                        {statusLabel(booking.status)}
                      </span>
                      <span className="status-pill">{booking.createdBy}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate">
                    <span className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4 text-lake" />
                      Customer: {booking.emailCustomerStatus}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4 text-lake" />
                      Admin: {booking.emailAdminStatus}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
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
                      Resend Emails
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </FadeIn>

        {selectedClient ? (
          <FadeIn className="panel p-8" delay={0.12}>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-lake" />
              <h3 className="text-2xl font-semibold text-ink">Selected client snapshot</h3>
            </div>
            <div className="mt-6 grid gap-4">
              <div className="rounded-3xl border border-ink/10 bg-[#f7fbfc] px-5 py-5">
                <p className="text-lg font-semibold text-ink">{selectedClient.fullName}</p>
                <p className="mt-1 text-sm leading-7 text-slate">{selectedClient.email}</p>
                <p className="text-sm leading-7 text-slate">{selectedClient.phone}</p>
                <p className="text-sm leading-7 text-slate">
                  Launch preference: {selectedClient.preferredLaunchLocation}
                </p>
              </div>
              <button
                className="button-dark w-full justify-center md:w-fit"
                type="button"
                onClick={() => {
                  applyClientToBookingForm(selectedClient)
                  setSelectedClientId(selectedClient.id)
                }}
              >
                Use This Client In Reservation Form
              </button>
              {selectedClient.upcomingBookings.length > 0 ? (
                <div className="grid gap-3">
                  {selectedClient.upcomingBookings.slice(0, 4).map((booking) => (
                    <div key={booking.id} className="soft-panel p-4">
                      <p className="font-semibold text-ink">
                        {formatSlotDateTime(booking.slot.startsAt)}
                      </p>
                      {booking.serviceName ? (
                        <p className="text-sm leading-7 text-slate">{booking.serviceName}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-7 text-slate">
                  This client does not have any upcoming reservations yet.
                </p>
              )}
            </div>
          </FadeIn>
        ) : null}
      </div>
    </div>
  )
}
