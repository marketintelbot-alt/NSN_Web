import { formatInTimeZone } from 'date-fns-tz'

import type {
  AdminBookingInput,
  AdminSlotInput,
  ClientBookingInput,
  ClientBookingUpdateInput,
  PublicBookingInput,
} from './bookingSchemas.js'
import type { ClientAccount } from './clientAccounts.js'
import {
  readClientAccountByEmail,
  readClientAccountById,
  type ClientServiceEntitlement,
} from './clientAccounts.js'
import {
  createLaunchDateTime,
  formatStoredDateTime,
  has24HourLeadTime,
  launchLocations,
  noTransportLaunchLocation,
  reservationWindowMessage,
  serviceTimeZone,
} from './time.js'
import { getSupabaseAdminClient } from './supabaseAdmin.js'

type StoredSlotRow = {
  id: string
  starts_at: string
  launch_location: string
  notes: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

type StoredBookingRow = {
  id: string
  slot_id: string
  client_account_id: string | null
  service_entitlement_id: string | null
  service_name: string | null
  add_on_services: string[] | null
  full_name: string
  email: string
  phone: string
  notes: string | null
  status: 'confirmed' | 'completed' | 'cancelled'
  created_by: 'public' | 'admin' | 'client'
  email_customer_status: 'pending' | 'sent' | 'failed'
  email_customer_error: string | null
  email_customer_sent_at: string | null
  email_admin_status: 'pending' | 'sent' | 'failed'
  email_admin_error: string | null
  email_admin_sent_at: string | null
  created_at: string
  updated_at: string
  booking_slots?: StoredSlotRow | StoredSlotRow[] | null
}

type DatabaseErrorLike = {
  code?: string
  details?: string | null
  message?: string
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
  status: 'confirmed' | 'completed' | 'cancelled'
  createdBy: 'public' | 'admin' | 'client'
  emailCustomerStatus: 'pending' | 'sent' | 'failed'
  emailCustomerError: string | null
  emailCustomerSentAt: string | null
  emailAdminStatus: 'pending' | 'sent' | 'failed'
  emailAdminError: string | null
  emailAdminSentAt: string | null
  createdAt: string
  updatedAt: string
  slot: PublicSlot
}

const rollingAvailabilityDays = 30
const slotGenerationStartHour = 8
const slotGenerationEndHour = 19
const slotGenerationIntervalMinutes = 30
const slotGenerationChunkSize = 200
const leadTimeMs = 24 * 60 * 60 * 1000

export class SlotConflictError extends Error {
  constructor(message = 'That time slot is no longer available.') {
    super(message)
    this.name = 'SlotConflictError'
  }
}

export class SlotNotFoundError extends Error {
  constructor(message = 'That time slot could not be found.') {
    super(message)
    this.name = 'SlotNotFoundError'
  }
}

function getAvailabilityCutoffDate(currentDate = new Date()) {
  return new Date(currentDate.getTime() + leadTimeMs)
}

function getAvailabilityCutoffIso(currentDate = new Date()) {
  return getAvailabilityCutoffDate(currentDate).toISOString()
}

function normalizeSlotRow(slot: StoredSlotRow): PublicSlot {
  return {
    id: slot.id,
    startsAt: slot.starts_at,
    launchLocation: slot.launch_location,
    notes: slot.notes || null,
    label: formatStoredDateTime(slot.starts_at),
  }
}

function extractJoinedSlot(slot: StoredSlotRow | StoredSlotRow[] | null | undefined) {
  if (!slot) {
    throw new SlotNotFoundError('The slot tied to this booking could not be loaded.')
  }

  return Array.isArray(slot) ? slot[0] : slot
}

function normalizeBookingRow(booking: StoredBookingRow): AdminBooking {
  const slot = extractJoinedSlot(booking.booking_slots)

  return {
    id: booking.id,
    slotId: booking.slot_id,
    clientAccountId: booking.client_account_id || null,
    serviceEntitlementId: booking.service_entitlement_id || null,
    serviceName: booking.service_name || null,
    addOnServices: booking.add_on_services || [],
    fullName: booking.full_name,
    email: booking.email,
    phone: booking.phone,
    notes: booking.notes || null,
    status: booking.status,
    createdBy: booking.created_by,
    emailCustomerStatus: booking.email_customer_status,
    emailCustomerError: booking.email_customer_error || null,
    emailCustomerSentAt: booking.email_customer_sent_at || null,
    emailAdminStatus: booking.email_admin_status,
    emailAdminError: booking.email_admin_error || null,
    emailAdminSentAt: booking.email_admin_sent_at || null,
    createdAt: booking.created_at,
    updatedAt: booking.updated_at,
    slot: normalizeSlotRow(slot),
  }
}

function isUniqueConstraintError(error: { code?: string; message?: string } | null) {
  return (
    error?.code === '23505' ||
    error?.message?.toLowerCase().includes('duplicate key value violates unique constraint') ||
    false
  )
}

function isLegacyClientCreatedByConstraintError(error: DatabaseErrorLike | null) {
  return (
    error?.code === '23514' &&
    Boolean(error.message?.includes('launch_bookings_created_by_check'))
  )
}

function getServiceDateString(date: Date) {
  return formatInTimeZone(date, serviceTimeZone, 'yyyy-MM-dd')
}

function buildSlotTimeStrings() {
  const values: string[] = []

  for (
    let minutes = slotGenerationStartHour * 60;
    minutes <= slotGenerationEndHour * 60;
    minutes += slotGenerationIntervalMinutes
  ) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    values.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`)
  }

  return values
}

const slotTimeStrings = buildSlotTimeStrings()

async function ensureRollingSlotInventory(daysAhead = rollingAvailabilityDays) {
  const supabaseAdmin = getSupabaseAdminClient()
  const cutoffDate = getAvailabilityCutoffDate()
  const records: Array<{
    starts_at: string
    launch_location: string
    notes: null
    is_active: true
  }> = []

  for (let offset = 0; offset < daysAhead; offset += 1) {
    const day = new Date(cutoffDate.getTime() + offset * 24 * 60 * 60 * 1000)
    const serviceDate = getServiceDateString(day)

    for (const launchLocation of launchLocations) {
      for (const slotTime of slotTimeStrings) {
        if (!has24HourLeadTime(serviceDate, slotTime)) {
          continue
        }

        records.push({
          starts_at: createLaunchDateTime(serviceDate, slotTime).toISOString(),
          launch_location: launchLocation,
          notes: null,
          is_active: true,
        })
      }
    }
  }

  for (let index = 0; index < records.length; index += slotGenerationChunkSize) {
    const chunk = records.slice(index, index + slotGenerationChunkSize)
    const { error } = await supabaseAdmin.from('booking_slots').upsert(chunk, {
      onConflict: 'launch_location,starts_at',
      ignoreDuplicates: true,
    })

    if (error) {
      throw error
    }
  }
}

async function readSlotById(slotId: string) {
  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from('booking_slots')
    .select('*')
    .eq('id', slotId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as StoredSlotRow | null) ?? null
}

async function readBookingById(bookingId: string) {
  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from('launch_bookings')
    .select('*, booking_slots(*)')
    .eq('id', bookingId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as StoredBookingRow | null) ?? null
}

function getBookingStartsAt(booking: StoredBookingRow) {
  return new Date(extractJoinedSlot(booking.booking_slots).starts_at).getTime()
}

async function ensureSlotIsBookable(slotId: string) {
  const slot = await readSlotById(slotId)

  if (!slot || !slot.is_active) {
    throw new SlotNotFoundError('That time slot is no longer available.')
  }

  const startsAtMs = new Date(slot.starts_at).getTime()

  if (startsAtMs <= Date.now()) {
    throw new SlotConflictError('That time slot has already passed.')
  }

  if (startsAtMs - Date.now() < leadTimeMs) {
    throw new SlotConflictError(reservationWindowMessage)
  }

  return slot
}

async function findMatchingClientAccountId(email: string, explicitClientAccountId?: string) {
  if (explicitClientAccountId) {
    return explicitClientAccountId
  }

  const matchedAccount = await readClientAccountByEmail(email)
  return matchedAccount?.id || null
}

async function resolveServiceSelection(
  clientAccountId: string | null,
  serviceEntitlementId: string | null | undefined,
  existingBooking?: StoredBookingRow | null,
) {
  if (!serviceEntitlementId) {
    return {
      serviceEntitlementId: null,
      serviceName: null,
    }
  }

  if (!clientAccountId) {
    throw new Error('Choose a saved client profile before reserving a contracted service.')
  }

  const clientAccount = await readClientAccountById(clientAccountId)

  if (!clientAccount) {
    throw new Error('That client account could not be found.')
  }

  const service = clientAccount.services.find((item) => item.id === serviceEntitlementId)

  if (!service) {
    throw new Error('The selected contracted service could not be found on this client account.')
  }

  const existingCountsAgainstBalance =
    existingBooking?.service_entitlement_id === serviceEntitlementId &&
    existingBooking.status !== 'cancelled'

  const availableUnits = existingCountsAgainstBalance
    ? service.remainingUnits + 1
    : service.remainingUnits

  if (availableUnits <= 0) {
    throw new SlotConflictError(`No ${service.serviceName} reservations remain on this account.`)
  }

  return {
    serviceEntitlementId: service.id,
    serviceName: service.serviceName,
  }
}

function sortBookingsAscending(bookings: AdminBooking[]) {
  return [...bookings].sort(
    (left, right) => new Date(left.slot.startsAt).getTime() - new Date(right.slot.startsAt).getTime(),
  )
}

export async function listAvailableSlots(launchLocation?: string) {
  await ensureRollingSlotInventory()

  const supabaseAdmin = getSupabaseAdminClient()
  const cutoffIso = getAvailabilityCutoffIso()
  let slotsQuery = supabaseAdmin
    .from('booking_slots')
    .select('*')
    .eq('is_active', true)
    .gte('starts_at', cutoffIso)
    .order('starts_at', { ascending: true })

  if (launchLocation) {
    slotsQuery = slotsQuery.eq('launch_location', launchLocation)
  }

  const [{ data: slots, error: slotError }, { data: bookings, error: bookingError }] =
    await Promise.all([
      slotsQuery,
      supabaseAdmin.from('launch_bookings').select('slot_id').neq('status', 'cancelled'),
    ])

  if (slotError) {
    throw slotError
  }

  if (bookingError) {
    throw bookingError
  }

  const bookedSlotIds = new Set((bookings ?? []).map((booking: { slot_id: string }) => booking.slot_id))

  return ((slots ?? []) as StoredSlotRow[])
    .filter((slot) => !bookedSlotIds.has(slot.id))
    .map(normalizeSlotRow)
}

export async function listAdminDashboard() {
  await ensureRollingSlotInventory()

  const supabaseAdmin = getSupabaseAdminClient()
  const recentWindowIso = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString()

  const [{ data: slots, error: slotError }, { data: bookings, error: bookingError }] =
    await Promise.all([
      supabaseAdmin
        .from('booking_slots')
        .select('*')
        .gte('starts_at', recentWindowIso)
        .order('starts_at', { ascending: true }),
      supabaseAdmin
        .from('launch_bookings')
        .select('*, booking_slots(*)')
        .order('created_at', { ascending: false }),
    ])

  if (slotError) {
    throw slotError
  }

  if (bookingError) {
    throw bookingError
  }

  const allBookings = sortBookingsAscending(
    ((bookings ?? []) as StoredBookingRow[]).map(normalizeBookingRow),
  )

  return {
    slots: ((slots ?? []) as StoredSlotRow[]).map((slot) => ({
      ...normalizeSlotRow(slot),
      isActive: slot.is_active,
    })),
    bookings: allBookings,
  }
}

export async function listClientBookings(clientAccountId: string) {
  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from('launch_bookings')
    .select('*, booking_slots(*)')
    .eq('client_account_id', clientAccountId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return ((data ?? []) as StoredBookingRow[]).map(normalizeBookingRow)
}

export async function listClientPortal(clientAccount: ClientAccount) {
  const [availableSlots, bookings, refreshedClientAccount] = await Promise.all([
    listAvailableSlots(
      clientAccount.preferredLaunchLocation === noTransportLaunchLocation
        ? undefined
        : clientAccount.preferredLaunchLocation,
    ),
    listClientBookings(clientAccount.id),
    readClientAccountById(clientAccount.id),
  ])

  const now = Date.now()
  const upcomingBookings = sortBookingsAscending(
    bookings.filter(
      (booking) =>
        booking.status !== 'cancelled' && new Date(booking.slot.startsAt).getTime() >= now,
    ),
  )

  const bookingHistory = [...bookings].sort(
    (left, right) => new Date(right.slot.startsAt).getTime() - new Date(left.slot.startsAt).getTime(),
  )

  return {
    client: refreshedClientAccount || clientAccount,
    availableSlots,
    upcomingBookings,
    bookingHistory,
  }
}

export async function createPublicBooking(input: PublicBookingInput) {
  const supabaseAdmin = getSupabaseAdminClient()
  await ensureSlotIsBookable(input.slotId)
  const clientAccountId = await findMatchingClientAccountId(input.email)

  const { data, error } = await supabaseAdmin
    .from('launch_bookings')
    .insert({
      slot_id: input.slotId,
      client_account_id: clientAccountId,
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      notes: input.notes || null,
      status: 'confirmed',
      created_by: 'public',
      email_customer_status: 'pending',
      email_admin_status: 'pending',
    })
    .select('id')
    .single()

  if (isUniqueConstraintError(error)) {
    throw new SlotConflictError()
  }

  if (error) {
    throw error
  }

  const booking = await readBookingById(data.id as string)

  if (!booking) {
    throw new Error('The booking was created, but it could not be loaded afterward.')
  }

  return normalizeBookingRow(booking)
}

export async function createClientBooking(clientAccount: ClientAccount, input: ClientBookingInput) {
  const supabaseAdmin = getSupabaseAdminClient()
  const slot = await ensureSlotIsBookable(input.slotId)

  if (
    clientAccount.preferredLaunchLocation !== noTransportLaunchLocation &&
    slot.launch_location !== clientAccount.preferredLaunchLocation
  ) {
    throw new SlotConflictError(
      'This slot is not available for the saved launch location on your account.',
    )
  }

  if (
    clientAccount.services.some((service) => service.remainingUnits > 0) &&
    !input.serviceEntitlementId
  ) {
    throw new Error('Choose one of your available contracted services first.')
  }

  const serviceSelection = await resolveServiceSelection(
    clientAccount.id,
    input.serviceEntitlementId || null,
  )

  const baseInsert = {
    slot_id: input.slotId,
    client_account_id: clientAccount.id,
    service_entitlement_id: serviceSelection.serviceEntitlementId,
    service_name: serviceSelection.serviceName,
    add_on_services: input.addOnServices,
    full_name: clientAccount.fullName,
    email: clientAccount.email,
    phone: clientAccount.phone,
    notes: input.notes || null,
    status: 'confirmed',
    email_customer_status: 'pending',
    email_admin_status: 'pending',
  }

  let { data, error } = await supabaseAdmin
    .from('launch_bookings')
    .insert({
      ...baseInsert,
      created_by: 'client',
    })
    .select('id')
    .single()

  if (isLegacyClientCreatedByConstraintError(error)) {
    ;({ data, error } = await supabaseAdmin
      .from('launch_bookings')
      .insert({
        ...baseInsert,
        // Older databases may not include the newer "client" source yet.
        created_by: 'public',
      })
      .select('id')
      .single())
  }

  if (isUniqueConstraintError(error)) {
    throw new SlotConflictError()
  }

  if (error) {
    throw error
  }

  const booking = await readBookingById(data.id as string)

  if (!booking) {
    throw new Error('The booking was created, but it could not be loaded afterward.')
  }

  return normalizeBookingRow(booking)
}

export async function updateClientBooking(
  clientAccount: ClientAccount,
  bookingId: string,
  input: ClientBookingUpdateInput,
) {
  const supabaseAdmin = getSupabaseAdminClient()
  const existingBooking = await readBookingById(bookingId)

  if (!existingBooking || existingBooking.client_account_id !== clientAccount.id) {
    throw new Error('That reservation could not be found on this client account.')
  }

  if (existingBooking.status === 'completed') {
    throw new Error('Completed reservations cannot be changed from the client dashboard.')
  }

  if (getBookingStartsAt(existingBooking) < Date.now()) {
    throw new Error('Past reservations cannot be changed from the client dashboard.')
  }

  const nextStatus = input.status
  const nextSlotId =
    nextStatus === 'cancelled' ? existingBooking.slot_id : input.slotId || existingBooking.slot_id

  if (nextStatus === 'confirmed') {
    const slot = await ensureSlotIsBookable(nextSlotId)

    if (
      clientAccount.preferredLaunchLocation !== noTransportLaunchLocation &&
      slot.launch_location !== clientAccount.preferredLaunchLocation
    ) {
      throw new SlotConflictError(
        'This slot is not available for the saved launch location on your account.',
      )
    }
  }

  const requestedServiceEntitlementId =
    input.serviceEntitlementId || existingBooking.service_entitlement_id || ''

  const serviceSelection = await resolveServiceSelection(
    clientAccount.id,
    requestedServiceEntitlementId,
    existingBooking,
  )

  const { error } = await supabaseAdmin
    .from('launch_bookings')
    .update({
      slot_id: nextSlotId,
      service_entitlement_id: serviceSelection.serviceEntitlementId,
      service_name: serviceSelection.serviceName,
      add_on_services: input.addOnServices,
      notes: input.notes || null,
      status: nextStatus,
    })
    .eq('id', bookingId)

  if (isUniqueConstraintError(error)) {
    throw new SlotConflictError()
  }

  if (error) {
    throw error
  }

  const updatedBooking = await readBookingById(bookingId)

  if (!updatedBooking) {
    throw new Error('That reservation was updated, but it could not be reloaded.')
  }

  return normalizeBookingRow(updatedBooking)
}

export async function upsertAdminSlot(input: AdminSlotInput) {
  const supabaseAdmin = getSupabaseAdminClient()
  const startsAt = createLaunchDateTime(input.slotDate, input.slotTime).toISOString()

  if (input.slotId) {
    const { error } = await supabaseAdmin
      .from('booking_slots')
      .update({
        starts_at: startsAt,
        launch_location: input.launchLocation,
        notes: input.notes || null,
        is_active: input.isActive,
      })
      .eq('id', input.slotId)

    if (isUniqueConstraintError(error)) {
      throw new SlotConflictError('That slot already exists.')
    }

    if (error) {
      throw error
    }

    return { slotId: input.slotId }
  }

  const { data, error } = await supabaseAdmin
    .from('booking_slots')
    .insert({
      starts_at: startsAt,
      launch_location: input.launchLocation,
      notes: input.notes || null,
      is_active: input.isActive,
    })
    .select('id')
    .single()

  if (isUniqueConstraintError(error)) {
    throw new SlotConflictError('That slot already exists.')
  }

  if (error) {
    throw error
  }

  return { slotId: data.id as string }
}

export async function deleteAdminSlot(slotId: string) {
  const supabaseAdmin = getSupabaseAdminClient()
  const { count, error: bookingLookupError } = await supabaseAdmin
    .from('launch_bookings')
    .select('*', { count: 'exact', head: true })
    .eq('slot_id', slotId)

  if (bookingLookupError) {
    throw bookingLookupError
  }

  if ((count || 0) > 0) {
    throw new Error('This slot already has booking history and cannot be deleted.')
  }

  const { error } = await supabaseAdmin.from('booking_slots').delete().eq('id', slotId)

  if (error) {
    throw error
  }
}

export async function createAdminBooking(input: AdminBookingInput) {
  const supabaseAdmin = getSupabaseAdminClient()
  await ensureSlotIsBookable(input.slotId)
  const clientAccountId = await findMatchingClientAccountId(
    input.email,
    input.clientAccountId || undefined,
  )
  const serviceSelection = await resolveServiceSelection(
    clientAccountId,
    input.serviceEntitlementId || null,
  )

  const { data, error } = await supabaseAdmin
    .from('launch_bookings')
    .insert({
      slot_id: input.slotId,
      client_account_id: clientAccountId,
      service_entitlement_id: serviceSelection.serviceEntitlementId,
      service_name: serviceSelection.serviceName,
      add_on_services: input.addOnServices,
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      notes: input.notes || null,
      status: input.status,
      created_by: 'admin',
      email_customer_status: 'pending',
      email_admin_status: 'pending',
    })
    .select('id')
    .single()

  if (isUniqueConstraintError(error)) {
    throw new SlotConflictError()
  }

  if (error) {
    throw error
  }

  const booking = await readBookingById(data.id as string)

  if (!booking) {
    throw new Error('The booking was created, but it could not be loaded afterward.')
  }

  return normalizeBookingRow(booking)
}

export async function updateAdminBooking(bookingId: string, input: AdminBookingInput) {
  const supabaseAdmin = getSupabaseAdminClient()
  const existingBooking = await readBookingById(bookingId)

  if (!existingBooking) {
    throw new Error('That booking could not be found.')
  }

  const isSlotChanging = existingBooking.slot_id !== input.slotId
  const shouldValidateSlot =
    input.status !== 'cancelled' &&
    (isSlotChanging || existingBooking.status === 'cancelled')

  if (shouldValidateSlot) {
    await ensureSlotIsBookable(input.slotId)
  }

  const clientAccountId = await findMatchingClientAccountId(
    input.email,
    input.clientAccountId || undefined,
  )
  const serviceSelection = await resolveServiceSelection(
    clientAccountId,
    input.serviceEntitlementId || null,
    existingBooking,
  )

  const { error } = await supabaseAdmin
    .from('launch_bookings')
    .update({
      slot_id: input.slotId,
      client_account_id: clientAccountId,
      service_entitlement_id: serviceSelection.serviceEntitlementId,
      service_name: serviceSelection.serviceName,
      add_on_services: input.addOnServices,
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      notes: input.notes || null,
      status: input.status,
    })
    .eq('id', bookingId)

  if (isUniqueConstraintError(error)) {
    throw new SlotConflictError()
  }

  if (error) {
    throw error
  }

  const booking = await readBookingById(bookingId)

  if (!booking) {
    throw new Error('That booking was updated, but it could not be reloaded.')
  }

  return normalizeBookingRow(booking)
}

export async function updateBookingEmailStatus(
  bookingId: string,
  status: {
    emailCustomerStatus: 'pending' | 'sent' | 'failed'
    emailCustomerError?: string | null
    emailCustomerSentAt?: string | null
    emailAdminStatus: 'pending' | 'sent' | 'failed'
    emailAdminError?: string | null
    emailAdminSentAt?: string | null
  },
) {
  const supabaseAdmin = getSupabaseAdminClient()
  const { error } = await supabaseAdmin
    .from('launch_bookings')
    .update({
      email_customer_status: status.emailCustomerStatus,
      email_customer_error: status.emailCustomerError || null,
      email_customer_sent_at: status.emailCustomerSentAt || null,
      email_admin_status: status.emailAdminStatus,
      email_admin_error: status.emailAdminError || null,
      email_admin_sent_at: status.emailAdminSentAt || null,
    })
    .eq('id', bookingId)

  if (error) {
    throw error
  }
}

export async function resendBookingEmails(bookingId: string) {
  const booking = await readBookingById(bookingId)

  if (!booking) {
    throw new Error('That booking could not be found.')
  }

  return normalizeBookingRow(booking)
}
