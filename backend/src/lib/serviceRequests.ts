import Stripe from 'stripe'
import { formatInTimeZone } from 'date-fns-tz'

import type { PublicServiceRequestInput } from './serviceRequestSchemas.js'
import { parseRequestedDateTimeLocal } from './serviceRequestSchemas.js'
import {
  businessTimeZone,
  calculateServicePriceCents,
  findServiceById,
  getConfiguredStripePriceId,
  isBoatLengthWithinConfiguredRange,
  minimumBoatLengthFeet,
  roundBoatLengthFeet,
  type PaymentType,
  type ServiceCategory,
} from './serviceCatalog.js'
import { getStripeClient } from './stripeCheckout.js'
import { getSupabaseAdminClient } from './supabaseAdmin.js'

export type ServiceRequestKind = 'booking' | 'inquiry'
export type BookingStatus =
  | 'draft'
  | 'pending_review'
  | 'changes_requested'
  | 'confirmed'
  | 'completed'
  | 'canceled'
  | 'declined'
  | 'refunded'
  | 'failed_payment'
export type PaymentStatus =
  | 'not_started'
  | 'authorized'
  | 'captured'
  | 'canceled'
  | 'refunded'
  | 'failed'
export type CustomerEmailType =
  | 'inquiry_received'
  | 'authorization_received'
  | 'booking_approved'
  | 'changes_requested'
  | 'request_declined'
  | 'booking_canceled'
  | 'service_completed'
  | 'booking_refunded'
export type InternalEmailType = 'new_inquiry' | 'authorization_received'

type StoredServiceRequestRow = {
  id: string
  request_kind: ServiceRequestKind
  booking_status: BookingStatus
  payment_status: PaymentStatus
  source: string
  selected_service_id: string | null
  selected_service_name: string | null
  selected_service_category: ServiceCategory | null
  payment_type: PaymentType | null
  quote_only: boolean
  quote_trigger_reasons: string[] | null
  selected_add_ons: string[] | null
  boat_length_feet: number | null
  boat_length_rounded: number | null
  calculated_price_cents: number | null
  currency: string
  requested_date_time: string | null
  customer_name: string
  customer_email: string
  customer_phone: string
  boat_make_model_year: string | null
  boat_location_marina: string | null
  customer_notes: string | null
  agreement_accepted: boolean
  agreement_accepted_at: string | null
  agreement_policy_version: string | null
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  stripe_charge_id: string | null
  payment_authorized_at: string | null
  payment_captured_at: string | null
  payment_canceled_at: string | null
  refunded_at: string | null
  admin_notes: string | null
  last_customer_email_type: CustomerEmailType | null
  last_customer_email_sent_at: string | null
  last_internal_email_type: InternalEmailType | null
  last_internal_email_sent_at: string | null
  created_at: string
  updated_at: string
}

export type ServiceRequestRecord = {
  id: string
  requestKind: ServiceRequestKind
  bookingStatus: BookingStatus
  paymentStatus: PaymentStatus
  source: string
  selectedServiceId: string | null
  selectedServiceName: string | null
  selectedServiceCategory: ServiceCategory | null
  paymentType: PaymentType | null
  quoteOnly: boolean
  quoteTriggerReasons: string[]
  selectedAddOns: string[]
  boatLengthFeet: number | null
  boatLengthRounded: number | null
  calculatedPriceCents: number | null
  currency: string
  requestedDateTime: string | null
  requestedDateTimeLabel: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
  boatMakeModelYear: string | null
  boatLocationMarina: string | null
  customerNotes: string | null
  agreementAccepted: boolean
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
  lastCustomerEmailType: CustomerEmailType | null
  lastCustomerEmailSentAt: string | null
  lastInternalEmailType: InternalEmailType | null
  lastInternalEmailSentAt: string | null
  createdAt: string
  updatedAt: string
  cancellationWindowStatus: 'open' | 'closed' | 'not_scheduled'
  cancellationWindowClosesAt: string | null
  cancellationWindowClosesAtLabel: string | null
}

type ServiceRequestInsert = Omit<StoredServiceRequestRow, 'id' | 'created_at' | 'updated_at'>

const cancellationWindowMs = 48 * 60 * 60 * 1000

function normalizeOrigin(value: string) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return ''
  }

  try {
    return new URL(trimmedValue).origin
  } catch {
    return trimmedValue.replace(/\/$/, '')
  }
}

function getSiteUrl() {
  const explicitSiteUrl = process.env.SITE_URL?.trim()

  if (explicitSiteUrl) {
    return normalizeOrigin(explicitSiteUrl)
  }

  const configuredCorsOrigin = `${process.env.CORS_ORIGIN || ''}`
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .find(Boolean)

  if (configuredCorsOrigin) {
    return configuredCorsOrigin
  }

  return process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173'
}

function getSuccessUrl(requestId: string) {
  const configuredSuccessUrl = process.env.SUCCESS_URL?.trim()

  if (configuredSuccessUrl) {
    return configuredSuccessUrl
      .replaceAll('{REQUEST_ID}', requestId)
      .replaceAll('{CHECKOUT_SESSION_ID}', '{CHECKOUT_SESSION_ID}')
  }

  const siteUrl = getSiteUrl()

  if (!siteUrl) {
    throw new Error('The site URL is not configured yet for Stripe checkout.')
  }

  return `${siteUrl}/booking/confirmation?request=${requestId}&session_id={CHECKOUT_SESSION_ID}`
}

function getCancelUrl(selectedServiceId: string | null) {
  const configuredCancelUrl = process.env.CANCEL_URL?.trim()

  if (configuredCancelUrl) {
    return configuredCancelUrl.replaceAll('{SERVICE_ID}', selectedServiceId || '')
  }

  const siteUrl = getSiteUrl()

  if (!siteUrl) {
    throw new Error('The site URL is not configured yet for Stripe checkout.')
  }

  const params = new URLSearchParams()
  params.set('cancelled', '1')

  if (selectedServiceId) {
    params.set('service', selectedServiceId)
  }

  return `${siteUrl}/booking?${params.toString()}`
}

function formatRequestedDateTimeLabel(value: string | null) {
  if (!value) {
    return null
  }

  return formatInTimeZone(
    new Date(value),
    businessTimeZone,
    "EEEE, MMMM d, yyyy 'at' h:mm a zzz",
  )
}

function getCancellationWindowDetails(requestedDateTime: string | null, currentDate = new Date()) {
  if (!requestedDateTime) {
    return {
      status: 'not_scheduled' as const,
      closesAt: null,
      closesAtLabel: null,
    }
  }

  const closesAtDate = new Date(new Date(requestedDateTime).getTime() - cancellationWindowMs)
  const closesAt = closesAtDate.toISOString()

  return {
    status: currentDate.getTime() <= closesAtDate.getTime() ? ('open' as const) : ('closed' as const),
    closesAt,
    closesAtLabel: formatInTimeZone(closesAtDate, businessTimeZone, "MMM d, yyyy 'at' h:mm a zzz"),
  }
}

function normalizeServiceRequestRow(row: StoredServiceRequestRow): ServiceRequestRecord {
  const cancellationWindow = getCancellationWindowDetails(row.requested_date_time)

  return {
    id: row.id,
    requestKind: row.request_kind,
    bookingStatus: row.booking_status,
    paymentStatus: row.payment_status,
    source: row.source,
    selectedServiceId: row.selected_service_id,
    selectedServiceName: row.selected_service_name,
    selectedServiceCategory: row.selected_service_category,
    paymentType: row.payment_type,
    quoteOnly: row.quote_only,
    quoteTriggerReasons: row.quote_trigger_reasons || [],
    selectedAddOns: row.selected_add_ons || [],
    boatLengthFeet: row.boat_length_feet,
    boatLengthRounded: row.boat_length_rounded,
    calculatedPriceCents: row.calculated_price_cents,
    currency: row.currency,
    requestedDateTime: row.requested_date_time,
    requestedDateTimeLabel: formatRequestedDateTimeLabel(row.requested_date_time),
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    boatMakeModelYear: row.boat_make_model_year,
    boatLocationMarina: row.boat_location_marina,
    customerNotes: row.customer_notes,
    agreementAccepted: row.agreement_accepted,
    agreementAcceptedAt: row.agreement_accepted_at,
    agreementPolicyVersion: row.agreement_policy_version,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    stripeChargeId: row.stripe_charge_id,
    paymentAuthorizedAt: row.payment_authorized_at,
    paymentCapturedAt: row.payment_captured_at,
    paymentCanceledAt: row.payment_canceled_at,
    refundedAt: row.refunded_at,
    adminNotes: row.admin_notes,
    lastCustomerEmailType: row.last_customer_email_type,
    lastCustomerEmailSentAt: row.last_customer_email_sent_at,
    lastInternalEmailType: row.last_internal_email_type,
    lastInternalEmailSentAt: row.last_internal_email_sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    cancellationWindowStatus: cancellationWindow.status,
    cancellationWindowClosesAt: cancellationWindow.closesAt,
    cancellationWindowClosesAtLabel: cancellationWindow.closesAtLabel,
  }
}

function getLatestChargeId(paymentIntent: Stripe.PaymentIntent | null | undefined) {
  if (!paymentIntent?.latest_charge) {
    return null
  }

  return typeof paymentIntent.latest_charge === 'string'
    ? paymentIntent.latest_charge
    : paymentIntent.latest_charge.id
}

function getQuotedAmountCentsFromMetadata(metadata: Record<string, string> | null | undefined) {
  const amount = Number(metadata?.quotedAmountCents || metadata?.amountCents || '')
  return Number.isInteger(amount) && amount > 0 ? amount : null
}

function buildQuoteTriggerReasons(
  input: PublicServiceRequestInput,
  roundedBoatLengthFeet: number | null,
) {
  const reasons: string[] = []
  const service = input.selectedServiceId ? findServiceById(input.selectedServiceId) : null

  if (!service) {
    reasons.push('service_selection_required')
  }

  if (input.notSureWhatINeed) {
    reasons.push('not_sure_what_i_need')
  }

  if (service?.quoteOnly) {
    reasons.push('service_is_quote_only')
  }

  if (
    service?.requiresBoatLength &&
    roundedBoatLengthFeet &&
    !isBoatLengthWithinConfiguredRange(service, roundedBoatLengthFeet)
  ) {
    reasons.push('boat_length_over_maximum')
  }

  if (input.heavyOxidation) {
    reasons.push('heavy_oxidation')
  }

  if (input.moldMildew) {
    reasons.push('mold_mildew')
  }

  if (input.severeStaining) {
    reasons.push('severe_staining')
  }

  if (input.neglectedCondition) {
    reasons.push('neglected_condition')
  }

  if (input.unusualAccessIssue) {
    reasons.push('unusual_access_issue')
  }

  if (input.majorRestorationNeed) {
    reasons.push('major_restoration_need')
  }

  return reasons
}

function canMoveToAuthorized(record: ServiceRequestRecord) {
  return !['captured', 'canceled', 'refunded'].includes(record.paymentStatus)
}

function canMoveToCaptured(record: ServiceRequestRecord) {
  return !['captured', 'refunded'].includes(record.paymentStatus)
}

function canMoveToCanceled(record: ServiceRequestRecord) {
  return !['captured', 'refunded'].includes(record.paymentStatus)
}

async function insertServiceRequest(payload: ServiceRequestInsert) {
  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from('service_requests')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return normalizeServiceRequestRow(data as StoredServiceRequestRow)
}

async function readStoredServiceRequestById(requestId: string) {
  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from('service_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as StoredServiceRequestRow | null) ?? null
}

async function readStoredServiceRequestByCheckoutSessionId(checkoutSessionId: string) {
  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from('service_requests')
    .select('*')
    .eq('stripe_checkout_session_id', checkoutSessionId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as StoredServiceRequestRow | null) ?? null
}

async function readStoredServiceRequestByPaymentIntentId(paymentIntentId: string) {
  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from('service_requests')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as StoredServiceRequestRow | null) ?? null
}

async function updateServiceRequestRow(requestId: string, patch: Partial<StoredServiceRequestRow>) {
  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from('service_requests')
    .update(patch)
    .eq('id', requestId)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return normalizeServiceRequestRow(data as StoredServiceRequestRow)
}

async function resolveStripePrice(
  serviceId: string,
  expectedUnitAmountCents: number,
  stripe: Stripe,
) {
  const service = findServiceById(serviceId)

  if (!service) {
    throw new Error('The selected service could not be found.')
  }

  const priceId = getConfiguredStripePriceId(service)

  if (!priceId) {
    throw new Error('Online checkout for this service is not configured yet.')
  }

  const price = await stripe.prices.retrieve(priceId)

  if (price.deleted || !price.active) {
    throw new Error('This Stripe price is not active.')
  }

  if (price.currency !== 'usd') {
    throw new Error('Stripe pricing must use USD for instant checkout services.')
  }

  if (price.type !== 'one_time') {
    throw new Error('Stripe pricing must be configured as a one-time price.')
  }

  if (price.unit_amount !== expectedUnitAmountCents) {
    throw new Error('The Stripe price does not match the configured service rate.')
  }

  return priceId
}

async function createServiceRequestCheckoutSession(
  request: ServiceRequestRecord,
  serviceId: string,
  roundedBoatLengthFeet: number,
) {
  const service = findServiceById(serviceId)

  if (!service) {
    throw new Error('The selected service could not be found.')
  }

  if (service.paymentType !== 'instant_checkout') {
    throw new Error('This service is not eligible for instant checkout.')
  }

  const stripe = getStripeClient()
  const expectedUnitAmountCents = service.pricePerFootCents || service.flatPriceCents || 0
  const priceId = await resolveStripePrice(service.id, expectedUnitAmountCents, stripe)
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    // NSN currently does not enable Stripe Tax automatically. Do not enable automatic_tax unless NSN has confirmed tax registration/compliance requirements.
    automatic_tax: { enabled: false },
    payment_method_types: ['card'],
    client_reference_id: request.id,
    customer_email: request.customerEmail,
    success_url: getSuccessUrl(request.id),
    cancel_url: getCancelUrl(request.selectedServiceId),
    line_items: [
      {
        price: priceId,
        quantity: roundedBoatLengthFeet,
      },
    ],
    metadata: {
      requestId: request.id,
      requestKind: request.requestKind,
      serviceId: service.id,
      serviceName: service.name,
      boatLengthFeet: String(roundedBoatLengthFeet),
      customerName: request.customerName,
      customerEmail: request.customerEmail,
      requestedDateTime: request.requestedDateTime || '',
      agreementPolicyVersion: request.agreementPolicyVersion || '',
    },
    payment_intent_data: {
      capture_method: 'manual',
      metadata: {
        requestId: request.id,
        requestKind: request.requestKind,
        serviceId: service.id,
        serviceName: service.name,
        boatLengthFeet: String(roundedBoatLengthFeet),
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        requestedDateTime: request.requestedDateTime || '',
        agreementPolicyVersion: request.agreementPolicyVersion || '',
      },
    },
  })

  const checkoutUrl = session.url

  if (!checkoutUrl) {
    throw new Error('Stripe did not return a checkout URL.')
  }

  return {
    id: session.id,
    url: checkoutUrl,
  }
}

async function createQuotedServiceRequestCheckoutSession(
  request: ServiceRequestRecord,
  amountCents: number,
) {
  const stripe = getStripeClient()
  const serviceName = request.selectedServiceName || 'North Shore Nautical service'
  const metadata = {
    checkoutKind: 'service_request_quote',
    requestId: request.id,
    requestKind: 'booking',
    serviceId: request.selectedServiceId || '',
    serviceName,
    quotedAmountCents: String(amountCents),
    customerName: request.customerName,
    customerEmail: request.customerEmail,
    requestedDateTime: request.requestedDateTime || '',
    agreementPolicyVersion: request.agreementPolicyVersion || '',
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    // NSN currently does not enable Stripe Tax automatically. Do not enable automatic_tax unless NSN has confirmed tax registration/compliance requirements.
    automatic_tax: { enabled: false },
    payment_method_types: ['card'],
    client_reference_id: request.id,
    customer_email: request.customerEmail,
    success_url: getSuccessUrl(request.id),
    cancel_url: getCancelUrl(request.selectedServiceId),
    metadata,
    payment_intent_data: {
      metadata,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: {
            name: serviceName,
            description: 'Approved North Shore Nautical service request',
            metadata: {
              requestId: request.id,
              serviceId: request.selectedServiceId || '',
            },
          },
        },
      },
    ],
  })

  const checkoutUrl = session.url

  if (!checkoutUrl) {
    throw new Error('Stripe did not return a checkout URL.')
  }

  return {
    id: session.id,
    url: checkoutUrl,
  }
}

function getStoredRequestIdFromMetadata(
  metadata: Record<string, string> | null | undefined,
  fallbackId = '',
) {
  const requestId = metadata?.requestId?.trim()
  return requestId || fallbackId.trim()
}

export async function createPublicServiceRequest(input: PublicServiceRequestInput) {
  const service = input.selectedServiceId ? findServiceById(input.selectedServiceId) : null

  if (!service && !input.notSureWhatINeed) {
    throw new Error('Choose a service or select "Not sure what I need."')
  }

  const roundedBoatLengthFeet =
    typeof input.boatLengthFeet === 'number' ? roundBoatLengthFeet(input.boatLengthFeet) : null

  if (service?.requiresBoatLength && !roundedBoatLengthFeet) {
    throw new Error('Boat length is required for the selected service.')
  }

  if (service?.requiresBoatLength && roundedBoatLengthFeet && roundedBoatLengthFeet < minimumBoatLengthFeet) {
    throw new Error(`Boat length must be at least ${minimumBoatLengthFeet} feet.`)
  }

  const quoteTriggerReasons = buildQuoteTriggerReasons(input, roundedBoatLengthFeet)
  const shouldRouteToInquiry =
    input.submissionIntent === 'inquiry' ||
    quoteTriggerReasons.length > 0 ||
    !service ||
    service.paymentType !== 'instant_checkout'

  const requestedDateTime = parseRequestedDateTimeLocal(input.requestedDateTimeLocal).toISOString()
  const calculatedPriceCents =
    !shouldRouteToInquiry && service && roundedBoatLengthFeet
      ? calculateServicePriceCents(service, roundedBoatLengthFeet)
      : null
  const request = await insertServiceRequest({
    request_kind: shouldRouteToInquiry ? 'inquiry' : 'booking',
    booking_status: shouldRouteToInquiry ? 'pending_review' : 'draft',
    payment_status: 'not_started',
    source: 'public_site',
    selected_service_id: service?.id || null,
    selected_service_name: service?.name || 'Not sure what I need',
    selected_service_category: service?.category || null,
    payment_type: service?.paymentType || 'quote_only',
    quote_only: shouldRouteToInquiry,
    quote_trigger_reasons: quoteTriggerReasons,
    selected_add_ons: [],
    boat_length_feet: input.boatLengthFeet ?? null,
    boat_length_rounded: roundedBoatLengthFeet,
    calculated_price_cents: calculatedPriceCents,
    currency: 'usd',
    requested_date_time: requestedDateTime,
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    boat_make_model_year: input.boatMakeModelYear || null,
    boat_location_marina: input.boatLocationMarina || null,
    customer_notes: input.customerNotes || null,
    agreement_accepted: true,
    agreement_accepted_at: new Date().toISOString(),
    agreement_policy_version: input.agreementPolicyVersion,
    stripe_checkout_session_id: null,
    stripe_payment_intent_id: null,
    stripe_charge_id: null,
    payment_authorized_at: null,
    payment_captured_at: null,
    payment_canceled_at: null,
    refunded_at: null,
    admin_notes: null,
    last_customer_email_type: null,
    last_customer_email_sent_at: null,
    last_internal_email_type: null,
    last_internal_email_sent_at: null,
  })

  if (shouldRouteToInquiry || !service || !roundedBoatLengthFeet) {
    return {
      kind: 'inquiry' as const,
      request,
    }
  }

  const checkoutSession = await createServiceRequestCheckoutSession(
    request,
    service.id,
    roundedBoatLengthFeet,
  )
  const updatedRequest = await updateServiceRequestRow(request.id, {
    stripe_checkout_session_id: checkoutSession.id,
  })

  return {
    kind: 'checkout' as const,
    request: updatedRequest,
    checkoutUrl: checkoutSession.url,
  }
}

export async function readServiceRequestById(requestId: string) {
  const row = await readStoredServiceRequestById(requestId)
  return row ? normalizeServiceRequestRow(row) : null
}

export async function readPublicServiceRequestConfirmation(requestId: string, sessionId = '') {
  let request = await readServiceRequestById(requestId)

  if (!request) {
    return null
  }

  if (sessionId) {
    if (request.stripeCheckoutSessionId && request.stripeCheckoutSessionId !== sessionId) {
      throw new Error('The confirmation session did not match this request.')
    }

    if (request.bookingStatus === 'draft' || request.paymentStatus === 'not_started') {
      request = await syncServiceRequestAuthorizationFromSessionId(sessionId)
    }
  }

  return request
}

export async function listAdminServiceRequests() {
  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from('service_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return ((data as StoredServiceRequestRow[] | null) || []).map((row) =>
    normalizeServiceRequestRow(row),
  )
}

export async function createServiceRequestPaymentLink(
  requestId: string,
  amountCents: number,
  adminNotes = '',
) {
  const request = await readServiceRequestById(requestId)

  if (!request) {
    throw new Error('That request could not be found.')
  }

  if (['completed', 'declined', 'canceled', 'refunded'].includes(request.bookingStatus)) {
    throw new Error('This request can no longer be accepted for payment.')
  }

  if (request.paymentStatus === 'captured') {
    throw new Error('This request has already been charged.')
  }

  if (request.paymentStatus === 'authorized') {
    throw new Error('This request already has a card authorization. Use Approve & Capture Payment instead.')
  }

  if (!Number.isInteger(amountCents) || amountCents < 100) {
    throw new Error('Enter a quote amount of at least $1.')
  }

  const checkoutSession = await createQuotedServiceRequestCheckoutSession(request, amountCents)
  const updatedRequest = await updateServiceRequestRow(request.id, {
    request_kind: 'booking',
    booking_status: 'pending_review',
    payment_status: 'not_started',
    calculated_price_cents: amountCents,
    stripe_checkout_session_id: checkoutSession.id,
    stripe_payment_intent_id: null,
    stripe_charge_id: null,
    payment_authorized_at: null,
    payment_captured_at: null,
    payment_canceled_at: null,
    admin_notes: adminNotes || request.adminNotes || null,
  })

  return {
    request: updatedRequest,
    checkoutUrl: checkoutSession.url,
  }
}

export async function markCustomerEmailSent(requestId: string, emailType: CustomerEmailType) {
  return updateServiceRequestRow(requestId, {
    last_customer_email_type: emailType,
    last_customer_email_sent_at: new Date().toISOString(),
  })
}

export async function markInternalEmailSent(requestId: string, emailType: InternalEmailType) {
  return updateServiceRequestRow(requestId, {
    last_internal_email_type: emailType,
    last_internal_email_sent_at: new Date().toISOString(),
  })
}

export async function requestServiceChanges(requestId: string, adminNotes = '') {
  const request = await readServiceRequestById(requestId)

  if (!request) {
    throw new Error('That request could not be found.')
  }

  if (['completed', 'declined', 'refunded'].includes(request.bookingStatus)) {
    throw new Error('This request can no longer be moved into changes requested.')
  }

  return updateServiceRequestRow(requestId, {
    booking_status: 'changes_requested',
    admin_notes: adminNotes || request.adminNotes || null,
  })
}

export async function cancelServiceRequest(requestId: string, adminNotes = '') {
  const request = await readServiceRequestById(requestId)

  if (!request) {
    throw new Error('That request could not be found.')
  }

  if (request.bookingStatus === 'refunded') {
    throw new Error('Refunded requests cannot be marked canceled.')
  }

  return updateServiceRequestRow(requestId, {
    booking_status: 'canceled',
    admin_notes: adminNotes || request.adminNotes || null,
  })
}

export async function completeServiceRequest(requestId: string, adminNotes = '') {
  const request = await readServiceRequestById(requestId)

  if (!request) {
    throw new Error('That request could not be found.')
  }

  if (['declined', 'refunded'].includes(request.bookingStatus)) {
    throw new Error('This request cannot be marked completed.')
  }

  return updateServiceRequestRow(requestId, {
    booking_status: 'completed',
    admin_notes: adminNotes || request.adminNotes || null,
  })
}

export async function declineServiceRequest(requestId: string, adminNotes = '') {
  const request = await readServiceRequestById(requestId)

  if (!request) {
    throw new Error('That request could not be found.')
  }

  if (request.stripePaymentIntentId && request.paymentStatus === 'authorized') {
    const stripe = getStripeClient()
    const canceledPaymentIntent = await stripe.paymentIntents.cancel(request.stripePaymentIntentId, {
      cancellation_reason: 'abandoned',
    })

    return syncServiceRequestCancellationFromPaymentIntent(canceledPaymentIntent, adminNotes)
  }

  return updateServiceRequestRow(requestId, {
    booking_status: 'declined',
    payment_status: request.paymentStatus === 'captured' ? request.paymentStatus : 'canceled',
    payment_canceled_at: request.paymentStatus === 'captured' ? request.paymentCanceledAt : new Date().toISOString(),
    admin_notes: adminNotes || request.adminNotes || null,
  })
}

export async function captureAuthorizedServiceRequest(requestId: string, adminNotes = '') {
  const request = await readServiceRequestById(requestId)

  if (!request) {
    throw new Error('That request could not be found.')
  }

  if (!request.stripePaymentIntentId) {
    throw new Error('There is no Stripe authorization on file for this request.')
  }

  if (request.paymentStatus === 'captured') {
    return adminNotes
      ? updateServiceRequestRow(requestId, { admin_notes: adminNotes || request.adminNotes || null })
      : request
  }

  if (request.paymentStatus !== 'authorized') {
    throw new Error('Only authorized requests can be captured.')
  }

  const stripe = getStripeClient()
  const paymentIntent = await stripe.paymentIntents.capture(request.stripePaymentIntentId)
  return syncServiceRequestCaptureFromPaymentIntent(paymentIntent, adminNotes)
}

export async function syncServiceRequestAuthorizationFromSessionId(checkoutSessionId: string) {
  const stripe = getStripeClient()
  const session = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
    expand: ['payment_intent'],
  })

  return syncServiceRequestAuthorizationFromCheckoutSession(session)
}

export async function syncServiceRequestAuthorizationFromCheckoutSession(
  session: Stripe.Checkout.Session,
) {
  const requestId = getStoredRequestIdFromMetadata(session.metadata, session.client_reference_id || '')
  const checkoutSessionId = session.id
  const storedRequest =
    (requestId ? await readStoredServiceRequestById(requestId) : null) ||
    (await readStoredServiceRequestByCheckoutSessionId(checkoutSessionId))

  if (!storedRequest) {
    throw new Error('The corresponding service request could not be located for this checkout session.')
  }

  const existingRequest = normalizeServiceRequestRow(storedRequest)
  let paymentIntent: Stripe.PaymentIntent | null = null

  if (typeof session.payment_intent === 'string') {
    const stripe = getStripeClient()
    paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent)
  } else if (session.payment_intent && !('deleted' in session.payment_intent)) {
    paymentIntent = session.payment_intent
  }

  const patch: Partial<StoredServiceRequestRow> = {
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntent?.id || existingRequest.stripePaymentIntentId,
    stripe_charge_id: getLatestChargeId(paymentIntent) || existingRequest.stripeChargeId,
  }
  const quotedAmountCents = getQuotedAmountCentsFromMetadata(session.metadata)

  if (quotedAmountCents) {
    patch.calculated_price_cents = quotedAmountCents
  }

  if (
    paymentIntent &&
    (paymentIntent.status === 'requires_capture' || paymentIntent.amount_capturable > 0) &&
    canMoveToAuthorized(existingRequest)
  ) {
    patch.booking_status = ['confirmed', 'completed', 'canceled', 'declined', 'refunded'].includes(
      existingRequest.bookingStatus,
    )
      ? existingRequest.bookingStatus
      : 'pending_review'
    patch.payment_status = 'authorized'
    patch.payment_authorized_at = existingRequest.paymentAuthorizedAt || new Date().toISOString()
  }

  if (paymentIntent?.status === 'succeeded') {
    await updateServiceRequestRow(existingRequest.id, patch)
    return syncServiceRequestCaptureFromPaymentIntent(paymentIntent, existingRequest.adminNotes || '')
  }

  return updateServiceRequestRow(existingRequest.id, patch)
}

export async function syncServiceRequestAuthorizationFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
) {
  const requestId = getStoredRequestIdFromMetadata(paymentIntent.metadata, '')
  const storedRequest =
    (requestId ? await readStoredServiceRequestById(requestId) : null) ||
    (await readStoredServiceRequestByPaymentIntentId(paymentIntent.id))

  if (!storedRequest) {
    return null
  }

  const request = normalizeServiceRequestRow(storedRequest)

  if (paymentIntent.status === 'requires_capture' || paymentIntent.amount_capturable > 0) {
    return updateServiceRequestRow(request.id, {
      stripe_payment_intent_id: paymentIntent.id,
      stripe_charge_id: getLatestChargeId(paymentIntent) || request.stripeChargeId,
      booking_status: ['confirmed', 'completed', 'canceled', 'declined', 'refunded'].includes(
        request.bookingStatus,
      )
        ? request.bookingStatus
        : 'pending_review',
      payment_status: canMoveToAuthorized(request) ? 'authorized' : request.paymentStatus,
      payment_authorized_at: request.paymentAuthorizedAt || new Date().toISOString(),
    })
  }

  if (paymentIntent.status === 'succeeded') {
    return syncServiceRequestCaptureFromPaymentIntent(paymentIntent)
  }

  if (paymentIntent.status === 'canceled') {
    return syncServiceRequestCancellationFromPaymentIntent(paymentIntent)
  }

  return request
}

export async function syncServiceRequestCaptureFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
  adminNotes = '',
) {
  const requestId = getStoredRequestIdFromMetadata(paymentIntent.metadata, '')
  const storedRequest =
    (requestId ? await readStoredServiceRequestById(requestId) : null) ||
    (await readStoredServiceRequestByPaymentIntentId(paymentIntent.id))

  if (!storedRequest) {
    throw new Error('The corresponding service request could not be located for this payment.')
  }

  const request = normalizeServiceRequestRow(storedRequest)

  return updateServiceRequestRow(request.id, {
    stripe_payment_intent_id: paymentIntent.id,
    stripe_charge_id: getLatestChargeId(paymentIntent) || request.stripeChargeId,
    booking_status: ['completed', 'canceled', 'declined', 'refunded'].includes(request.bookingStatus)
      ? request.bookingStatus
      : 'confirmed',
    payment_status: canMoveToCaptured(request) ? 'captured' : request.paymentStatus,
    payment_captured_at: request.paymentCapturedAt || new Date().toISOString(),
    calculated_price_cents:
      getQuotedAmountCentsFromMetadata(paymentIntent.metadata) || request.calculatedPriceCents,
    admin_notes: adminNotes || request.adminNotes || null,
  })
}

export async function syncServiceRequestCancellationFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
  adminNotes = '',
) {
  const requestId = getStoredRequestIdFromMetadata(paymentIntent.metadata, '')
  const storedRequest =
    (requestId ? await readStoredServiceRequestById(requestId) : null) ||
    (await readStoredServiceRequestByPaymentIntentId(paymentIntent.id))

  if (!storedRequest) {
    throw new Error('The corresponding service request could not be located for this payment.')
  }

  const request = normalizeServiceRequestRow(storedRequest)

  return updateServiceRequestRow(request.id, {
    stripe_payment_intent_id: paymentIntent.id,
    booking_status: ['confirmed', 'completed', 'refunded'].includes(request.bookingStatus)
      ? request.bookingStatus
      : 'declined',
    payment_status: canMoveToCanceled(request) ? 'canceled' : request.paymentStatus,
    payment_canceled_at: request.paymentCanceledAt || new Date().toISOString(),
    admin_notes: adminNotes || request.adminNotes || null,
  })
}

export async function syncServiceRequestRefundFromCharge(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id || ''

  if (!paymentIntentId) {
    return null
  }

  const storedRequest = await readStoredServiceRequestByPaymentIntentId(paymentIntentId)

  if (!storedRequest) {
    return null
  }

  const request = normalizeServiceRequestRow(storedRequest)

  return updateServiceRequestRow(request.id, {
    stripe_charge_id: charge.id,
    booking_status: 'refunded',
    payment_status: 'refunded',
    refunded_at: request.refundedAt || new Date().toISOString(),
  })
}
