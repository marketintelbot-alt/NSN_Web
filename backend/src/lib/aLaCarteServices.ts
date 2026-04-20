import { normalizeText } from './sanitize.js'
import { getSupabaseAdminClient } from './supabaseAdmin.js'

type FlatRangePricing = {
  kind: 'flat_range'
  minAmountCents: number
  maxAmountCents: number
}

type PerFootRangePricing = {
  kind: 'per_foot_range'
  minRateCentsPerFoot: number
  maxRateCentsPerFoot: number
  minimumFlatCents?: number
  maximumFlatCents?: number
}

type HourlyRangePricing = {
  kind: 'hourly_range'
  minAmountCents: number
  maxAmountCents: number
}

type CustomQuotePricing = {
  kind: 'custom_quote'
}

type CatalogPricing =
  | FlatRangePricing
  | PerFootRangePricing
  | HourlyRangePricing
  | CustomQuotePricing

type CatalogEntry = {
  serviceKey: string
  serviceName: string
  category: string
  description: string
  pricingDisplay: string
  pricing: CatalogPricing
  checkoutBlurb: string
}

type StoredALaCarteCreditRow = {
  id: string
  client_account_id: string
  service_key: string
  service_name: string
  total_units: number
  created_at: string
  updated_at: string
}

type StoredBookedALaCarteRow = {
  client_account_id: string | null
  add_on_services: string[] | null
}

export type PublicALaCarteService = {
  serviceKey: string
  serviceName: string
  category: string
  description: string
  pricingDisplay: string
  checkoutBlurb: string
  requiresBoatLength: boolean
  customQuoteOnly: boolean
  checkoutEnabled: boolean
  minimumCheckoutAmountCents: number | null
  maximumCheckoutAmountCents: number | null
  defaultCheckoutAmountCents: number | null
}

export type ClientALaCarteCredit = {
  id: string
  clientAccountId: string
  serviceKey: string
  serviceName: string
  category: string
  totalUnits: number
  reservedUnits: number
  remainingUnits: number
  createdAt: string
  updatedAt: string
}

export type ValidatedALaCarteCheckoutAmount = {
  service: PublicALaCarteService
  amountCents: number
}

const aLaCarteServiceCatalog: CatalogEntry[] = [
  {
    serviceKey: 'carpet-and-mat-shampoo',
    serviceName: 'Carpet and mat shampoo',
    category: 'A La Carte Interior Services',
    description: 'Hot-water extraction to remove dirt, stains, and odors.',
    pricingDisplay: '$75-$150 or $4-$6 / ft',
    pricing: {
      kind: 'per_foot_range',
      minRateCentsPerFoot: 400,
      maxRateCentsPerFoot: 600,
      minimumFlatCents: 7500,
      maximumFlatCents: 15000,
    },
    checkoutBlurb: 'Prepay an amount within the published service range to unlock scheduling.',
  },
  {
    serviceKey: 'vinyl-seat-deep-clean-and-condition',
    serviceName: 'Vinyl seat deep clean and condition',
    category: 'A La Carte Interior Services',
    description: 'Includes cleaning, conditioning, and UV protection.',
    pricingDisplay: '$75-$200 or $5-$7 / ft',
    pricing: {
      kind: 'per_foot_range',
      minRateCentsPerFoot: 500,
      maxRateCentsPerFoot: 700,
      minimumFlatCents: 7500,
      maximumFlatCents: 20000,
    },
    checkoutBlurb: 'Prepay an amount within the published service range to unlock scheduling.',
  },
  {
    serviceKey: 'cabin-interior-detail',
    serviceName: 'Cabin interior detail',
    category: 'A La Carte Interior Services',
    description: 'Walls, ceilings, cabinetry, counters, mirrors, appliances, and head.',
    pricingDisplay: '$10-$14 / ft',
    pricing: {
      kind: 'per_foot_range',
      minRateCentsPerFoot: 1000,
      maxRateCentsPerFoot: 1400,
    },
    checkoutBlurb: 'Boat length on file is used to calculate your checkout range.',
  },
  {
    serviceKey: 'mold-and-mildew-treatment',
    serviceName: 'Mold and mildew treatment',
    category: 'A La Carte Interior Services',
    description: 'Targeted remediation using marine-safe products.',
    pricingDisplay: '$150-$300',
    pricing: {
      kind: 'flat_range',
      minAmountCents: 15000,
      maxAmountCents: 30000,
    },
    checkoutBlurb: 'Choose the quoted amount within the published service range.',
  },
  {
    serviceKey: 'exterior-wash-only',
    serviceName: 'Exterior wash only',
    category: 'A La Carte Exterior Services',
    description: 'Hull, topsides, hardware, and windows.',
    pricingDisplay: '$4-$6 / ft',
    pricing: {
      kind: 'per_foot_range',
      minRateCentsPerFoot: 400,
      maxRateCentsPerFoot: 600,
    },
    checkoutBlurb: 'Boat length on file is used to calculate your checkout range.',
  },
  {
    serviceKey: 'non-skid-deck-scrub',
    serviceName: 'Non-skid deck scrub',
    category: 'A La Carte Exterior Services',
    description: 'Deep cleaning of textured surfaces.',
    pricingDisplay: '$5-$7 / ft',
    pricing: {
      kind: 'per_foot_range',
      minRateCentsPerFoot: 500,
      maxRateCentsPerFoot: 700,
    },
    checkoutBlurb: 'Boat length on file is used to calculate your checkout range.',
  },
  {
    serviceKey: 'buff-and-wax-single-stage',
    serviceName: 'Buff and wax (single-stage)',
    category: 'A La Carte Exterior Services',
    description: 'Enhances gloss and adds UV protection.',
    pricingDisplay: '$18-$25 / ft',
    pricing: {
      kind: 'per_foot_range',
      minRateCentsPerFoot: 1800,
      maxRateCentsPerFoot: 2500,
    },
    checkoutBlurb: 'Boat length on file is used to calculate your checkout range.',
  },
  {
    serviceKey: 'oxidation-removal',
    serviceName: 'Oxidation removal',
    category: 'A La Carte Exterior Services',
    description: 'Light starts at $10-$15 / ft, moderate runs $18-$25 / ft, and heavy oxidation needs a custom quote.',
    pricingDisplay: '$10-$25 / ft',
    pricing: {
      kind: 'per_foot_range',
      minRateCentsPerFoot: 1000,
      maxRateCentsPerFoot: 2500,
    },
    checkoutBlurb: 'Heavy oxidation still needs a manual quote before work is confirmed.',
  },
  {
    serviceKey: 'stainless-and-aluminum-polishing',
    serviceName: 'Stainless and aluminum polishing',
    category: 'Specialty & Add-On Services',
    description: 'Quoted for the first hour of polishing work.',
    pricingDisplay: '$75-$95 / hour',
    pricing: {
      kind: 'hourly_range',
      minAmountCents: 7500,
      maxAmountCents: 9500,
    },
    checkoutBlurb: 'Choose the quoted amount within the published hourly range.',
  },
  {
    serviceKey: 'teak-cleaning-and-oiling',
    serviceName: 'Teak cleaning and oiling',
    category: 'Specialty & Add-On Services',
    description: 'Boat length on file is used to calculate the published range.',
    pricingDisplay: '$8-$15 / ft',
    pricing: {
      kind: 'per_foot_range',
      minRateCentsPerFoot: 800,
      maxRateCentsPerFoot: 1500,
    },
    checkoutBlurb: 'Boat length on file is used to calculate your checkout range.',
  },
  {
    serviceKey: 'decal-removal',
    serviceName: 'Decal removal',
    category: 'Specialty & Add-On Services',
    description: 'Prepay within the published range to place the service on your reservation.',
    pricingDisplay: '$75-$200',
    pricing: {
      kind: 'flat_range',
      minAmountCents: 7500,
      maxAmountCents: 20000,
    },
    checkoutBlurb: 'Choose the quoted amount within the published service range.',
  },
  {
    serviceKey: 'seasonal-launch-and-haul-out-detail',
    serviceName: 'Seasonal launch and haul-out detail',
    category: 'Specialty & Add-On Services',
    description: 'This service stays quote-based and is not sold through Stripe.',
    pricingDisplay: 'Custom quote',
    pricing: {
      kind: 'custom_quote',
    },
    checkoutBlurb: 'North Shore Nautical will quote this service directly.',
  },
]

const catalogByKey = new Map(
  aLaCarteServiceCatalog.map((service) => [service.serviceKey, service]),
)
const catalogByName = new Map(
  aLaCarteServiceCatalog.map((service) => [service.serviceName.toLowerCase(), service]),
)

function createCountKey(clientAccountId: string, serviceKey: string) {
  return `${clientAccountId}:${serviceKey}`
}

function normalizeAmountCents(amountCents: number) {
  return Math.max(0, Math.round(amountCents))
}

function normalizeBoatLengthFeet(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null
  }

  return value
}

export function normalizeALaCarteServiceKey(serviceName: string) {
  return (
    normalizeText(serviceName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120) || 'service'
  )
}

function computeCheckoutRange(
  entry: CatalogEntry,
  boatLengthFeet: number | null | undefined,
) {
  const normalizedBoatLengthFeet = normalizeBoatLengthFeet(boatLengthFeet)

  switch (entry.pricing.kind) {
    case 'custom_quote':
      return {
        requiresBoatLength: false,
        customQuoteOnly: true,
        minimumCheckoutAmountCents: null,
        maximumCheckoutAmountCents: null,
        defaultCheckoutAmountCents: null,
      }
    case 'flat_range':
    case 'hourly_range':
      return {
        requiresBoatLength: false,
        customQuoteOnly: false,
        minimumCheckoutAmountCents: entry.pricing.minAmountCents,
        maximumCheckoutAmountCents: entry.pricing.maxAmountCents,
        defaultCheckoutAmountCents: entry.pricing.minAmountCents,
      }
    case 'per_foot_range': {
      if (!normalizedBoatLengthFeet) {
        return {
          requiresBoatLength: true,
          customQuoteOnly: false,
          minimumCheckoutAmountCents: null,
          maximumCheckoutAmountCents: null,
          defaultCheckoutAmountCents: null,
        }
      }

      const minimumByFoot = normalizeAmountCents(
        normalizedBoatLengthFeet * entry.pricing.minRateCentsPerFoot,
      )
      const maximumByFoot = normalizeAmountCents(
        normalizedBoatLengthFeet * entry.pricing.maxRateCentsPerFoot,
      )

      return {
        requiresBoatLength: true,
        customQuoteOnly: false,
        minimumCheckoutAmountCents: Math.max(
          minimumByFoot,
          entry.pricing.minimumFlatCents || 0,
        ),
        maximumCheckoutAmountCents: Math.max(
          maximumByFoot,
          entry.pricing.maximumFlatCents || 0,
        ),
        defaultCheckoutAmountCents: Math.max(
          minimumByFoot,
          entry.pricing.minimumFlatCents || 0,
        ),
      }
    }
  }
}

function normalizeCatalogEntry(
  entry: CatalogEntry,
  boatLengthFeet: number | null | undefined = null,
): PublicALaCarteService {
  const checkoutRange = computeCheckoutRange(entry, boatLengthFeet)

  return {
    serviceKey: entry.serviceKey,
    serviceName: entry.serviceName,
    category: entry.category,
    description: entry.description,
    pricingDisplay: entry.pricingDisplay,
    checkoutBlurb: entry.checkoutBlurb,
    requiresBoatLength: checkoutRange.requiresBoatLength,
    customQuoteOnly: checkoutRange.customQuoteOnly,
    checkoutEnabled:
      !checkoutRange.customQuoteOnly &&
      typeof checkoutRange.minimumCheckoutAmountCents === 'number' &&
      typeof checkoutRange.maximumCheckoutAmountCents === 'number',
    minimumCheckoutAmountCents: checkoutRange.minimumCheckoutAmountCents,
    maximumCheckoutAmountCents: checkoutRange.maximumCheckoutAmountCents,
    defaultCheckoutAmountCents: checkoutRange.defaultCheckoutAmountCents,
  }
}

function isMissingALaCarteSchemaError(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() || ''

  return (
    message.includes('client_paid_add_on_credits') ||
    message.includes('stripe_checkout_purchases') ||
    message.includes('fulfill_stripe_add_on_purchase')
  )
}

async function readReservedALaCarteCounts(clientAccountIds?: string[]) {
  const supabaseAdmin = getSupabaseAdminClient()
  let query = supabaseAdmin
    .from('launch_bookings')
    .select('client_account_id, add_on_services')
    .neq('status', 'cancelled')
    .not('client_account_id', 'is', null)

  if (clientAccountIds && clientAccountIds.length > 0) {
    query = query.in('client_account_id', clientAccountIds)
  }

  const { data, error } = await query

  if (error) {
    if (isMissingALaCarteSchemaError(error)) {
      return new Map<string, number>()
    }

    throw error
  }

  return ((data ?? []) as StoredBookedALaCarteRow[]).reduce((counts, row) => {
    if (!row.client_account_id) {
      return counts
    }

    const serviceKeys = new Set(
      (row.add_on_services || []).map((serviceName) => {
        const catalogEntry =
          catalogByName.get(serviceName.toLowerCase()) ||
          catalogByKey.get(normalizeALaCarteServiceKey(serviceName))

        return catalogEntry?.serviceKey || normalizeALaCarteServiceKey(serviceName)
      }),
    )

    for (const serviceKey of serviceKeys) {
      const countKey = createCountKey(row.client_account_id, serviceKey)
      counts.set(countKey, (counts.get(countKey) || 0) + 1)
    }

    return counts
  }, new Map<string, number>())
}

function normalizeCreditRow(
  row: StoredALaCarteCreditRow,
  reservedUnits: number,
): ClientALaCarteCredit {
  const catalogEntry = catalogByKey.get(row.service_key)
  const totalUnits = Number.isFinite(row.total_units) ? row.total_units : 0

  return {
    id: row.id,
    clientAccountId: row.client_account_id,
    serviceKey: row.service_key,
    serviceName: catalogEntry?.serviceName || row.service_name,
    category: catalogEntry?.category || 'A La Carte Services',
    totalUnits,
    reservedUnits,
    remainingUnits: Math.max(0, totalUnits - reservedUnits),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function listPublicALaCarteServices() {
  return aLaCarteServiceCatalog.map((service) => normalizeCatalogEntry(service))
}

export function listClientALaCarteServices(boatLengthFeet: number | null | undefined) {
  return aLaCarteServiceCatalog.map((service) =>
    normalizeCatalogEntry(service, boatLengthFeet),
  )
}

export function findALaCarteServiceByKey(serviceKey: string) {
  return catalogByKey.get(serviceKey) || null
}

export function normalizeSelectedALaCarteServiceNames(serviceNames: string[]) {
  const normalizedNames: string[] = []
  const seenServiceKeys = new Set<string>()

  for (const serviceName of serviceNames) {
    const catalogEntry =
      catalogByName.get(serviceName.toLowerCase()) ||
      catalogByKey.get(normalizeALaCarteServiceKey(serviceName))

    const normalizedServiceName = catalogEntry?.serviceName || normalizeText(serviceName)
    const normalizedServiceKey =
      catalogEntry?.serviceKey || normalizeALaCarteServiceKey(normalizedServiceName)

    if (!normalizedServiceName || seenServiceKeys.has(normalizedServiceKey)) {
      continue
    }

    seenServiceKeys.add(normalizedServiceKey)
    normalizedNames.push(normalizedServiceName)
  }

  return normalizedNames
}

export async function listClientALaCarteCredits(clientAccountId: string) {
  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from('client_paid_add_on_credits')
    .select('*')
    .eq('client_account_id', clientAccountId)
    .order('service_name', { ascending: true })

  if (error) {
    if (isMissingALaCarteSchemaError(error)) {
      return [] as ClientALaCarteCredit[]
    }

    throw error
  }

  const rows = (data ?? []) as StoredALaCarteCreditRow[]

  if (rows.length === 0) {
    return [] as ClientALaCarteCredit[]
  }

  const reservedCounts = await readReservedALaCarteCounts([clientAccountId])
  return rows.map((row) =>
    normalizeCreditRow(row, reservedCounts.get(createCountKey(clientAccountId, row.service_key)) || 0),
  )
}

export async function validateALaCarteCheckoutAmount(
  serviceKey: string,
  amountCents: number,
  boatLengthFeet: number | null | undefined,
): Promise<ValidatedALaCarteCheckoutAmount> {
  const catalogEntry = findALaCarteServiceByKey(serviceKey)

  if (!catalogEntry) {
    throw new Error('That a la carte service is not available.')
  }

  const service = normalizeCatalogEntry(catalogEntry, boatLengthFeet)

  if (service.customQuoteOnly) {
    throw new Error('This service is still handled by custom quote instead of Stripe.')
  }

  if (!service.checkoutEnabled) {
    throw new Error('Add your boat length to the portal before paying for this service.')
  }

  if (
    typeof service.minimumCheckoutAmountCents !== 'number' ||
    typeof service.maximumCheckoutAmountCents !== 'number'
  ) {
    throw new Error('That a la carte service is not ready for checkout yet.')
  }

  const normalizedAmountCents = normalizeAmountCents(amountCents)

  if (
    normalizedAmountCents < service.minimumCheckoutAmountCents ||
    normalizedAmountCents > service.maximumCheckoutAmountCents
  ) {
    throw new Error('Choose a Stripe amount inside the published service range.')
  }

  return {
    service,
    amountCents: normalizedAmountCents,
  }
}

export async function ensureClientHasPaidALaCarteCredits(
  clientAccountId: string,
  selectedServices: string[],
  existingBooking?: { add_on_services: string[] | null; status: string } | null,
) {
  const normalizedServiceNames = normalizeSelectedALaCarteServiceNames(selectedServices)

  if (normalizedServiceNames.length === 0) {
    return [] as string[]
  }

  const existingServiceKeys = new Set(
    (existingBooking?.status && existingBooking.status !== 'cancelled'
      ? existingBooking.add_on_services || []
      : []
    )
      .map((serviceName) => {
        const catalogEntry = catalogByName.get(serviceName.toLowerCase())
        return catalogEntry?.serviceKey || normalizeALaCarteServiceKey(serviceName)
      })
      .filter(Boolean),
  )

  const credits = await listClientALaCarteCredits(clientAccountId)
  const creditByKey = new Map(credits.map((credit) => [credit.serviceKey, credit]))

  for (const serviceName of normalizedServiceNames) {
    const catalogEntry = catalogByName.get(serviceName.toLowerCase())

    if (!catalogEntry) {
      if (existingBooking?.add_on_services?.includes(serviceName)) {
        continue
      }

      throw new Error('That a la carte service is not available.')
    }

    const credit = creditByKey.get(catalogEntry.serviceKey)
    const availableUnits =
      (credit?.remainingUnits || 0) + (existingServiceKeys.has(catalogEntry.serviceKey) ? 1 : 0)

    if (availableUnits <= 0) {
      throw new Error(
        `Purchase ${catalogEntry.serviceName} through Stripe before reserving it.`,
      )
    }
  }

  return normalizedServiceNames
}

export async function fulfillALaCarteCheckoutPurchase(input: {
  clientAccountId: string
  serviceKey: string
  serviceName: string
  amountCents: number
  stripeCheckoutSessionId: string
  stripePaymentIntentId?: string | null
  customerEmail?: string | null
}) {
  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await supabaseAdmin.rpc('fulfill_stripe_add_on_purchase', {
    p_client_account_id: input.clientAccountId,
    p_service_key: input.serviceKey,
    p_service_name: input.serviceName,
    p_quantity: 1,
    p_unit_amount_cents: normalizeAmountCents(input.amountCents),
    p_currency: 'usd',
    p_stripe_checkout_session_id: input.stripeCheckoutSessionId,
    p_stripe_payment_intent_id: input.stripePaymentIntentId || null,
    p_customer_email: input.customerEmail || null,
  })

  if (error) {
    if (isMissingALaCarteSchemaError(error)) {
      throw new Error(
        'Stripe fulfillment storage is not configured yet. Run the latest Supabase schema before taking payments.',
      )
    }

    throw error
  }

  return Boolean(data)
}
