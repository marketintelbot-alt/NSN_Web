export type ServiceCategory = 'marine_care' | 'advisory'
export type PaymentType = 'instant_checkout' | 'quote_only'
export type PricingModel = 'per_foot' | 'flat' | 'starting_at_per_foot' | 'custom'

export type ServiceCatalogItem = {
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

export type PublicServiceCatalogResponse = {
  services: ServiceCatalogItem[]
}

export type ServiceRequestPayload = {
  submissionIntent: 'checkout' | 'inquiry'
  selectedServiceId: string
  notSureWhatINeed: boolean
  heavyOxidation: boolean
  moldMildew: boolean
  severeStaining: boolean
  neglectedCondition: boolean
  unusualAccessIssue: boolean
  majorRestorationNeed: boolean
  customerName: string
  customerEmail: string
  customerPhone: string
  boatLengthFeet: number | ''
  boatMakeModelYear: string
  boatLocationMarina: string
  requestedDateTimeLocal: string
  customerNotes: string
  agreementAccepted: boolean
  agreementPolicyVersion: string
  companyWebsite: string
}

export type CreateServiceRequestResponse = {
  outcome: 'checkout' | 'inquiry' | 'ignored'
  requestId?: string
  checkoutUrl?: string
  message?: string
}

export type ServiceRequestConfirmation = {
  request: {
    id: string
    requestKind: 'booking' | 'inquiry'
    bookingStatus:
      | 'draft'
      | 'pending_review'
      | 'changes_requested'
      | 'confirmed'
      | 'completed'
      | 'canceled'
      | 'declined'
      | 'refunded'
      | 'failed_payment'
    paymentStatus: 'not_started' | 'authorized' | 'captured' | 'canceled' | 'refunded' | 'failed'
    selectedServiceName: string | null
    requestedDateTimeLabel: string | null
    calculatedPriceCents: number | null
    customerName: string
  }
}

export type AdminServiceRequest = {
  id: string
  requestKind: 'booking' | 'inquiry'
  bookingStatus:
    | 'draft'
    | 'pending_review'
    | 'changes_requested'
    | 'confirmed'
    | 'completed'
    | 'canceled'
    | 'declined'
    | 'refunded'
    | 'failed_payment'
  paymentStatus: 'not_started' | 'authorized' | 'captured' | 'canceled' | 'refunded' | 'failed'
  selectedServiceId: string | null
  selectedServiceName: string | null
  selectedServiceCategory: ServiceCategory | null
  paymentType: PaymentType | null
  quoteOnly: boolean
  quoteTriggerReasons: string[]
  boatLengthFeet: number | null
  boatLengthRounded: number | null
  calculatedPriceCents: number | null
  requestedDateTime: string | null
  requestedDateTimeLabel: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
  boatMakeModelYear: string | null
  boatLocationMarina: string | null
  customerNotes: string | null
  agreementAcceptedAt: string | null
  agreementPolicyVersion: string | null
  stripeCheckoutSessionId: string | null
  stripePaymentIntentId: string | null
  stripeChargeId: string | null
  paymentAuthorizedAt: string | null
  paymentCapturedAt: string | null
  paymentCanceledAt: string | null
  refundedAt: string | null
  adminNotes: string | null
  createdAt: string
  updatedAt: string
  cancellationWindowStatus: 'open' | 'closed' | 'not_scheduled'
  cancellationWindowClosesAt: string | null
  cancellationWindowClosesAtLabel: string | null
}

export type AdminServiceRequestsResponse = {
  requests: AdminServiceRequest[]
}
