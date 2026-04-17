import bcrypt from 'bcryptjs'

import { normalizeMultilineText, normalizeText } from './sanitize.js'
import { getSupabaseAdminClient } from './supabaseAdmin.js'

type StoredClientServiceEntitlementRow = {
  id: string
  client_account_id: string
  service_key: string
  service_name: string
  total_units: number
  notes: string | null
  created_at: string
  updated_at: string
}

type StoredClientAccountRow = {
  id: string
  email: string
  password_hash: string
  full_name: string
  phone: string
  boat_name: string | null
  boat_make_model: string | null
  boat_length_feet: number | null
  preferred_launch_location: string
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  client_service_entitlements?: StoredClientServiceEntitlementRow[] | null
}

type ClientServiceReservationRow = {
  client_account_id: string | null
  service_entitlement_id: string | null
}

type NormalizedServiceInput = {
  serviceKey: string
  serviceName: string
  totalUnits: number
  notes: string | null
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

export type ClientServiceInput = {
  serviceName: string
  totalUnits: number
  notes?: string
}

export type ClientAccountInput = {
  clientId?: string
  email: string
  password?: string
  fullName: string
  phone: string
  boatName?: string
  boatMakeModel?: string
  boatLengthFeet?: number | null
  preferredLaunchLocation: string
  notes?: string
  isActive: boolean
  services?: ClientServiceInput[]
}

export type ClientProfileInput = {
  fullName: string
  phone: string
  boatName?: string
  boatMakeModel?: string
  boatLengthFeet?: number | null
  preferredLaunchLocation: string
  notes?: string
}

const missingSchemaMessage =
  'Client account storage is not configured yet. Run the latest Supabase schema before using client account management.'

function isMissingClientAccountsSchemaError(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() || ''
  return message.includes('client_accounts') || message.includes('client_service_entitlements')
}

function normalizeOptionalText(value: string | null | undefined, max: number) {
  const normalized = value ? normalizeText(value) : ''
  return normalized.length > 0 ? normalized.slice(0, max) : null
}

function normalizeOptionalNotes(value: string | null | undefined, max: number) {
  const normalized = value ? normalizeMultilineText(value) : ''
  return normalized.length > 0 ? normalized.slice(0, max) : null
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function normalizeServiceKey(serviceName: string) {
  const normalized = normalizeText(serviceName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized.slice(0, 120) || 'service'
}

function normalizeServiceInputs(services: ClientServiceInput[] | undefined) {
  const entries = new Map<string, NormalizedServiceInput>()

  for (const service of services || []) {
    const serviceName = normalizeText(service.serviceName || '').slice(0, 120)

    if (!serviceName) {
      continue
    }

    const serviceKey = normalizeServiceKey(serviceName)
    const totalUnits = Math.max(0, Math.floor(Number(service.totalUnits) || 0))
    entries.set(serviceKey, {
      serviceKey,
      serviceName,
      totalUnits,
      notes: normalizeOptionalNotes(service.notes, 500),
    })
  }

  return [...entries.values()]
}

async function readServiceReservationCounts(clientAccountIds?: string[]) {
  const supabaseAdmin = getSupabaseAdminClient()
  let query = supabaseAdmin
    .from('launch_bookings')
    .select('client_account_id, service_entitlement_id')
    .not('service_entitlement_id', 'is', null)
    .neq('status', 'cancelled')

  if (clientAccountIds && clientAccountIds.length > 0) {
    query = query.in('client_account_id', clientAccountIds)
  }

  const { data, error } = await query

  if (error) {
    if (isMissingClientAccountsSchemaError(error)) {
      return new Map<string, number>()
    }

    throw error
  }

  return ((data ?? []) as ClientServiceReservationRow[]).reduce((counts, row) => {
    if (!row.service_entitlement_id) {
      return counts
    }

    counts.set(row.service_entitlement_id, (counts.get(row.service_entitlement_id) || 0) + 1)
    return counts
  }, new Map<string, number>())
}

function normalizeServiceEntitlementRow(
  row: StoredClientServiceEntitlementRow,
  reservedUnits: number,
): ClientServiceEntitlement {
  const totalUnits = Number.isFinite(row.total_units) ? row.total_units : 0

  return {
    id: row.id,
    clientAccountId: row.client_account_id,
    serviceKey: row.service_key,
    serviceName: row.service_name,
    totalUnits,
    reservedUnits,
    remainingUnits: Math.max(0, totalUnits - reservedUnits),
    notes: row.notes || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function normalizeClientAccountRow(
  row: StoredClientAccountRow,
  usageCounts: Map<string, number>,
): ClientAccount {
  const services = (row.client_service_entitlements || [])
    .map((service) =>
      normalizeServiceEntitlementRow(service, usageCounts.get(service.id) || 0),
    )
    .sort((left, right) => left.serviceName.localeCompare(right.serviceName))

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    boatName: row.boat_name || null,
    boatMakeModel: row.boat_make_model || null,
    boatLengthFeet:
      typeof row.boat_length_feet === 'number' && Number.isFinite(row.boat_length_feet)
        ? row.boat_length_feet
        : null,
    preferredLaunchLocation: row.preferred_launch_location,
    notes: row.notes || null,
    isActive: row.is_active,
    services,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function listClientAccountRows() {
  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from('client_accounts')
    .select('*, client_service_entitlements(*)')
    .order('full_name', { ascending: true })

  if (error) {
    if (isMissingClientAccountsSchemaError(error)) {
      return [] as StoredClientAccountRow[]
    }

    throw error
  }

  return (data ?? []) as StoredClientAccountRow[]
}

async function syncClientServices(clientId: string, services: ClientServiceInput[] | undefined) {
  const normalizedServices = normalizeServiceInputs(services)
  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from('client_service_entitlements')
    .select('id, service_key')
    .eq('client_account_id', clientId)

  if (error) {
    if (isMissingClientAccountsSchemaError(error)) {
      throw new Error(missingSchemaMessage)
    }

    throw error
  }

  const existingRows = (data ?? []) as Array<{ id: string; service_key: string }>
  const incomingKeys = new Set(normalizedServices.map((service) => service.serviceKey))

  if (normalizedServices.length > 0) {
    const { error: upsertError } = await supabaseAdmin
      .from('client_service_entitlements')
      .upsert(
        normalizedServices.map((service) => ({
          client_account_id: clientId,
          service_key: service.serviceKey,
          service_name: service.serviceName,
          total_units: service.totalUnits,
          notes: service.notes,
        })),
        {
          onConflict: 'client_account_id,service_key',
        },
      )

    if (upsertError) {
      if (isMissingClientAccountsSchemaError(upsertError)) {
        throw new Error(missingSchemaMessage)
      }

      throw upsertError
    }
  }

  const removedIds = existingRows
    .filter((row) => !incomingKeys.has(row.service_key))
    .map((row) => row.id)

  if (removedIds.length > 0) {
    const { error: deleteError } = await supabaseAdmin
      .from('client_service_entitlements')
      .delete()
      .in('id', removedIds)

    if (deleteError) {
      throw deleteError
    }
  }
}

async function linkBookingsToClientAccount(clientId: string, emails: string[]) {
  const normalizedEmails = emails.map(normalizeEmail)

  if (!normalizedEmails.length) {
    return
  }

  const supabaseAdmin = getSupabaseAdminClient()
  const { error } = await supabaseAdmin
    .from('launch_bookings')
    .update({ client_account_id: clientId })
    .in('email', normalizedEmails)

  if (error) {
    throw error
  }
}

async function readClientAccountRowById(clientId: string) {
  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from('client_accounts')
    .select('*, client_service_entitlements(*)')
    .eq('id', clientId)
    .maybeSingle()

  if (error) {
    if (isMissingClientAccountsSchemaError(error)) {
      return null
    }

    throw error
  }

  return (data as StoredClientAccountRow | null) ?? null
}

async function readClientAccountRowByEmail(email: string) {
  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from('client_accounts')
    .select('*, client_service_entitlements(*)')
    .eq('email', normalizeEmail(email))
    .maybeSingle()

  if (error) {
    if (isMissingClientAccountsSchemaError(error)) {
      return null
    }

    throw error
  }

  return (data as StoredClientAccountRow | null) ?? null
}

export async function listClientAccounts() {
  const rows = await listClientAccountRows()

  if (rows.length === 0) {
    return [] as ClientAccount[]
  }

  const usageCounts = await readServiceReservationCounts(rows.map((row) => row.id))
  return rows.map((row) => normalizeClientAccountRow(row, usageCounts))
}

export async function readClientAccountById(clientId: string) {
  const row = await readClientAccountRowById(clientId)

  if (!row) {
    return null
  }

  const usageCounts = await readServiceReservationCounts([clientId])
  return normalizeClientAccountRow(row, usageCounts)
}

export async function readClientAccountByEmail(email: string) {
  const row = await readClientAccountRowByEmail(email)

  if (!row) {
    return null
  }

  const usageCounts = await readServiceReservationCounts([row.id])
  return normalizeClientAccountRow(row, usageCounts)
}

export async function readClientServiceEntitlementById(
  clientId: string,
  serviceEntitlementId: string,
) {
  const client = await readClientAccountById(clientId)
  return client?.services.find((service) => service.id === serviceEntitlementId) || null
}

export async function authenticateClientCredentials(email: string, password: string) {
  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from('client_accounts')
    .select('*')
    .eq('email', normalizeEmail(email))
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    if (isMissingClientAccountsSchemaError(error)) {
      return null
    }

    throw error
  }

  const account = data as StoredClientAccountRow | null

  if (!account) {
    return null
  }

  const passwordMatches = await bcrypt.compare(password, account.password_hash)

  if (!passwordMatches) {
    return null
  }

  return (await readClientAccountById(account.id)) || null
}

export async function upsertClientAccount(input: ClientAccountInput) {
  const supabaseAdmin = getSupabaseAdminClient()
  const existingAccount = input.clientId ? await readClientAccountById(input.clientId) : null
  const normalizedEmail = normalizeEmail(input.email)
  const passwordValue = input.password?.trim() || ''

  if (!passwordValue && !existingAccount) {
    throw new Error('A password is required when creating a client account.')
  }

  const passwordHash = passwordValue
    ? await bcrypt.hash(passwordValue, 12)
    : await (async () => {
        const { data, error } = await supabaseAdmin
          .from('client_accounts')
          .select('password_hash')
          .eq('id', input.clientId)
          .single()

        if (error) {
          if (isMissingClientAccountsSchemaError(error)) {
            throw new Error(missingSchemaMessage)
          }

          throw error
        }

        return (data.password_hash as string) || ''
      })()

  const payload = {
    email: normalizedEmail,
    password_hash: passwordHash,
    full_name: normalizeText(input.fullName).slice(0, 80),
    phone: normalizeText(input.phone).slice(0, 30),
    boat_name: normalizeOptionalText(input.boatName, 120),
    boat_make_model: normalizeOptionalText(input.boatMakeModel, 120),
    boat_length_feet:
      typeof input.boatLengthFeet === 'number' && Number.isFinite(input.boatLengthFeet)
        ? Number(input.boatLengthFeet)
        : null,
    preferred_launch_location: input.preferredLaunchLocation,
    notes: normalizeOptionalNotes(input.notes, 1000),
    is_active: input.isActive,
  }

  if (input.clientId) {
    const { error } = await supabaseAdmin
      .from('client_accounts')
      .update(payload)
      .eq('id', input.clientId)

    if (error) {
      if (isMissingClientAccountsSchemaError(error)) {
        throw new Error(missingSchemaMessage)
      }

      if (error.code === '23505') {
        throw new Error('A client account already exists for that email.')
      }

      throw error
    }

    await syncClientServices(input.clientId, input.services)
    await linkBookingsToClientAccount(input.clientId, [
      normalizedEmail,
      existingAccount?.email || normalizedEmail,
    ])

    const updatedAccount = await readClientAccountById(input.clientId)

    if (!updatedAccount) {
      throw new Error('The client account was updated, but it could not be reloaded.')
    }

    return updatedAccount
  }

  const { data, error } = await supabaseAdmin
    .from('client_accounts')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    if (isMissingClientAccountsSchemaError(error)) {
      throw new Error(missingSchemaMessage)
    }

    if (error.code === '23505') {
      throw new Error('A client account already exists for that email.')
    }

    throw error
  }

  const clientId = data.id as string
  await syncClientServices(clientId, input.services)
  await linkBookingsToClientAccount(clientId, [normalizedEmail])

  const createdAccount = await readClientAccountById(clientId)

  if (!createdAccount) {
    throw new Error('The client account was created, but it could not be reloaded.')
  }

  return createdAccount
}

export async function updateClientProfile(clientId: string, input: ClientProfileInput) {
  const existingAccount = await readClientAccountById(clientId)

  if (!existingAccount) {
    throw new Error('That client account could not be found.')
  }

  return upsertClientAccount({
    clientId,
    email: existingAccount.email,
    fullName: input.fullName,
    phone: input.phone,
    boatName: input.boatName,
    boatMakeModel: input.boatMakeModel,
    boatLengthFeet: input.boatLengthFeet,
    preferredLaunchLocation: input.preferredLaunchLocation,
    notes: input.notes,
    isActive: existingAccount.isActive,
    services: existingAccount.services.map((service) => ({
      serviceName: service.serviceName,
      totalUnits: service.totalUnits,
      notes: service.notes || '',
    })),
  })
}
