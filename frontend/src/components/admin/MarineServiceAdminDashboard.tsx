import { useEffect, useMemo, useState } from 'react'

import {
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Copy,
  CreditCard,
  LoaderCircle,
  LogOut,
  Mail,
  Phone,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react'

import { FadeIn } from '../ui/FadeIn'
import {
  adminApiRequest,
  destroyAccountSession,
  type AccountSession,
} from '../../lib/adminSession'
import { trackEvent } from '../../lib/analytics'
import { formatCurrency } from '../../lib/servicePricing'
import type { AdminServiceRequest, AdminServiceRequestsResponse } from '../../types/service'

type MarineServiceAdminDashboardProps = {
  accountSession: AccountSession
  onSignedOut: () => void
}

type AdminActionResponse = {
  request?: AdminServiceRequest
  checkoutUrl?: string
  message?: string
}

const bookingStatusOptions = [
  'all',
  'pending_review',
  'changes_requested',
  'confirmed',
  'completed',
  'declined',
  'canceled',
  'refunded',
  'draft',
  'failed_payment',
] as const

const paymentStatusOptions = [
  'all',
  'not_started',
  'authorized',
  'captured',
  'canceled',
  'refunded',
  'failed',
] as const

const requestKindOptions = ['all', 'booking', 'inquiry'] as const

function statusClasses(status: string) {
  if (['declined', 'canceled', 'failed', 'failed_payment', 'refunded'].includes(status)) {
    return 'status-pill-failed'
  }

  if (['authorized', 'confirmed', 'completed'].includes(status)) {
    return 'status-pill-active'
  }

  return 'status-pill-neutral'
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return 'Not set'
  }

  return value.replaceAll('_', ' ')
}

function requestSummary(request: AdminServiceRequest) {
  if (request.requestKind === 'inquiry') {
    return 'Inquiry review'
  }

  if (request.paymentStatus === 'authorized') {
    return 'Authorized and pending review'
  }

  if (request.paymentStatus === 'captured') {
    return 'Approved and captured'
  }

  return 'Request in progress'
}

function canRequestChanges(request: AdminServiceRequest) {
  return !['completed', 'declined', 'refunded'].includes(request.bookingStatus)
}

function canDecline(request: AdminServiceRequest) {
  return !['completed', 'declined', 'refunded'].includes(request.bookingStatus)
}

function canCancel(request: AdminServiceRequest) {
  return !['completed', 'declined', 'canceled', 'refunded'].includes(request.bookingStatus)
}

function canCreatePaymentLink(request: AdminServiceRequest) {
  return (
    !['completed', 'declined', 'canceled', 'refunded'].includes(request.bookingStatus) &&
    !['authorized', 'captured', 'refunded'].includes(request.paymentStatus)
  )
}

async function copyToClipboard(value: string) {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    return false
  }

  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}

export function MarineServiceAdminDashboard({
  accountSession,
  onSignedOut,
}: MarineServiceAdminDashboardProps) {
  const [requests, setRequests] = useState<AdminServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedRequestId, setSelectedRequestId] = useState('')
  const [bookingStatusFilter, setBookingStatusFilter] =
    useState<(typeof bookingStatusOptions)[number]>('all')
  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState<(typeof paymentStatusOptions)[number]>('all')
  const [requestKindFilter, setRequestKindFilter] =
    useState<(typeof requestKindOptions)[number]>('all')
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({})
  const [quoteAmountDrafts, setQuoteAmountDrafts] = useState<Record<string, string>>({})
  const [actionState, setActionState] = useState<'idle' | 'submitting'>('idle')
  const [copiedField, setCopiedField] = useState('')
  const [paymentLinkUrl, setPaymentLinkUrl] = useState('')

  async function loadRequests(showRefreshingState = false) {
    if (showRefreshingState) {
      setRefreshing(true)
    }

    const response = await adminApiRequest<AdminServiceRequestsResponse>(
      '/api/admin/service-requests',
    )

    if (showRefreshingState) {
      setRefreshing(false)
    }

    setLoading(false)

    if (!response.ok) {
      setMessage(response.payload.message || 'We could not load service requests right now.')
      return
    }

    const nextRequests = response.payload.requests || []
    setRequests(nextRequests)
    setMessage('')
    setSelectedRequestId((current) =>
      nextRequests.some((request) => request.id === current) ? current : nextRequests[0]?.id || '',
    )
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRequests()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  const filteredRequests = useMemo(
    () =>
      requests.filter((request) => {
        if (bookingStatusFilter !== 'all' && request.bookingStatus !== bookingStatusFilter) {
          return false
        }

        if (paymentStatusFilter !== 'all' && request.paymentStatus !== paymentStatusFilter) {
          return false
        }

        if (requestKindFilter !== 'all' && request.requestKind !== requestKindFilter) {
          return false
        }

        return true
      }),
    [bookingStatusFilter, paymentStatusFilter, requestKindFilter, requests],
  )

  const effectiveSelectedRequestId = filteredRequests.some(
    (request) => request.id === selectedRequestId,
  )
    ? selectedRequestId
    : filteredRequests[0]?.id || ''

  const selectedRequest =
    filteredRequests.find((request) => request.id === effectiveSelectedRequestId) ||
    filteredRequests[0] ||
    null

  const adminNotes = selectedRequest
    ? notesDrafts[selectedRequest.id] ?? selectedRequest.adminNotes ?? ''
    : ''
  const quoteAmountDraft = selectedRequest
    ? quoteAmountDrafts[selectedRequest.id] ??
      (typeof selectedRequest.calculatedPriceCents === 'number'
        ? (selectedRequest.calculatedPriceCents / 100).toFixed(2)
        : '')
    : ''

  async function handleSignOut() {
    await destroyAccountSession()
    onSignedOut()
  }

  async function handleCopy(value: string, key: string) {
    if (!value) {
      return
    }

    const didCopy = await copyToClipboard(value)

    if (didCopy) {
        setCopiedField(key)
        window.setTimeout(() => setCopiedField((current) => (current === key ? '' : current)), 1500)
    }
  }

  async function handleAction(
    path: string,
    successMessage: string,
    eventName = '',
  ) {
    if (!selectedRequest) {
      return
    }

    setActionState('submitting')
    setMessage('')
    setPaymentLinkUrl('')

    const response = await adminApiRequest<AdminActionResponse>(path, {
      method: 'POST',
      body: JSON.stringify({
        adminNotes,
      }),
    })

    setActionState('idle')

    if (!response.ok || !response.payload.request) {
      setMessage(response.payload.message || 'We could not update that request right now.')
      return
    }

    const updatedRequest = response.payload.request
    setRequests((current) =>
      current.map((request) => (request.id === updatedRequest.id ? updatedRequest : request)),
    )
    setNotesDrafts((current) => ({
      ...current,
      [updatedRequest.id]: updatedRequest.adminNotes || '',
    }))
    setSelectedRequestId(updatedRequest.id)
    setMessage(response.payload.message || successMessage)

    if (eventName) {
      trackEvent(eventName, {
        requestId: updatedRequest.id,
        bookingStatus: updatedRequest.bookingStatus,
        paymentStatus: updatedRequest.paymentStatus,
      })
    }
  }

  async function handlePaymentLinkAction() {
    if (!selectedRequest) {
      return
    }

    const quoteAmount = Number(quoteAmountDraft)

    if (!Number.isFinite(quoteAmount) || quoteAmount <= 0) {
      setMessage('Enter the accepted quote amount before sending a payment link.')
      return
    }

    setActionState('submitting')
    setMessage('')
    setPaymentLinkUrl('')

    const response = await adminApiRequest<AdminActionResponse>(
      `/api/admin/service-requests/${selectedRequest.id}/payment-link`,
      {
        method: 'POST',
        body: JSON.stringify({
          adminNotes,
          amountCents: Math.round(quoteAmount * 100),
        }),
      },
    )

    setActionState('idle')

    if (!response.ok || !response.payload.request) {
      setMessage(response.payload.message || 'We could not create that payment link right now.')
      return
    }

    const updatedRequest = response.payload.request
    setRequests((current) =>
      current.map((request) => (request.id === updatedRequest.id ? updatedRequest : request)),
    )
    setNotesDrafts((current) => ({
      ...current,
      [updatedRequest.id]: updatedRequest.adminNotes || '',
    }))
    setQuoteAmountDrafts((current) => ({
      ...current,
      [updatedRequest.id]: updatedRequest.calculatedPriceCents
        ? (updatedRequest.calculatedPriceCents / 100).toFixed(2)
        : quoteAmountDraft,
    }))
    setSelectedRequestId(updatedRequest.id)
    setPaymentLinkUrl(response.payload.checkoutUrl || '')
    setMessage(response.payload.message || 'Payment link created and sent to the customer.')
    trackEvent('payment_link_sent', {
      requestId: updatedRequest.id,
      bookingStatus: updatedRequest.bookingStatus,
      paymentStatus: updatedRequest.paymentStatus,
    })
  }

  return (
    <div className="grid gap-6">
      <FadeIn className="panel p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-navy/70">
              Signed in as {accountSession.email}
            </p>
            <h2 className="section-title mt-3 text-3xl md:text-4xl">
              Marine care request dashboard
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate">
              Review incoming bookings and inquiries, capture approved authorizations, request changes, and keep status transitions aligned with the public promise.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="button-secondary justify-center"
              disabled={refreshing}
              type="button"
              onClick={() => void loadRequests(true)}
            >
              {refreshing ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Refreshing
                </>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </>
              )}
            </button>
            <button className="button-dark justify-center" type="button" onClick={() => void handleSignOut()}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="soft-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/70">
              Pending Review
            </p>
            <p className="mt-2 font-display text-4xl font-semibold text-ink">
              {
                requests.filter((request) =>
                  ['pending_review', 'changes_requested', 'draft'].includes(request.bookingStatus),
                ).length
              }
            </p>
          </div>
          <div className="soft-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/70">
              Authorized
            </p>
            <p className="mt-2 font-display text-4xl font-semibold text-ink">
              {requests.filter((request) => request.paymentStatus === 'authorized').length}
            </p>
          </div>
          <div className="soft-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/70">
              Confirmed
            </p>
            <p className="mt-2 font-display text-4xl font-semibold text-ink">
              {requests.filter((request) => request.bookingStatus === 'confirmed').length}
            </p>
          </div>
        </div>
      </FadeIn>

      {message ? (
        <FadeIn className="rounded-3xl border border-ink/10 bg-white/82 px-5 py-4 text-sm text-slate">
          {message}
        </FadeIn>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <FadeIn className="panel p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="field-label">
              Booking Status
              <select
                className="input-field"
                value={bookingStatusFilter}
                onChange={(event) =>
                  setBookingStatusFilter(
                    event.target.value as (typeof bookingStatusOptions)[number],
                  )
                }
              >
                {bookingStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All statuses' : formatLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Payment Status
              <select
                className="input-field"
                value={paymentStatusFilter}
                onChange={(event) =>
                  setPaymentStatusFilter(
                    event.target.value as (typeof paymentStatusOptions)[number],
                  )
                }
              >
                {paymentStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All payments' : formatLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Request Type
              <select
                className="input-field"
                value={requestKindFilter}
                onChange={(event) =>
                  setRequestKindFilter(
                    event.target.value as (typeof requestKindOptions)[number],
                  )
                }
              >
                {requestKindOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'Bookings + inquiries' : formatLabel(status)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <div className="mt-8 flex items-center gap-3 rounded-3xl border border-ink/10 bg-white/78 px-5 py-4 text-sm text-slate">
              <LoaderCircle className="h-4 w-4 animate-spin text-lake" />
              Loading service requests...
            </div>
          ) : null}

          {!loading && filteredRequests.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-ink/10 bg-white/78 px-5 py-5 text-sm leading-7 text-slate">
              No requests match the current filters.
            </div>
          ) : null}

          <div className="mt-8 grid gap-4">
            {filteredRequests.map((request, index) => (
              <FadeIn
                key={request.id}
                className={`rounded-3xl border p-5 transition ${
                  selectedRequest?.id === request.id
                    ? 'border-lake bg-lake/10'
                    : 'border-ink/10 bg-white/82 hover:border-lake/35'
                }`}
                delay={index * 0.03}
              >
                <button
                  className="w-full text-left"
                  type="button"
                  onClick={() => setSelectedRequestId(request.id)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-navy/70">
                        {request.requestKind === 'booking' ? 'Booking request' : 'Inquiry'}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-ink">
                        {request.customerName}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-slate">
                        {request.selectedServiceName || 'Service inquiry'}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <span className={`status-pill ${statusClasses(request.bookingStatus)}`}>
                        {formatLabel(request.bookingStatus)}
                      </span>
                      <span className={`status-pill ${statusClasses(request.paymentStatus)}`}>
                        {formatLabel(request.paymentStatus)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm leading-7 text-slate">
                    <p>{requestSummary(request)}</p>
                    <p>{request.requestedDateTimeLabel || 'Requested timing under review'}</p>
                    <p>{formatCurrency(request.calculatedPriceCents)}</p>
                  </div>
                </button>
              </FadeIn>
            ))}
          </div>
        </FadeIn>

        <FadeIn className="panel p-6 md:p-8" delay={0.08}>
          {selectedRequest ? (
            <div className="grid gap-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-navy/70">
                    Selected Request
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold text-ink">
                    {selectedRequest.selectedServiceName || 'Service inquiry'}
                  </h2>
                  <p className="mt-3 text-base leading-8 text-slate">
                    {selectedRequest.customerName} · {selectedRequest.customerEmail}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <span className={`status-pill ${statusClasses(selectedRequest.bookingStatus)}`}>
                    {formatLabel(selectedRequest.bookingStatus)}
                  </span>
                  <span className={`status-pill ${statusClasses(selectedRequest.paymentStatus)}`}>
                    {formatLabel(selectedRequest.paymentStatus)}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="soft-panel p-5">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-lake" />
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-navy/70">
                      Customer
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm leading-7 text-slate">
                    <p className="font-semibold text-ink">{selectedRequest.customerName}</p>
                    <div className="flex items-center justify-between gap-3">
                      <span>{selectedRequest.customerEmail}</span>
                      <button
                        className="button-quiet min-h-0 px-2 py-1 text-xs"
                        type="button"
                        onClick={() =>
                          void handleCopy(selectedRequest.customerEmail, 'customer-email')
                        }
                      >
                        <Copy className="h-4 w-4" />
                        {copiedField === 'customer-email' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>{selectedRequest.customerPhone}</span>
                      <button
                        className="button-quiet min-h-0 px-2 py-1 text-xs"
                        type="button"
                        onClick={() =>
                          void handleCopy(selectedRequest.customerPhone, 'customer-phone')
                        }
                      >
                        <Copy className="h-4 w-4" />
                        {copiedField === 'customer-phone' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="soft-panel p-5">
                  <div className="flex items-center gap-3">
                    <CalendarClock className="h-5 w-5 text-lake" />
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-navy/70">
                      Scheduling
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm leading-7 text-slate">
                    <p>{selectedRequest.requestedDateTimeLabel || 'Timing under review'}</p>
                    <p>
                      Refund window:{' '}
                      <span className="font-semibold text-ink">
                        {formatLabel(selectedRequest.cancellationWindowStatus)}
                      </span>
                    </p>
                    <p>
                      Closes:{' '}
                      <span className="font-semibold text-ink">
                        {selectedRequest.cancellationWindowClosesAtLabel || 'Not scheduled'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="soft-panel p-5">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-lake" />
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-navy/70">
                      Boat + Scope
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm leading-7 text-slate">
                    <p>Boat length: {selectedRequest.boatLengthRounded || 'N/A'} ft</p>
                    <p>Boat details: {selectedRequest.boatMakeModelYear || 'Not provided'}</p>
                    <p>Location: {selectedRequest.boatLocationMarina || 'Not provided'}</p>
                    <p>Quote flags: {selectedRequest.quoteTriggerReasons.join(', ') || 'None'}</p>
                  </div>
                </div>

                <div className="soft-panel p-5">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-lake" />
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-navy/70">
                      Payment + Agreement
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm leading-7 text-slate">
                    <p>Estimated price: {formatCurrency(selectedRequest.calculatedPriceCents)}</p>
                    <p>Agreement version: {selectedRequest.agreementPolicyVersion || 'Not set'}</p>
                    <p>
                      Accepted at:{' '}
                      {selectedRequest.agreementAcceptedAt || 'Not recorded'}
                    </p>
                    <p>Authorized at: {selectedRequest.paymentAuthorizedAt || 'Not yet'}</p>
                    <p>Captured at: {selectedRequest.paymentCapturedAt || 'Not yet'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-ink/10 bg-white/82 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-navy/70">
                  Customer notes
                </p>
                <p className="mt-3 text-sm leading-7 text-slate">
                  {selectedRequest.customerNotes || 'No customer notes provided.'}
                </p>
              </div>

              <div className="rounded-3xl border border-ink/10 bg-white/82 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-navy/70">
                  Internal IDs
                </p>
                <div className="mt-4 grid gap-3 text-sm leading-7 text-slate">
                  {(
                    [
                      ['Request ID', selectedRequest.id, 'request-id'],
                      ['Stripe Checkout Session', selectedRequest.stripeCheckoutSessionId, 'checkout-id'],
                      ['Stripe PaymentIntent', selectedRequest.stripePaymentIntentId, 'payment-intent-id'],
                      ['Stripe Charge', selectedRequest.stripeChargeId, 'charge-id'],
                    ] as Array<[string, string | null, string]>
                  ).map(([label, value, key]) => (
                    <div key={key} className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-ink">{label}</p>
                        <p>{value || 'Not available'}</p>
                      </div>
                      {value ? (
                        <button
                          className="button-quiet min-h-0 self-start px-2 py-1 text-xs"
                          type="button"
                          onClick={() => void handleCopy(value, key)}
                        >
                          <Copy className="h-4 w-4" />
                          {copiedField === key ? 'Copied' : 'Copy'}
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <label className="field-label">
                Admin Notes
                <textarea
                  className="text-area"
                  placeholder="Add internal notes about approval, requested changes, access details, or decline reasoning."
                  value={adminNotes}
                  onChange={(event) =>
                    setNotesDrafts((current) => ({
                      ...current,
                      [selectedRequest.id]: event.target.value,
                    }))
                  }
                />
              </label>

              {canCreatePaymentLink(selectedRequest) ? (
                <div className="rounded-3xl border border-ink/10 bg-white/82 p-5">
                  <label className="field-label">
                    Accepted Quote Amount
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate">
                        $
                      </span>
                      <input
                        className="input-field pl-8"
                        inputMode="decimal"
                        min="1"
                        placeholder="0.00"
                        step="0.01"
                        type="number"
                        value={quoteAmountDraft}
                        onChange={(event) =>
                          setQuoteAmountDrafts((current) => ({
                            ...current,
                            [selectedRequest.id]: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </label>
                  <button
                    className="button-primary mt-4 w-full justify-center"
                    disabled={actionState === 'submitting'}
                    type="button"
                    onClick={() => void handlePaymentLinkAction()}
                  >
                    {actionState === 'submitting' ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Accept & Send Payment Link
                      </>
                    )}
                  </button>

                  {paymentLinkUrl ? (
                    <div className="mt-4 rounded-2xl border border-lake/30 bg-lake/10 px-4 py-4 text-sm leading-7 text-slate">
                      <p className="font-semibold text-ink">Payment link ready</p>
                      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <a
                          className="break-all font-semibold text-ink underline decoration-lake underline-offset-4"
                          href={paymentLinkUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Open secure checkout
                        </a>
                        <button
                          className="button-quiet min-h-0 self-start px-2 py-1 text-xs"
                          type="button"
                          onClick={() => void handleCopy(paymentLinkUrl, 'payment-link')}
                        >
                          <Copy className="h-4 w-4" />
                          {copiedField === 'payment-link' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                {selectedRequest.paymentStatus === 'authorized' ? (
                  <button
                    className="button-primary w-full justify-center"
                    disabled={actionState === 'submitting'}
                    type="button"
                    onClick={() =>
                      void handleAction(
                        `/api/admin/service-requests/${selectedRequest.id}/approve-capture`,
                        'Payment captured and booking confirmed.',
                        'booking_approved',
                      )
                    }
                  >
                    {actionState === 'submitting' ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Approve & Capture Payment
                      </>
                    )}
                  </button>
                ) : null}

                {canRequestChanges(selectedRequest) ? (
                  <button
                    className="button-secondary w-full justify-center"
                    disabled={actionState === 'submitting'}
                    type="button"
                    onClick={() =>
                      void handleAction(
                        `/api/admin/service-requests/${selectedRequest.id}/request-changes`,
                        'Changes requested and customer notification queued.',
                      )
                    }
                  >
                    <CircleAlert className="h-4 w-4" />
                    Request Changes
                  </button>
                ) : null}

                {canDecline(selectedRequest) ? (
                  <button
                    className="button-dark w-full justify-center"
                    disabled={actionState === 'submitting'}
                    type="button"
                    onClick={() =>
                      void handleAction(
                        `/api/admin/service-requests/${selectedRequest.id}/decline`,
                        'Request declined and authorization canceled when applicable.',
                        'booking_declined',
                      )
                    }
                  >
                    <XCircle className="h-4 w-4" />
                    Decline / Cancel Authorization
                  </button>
                ) : null}

                {selectedRequest.bookingStatus === 'confirmed' ? (
                  <button
                    className="button-secondary w-full justify-center"
                    disabled={actionState === 'submitting'}
                    type="button"
                    onClick={() =>
                      void handleAction(
                        `/api/admin/service-requests/${selectedRequest.id}/complete`,
                        'Booking marked complete.',
                        'service_completed',
                      )
                    }
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Mark Completed
                  </button>
                ) : null}

                {canCancel(selectedRequest) ? (
                  <button
                    className="button-secondary w-full justify-center"
                    disabled={actionState === 'submitting'}
                    type="button"
                    onClick={() =>
                      void handleAction(
                        `/api/admin/service-requests/${selectedRequest.id}/cancel`,
                        'Booking marked canceled.',
                      )
                    }
                  >
                    <Phone className="h-4 w-4" />
                    Mark Canceled
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-ink/10 bg-white/78 px-5 py-5 text-sm leading-7 text-slate">
              Select a request from the list to review details and actions.
            </div>
          )}
        </FadeIn>
      </div>
    </div>
  )
}
