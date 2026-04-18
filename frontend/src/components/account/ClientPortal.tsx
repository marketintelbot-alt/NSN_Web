import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  CalendarClock,
  CheckCircle2,
  LoaderCircle,
  LogOut,
  PencilLine,
  Save,
  ShipWheel,
  Sparkles,
} from 'lucide-react'

import { FadeIn } from '../ui/FadeIn'
import {
  adminApiRequest,
  destroyAccountSession,
  type AccountSession,
} from '../../lib/adminSession'
import { serviceMenuSections, supportPhoneNumbers } from '../../content/site'
import {
  formatSlotDate,
  formatSlotDateTime,
  formatReturnTime,
  formatSlotTime,
  groupSlotsByDate,
  returnTimeOptions,
  suggestReturnTime,
} from '../../lib/reservation'
import type {
  ClientPortalResponse,
  ClientServiceEntitlement,
  PublicSlot,
} from '../../types/booking'

type ClientPortalProps = {
  session: AccountSession
  onSignedOut: () => void
}

type ProfileFormState = {
  fullName: string
  phone: string
  boatName: string
  boatMakeModel: string
  boatLengthFeet: string
  preferredLaunchLocation: string
  notes: string
}

const transportLaunchLocations = ['Lloyd Boat Launch', 'Evanston Boat Launch'] as const
const noTransportLaunchLocation = 'Not needed'

function emptyProfileForm(): ProfileFormState {
  return {
    fullName: '',
    phone: '',
    boatName: '',
    boatMakeModel: '',
    boatLengthFeet: '',
    preferredLaunchLocation: transportLaunchLocations[0],
    notes: '',
  }
}

function buildProfileForm(portal: ClientPortalResponse | null): ProfileFormState {
  if (!portal) {
    return emptyProfileForm()
  }

  return {
    fullName: portal.client.fullName,
    phone: portal.client.phone,
    boatName: portal.client.boatName || '',
    boatMakeModel: portal.client.boatMakeModel || '',
    boatLengthFeet: portal.client.boatLengthFeet ? String(portal.client.boatLengthFeet) : '',
    preferredLaunchLocation: portal.client.preferredLaunchLocation,
    notes: portal.client.notes || '',
  }
}

function serviceCardClasses(service: ClientServiceEntitlement, selectedId: string) {
  if (service.id === selectedId) {
    return 'border-lake bg-lake/10'
  }

  if (service.remainingUnits === 0) {
    return 'border-ink/10 bg-[#f6f8fa] opacity-70'
  }

  return 'border-ink/10 bg-white hover:border-lake/40'
}

const addOnServiceOptions = serviceMenuSections
  .filter(
    (section) =>
      section.title.includes('A La Carte') || section.title.includes('Specialty & Add-On'),
  )
  .flatMap((section) => section.items)

const supportNumbersLine = supportPhoneNumbers.map((contact) => contact.phoneDisplay).join(' or ')
const returnTimingReminder = `If your return timing changes, call or text support at ${supportNumbersLine}.`

function toggleAddOnSelection(current: string[], addOnService: string) {
  return current.includes(addOnService)
    ? current.filter((item) => item !== addOnService)
    : [...current, addOnService]
}

function getDefaultServiceEntitlementId(
  portal: ClientPortalResponse | null,
  currentId = '',
) {
  if (!portal) {
    return ''
  }

  return (
    portal.client.services.find((service) => service.id === currentId)?.id ||
    portal.client.services.find((service) => service.remainingUnits > 0)?.id ||
    ''
  )
}

function buildBookingSlotChoices(
  portal: ClientPortalResponse | null,
  editingBookingId = '',
) {
  if (!portal) {
    return [] as PublicSlot[]
  }

  if (!editingBookingId) {
    return portal.availableSlots
  }

  const bookingBeingEdited =
    portal.upcomingBookings.find((booking) => booking.id === editingBookingId) || null

  if (!bookingBeingEdited) {
    return portal.availableSlots
  }

  return portal.availableSlots.some((slot) => slot.id === bookingBeingEdited.slotId)
    ? portal.availableSlots
    : [bookingBeingEdited.slot, ...portal.availableSlots]
}

export function ClientPortal({ session, onSignedOut }: ClientPortalProps) {
  const [portal, setPortal] = useState<ClientPortalResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshingPortal, setRefreshingPortal] = useState(false)
  const [portalMessage, setPortalMessage] = useState('')
  const [message, setMessage] = useState('')
  const [editingBookingId, setEditingBookingId] = useState('')
  const [selectedSlotId, setSelectedSlotId] = useState('')
  const [selectedReturnTime, setSelectedReturnTime] = useState('')
  const [selectedServiceEntitlementId, setSelectedServiceEntitlementId] = useState('')
  const [selectedAddOnServices, setSelectedAddOnServices] = useState<string[]>([])
  const [bookingNotes, setBookingNotes] = useState('')
  const [bookingState, setBookingState] = useState<'idle' | 'submitting'>('idle')
  const [confirmationMessage, setConfirmationMessage] = useState('')
  const [profileForm, setProfileForm] = useState<ProfileFormState>(emptyProfileForm())
  const [profileExpanded, setProfileExpanded] = useState(false)
  const [profileState, setProfileState] = useState<'idle' | 'saving'>('idle')
  const [profileMessage, setProfileMessage] = useState('')

  function scrollToBookingComposer() {
    document.getElementById('client-booking-composer')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  function beginReservation(serviceId?: string) {
    if (serviceId) {
      setSelectedServiceEntitlementId(serviceId)
    }

    setMessage('')
    setConfirmationMessage('')
    scrollToBookingComposer()
  }

  function resetBookingComposer(nextPortal: ClientPortalResponse | null) {
    setEditingBookingId('')
    setSelectedSlotId(nextPortal?.availableSlots[0]?.id || '')
    setSelectedReturnTime('')
    setSelectedServiceEntitlementId(getDefaultServiceEntitlementId(nextPortal))
    setSelectedAddOnServices([])
    setBookingNotes('')
  }

  const loadPortal = useCallback(async () => {
    setRefreshingPortal(true)

    const response = await adminApiRequest<ClientPortalResponse>('/api/account/portal')
    setRefreshingPortal(false)

    if (response.status === 401) {
      onSignedOut()
      return null
    }

    if (!response.ok) {
      setPortalMessage(
        response.payload.message || 'Unable to refresh your saved booking details right now.',
      )
      return null
    }

    setPortalMessage('')
    setPortal(response.payload)
    setProfileForm(buildProfileForm(response.payload))
    const nextBookingSlots = buildBookingSlotChoices(response.payload, editingBookingId)

    setSelectedSlotId((current) =>
      nextBookingSlots.find((slot) => slot.id === current)?.id || nextBookingSlots[0]?.id || '',
    )
    setSelectedServiceEntitlementId((current) =>
      getDefaultServiceEntitlementId(response.payload, current),
    )

    return response.payload
  }, [editingBookingId, onSignedOut])

  useEffect(() => {
    let isMounted = true

    async function loadInitialPortal() {
      const response = await adminApiRequest<ClientPortalResponse>('/api/account/portal')

      if (!isMounted) {
        return
      }

      setLoading(false)

      if (response.status === 401) {
        onSignedOut()
        return
      }

      if (!response.ok) {
        setPortalMessage(response.payload.message || 'Unable to load your account right now.')
        return
      }

      setPortalMessage('')
      setPortal(response.payload)
      setProfileForm(buildProfileForm(response.payload))
      setSelectedSlotId(response.payload.availableSlots[0]?.id || '')
      setSelectedReturnTime('')
      setSelectedServiceEntitlementId(getDefaultServiceEntitlementId(response.payload))
    }

    void loadInitialPortal()

    return () => {
      isMounted = false
    }
  }, [onSignedOut])

  async function handleSignOut() {
    await destroyAccountSession()
    onSignedOut()
  }

  async function refreshPortal() {
    return loadPortal()
  }

  function startEditingBooking(bookingId: string) {
    if (!portal) {
      return
    }

    const booking = portal.upcomingBookings.find((item) => item.id === bookingId)

    if (!booking) {
      return
    }

    setEditingBookingId(booking.id)
    setSelectedSlotId(booking.slotId)
    setSelectedReturnTime(booking.returnTime || suggestReturnTime(booking.slot.startsAt))
    setSelectedServiceEntitlementId(booking.serviceEntitlementId || '')
    setSelectedAddOnServices(booking.addOnServices)
    setBookingNotes(booking.notes || '')
    setMessage('')
    setConfirmationMessage('')
    scrollToBookingComposer()
  }

  function stopEditingBooking() {
    resetBookingComposer(portal)
    setMessage('')
    setConfirmationMessage('')
  }

  async function handleConfirmBooking() {
    if (!selectedSlotId) {
      setMessage('Choose a date and time first.')
      return
    }

    if (
      portal?.client.services.some((service) => service.remainingUnits > 0) &&
      !selectedServiceEntitlementId
    ) {
      setMessage('Choose one of your available contracted services first.')
      return
    }

    setBookingState('submitting')
    setMessage('')
    setConfirmationMessage('')

    const response = await adminApiRequest<{
      booking?: ClientPortalResponse['upcomingBookings'][number]
      slot?: PublicSlot
      message?: string
    }>(editingBookingId ? `/api/account/bookings/${editingBookingId}` : '/api/account/bookings', {
      method: editingBookingId ? 'PUT' : 'POST',
      body: JSON.stringify({
        slotId: selectedSlotId,
        returnTime: effectiveSelectedReturnTime,
        serviceEntitlementId: selectedServiceEntitlementId,
        addOnServices: selectedAddOnServices,
        notes: bookingNotes,
        status: 'confirmed',
      }),
    })

    setBookingState('idle')

    if (response.status === 401) {
      onSignedOut()
      return
    }

    if (!response.ok) {
      if (response.status === 404 || response.status === 409) {
        await refreshPortal()
      }

      setMessage(response.payload.message || 'Unable to confirm your booking just now.')
      return
    }

    const confirmedSlot =
      response.payload.booking?.slot ||
      response.payload.slot ||
      buildBookingSlotChoices(portal, editingBookingId).find((slot) => slot.id === selectedSlotId) ||
      null
    const selectedService =
      response.payload.booking?.serviceName ||
      portal?.client.services.find((service) => service.id === selectedServiceEntitlementId)
        ?.serviceName ||
      null
    const confirmedAddOns = response.payload.booking?.addOnServices || selectedAddOnServices
    const confirmedReturnTime = response.payload.booking?.returnTime || effectiveSelectedReturnTime

    setConfirmationMessage(
      confirmedSlot
        ? `${
            selectedService ? `${selectedService} ${editingBookingId ? 'moved to' : 'reserved for'} ` : editingBookingId ? 'Your reservation is now set for ' : ''
          }${formatSlotDateTime(confirmedSlot.startsAt)} returning by ${formatReturnTime(confirmedReturnTime)}${confirmedAddOns.length > 0 ? ` with ${confirmedAddOns.join(', ')}` : ''}.`
        : editingBookingId
          ? 'Your reservation has been updated.'
          : 'Your reservation is confirmed and on file.',
    )
    const refreshedPortal = await refreshPortal()
    resetBookingComposer(refreshedPortal || portal)
  }

  async function handleCancelBooking(bookingId: string) {
    if (!portal) {
      return
    }

    const booking = portal.upcomingBookings.find((item) => item.id === bookingId)

    if (!booking || bookingState === 'submitting') {
      return
    }

    const shouldCancel = window.confirm(
      `Cancel the reservation for ${formatSlotDateTime(booking.slot.startsAt)}?`,
    )

    if (!shouldCancel) {
      return
    }

    setBookingState('submitting')
    setMessage('')
    setConfirmationMessage('')

    const response = await adminApiRequest<{ message?: string }>(`/api/account/bookings/${booking.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        returnTime: booking.returnTime || suggestReturnTime(booking.slot.startsAt),
        serviceEntitlementId: booking.serviceEntitlementId,
        addOnServices: booking.addOnServices,
        notes: booking.notes || '',
        status: 'cancelled',
      }),
    })

    setBookingState('idle')

    if (response.status === 401) {
      onSignedOut()
      return
    }

    if (!response.ok) {
      setMessage(response.payload.message || 'Unable to cancel your reservation right now.')
      return
    }

    setConfirmationMessage(`Your reservation for ${formatSlotDateTime(booking.slot.startsAt)} was cancelled.`)
    const refreshedPortal = await refreshPortal()

    if (editingBookingId === booking.id) {
      resetBookingComposer(refreshedPortal || portal)
    }
  }

  async function handleSaveProfile() {
    setProfileState('saving')
    setProfileMessage('')
    setMessage('')

    const response = await adminApiRequest<{ message?: string }>('/api/account/profile', {
      method: 'PUT',
      body: JSON.stringify({
        fullName: profileForm.fullName,
        phone: profileForm.phone,
        boatName: profileForm.boatName,
        boatMakeModel: profileForm.boatMakeModel,
        boatLengthFeet: profileForm.boatLengthFeet ? Number(profileForm.boatLengthFeet) : undefined,
        preferredLaunchLocation: profileForm.preferredLaunchLocation,
        notes: profileForm.notes,
      }),
    })

    setProfileState('idle')

    if (response.status === 401) {
      onSignedOut()
      return
    }

    if (!response.ok) {
      setProfileMessage(response.payload.message || 'Unable to update your profile right now.')
      return
    }

    setProfileExpanded(false)
    setProfileMessage('Your saved account details were updated.')
    await refreshPortal()
  }

  const editingBooking =
    portal?.upcomingBookings.find((booking) => booking.id === editingBookingId) || null

  const bookingSlotChoices = useMemo(
    () => buildBookingSlotChoices(portal, editingBookingId),
    [editingBookingId, portal],
  )

  const selectedSlot = bookingSlotChoices.find((slot) => slot.id === selectedSlotId) || null
  const effectiveSelectedReturnTime =
    selectedReturnTime || (selectedSlot ? suggestReturnTime(selectedSlot.startsAt) : '')
  const slotDayGroups = useMemo(() => groupSlotsByDate(bookingSlotChoices), [bookingSlotChoices])
  const selectedSlotDayLabel = selectedSlot
    ? formatSlotDate(selectedSlot.startsAt)
    : slotDayGroups[0]?.label || ''
  const selectedSlotDay =
    slotDayGroups.find((dayGroup) => dayGroup.label === selectedSlotDayLabel) || slotDayGroups[0]
  const requiresServiceSelection = Boolean(
    portal?.client.services.some((service) => service.remainingUnits > 0),
  )
  const hasAnyContractedServices = Boolean(portal?.client.services.length)
  const bookingActionDisabled =
    bookingState === 'submitting' ||
    loading ||
    refreshingPortal ||
    !selectedSlotId ||
    !effectiveSelectedReturnTime ||
    (requiresServiceSelection && !selectedServiceEntitlementId)

  return (
    <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
      <div className="grid gap-6 self-start">
        <FadeIn className="panel p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="section-label w-fit">Client Account</span>
              <h2 className="section-title text-3xl md:text-4xl">
                {portal?.client.fullName || session.fullName || session.email}
              </h2>
              <p className="mt-3 text-base leading-8 text-slate">
                Your launch location, boat details, and contracted services stay on file so booking from a phone stays simple.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold text-ink"
                type="button"
                onClick={() => {
                  setProfileExpanded((current) => !current)
                  setProfileForm(buildProfileForm(portal))
                  setProfileMessage('')
                }}
              >
                <PencilLine className="h-4 w-4" />
                {profileExpanded ? 'Close Profile' : 'Edit Profile'}
              </button>
              <button className="button-dark" type="button" onClick={() => void handleSignOut()}>
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 flex items-center gap-3 rounded-3xl border border-ink/10 bg-[#f7fbfc] px-5 py-5 text-sm text-slate">
              <LoaderCircle className="h-4 w-4 animate-spin text-lake" />
              Loading your saved account...
            </div>
          ) : portal ? (
            <div className="mt-8 grid gap-4">
              {portal.client.services.length > 0 ? (
                <div className="rounded-3xl border border-ink/10 bg-[#f7fbfc] px-5 py-5 md:hidden">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">
                    Remaining services
                  </p>
                  <div className="mt-4 grid gap-3">
                    {portal.client.services.map((service) => (
                      <div
                        key={service.id}
                        className="rounded-3xl border border-ink/10 bg-white px-4 py-4"
                      >
                        <p className="text-sm font-semibold text-ink">{service.serviceName}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="status-pill status-pill-active">
                            {service.remainingUnits} remaining
                          </span>
                          <span className="status-pill">{service.totalUnits} total</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-ink/10 bg-[#f7fbfc] px-5 py-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">
                    {portal.client.preferredLaunchLocation === noTransportLaunchLocation
                      ? 'Transportation'
                      : 'Desired launch location'}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-ink">
                    {portal.client.preferredLaunchLocation === noTransportLaunchLocation
                      ? 'Not needed'
                      : portal.client.preferredLaunchLocation}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate">{portal.client.email}</p>
                  <p className="text-sm leading-7 text-slate">{portal.client.phone}</p>
                </div>
                <div className="rounded-3xl border border-ink/10 bg-[#f7fbfc] px-5 py-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">
                    Boat profile
                  </p>
                  <p className="mt-3 text-lg font-semibold text-ink">
                    {portal.client.boatName || 'Boat name not added yet'}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate">
                    {portal.client.boatMakeModel || 'Make / model not added yet'}
                  </p>
                  <p className="text-sm leading-7 text-slate">
                    {portal.client.boatLengthFeet
                      ? `${portal.client.boatLengthFeet} ft`
                      : 'Length not added yet'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-[#ead4bf] bg-[#fffaf4] px-5 py-5 text-sm text-[#6e4f38]">
              <p>{portalMessage || 'Unable to load your account right now.'}</p>
              <button
                className="mt-4 rounded-full border border-[#caa27f] px-4 py-2 text-sm font-semibold text-[#6e4f38] transition hover:bg-white/70"
                type="button"
                onClick={() => window.location.reload()}
              >
                Retry Loading
              </button>
            </div>
          )}
        </FadeIn>

        <FadeIn className="panel p-6 md:p-8" delay={0.05}>
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-lake" />
            <h3 className="text-2xl font-semibold text-ink">Contracted services</h3>
          </div>
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm leading-7 text-slate">
              {requiresServiceSelection
                ? 'Choose the contracted service you want to use for this reservation.'
                : 'Choose a date and time below. Your profile stays attached to the reservation automatically.'}
            </p>
            <button
              className="button-dark w-full justify-center disabled:cursor-not-allowed disabled:opacity-60 md:w-fit"
              type="button"
              disabled={loading || refreshingPortal || !portal}
              onClick={() => beginReservation(selectedServiceEntitlementId)}
            >
              {loading
                ? 'Loading...'
                : refreshingPortal
                  ? 'Refreshing...'
                  : requiresServiceSelection
                    ? 'Reserve a Time'
                    : 'Choose a Time'}
            </button>
          </div>
          <div className="mt-6 grid gap-4">
            {loading ? (
              <p className="text-sm text-slate">Loading your service balances...</p>
            ) : !portal || portal.client.services.length === 0 ? (
              <p className="rounded-3xl border border-ink/10 bg-[#f7fbfc] px-5 py-5 text-sm leading-7 text-slate">
                No contracted service balance is attached to this account yet. You can still
                choose an available day and time below, and North Shore Nautical can match the
                reservation to your account details.
              </p>
            ) : (
              portal.client.services.map((service) => (
                <div
                  key={service.id}
                  className={`rounded-3xl border px-5 py-5 text-left transition ${serviceCardClasses(service, selectedServiceEntitlementId)}`}
                  role="button"
                  tabIndex={service.remainingUnits === 0 ? -1 : 0}
                  onClick={() => {
                    if (service.remainingUnits > 0) {
                      setSelectedServiceEntitlementId(service.id)
                    }
                  }}
                  onKeyDown={(event) => {
                    if (
                      service.remainingUnits > 0 &&
                      (event.key === 'Enter' || event.key === ' ')
                    ) {
                      event.preventDefault()
                      setSelectedServiceEntitlementId(service.id)
                    }
                  }}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-ink">{service.serviceName}</p>
                      {service.notes ? (
                        <p className="mt-2 text-sm leading-7 text-slate">{service.notes}</p>
                      ) : null}
                    </div>
                    <div className="flex gap-3">
                      <span className="status-pill status-pill-active">
                        {service.remainingUnits} remaining
                      </span>
                      <span className="status-pill">{service.totalUnits} total</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {service.id === selectedServiceEntitlementId ? (
                      <span className="status-pill status-pill-active">Selected for booking</span>
                    ) : (
                      <span className="text-sm text-slate">Tap the card to select this service.</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </FadeIn>

        <FadeIn className="panel p-6 md:p-8" delay={0.08}>
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-lake" />
            <h3 className="text-2xl font-semibold text-ink">Upcoming reservations</h3>
          </div>
          <div className="mt-6 grid gap-4">
            {loading ? (
              <p className="text-sm text-slate">Loading upcoming bookings...</p>
            ) : !portal || portal.upcomingBookings.length === 0 ? (
              <p className="rounded-3xl border border-ink/10 bg-[#f7fbfc] px-5 py-5 text-sm leading-7 text-slate">
                No upcoming reservations are currently on file.
              </p>
            ) : (
              portal.upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`soft-panel p-5 ${editingBookingId === booking.id ? 'border-lake bg-lake/10' : ''}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-ink">
                        {formatSlotDateTime(booking.slot.startsAt)}
                      </p>
                      <p className="mt-1 text-sm leading-7 text-slate">{booking.slot.launchLocation}</p>
                      <p className="text-sm leading-7 text-slate">
                        {booking.returnTime
                          ? `Return by ${formatReturnTime(booking.returnTime)}`
                          : 'Return time not set yet'}
                      </p>
                    </div>
                    {editingBookingId === booking.id ? (
                      <span className="status-pill status-pill-active">Editing</span>
                    ) : null}
                  </div>
                  {booking.serviceName ? (
                    <p className="text-sm leading-7 text-slate">Service: {booking.serviceName}</p>
                  ) : null}
                  {booking.addOnServices.length > 0 ? (
                    <p className="text-sm leading-7 text-slate">
                      A la carte: {booking.addOnServices.join(', ')}
                    </p>
                  ) : null}
                  {booking.notes ? (
                    <p className="mt-2 text-sm leading-7 text-slate">{booking.notes}</p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink"
                      type="button"
                      disabled={bookingState === 'submitting'}
                      onClick={() => startEditingBooking(booking.id)}
                    >
                      {editingBookingId === booking.id ? 'Editing Reservation' : 'Reschedule'}
                    </button>
                    <button
                      className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink"
                      type="button"
                      disabled={bookingState === 'submitting'}
                      onClick={() => void handleCancelBooking(booking.id)}
                    >
                      Cancel Reservation
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </FadeIn>
      </div>

      <div className="grid gap-6">
        {portalMessage && portal ? (
          <div className="rounded-3xl border border-[#ead4bf] bg-[#fffaf4] px-5 py-5 text-sm text-[#6e4f38]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p>{portalMessage}</p>
              <button
                className="rounded-full border border-[#caa27f] px-4 py-2 text-sm font-semibold text-[#6e4f38] transition hover:bg-white/70"
                type="button"
                onClick={() => void refreshPortal()}
              >
                {refreshingPortal ? 'Refreshing...' : 'Retry'}
              </button>
            </div>
          </div>
        ) : null}

        {message ? (
          <div className="rounded-3xl border border-[#ead4bf] bg-[#fffaf4] px-5 py-5 text-sm text-[#6e4f38]">
            {message}
          </div>
        ) : null}

        {confirmationMessage ? (
          <div className="rounded-3xl border border-[#b8d7ca] bg-[#f4fbf7] px-5 py-5 text-sm text-[#1d5c42]">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2c7d57]" />
              <div>
                <p className="font-semibold text-[#174731]">Reservation update</p>
                <p className="mt-1 leading-7">{confirmationMessage}</p>
              </div>
            </div>
          </div>
        ) : null}

        {profileExpanded ? (
          <FadeIn className="panel p-6 md:p-8" delay={0.02}>
            <div className="flex items-center gap-3">
              <PencilLine className="h-5 w-5 text-lake" />
              <h3 className="text-2xl font-semibold text-ink">Edit profile</h3>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="field-label">
                  Full name
                  <input
                    className="input-field"
                    value={profileForm.fullName}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="field-label">
                  Phone
                  <input
                    className="input-field"
                    value={profileForm.phone}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="field-label">
                  Boat name
                  <input
                    className="input-field"
                    value={profileForm.boatName}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        boatName: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="field-label">
                  Make / model
                  <input
                    className="input-field"
                    value={profileForm.boatMakeModel}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        boatMakeModel: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="field-label">
                  Length (ft)
                  <input
                    className="input-field"
                    inputMode="decimal"
                    value={profileForm.boatLengthFeet}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        boatLengthFeet: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="field-label">
                  Transportation need
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                        profileForm.preferredLaunchLocation === noTransportLaunchLocation
                          ? 'border-lake bg-lake/10 text-ink'
                          : 'border-ink/10 bg-white text-slate'
                      }`}
                      type="button"
                      onClick={() =>
                        setProfileForm((current) => ({
                          ...current,
                          preferredLaunchLocation: noTransportLaunchLocation,
                        }))
                      }
                    >
                      Service only
                    </button>
                    <button
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                        profileForm.preferredLaunchLocation !== noTransportLaunchLocation
                          ? 'border-lake bg-lake/10 text-ink'
                          : 'border-ink/10 bg-white text-slate'
                      }`}
                      type="button"
                      onClick={() =>
                        setProfileForm((current) => ({
                          ...current,
                          preferredLaunchLocation:
                            current.preferredLaunchLocation === noTransportLaunchLocation
                              ? transportLaunchLocations[0]
                              : current.preferredLaunchLocation,
                        }))
                      }
                    >
                      Transportation needed
                    </button>
                  </div>
                </div>
                {profileForm.preferredLaunchLocation !== noTransportLaunchLocation ? (
                  <label className="field-label md:col-span-2">
                    Desired launch location
                    <select
                      className="input-field"
                      value={profileForm.preferredLaunchLocation}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          preferredLaunchLocation: event.target.value,
                        }))
                      }
                    >
                      {transportLaunchLocations.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>

              <label className="field-label">
                Notes
                <textarea
                  className="text-area"
                  value={profileForm.notes}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>

              {profileMessage ? (
                <div className="rounded-3xl border border-ink/10 bg-white px-4 py-4 text-sm text-slate">
                  {profileMessage}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  className="button-dark w-full justify-center md:w-fit"
                  type="button"
                  onClick={() => void handleSaveProfile()}
                >
                  <Save className="h-4 w-4" />
                  {profileState === 'saving' ? 'Saving...' : 'Save Profile'}
                </button>
                <button
                  className="rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold text-ink"
                  type="button"
                  onClick={() => setProfileExpanded(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </FadeIn>
        ) : null}

        <section
          id="client-booking-composer"
          className="panel scroll-mt-36 p-6 md:scroll-mt-40 md:p-8"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-3">
              <ShipWheel className="h-5 w-5 text-lake" />
              <h3 className="text-2xl font-semibold text-ink">
                {editingBooking ? 'Modify your reservation' : 'Reserve a time'}
              </h3>
            </div>
            <button
              className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink transition hover:border-lake/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={loading || refreshingPortal}
              onClick={() => void refreshPortal()}
            >
              {refreshingPortal ? 'Refreshing...' : 'Refresh Times'}
            </button>
          </div>
          <p className="mt-4 text-base leading-8 text-slate">
            {editingBooking
              ? 'Adjust the date, time, add-ons, or notes for the reservation you already have on file.'
              : requiresServiceSelection
                ? 'Pick the contracted service you want to use, then choose an available day and time. Reserved slots are automatically blocked so no one else can take the same booking time.'
                : 'Choose an available day and time below. Reserved slots are blocked automatically so no one else can take the same booking time while your request is on file.'}
          </p>

          {editingBooking ? (
            <div className="mt-6 rounded-3xl border border-ink/10 bg-[#f7fbfc] px-5 py-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">
                    Reservation being updated
                  </p>
                  <p className="mt-3 text-lg font-semibold text-ink">
                    {formatSlotDateTime(editingBooking.slot.startsAt)}
                  </p>
                  <p className="mt-1 text-sm leading-7 text-slate">
                    {editingBooking.slot.launchLocation}
                  </p>
                </div>
                <button
                  className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink"
                  type="button"
                  onClick={stopEditingBooking}
                >
                  Cancel Edit
                </button>
              </div>
            </div>
          ) : null}

          {selectedSlot ? (
            <div className="mt-6 rounded-3xl border border-ink/10 bg-[#f7fbfc] px-5 py-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">
                Selected reservation
              </p>
              <p className="mt-3 text-lg font-semibold text-ink">
                {formatSlotDateTime(selectedSlot.startsAt)}
              </p>
              <p className="mt-1 text-sm leading-7 text-slate">{selectedSlot.launchLocation}</p>
              <p className="text-sm leading-7 text-slate">
                Planned return: {formatReturnTime(effectiveSelectedReturnTime)}
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-5">
            {slotDayGroups.length === 0 ? (
              <div className="rounded-3xl border border-ink/10 bg-[#f7fbfc] px-5 py-5 text-sm leading-7 text-slate">
                <p>No booking times are open right now beyond the 24-hour notice window.</p>
                <button
                  className="mt-4 rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink transition hover:border-lake/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  disabled={loading || refreshingPortal}
                  onClick={() => void refreshPortal()}
                >
                  {refreshingPortal ? 'Refreshing...' : 'Check Again'}
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="overflow-x-auto pb-1">
                  <div className="flex min-w-max gap-3">
                    {slotDayGroups.map((dayGroup) => {
                      const isSelectedDay = dayGroup.label === selectedSlotDayLabel

                      return (
                        <button
                          key={dayGroup.label}
                          className={`rounded-2xl border px-4 py-3 text-left transition ${
                            isSelectedDay
                              ? 'border-lake bg-lake/10 text-ink'
                              : 'border-ink/10 bg-white text-slate hover:border-lake/30'
                          }`}
                          type="button"
                          onClick={() => setSelectedSlotId(dayGroup.slots[0]?.id || '')}
                        >
                          <span className="block text-sm font-semibold">{dayGroup.label}</span>
                          <span className="mt-1 block text-xs uppercase tracking-[0.16em] text-slate/80">
                            {dayGroup.slots.length} times
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                {selectedSlotDay ? (
                  <div className="rounded-3xl border border-ink/10 bg-[#f9fbfc] px-4 py-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-lake">
                      {selectedSlotDay.label}
                    </p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {selectedSlotDay.slots.map((slot) => (
                        <button
                          key={slot.id}
                          className={`slot-button ${slot.id === selectedSlotId ? 'slot-button-active' : ''}`}
                          type="button"
                          onClick={() => setSelectedSlotId(slot.id)}
                        >
                          <span>
                            <span className="block text-base font-semibold text-ink">
                              {formatSlotTime(slot.startsAt)}
                            </span>
                            <span className="mt-1 block text-sm text-slate">
                              {slot.launchLocation}
                            </span>
                          </span>
                          {slot.id === selectedSlotId ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-lake" />
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
            <label className="field-label">
              Planned return time
              <select
                className="input-field"
                value={effectiveSelectedReturnTime}
                onChange={(event) => setSelectedReturnTime(event.target.value)}
              >
                <option value="">Choose your return time</option>
                {returnTimeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-3xl border border-ink/10 bg-[#f7fbfc] px-5 py-5 text-sm leading-7 text-slate">
              <p className="font-semibold text-ink">Need help or running early or late?</p>
              <p className="mt-2">{returnTimingReminder}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {supportPhoneNumbers.map((supportLine) => (
                  <a
                    key={supportLine.phoneHref}
                    className="rounded-full border border-ink/10 bg-white px-4 py-2 font-semibold text-ink transition hover:border-lake/35 hover:bg-lake/5"
                    href={supportLine.phoneHref}
                  >
                    {supportLine.phoneDisplay}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-ink/10 bg-[#f8fbfc] px-5 py-5">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-lake" />
              <div>
                <p className="text-lg font-semibold text-ink">A la carte add-ons</p>
                <p className="text-sm leading-7 text-slate">
                  Add any extra services you want included with this reservation.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {addOnServiceOptions.map((addOnService) => {
                const selected = selectedAddOnServices.includes(addOnService)

                return (
                  <button
                    key={addOnService}
                    className={`rounded-3xl border px-4 py-4 text-left transition ${
                      selected ? 'border-lake bg-lake/10' : 'border-ink/10 bg-white hover:border-lake/30'
                    }`}
                    type="button"
                    onClick={() =>
                      setSelectedAddOnServices((current) =>
                        toggleAddOnSelection(current, addOnService),
                      )
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold leading-7 text-ink">{addOnService}</span>
                      {selected ? <CheckCircle2 className="h-5 w-5 shrink-0 text-lake" /> : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <label className="field-label mt-6">
            Reservation notes
            <textarea
              className="text-area"
              placeholder="Optional detail for the crew."
              value={bookingNotes}
              onChange={(event) => setBookingNotes(event.target.value)}
            />
          </label>

          <button
            className="button-dark mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={() => void handleConfirmBooking()}
            disabled={bookingActionDisabled}
          >
            {bookingState === 'submitting'
              ? editingBooking
                ? 'Saving Changes...'
                : 'Confirming...'
              : editingBooking
                ? 'Save Reservation Changes'
                : hasAnyContractedServices
                  ? 'Reserve My Service'
                  : 'Reserve My Time'}
          </button>
        </section>

        <FadeIn className="panel p-6 md:p-8" delay={0.08}>
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-lake" />
            <h3 className="text-2xl font-semibold text-ink">Booking history</h3>
          </div>
          <div className="mt-6 grid gap-4">
            {loading ? (
              <p className="text-sm text-slate">Loading booking history...</p>
            ) : !portal || portal.bookingHistory.length === 0 ? (
              <p className="rounded-3xl border border-ink/10 bg-[#f7fbfc] px-5 py-5 text-sm leading-7 text-slate">
                No booking history is on file yet.
              </p>
            ) : (
              portal.bookingHistory.slice(0, 12).map((booking) => (
                <div key={booking.id} className="soft-panel p-5">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-ink">
                        {formatSlotDateTime(booking.slot.startsAt)}
                      </p>
                      <p className="text-sm leading-7 text-slate">{booking.slot.launchLocation}</p>
                      <p className="text-sm leading-7 text-slate">
                        {booking.returnTime
                          ? `Return by ${formatReturnTime(booking.returnTime)}`
                          : 'Return time not set yet'}
                      </p>
                    </div>
                    <span className="status-pill status-pill-neutral">{booking.status}</span>
                  </div>
                  {booking.serviceName ? (
                    <p className="mt-2 text-sm leading-7 text-slate">Service: {booking.serviceName}</p>
                  ) : null}
                  {booking.addOnServices.length > 0 ? (
                    <p className="mt-2 text-sm leading-7 text-slate">
                      A la carte: {booking.addOnServices.join(', ')}
                    </p>
                  ) : null}
                  {booking.notes ? (
                    <p className="mt-2 text-sm leading-7 text-slate">{booking.notes}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </FadeIn>
      </div>
    </div>
  )
}
