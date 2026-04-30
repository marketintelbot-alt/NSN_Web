export const SERVICE_AGREEMENT_POLICY_VERSION = 'service-agreement-v1.1'
export const businessTimeZone = 'America/Chicago'
export const minimumBoatLengthFeet = 10
export const maximumBoatLengthFeet = 30

export type ServiceCategory = 'marine_care' | 'advisory'
export type PaymentType = 'instant_checkout' | 'quote_only'
export type PricingModel = 'per_foot' | 'flat' | 'starting_at_per_foot' | 'custom'

type ServiceDefinition = {
  id: string
  name: string
  description: string
  category: ServiceCategory
  pricingModel: PricingModel
  pricePerFootCents: number | null
  flatPriceCents: number | null
  startingPricePerFootCents: number | null
  paymentType: PaymentType
  quoteOnly: boolean
  stripePriceEnvVarName: string | null
  minBoatLengthFeet: number | null
  maxBoatLengthFeet: number | null
  requiresBoatLength: boolean
  addOnsAllowed: boolean
  warningNotes: string[]
  displayOrder: number
}

export type PublicServiceCatalogItem = {
  id: string
  name: string
  description: string
  category: ServiceCategory
  categoryLabel: string
  pricingModel: PricingModel
  pricingLabel: string
  paymentType: PaymentType
  quoteOnly: boolean
  minBoatLengthFeet: number | null
  maxBoatLengthFeet: number | null
  requiresBoatLength: boolean
  addOnsAllowed: boolean
  warningNotes: string[]
  displayOrder: number
}

const serviceCatalog: ServiceDefinition[] = [
  {
    id: 'maintenance-detail',
    name: 'Maintenance Detail',
    description:
      'A dependable seasonal reset for routine upkeep, light interior attention, and a clean exterior finish.',
    category: 'marine_care',
    pricingModel: 'per_foot',
    pricePerFootCents: 1600,
    flatPriceCents: null,
    startingPricePerFootCents: null,
    paymentType: 'instant_checkout',
    quoteOnly: false,
    stripePriceEnvVarName: 'STRIPE_PRICE_MAINTENANCE_DETAIL',
    minBoatLengthFeet: minimumBoatLengthFeet,
    maxBoatLengthFeet: maximumBoatLengthFeet,
    requiresBoatLength: true,
    addOnsAllowed: false,
    warningNotes: ['Boat length is rounded up to the nearest whole foot for checkout.'],
    displayOrder: 10,
  },
  {
    id: 'signature-detail',
    name: 'Signature Detail',
    description:
      'A more comprehensive marine care package for owners who want a premium clean, polished finish, and stronger presentation.',
    category: 'marine_care',
    pricingModel: 'per_foot',
    pricePerFootCents: 2900,
    flatPriceCents: null,
    startingPricePerFootCents: null,
    paymentType: 'instant_checkout',
    quoteOnly: false,
    stripePriceEnvVarName: 'STRIPE_PRICE_SIGNATURE_DETAIL',
    minBoatLengthFeet: minimumBoatLengthFeet,
    maxBoatLengthFeet: maximumBoatLengthFeet,
    requiresBoatLength: true,
    addOnsAllowed: false,
    warningNotes: ['Manual review still applies before the appointment is approved.'],
    displayOrder: 20,
  },
  {
    id: 'restoration-detail',
    name: 'Restoration Detail',
    description:
      'For aged, weathered, or neglected boats that need staged correction, heavier recovery work, and a tailored scope.',
    category: 'marine_care',
    pricingModel: 'starting_at_per_foot',
    pricePerFootCents: null,
    flatPriceCents: null,
    startingPricePerFootCents: 4200,
    paymentType: 'quote_only',
    quoteOnly: true,
    stripePriceEnvVarName: null,
    minBoatLengthFeet: minimumBoatLengthFeet,
    maxBoatLengthFeet: maximumBoatLengthFeet,
    requiresBoatLength: true,
    addOnsAllowed: false,
    warningNotes: ['Restoration work is reviewed manually before any payment is accepted.'],
    displayOrder: 30,
  },
  {
    id: 'exterior-wash',
    name: 'Exterior Wash',
    description:
      'A clean exterior wash for routine upkeep between details, focused on hull, topsides, rails, and glass.',
    category: 'marine_care',
    pricingModel: 'per_foot',
    pricePerFootCents: 500,
    flatPriceCents: null,
    startingPricePerFootCents: null,
    paymentType: 'instant_checkout',
    quoteOnly: false,
    stripePriceEnvVarName: 'STRIPE_PRICE_EXTERIOR_WASH',
    minBoatLengthFeet: minimumBoatLengthFeet,
    maxBoatLengthFeet: maximumBoatLengthFeet,
    requiresBoatLength: true,
    addOnsAllowed: false,
    warningNotes: [],
    displayOrder: 40,
  },
  {
    id: 'buff-wax',
    name: 'Buff & Wax',
    description:
      'Single-stage buffing and protective wax application to refresh gloss and support seasonal protection.',
    category: 'marine_care',
    pricingModel: 'per_foot',
    pricePerFootCents: 2300,
    flatPriceCents: null,
    startingPricePerFootCents: null,
    paymentType: 'instant_checkout',
    quoteOnly: false,
    stripePriceEnvVarName: 'STRIPE_PRICE_BUFF_WAX',
    minBoatLengthFeet: minimumBoatLengthFeet,
    maxBoatLengthFeet: maximumBoatLengthFeet,
    requiresBoatLength: true,
    addOnsAllowed: false,
    warningNotes: ['Heavy oxidation or major correction needs a manual quote instead.'],
    displayOrder: 50,
  },
  {
    id: 'vinyl-deep-clean',
    name: 'Vinyl Deep Clean',
    description:
      'Deep cleaning and conditioning for seating, bolsters, and vinyl surfaces that need more than routine wipe-downs.',
    category: 'marine_care',
    pricingModel: 'per_foot',
    pricePerFootCents: 600,
    flatPriceCents: null,
    startingPricePerFootCents: null,
    paymentType: 'instant_checkout',
    quoteOnly: false,
    stripePriceEnvVarName: 'STRIPE_PRICE_VINYL_DEEP_CLEAN',
    minBoatLengthFeet: minimumBoatLengthFeet,
    maxBoatLengthFeet: maximumBoatLengthFeet,
    requiresBoatLength: true,
    addOnsAllowed: false,
    warningNotes: ['Severe staining or mildew may require manual review.'],
    displayOrder: 60,
  },
  {
    id: 'interior-cleaning',
    name: 'Interior Cleaning',
    description:
      'Interior-focused cleaning for cabins, seating areas, compartments, and touchpoints when the scope needs review before approval.',
    category: 'marine_care',
    pricingModel: 'custom',
    pricePerFootCents: null,
    flatPriceCents: null,
    startingPricePerFootCents: null,
    paymentType: 'quote_only',
    quoteOnly: true,
    stripePriceEnvVarName: null,
    minBoatLengthFeet: minimumBoatLengthFeet,
    maxBoatLengthFeet: maximumBoatLengthFeet,
    requiresBoatLength: true,
    addOnsAllowed: false,
    warningNotes: ['Interior cleaning scopes are reviewed manually before pricing is finalized.'],
    displayOrder: 65,
  },
  {
    id: 'carpet-mat-shampoo',
    name: 'Carpet / Mat Shampoo',
    description:
      'Targeted shampoo service for carpeted surfaces and removable mats that need a fresher, cleaner finish.',
    category: 'marine_care',
    pricingModel: 'per_foot',
    pricePerFootCents: 500,
    flatPriceCents: null,
    startingPricePerFootCents: null,
    paymentType: 'instant_checkout',
    quoteOnly: false,
    stripePriceEnvVarName: 'STRIPE_PRICE_CARPET_MAT_SHAMPOO',
    minBoatLengthFeet: minimumBoatLengthFeet,
    maxBoatLengthFeet: maximumBoatLengthFeet,
    requiresBoatLength: true,
    addOnsAllowed: false,
    warningNotes: ['Heavy staining may move this request into quote review.'],
    displayOrder: 70,
  },
  {
    id: 'non-skid-deck-scrub',
    name: 'Non-Skid Deck Scrub',
    description:
      'Deep cleaning for non-skid surfaces to improve presentation and remove built-up grime from textured areas.',
    category: 'marine_care',
    pricingModel: 'per_foot',
    pricePerFootCents: 600,
    flatPriceCents: null,
    startingPricePerFootCents: null,
    paymentType: 'instant_checkout',
    quoteOnly: false,
    stripePriceEnvVarName: 'STRIPE_PRICE_NON_SKID_DECK_SCRUB',
    minBoatLengthFeet: minimumBoatLengthFeet,
    maxBoatLengthFeet: maximumBoatLengthFeet,
    requiresBoatLength: true,
    addOnsAllowed: false,
    warningNotes: [],
    displayOrder: 80,
  },
  {
    id: 'heavy-oxidation-removal',
    name: 'Heavy Oxidation Removal',
    description:
      'For heavier oxidation, dull finishes, and condition issues that need a more intensive correction plan.',
    category: 'marine_care',
    pricingModel: 'custom',
    pricePerFootCents: null,
    flatPriceCents: null,
    startingPricePerFootCents: null,
    paymentType: 'quote_only',
    quoteOnly: true,
    stripePriceEnvVarName: null,
    minBoatLengthFeet: minimumBoatLengthFeet,
    maxBoatLengthFeet: maximumBoatLengthFeet,
    requiresBoatLength: true,
    addOnsAllowed: false,
    warningNotes: ['Heavy oxidation is always reviewed manually before approval.'],
    displayOrder: 90,
  },
  {
    id: 'mold-mildew-treatment',
    name: 'Mold / Mildew Treatment',
    description:
      'Condition-based treatment for mold and mildew issues that need review before scheduling and pricing.',
    category: 'marine_care',
    pricingModel: 'custom',
    pricePerFootCents: null,
    flatPriceCents: null,
    startingPricePerFootCents: null,
    paymentType: 'quote_only',
    quoteOnly: true,
    stripePriceEnvVarName: null,
    minBoatLengthFeet: minimumBoatLengthFeet,
    maxBoatLengthFeet: maximumBoatLengthFeet,
    requiresBoatLength: true,
    addOnsAllowed: false,
    warningNotes: ['Condition-based review is required before work is approved.'],
    displayOrder: 100,
  },
  {
    id: 'multi-stage-gelcoat-correction',
    name: 'Multi-Stage Gelcoat Correction',
    description:
      'Advanced correction work for finish recovery projects that need staging, testing, and a custom scope.',
    category: 'marine_care',
    pricingModel: 'custom',
    pricePerFootCents: null,
    flatPriceCents: null,
    startingPricePerFootCents: null,
    paymentType: 'quote_only',
    quoteOnly: true,
    stripePriceEnvVarName: null,
    minBoatLengthFeet: minimumBoatLengthFeet,
    maxBoatLengthFeet: maximumBoatLengthFeet,
    requiresBoatLength: true,
    addOnsAllowed: false,
    warningNotes: ['Finish correction is quote-based and reviewed manually.'],
    displayOrder: 110,
  },
  {
    id: 'teak-cleaning-oiling',
    name: 'Teak Cleaning & Oiling',
    description:
      'Condition-led teak care priced after review of the boat, surface area, and current finish condition.',
    category: 'marine_care',
    pricingModel: 'custom',
    pricePerFootCents: null,
    flatPriceCents: null,
    startingPricePerFootCents: null,
    paymentType: 'quote_only',
    quoteOnly: true,
    stripePriceEnvVarName: null,
    minBoatLengthFeet: minimumBoatLengthFeet,
    maxBoatLengthFeet: maximumBoatLengthFeet,
    requiresBoatLength: true,
    addOnsAllowed: false,
    warningNotes: ['Teak work is quoted after review.'],
    displayOrder: 120,
  },
  {
    id: 'metal-polishing',
    name: 'Metal Polishing',
    description:
      'Detail-oriented metal polishing for rails, fittings, and brightwork, scoped after manual review.',
    category: 'marine_care',
    pricingModel: 'custom',
    pricePerFootCents: null,
    flatPriceCents: null,
    startingPricePerFootCents: null,
    paymentType: 'quote_only',
    quoteOnly: true,
    stripePriceEnvVarName: null,
    minBoatLengthFeet: minimumBoatLengthFeet,
    maxBoatLengthFeet: maximumBoatLengthFeet,
    requiresBoatLength: true,
    addOnsAllowed: false,
    warningNotes: ['Metal polishing is quoted manually and may be priced hourly.'],
    displayOrder: 130,
  },
  {
    id: 'owner-advisory-support',
    name: 'Owner Advisory Support',
    description:
      'Practical guidance for buying decisions, care planning, seasonal prep, technician referrals, and ownership support.',
    category: 'advisory',
    pricingModel: 'custom',
    pricePerFootCents: null,
    flatPriceCents: null,
    startingPricePerFootCents: null,
    paymentType: 'quote_only',
    quoteOnly: true,
    stripePriceEnvVarName: null,
    minBoatLengthFeet: null,
    maxBoatLengthFeet: null,
    requiresBoatLength: false,
    addOnsAllowed: false,
    warningNotes: [
      'Advisory services are general owner support and referral guidance only.',
      'Requests outside that scope can still be reviewed and redirected when needed.',
    ],
    displayOrder: 200,
  },
]

const serviceCatalogById = new Map(serviceCatalog.map((service) => [service.id, service]))

export function getServiceCategoryLabel(category: ServiceCategory) {
  return category === 'marine_care' ? 'Marine Care' : 'Advisory'
}

export function getServicePricingLabel(service: ServiceDefinition) {
  switch (service.pricingModel) {
    case 'per_foot':
      return `$${(service.pricePerFootCents || 0) / 100}/ft`
    case 'flat':
      return `$${(service.flatPriceCents || 0) / 100}`
    case 'starting_at_per_foot':
      return `Starting at $${(service.startingPricePerFootCents || 0) / 100}/ft`
    default:
      return 'Inquiry only'
  }
}

export function listPublicServiceCatalog(): PublicServiceCatalogItem[] {
  return [...serviceCatalog]
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      category: service.category,
      categoryLabel: getServiceCategoryLabel(service.category),
      pricingModel: service.pricingModel,
      pricingLabel: getServicePricingLabel(service),
      paymentType: service.paymentType,
      quoteOnly: service.quoteOnly,
      minBoatLengthFeet: service.minBoatLengthFeet,
      maxBoatLengthFeet: service.maxBoatLengthFeet,
      requiresBoatLength: service.requiresBoatLength,
      addOnsAllowed: service.addOnsAllowed,
      warningNotes: service.warningNotes,
      displayOrder: service.displayOrder,
    }))
}

export function findServiceById(serviceId: string) {
  return serviceCatalogById.get(serviceId) || null
}

export function roundBoatLengthFeet(boatLengthFeet: number) {
  return Math.ceil(boatLengthFeet)
}

export function calculateServicePriceCents(service: ServiceDefinition, roundedBoatLengthFeet: number) {
  if (service.paymentType !== 'instant_checkout') {
    throw new Error('This service is not eligible for instant checkout.')
  }

  if (service.pricingModel === 'per_foot' && service.pricePerFootCents) {
    return service.pricePerFootCents * roundedBoatLengthFeet
  }

  if (service.pricingModel === 'flat' && service.flatPriceCents) {
    return service.flatPriceCents
  }

  throw new Error('This service is missing instant checkout pricing configuration.')
}

export function getConfiguredStripePriceId(service: ServiceDefinition) {
  if (!service.stripePriceEnvVarName) {
    return ''
  }

  return process.env[service.stripePriceEnvVarName]?.trim() || ''
}

export function isBoatLengthWithinConfiguredRange(
  service: ServiceDefinition,
  roundedBoatLengthFeet: number,
) {
  if (!service.requiresBoatLength) {
    return true
  }

  if (
    typeof service.minBoatLengthFeet === 'number' &&
    roundedBoatLengthFeet < service.minBoatLengthFeet
  ) {
    return false
  }

  if (
    typeof service.maxBoatLengthFeet === 'number' &&
    roundedBoatLengthFeet > service.maxBoatLengthFeet
  ) {
    return false
  }

  return true
}
