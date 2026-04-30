import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'

import { AlertCircle, ArrowRight, CalendarClock, CheckCircle2, LoaderCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { FadeIn } from '../ui/FadeIn'
import { apiRequest } from '../../lib/api'
import { trackEvent } from '../../lib/analytics'
import {
  calculateEstimateCents,
  formatCurrency,
  maximumBoatLengthFeet,
  minimumBoatLengthFeet,
  serviceAgreementPolicyVersion,
  shouldRouteToInquiry,
} from '../../lib/servicePricing'
import type {
  CreateServiceRequestResponse,
  PublicServiceCatalogResponse,
  ServiceCatalogItem,
} from '../../types/service'

type MarineServiceRequestFormProps = {
  mode: 'booking' | 'contact'
  presetServiceId?: string
}

type FormState = {
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
  boatLengthFeet: string
  boatMakeModelYear: string
  boatLocationMarina: string
  requestedDateTimeLocal: string
  customerNotes: string
  agreementAccepted: boolean
  companyWebsite: string
}

function emptyFormState(): FormState {
  return {
    selectedServiceId: '',
    notSureWhatINeed: false,
    heavyOxidation: false,
    moldMildew: false,
    severeStaining: false,
    neglectedCondition: false,
    unusualAccessIssue: false,
    majorRestorationNeed: false,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    boatLengthFeet: '',
    boatMakeModelYear: '',
    boatLocationMarina: '',
    requestedDateTimeLocal: '',
    customerNotes: '',
    agreementAccepted: false,
    companyWebsite: '',
  }
}

function parseBoatLength(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function MarineServiceRequestForm({
  mode,
  presetServiceId = '',
}: MarineServiceRequestFormProps) {
  const navigate = useNavigate()
  const [services, setServices] = useState<ServiceCatalogItem[]>([])
  const [form, setForm] = useState<FormState>(emptyFormState())
  const [catalogState, setCatalogState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [submitState, setSubmitState] = useState<'idle' | 'submitting'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadCatalog() {
      const response = await apiRequest<PublicServiceCatalogResponse>('/api/services/catalog')

      if (!isMounted) {
        return
      }

      if (!response.ok) {
        setCatalogState('error')
        setMessage(response.payload.message || 'We could not load the service catalog right now.')
        return
      }

      setServices(response.payload.services)
      setCatalogState('ready')
      setForm((current) => ({
        ...current,
        selectedServiceId:
          current.selectedServiceId || presetServiceId || response.payload.services[0]?.id || '',
      }))
    }

    void loadCatalog()

    return () => {
      isMounted = false
    }
  }, [presetServiceId])

  const selectedService = useMemo(
    () => services.find((service) => service.id === form.selectedServiceId) || null,
    [form.selectedServiceId, services],
  )

  const numericBoatLength = useMemo(() => parseBoatLength(form.boatLengthFeet), [form.boatLengthFeet])
  const routesToInquiry = useMemo(
    () =>
      shouldRouteToInquiry(selectedService, numericBoatLength, {
        notSureWhatINeed: form.notSureWhatINeed,
        heavyOxidation: form.heavyOxidation,
        moldMildew: form.moldMildew,
        severeStaining: form.severeStaining,
        neglectedCondition: form.neglectedCondition,
        unusualAccessIssue: form.unusualAccessIssue,
        majorRestorationNeed: form.majorRestorationNeed,
      }),
    [
      form.heavyOxidation,
      form.majorRestorationNeed,
      form.moldMildew,
      form.neglectedCondition,
      form.notSureWhatINeed,
      form.severeStaining,
      form.unusualAccessIssue,
      numericBoatLength,
      selectedService,
    ],
  )
  const estimatedPriceCents = useMemo(
    () => calculateEstimateCents(selectedService, numericBoatLength),
    [numericBoatLength, selectedService],
  )

  function updateForm<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.currentTarget
    const nextValue =
      event.currentTarget instanceof HTMLInputElement && event.currentTarget.type === 'checkbox'
        ? event.currentTarget.checked
        : value

    updateForm(name as keyof FormState, nextValue as never)
  }

  function handleServiceSelection(serviceId: string) {
    setForm((current) => ({
      ...current,
      selectedServiceId: serviceId,
      notSureWhatINeed: false,
    }))
  }

  function validateBeforeSubmit() {
    if (!form.selectedServiceId && !form.notSureWhatINeed) {
      return 'Choose a service or select “Not sure what I need.”'
    }

    if (!form.customerName.trim()) {
      return 'Please enter your name.'
    }

    if (!form.customerEmail.trim()) {
      return 'Please enter your email address.'
    }

    if (!form.customerPhone.trim()) {
      return 'Please enter your phone number.'
    }

    if (!form.boatLocationMarina.trim()) {
      return 'Please enter the boat location or marina.'
    }

    if (!form.requestedDateTimeLocal.trim()) {
      return 'Please enter your preferred date and time.'
    }

    if (!form.agreementAccepted) {
      return 'Please accept the Service Agreement before submitting.'
    }

    if (selectedService?.requiresBoatLength && numericBoatLength === null) {
      return 'Please enter your boat length in feet.'
    }

    if (
      selectedService?.requiresBoatLength &&
      typeof numericBoatLength === 'number' &&
      numericBoatLength < minimumBoatLengthFeet
    ) {
      return `Boat length must be at least ${minimumBoatLengthFeet} feet.`
    }

    if (
      selectedService?.requiresBoatLength &&
      typeof numericBoatLength === 'number' &&
      numericBoatLength > 200
    ) {
      return 'Please enter a realistic boat length.'
    }

    return ''
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationMessage = validateBeforeSubmit()

    if (validationMessage) {
      setMessage(validationMessage)
      return
    }

    const submissionIntent =
      mode === 'contact' ? 'inquiry' : routesToInquiry ? ('inquiry' as const) : ('checkout' as const)

    setSubmitState('submitting')
    setMessage('')

    if (submissionIntent === 'checkout') {
      trackEvent('checkout_started', {
        serviceId: form.selectedServiceId || 'not_sure',
        mode,
      })
    }

    const response = await apiRequest<CreateServiceRequestResponse>('/api/service-requests', {
      method: 'POST',
      body: JSON.stringify({
        submissionIntent,
        selectedServiceId: form.selectedServiceId,
        notSureWhatINeed: form.notSureWhatINeed,
        heavyOxidation: form.heavyOxidation,
        moldMildew: form.moldMildew,
        severeStaining: form.severeStaining,
        neglectedCondition: form.neglectedCondition,
        unusualAccessIssue: form.unusualAccessIssue,
        majorRestorationNeed: form.majorRestorationNeed,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        boatLengthFeet: form.boatLengthFeet ? Number(form.boatLengthFeet) : '',
        boatMakeModelYear: form.boatMakeModelYear,
        boatLocationMarina: form.boatLocationMarina,
        requestedDateTimeLocal: form.requestedDateTimeLocal,
        customerNotes: form.customerNotes,
        agreementAccepted: form.agreementAccepted,
        agreementPolicyVersion: serviceAgreementPolicyVersion,
        companyWebsite: form.companyWebsite,
      }),
    })

    setSubmitState('idle')

    if (!response.ok) {
      setMessage(response.payload.message || 'We could not submit your request right now.')
      return
    }

    if (response.payload.outcome === 'checkout' && response.payload.checkoutUrl) {
      window.location.assign(response.payload.checkoutUrl)
      return
    }

    if (response.payload.requestId) {
      if (response.payload.outcome === 'inquiry') {
        trackEvent('inquiry_submitted', {
          serviceId: form.selectedServiceId || 'not_sure',
          mode,
        })
      }

      navigate(`/booking/confirmation?request=${response.payload.requestId}`)
      return
    }

    setMessage(response.payload.message || 'Your request has been received.')
  }

  const heading =
    mode === 'booking'
      ? 'Build your request'
      : 'Tell us about your boat, timing, and what kind of help you need.'
  const subheading =
    mode === 'booking'
      ? 'Choose the service first, then add the details we need to review pricing and scheduling properly.'
      : 'This form routes directly to the North Shore Nautical team for review and follow-up.'
  const submitLabel =
    mode === 'contact'
      ? 'Submit Inquiry'
      : routesToInquiry
        ? 'Submit for Review'
        : 'Continue to Secure Checkout'

  return (
    <div className="panel p-6 md:p-8">
      <div className="max-w-3xl">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-navy/70">
          {heading}
        </p>
        <h2 className="mt-3 font-display text-4xl font-semibold text-ink md:text-5xl">{subheading}</h2>
      </div>

      {catalogState === 'loading' ? (
        <div className="mt-8 flex items-center gap-3 rounded-3xl border border-ink/10 bg-[#f8fbf7]/90 px-5 py-4 text-sm text-slate">
          <LoaderCircle className="h-4 w-4 animate-spin text-lake" />
          Loading services and pricing...
        </div>
      ) : null}

      {catalogState === 'error' ? (
        <div className="mt-8 flex items-start gap-3 rounded-3xl border border-[#ead4bf] bg-[#fffaf4] px-5 py-4 text-sm text-[#6e4f38]">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#c88854]" />
          <span>{message}</span>
        </div>
      ) : null}

      {catalogState === 'ready' ? (
        <form className="mt-8 grid gap-8" onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-navy/70">
                  Choose a service
                </p>
                <p className="mt-2 text-sm leading-7 text-slate">
                  Marine care drives the booking flow. Advisory and condition-heavy work route to inquiry review.
                </p>
              </div>
              {mode === 'booking' ? (
                <Link className="button-quiet justify-start md:justify-center" to="/pricing">
                  Compare pricing
                </Link>
              ) : null}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {services.map((service, index) => (
                <FadeIn
                  key={service.id}
                  className={`rounded-3xl border p-5 transition ${
                    form.selectedServiceId === service.id && !form.notSureWhatINeed
                      ? 'border-lake bg-lake/10'
                      : 'border-ink/10 bg-[#f8fbf7]/90 hover:border-lake/35'
                  }`}
                  delay={index * 0.03}
                >
                  <button
                    className="w-full text-left"
                    type="button"
                    onClick={() => handleServiceSelection(service.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-navy/70">
                          {service.categoryLabel}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-ink">{service.name}</h3>
                      </div>
                      <span className="status-pill">{service.pricingLabel}</span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate">{service.description}</p>
                    {service.warningNotes.length > 0 ? (
                      <p className="mt-3 text-xs leading-6 text-slate/90">
                        {service.warningNotes[0]}
                      </p>
                    ) : null}
                  </button>
                </FadeIn>
              ))}

              <div
                className={`rounded-3xl border p-5 transition ${
                  form.notSureWhatINeed
                    ? 'border-lake bg-lake/10'
                    : 'border-dashed border-ink/14 bg-[#f8fbf7]/85 hover:border-lake/35'
                }`}
              >
                <button
                  className="w-full text-left"
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      notSureWhatINeed: true,
                    }))
                  }
                >
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-navy/70">
                    Guided Intake
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-ink">Not sure what I need</h3>
                  <p className="mt-3 text-sm leading-7 text-slate">
                    Tell us about the boat and the condition. We’ll route the request to review instead of checkout.
                  </p>
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="field-label">
                  Name
                  <input
                    className="input-field"
                    name="customerName"
                    placeholder="Full name"
                    type="text"
                    value={form.customerName}
                    onChange={handleInputChange}
                  />
                </label>
                <label className="field-label">
                  Email
                  <input
                    className="input-field"
                    name="customerEmail"
                    placeholder="you@example.com"
                    type="email"
                    value={form.customerEmail}
                    onChange={handleInputChange}
                  />
                </label>
                <label className="field-label">
                  Phone
                  <input
                    className="input-field"
                    name="customerPhone"
                    placeholder="Best number for follow-up"
                    type="tel"
                    value={form.customerPhone}
                    onChange={handleInputChange}
                  />
                </label>
                <label className="field-label">
                  Boat Length (ft)
                  <input
                    className="input-field"
                    inputMode="decimal"
                    max={200}
                    min={1}
                    name="boatLengthFeet"
                    placeholder="For example: 28"
                    step="0.1"
                    type="number"
                    value={form.boatLengthFeet}
                    onChange={handleInputChange}
                  />
                </label>
                <label className="field-label">
                  Boat Make / Model / Year
                  <input
                    className="input-field"
                    name="boatMakeModelYear"
                    placeholder="For example: Sea Ray 280 / 2018"
                    type="text"
                    value={form.boatMakeModelYear}
                    onChange={handleInputChange}
                  />
                </label>
                <label className="field-label">
                  Location / Marina
                  <input
                    className="input-field"
                    name="boatLocationMarina"
                    placeholder="Where the boat will be serviced"
                    type="text"
                    value={form.boatLocationMarina}
                    onChange={handleInputChange}
                  />
                </label>
              </div>

              <div className="rounded-3xl border border-ink/10 bg-[#f8fbf7]/90 p-5 shadow-soft">
                <div className="flex items-start gap-3">
                  <CalendarClock className="mt-1 h-5 w-5 shrink-0 text-lake" />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-navy/70">
                      Preferred Service Window
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate">
                      Pick the date and time that works best. North Shore Nautical reviews timing, marina access, weather, and current workload before confirming.
                    </p>
                  </div>
                </div>
                <label className="field-label mt-4">
                  Requested Date & Time
                  <input
                    className="input-field"
                    name="requestedDateTimeLocal"
                    type="datetime-local"
                    value={form.requestedDateTimeLocal}
                    onChange={handleInputChange}
                  />
                </label>
              </div>

              <div className="rounded-3xl border border-ink/10 bg-[#f8fbf7]/90 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-navy/70">
                  Condition flags
                </p>
                <p className="mt-2 text-sm leading-7 text-slate">
                  These route heavier-condition projects into quote review instead of instant checkout. Boat condition can also change the final price after review.
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {[
                    ['heavyOxidation', 'Heavy oxidation'],
                    ['moldMildew', 'Mold / mildew'],
                    ['severeStaining', 'Severe staining'],
                    ['neglectedCondition', 'Neglected condition'],
                    ['unusualAccessIssue', 'Unusual access issue'],
                    ['majorRestorationNeed', 'Major restoration need'],
                  ].map(([name, label]) => (
                    <label
                      key={name}
                      className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-[#f8fbf7] px-4 py-3 text-sm text-ink"
                    >
                      <input
                        checked={Boolean(form[name as keyof FormState])}
                        name={name}
                        type="checkbox"
                        onChange={handleInputChange}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="field-label">
                Notes
                <textarea
                  className="text-area"
                  name="customerNotes"
                  placeholder="Tell us anything helpful about the boat, access, current condition, or what you are hoping to improve."
                  value={form.customerNotes}
                  onChange={handleInputChange}
                />
              </label>
            </div>

            <div className="grid gap-4 self-start">
              <div className="soft-panel p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-navy/70">
                  Submission path
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-ink">
                  {mode === 'contact'
                    ? 'Inquiry review'
                    : routesToInquiry
                      ? 'Quote and review'
                      : 'Secure checkout'}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate">
                  {mode === 'contact'
                    ? 'This form always routes to inquiry review so the team can respond directly.'
                    : routesToInquiry
                      ? 'This request needs manual review before any payment capture or confirmation.'
                      : 'You will see the estimate first, then continue to Stripe for card authorization.'}
                </p>
              </div>

              {mode === 'booking' ? (
                <div className="panel p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-navy/70">
                    Estimated price
                  </p>
                  <p className="mt-3 font-display text-5xl font-semibold text-ink">
                    {routesToInquiry ? 'Review first' : formatCurrency(estimatedPriceCents)}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate">
                    {routesToInquiry
                      ? `Quote-only, condition-heavy, and boats over ${maximumBoatLengthFeet} feet are reviewed manually before pricing is finalized.`
                      : `Boat length is rounded up to the nearest whole foot for checkout. Routine online checkout is designed for boats between ${minimumBoatLengthFeet} and ${maximumBoatLengthFeet} feet, and condition can still affect approval or final pricing.`}
                  </p>
                </div>
              ) : null}

              <label className="flex items-start gap-3 rounded-3xl border border-ink/10 bg-[#f8fbf7]/90 px-4 py-4 text-sm leading-7 text-slate">
                <input
                  checked={form.agreementAccepted}
                  className="mt-1"
                  name="agreementAccepted"
                  type="checkbox"
                  onChange={handleInputChange}
                />
                <span>
                  I agree to North Shore Nautical&apos;s{' '}
                  <Link className="font-semibold text-ink underline" to="/service-agreement">
                    Service Agreement
                  </Link>
                  , Cancellation Policy, Refund Policy, and acknowledge that North Shore Nautical provides marine detailing, care, and advisory services only.
                </span>
              </label>

              {message ? (
                <div className="rounded-3xl border border-[#ead4bf] bg-[#fffaf4] px-5 py-4 text-sm text-[#6e4f38]">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#c88854]" />
                    <span>{message}</span>
                  </div>
                </div>
              ) : null}

              <button
                className="button-primary w-full justify-center"
                disabled={submitState === 'submitting'}
                type="submit"
              >
                {submitState === 'submitting' ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    {submitLabel}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="rounded-3xl border border-ink/10 bg-[#f8fbf7]/90 px-5 py-4 text-sm leading-7 text-slate">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-lake" />
                  <span>
                    North Shore Nautical reviews every request before a service window is considered confirmed.
                  </span>
                </div>
              </div>

              <input
                aria-hidden="true"
                className="hidden"
                name="companyWebsite"
                tabIndex={-1}
                type="text"
                value={form.companyWebsite}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </form>
      ) : null}
    </div>
  )
}
