import { useEffect, useMemo, useState } from 'react'

import { CheckCircle2, CircleAlert, LoaderCircle } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { Seo } from '../components/seo/Seo'
import { FadeIn } from '../components/ui/FadeIn'
import { PageHero } from '../components/ui/PageHero'
import { apiRequest } from '../lib/api'
import { trackEvent } from '../lib/analytics'
import { formatCurrency } from '../lib/servicePricing'
import type { ServiceRequestConfirmation } from '../types/service'

function getConfirmationCopy(request: ServiceRequestConfirmation['request']) {
  if (request.bookingStatus === 'confirmed' && request.paymentStatus === 'captured') {
    return {
      eyebrow: 'Approved',
      title: 'Your appointment has been approved and your payment has been processed.',
      body: 'Your service window is now confirmed. North Shore Nautical will follow up directly if any additional access details are needed.',
      eventName: 'booking_approved',
    }
  }

  if (request.bookingStatus === 'changes_requested') {
    return {
      eyebrow: 'More Information Needed',
      title: 'North Shore Nautical needs a few details before approving this request.',
      body: 'A team member will follow up directly if appointment details need adjustment or more information is required before approval.',
      eventName: '',
    }
  }

  if (
    request.bookingStatus === 'declined' ||
    request.paymentStatus === 'canceled' ||
    request.bookingStatus === 'canceled'
  ) {
    return {
      eyebrow: 'Not Approved',
      title: 'Your appointment request could not be approved at this time.',
      body: 'No payment was captured. North Shore Nautical will follow up directly if another option makes sense.',
      eventName: 'booking_declined',
    }
  }

  if (request.bookingStatus === 'refunded' || request.paymentStatus === 'refunded') {
    return {
      eyebrow: 'Refunded',
      title: 'This request has been refunded.',
      body: 'North Shore Nautical has recorded the request as refunded. A team member will follow up directly if any additional details are needed.',
      eventName: '',
    }
  }

  if (request.bookingStatus === 'completed') {
    return {
      eyebrow: 'Completed',
      title: 'This service request has been marked complete.',
      body: 'Thank you for choosing North Shore Nautical.',
      eventName: 'service_completed',
    }
  }

  if (request.requestKind === 'inquiry' || request.paymentStatus === 'not_started') {
    return {
      eyebrow: 'Inquiry Received',
      title: 'Thanks — your inquiry has been received.',
      body: 'North Shore Nautical will review your details and follow up shortly.',
      eventName: '',
    }
  }

  return {
    eyebrow: 'Pending Review',
    title: 'Your appointment request has been received.',
    body: 'Your payment method has been authorized, but payment will not be captured until North Shore Nautical reviews and approves your request. You will hear from us shortly.',
    eventName: 'authorization_completed',
  }
}

export function ConfirmationPage() {
  const [searchParams] = useSearchParams()
  const requestId = searchParams.get('request') || ''
  const sessionId = searchParams.get('session_id') || ''
  const [request, setRequest] = useState<ServiceRequestConfirmation['request'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadConfirmation() {
      if (!requestId) {
        if (isMounted) {
          setLoading(false)
          setMessage('We could not find a request reference to confirm.')
        }
        return
      }

      const query = new URLSearchParams()

      if (sessionId) {
        query.set('session_id', sessionId)
      }

      const response = await apiRequest<ServiceRequestConfirmation>(
        `/api/service-requests/${requestId}/confirmation${query.toString() ? `?${query.toString()}` : ''}`,
      )

      if (!isMounted) {
        return
      }

      setLoading(false)

      if (!response.ok || !response.payload.request) {
        setMessage(response.payload.message || 'We could not load that request confirmation.')
        return
      }

      setRequest(response.payload.request)
    }

    void loadConfirmation()

    return () => {
      isMounted = false
    }
  }, [requestId, sessionId])

  const confirmationCopy = useMemo(
    () => (request ? getConfirmationCopy(request) : null),
    [request],
  )

  useEffect(() => {
    if (request && confirmationCopy?.eventName) {
      trackEvent(confirmationCopy.eventName, {
        requestId: request.id,
        bookingStatus: request.bookingStatus,
        paymentStatus: request.paymentStatus,
      })
    }
  }, [confirmationCopy?.eventName, request])

  return (
    <>
      <Seo
        title="Request Confirmation"
        description="Review the latest North Shore Nautical request status and payment authorization state."
        path="/booking/confirmation"
        noIndex
      />

      <PageHero
        eyebrow={confirmationCopy?.eyebrow || 'Confirmation'}
        title={confirmationCopy?.title || 'Loading your request confirmation...'}
        description={
          confirmationCopy?.body ||
          'North Shore Nautical is checking the latest request status and payment state.'
        }
      />

      <section className="section-pad">
        <div className="container">
          {loading ? (
            <div className="panel flex items-center gap-3 p-6 text-sm text-slate">
              <LoaderCircle className="h-5 w-5 animate-spin text-lake" />
              Loading the latest request details...
            </div>
          ) : null}

          {!loading && message ? (
            <FadeIn className="rounded-3xl border border-[#ead4bf] bg-[#fffaf4] px-5 py-4 text-sm text-[#6e4f38]">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#c88854]" />
                <span>{message}</span>
              </div>
            </FadeIn>
          ) : null}

          {!loading && request ? (
            <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
              <FadeIn className="panel p-6 md:p-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-lake" />
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-navy/70">
                      Request Summary
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold text-ink">
                      {request.selectedServiceName || 'Service inquiry'}
                    </h2>
                    <p className="mt-3 text-base leading-8 text-slate">
                      {confirmationCopy?.body}
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-4">
                  <div className="soft-panel p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/70">
                      Customer
                    </p>
                    <p className="mt-2 text-base font-semibold text-ink">{request.customerName}</p>
                  </div>
                  <div className="soft-panel p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/70">
                      Requested Timing
                    </p>
                    <p className="mt-2 text-base font-semibold text-ink">
                      {request.requestedDateTimeLabel || 'Timing to be coordinated directly'}
                    </p>
                  </div>
                  <div className="soft-panel p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/70">
                      Estimated Price
                    </p>
                    <p className="mt-2 text-base font-semibold text-ink">
                      {formatCurrency(request.calculatedPriceCents)}
                    </p>
                  </div>
                </div>
              </FadeIn>

              <FadeIn className="soft-panel p-6 md:p-8" delay={0.08}>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-navy/70">
                  Current Status
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-ink/10 bg-white px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/70">
                      Booking Status
                    </p>
                    <p className="mt-2 text-lg font-semibold capitalize text-ink">
                      {request.bookingStatus.replaceAll('_', ' ')}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-ink/10 bg-white px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/70">
                      Payment Status
                    </p>
                    <p className="mt-2 text-lg font-semibold capitalize text-ink">
                      {request.paymentStatus.replaceAll('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link className="button-primary justify-center" to="/services">
                    Explore Services
                  </Link>
                  <Link className="button-secondary justify-center" to="/contact">
                    Contact North Shore Nautical
                  </Link>
                </div>
              </FadeIn>
            </div>
          ) : null}
        </div>
      </section>
    </>
  )
}
