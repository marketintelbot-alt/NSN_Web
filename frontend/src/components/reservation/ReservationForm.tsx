import { useCallback, useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarClock, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { useAuth } from '../account/useAuth'
import { launchLocations } from '../../content/site'
import {
  formatReservationDateTime,
  reservationInitialValues,
  reservationSchema,
  reservationWindowMessage,
  type ReservationFormValues,
} from '../../lib/reservation'
import { supabase } from '../../lib/supabase'
import type { SavedBoat } from '../../types/account'

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:4000'

type ApiErrorResponse = {
  message?: string
  fieldErrors?: Partial<Record<keyof ReservationFormValues, string[]>>
}

export function ReservationForm() {
  const { accountsEnabled, session } = useAuth()
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>(
    'idle',
  )
  const [submitMessage, setSubmitMessage] = useState('')
  const [confirmedDateTime, setConfirmedDateTime] = useState('')
  const [savedBoats, setSavedBoats] = useState<SavedBoat[]>([])
  const [boatsLoading, setBoatsLoading] = useState(false)
  const [selectedBoatId, setSelectedBoatId] = useState('')

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: reservationInitialValues,
  })

  const launchLocation = useWatch({
    control,
    name: 'launchLocation',
  })
  const cleaningRequested = useWatch({
    control,
    name: 'cleaningRequested',
  })

  const loadSavedBoats = useCallback(async () => {
    if (!session?.user || !supabase) {
      return
    }

    setBoatsLoading(true)
    const { data } = await supabase
      .from('client_boats')
      .select('*')
      .eq('user_id', session.user.id)
      .order('is_primary', { ascending: false })
      .order('boat_name', { ascending: true })

    setSavedBoats((data ?? []) as SavedBoat[])
    setBoatsLoading(false)
  }, [session])

  useEffect(() => {
    if (!accountsEnabled || !session?.user || !supabase) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void loadSavedBoats()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [accountsEnabled, loadSavedBoats, session])

  async function onSubmit(values: ReservationFormValues) {
    setSubmitStatus('submitting')
    setSubmitMessage('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      const payload = (await response.json()) as ApiErrorResponse

      if (!response.ok) {
        if (payload.fieldErrors) {
          for (const [field, messages] of Object.entries(payload.fieldErrors)) {
            const firstMessage = messages?.[0]

            if (firstMessage) {
              setError(field as keyof ReservationFormValues, {
                type: 'server',
                message: firstMessage,
              })
            }
          }
        }

        setSubmitStatus('error')
        setSubmitMessage(payload.message || 'We were unable to submit your request just now.')
        return
      }

      setConfirmedDateTime(
        formatReservationDateTime(values.requestedLaunchDate, values.requestedLaunchTime),
      )
      setSubmitStatus('success')
      setSubmitMessage(
        'Your launch delivery request has been received. A confirmation email is on its way, and North Shore Nautical will follow up if any timing, launch, or cleaning details need clarification.',
      )
      reset({
        ...reservationInitialValues,
        boatName: selectedBoat?.boat_name || '',
        boatType: selectedBoat?.boat_type || '',
        boatLength: selectedBoat?.boat_length || '',
      })
    } catch {
      setSubmitStatus('error')
      setSubmitMessage(
        'We were unable to submit your request just now. Please try again in a moment or contact us directly for assistance.',
      )
    }
  }

  const fieldHintClass = 'mt-2 text-sm text-[#b43e37]'
  const boatsForCurrentSession = session ? savedBoats : []
  const selectedBoat = session
    ? boatsForCurrentSession.find((boat) => boat.id === selectedBoatId) ??
      boatsForCurrentSession.find((boat) => boat.is_primary) ??
      boatsForCurrentSession[0]
    : undefined
  const hasSavedBoats = boatsForCurrentSession.length > 0

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
      <div className="panel p-6 md:p-8">
        <div className="flex flex-col gap-4 border-b border-ink/10 pb-6">
          <span className="section-label w-fit">Launch Delivery Request</span>
          <h2 className="section-title text-3xl md:text-4xl">Reserve launch delivery</h2>
          <p className="section-copy max-w-none">
            Most reservations are for boats already stored with North Shore Nautical.
            Choose Lloyd Boat Launch or Evanston Boat Launch, let us know whether you
            want pre-launch cleaning, and submit the request at least 24 hours in
            advance.
          </p>
        </div>

        <form className="mt-8 grid gap-6" noValidate onSubmit={handleSubmit(onSubmit)}>
          {accountsEnabled ? (
            <div className="rounded-3xl border border-ink/10 bg-[#f5f9fb] p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">
                    Client account
                  </p>
                  <p className="mt-2 text-base leading-7 text-slate">
                    {session
                      ? 'Signed in. We can pull your saved boat details into this reservation.'
                      : 'Sign in to use your saved boats and avoid re-entering vessel information.'}
                  </p>
                </div>
                <Link className="button-dark" to="/account">
                  {session ? 'Manage Account' : 'Client Login'}
                </Link>
              </div>
            </div>
          ) : null}

          {session && hasSavedBoats ? (
            <div className="grid gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">
                  Select a saved boat
                </p>
                <p className="mt-2 text-sm leading-7 text-slate">
                  Your stored-client boats are ready to use for this launch request.
                </p>
              </div>
              <div className="grid gap-3">
                {boatsForCurrentSession.map((boat) => (
                  <button
                    key={boat.id}
                    className={`rounded-3xl border p-5 text-left transition ${
                      selectedBoatId === boat.id
                        ? 'border-lake bg-lake/10'
                        : 'border-ink/10 bg-white hover:border-lake/40'
                    }`}
                    type="button"
                    onClick={() => setSelectedBoatId(boat.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-ink">{boat.boat_name}</p>
                        <p className="mt-1 text-sm leading-7 text-slate">
                          {boat.boat_type} · {boat.boat_length}
                        </p>
                      </div>
                      {boat.is_primary ? (
                        <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink">
                          Primary
                        </span>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : session && boatsLoading ? (
            <div className="rounded-3xl border border-ink/10 bg-[#f5f9fb] p-5 text-sm text-slate">
              Loading your saved boats...
            </div>
          ) : session ? (
            <div className="rounded-3xl border border-ink/10 bg-[#f5f9fb] p-5 text-sm text-slate">
              You&apos;re signed in, but no boats are saved yet. Add one in your{' '}
              <Link className="font-semibold text-ink" to="/account">
                client account
              </Link>{' '}
              or enter the details below for now.
            </div>
          ) : null}

          {selectedBoat ? (
            <>
              <input
                readOnly
                type="hidden"
                value={selectedBoat.boat_name}
                {...register('boatName')}
              />
              <input
                readOnly
                type="hidden"
                value={selectedBoat.boat_type}
                {...register('boatType')}
              />
              <input
                readOnly
                type="hidden"
                value={selectedBoat.boat_length}
                {...register('boatLength')}
              />
              <div className="rounded-3xl border border-ink/10 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">
                  Boat on file
                </p>
                <p className="mt-3 text-lg font-semibold text-ink">{selectedBoat.boat_name}</p>
                <p className="mt-1 text-sm leading-7 text-slate">
                  {selectedBoat.boat_type} · {selectedBoat.boat_length}
                </p>
              </div>
            </>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Boat Name
                <input className="input-field" {...register('boatName')} />
                {errors.boatName ? (
                  <span className={fieldHintClass}>{errors.boatName.message}</span>
                ) : null}
              </label>

              <label className="grid gap-2 text-sm font-semibold text-ink">
                Boat Type / Model
                <input className="input-field" {...register('boatType')} />
                {errors.boatType ? (
                  <span className={fieldHintClass}>{errors.boatType.message}</span>
                ) : null}
              </label>

              <label className="grid gap-2 text-sm font-semibold text-ink">
                Boat Length
                <input
                  className="input-field"
                  placeholder="Example: 28 ft"
                  {...register('boatLength')}
                />
                {errors.boatLength ? (
                  <span className={fieldHintClass}>{errors.boatLength.message}</span>
                ) : null}
              </label>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Full Name
              <input className="input-field" {...register('fullName')} />
              {errors.fullName ? (
                <span className={fieldHintClass}>{errors.fullName.message}</span>
              ) : null}
            </label>

            <label className="grid gap-2 text-sm font-semibold text-ink">
              Email Address
              <input className="input-field" type="email" {...register('email')} />
              {errors.email ? (
                <span className={fieldHintClass}>{errors.email.message}</span>
              ) : null}
            </label>

            <label className="grid gap-2 text-sm font-semibold text-ink">
              Phone Number
              <input className="input-field" type="tel" {...register('phone')} />
              {errors.phone ? (
                <span className={fieldHintClass}>{errors.phone.message}</span>
              ) : null}
            </label>

            <label className="grid gap-2 text-sm font-semibold text-ink">
              Requested Launch Date
              <input className="input-field" type="date" {...register('requestedLaunchDate')} />
              {errors.requestedLaunchDate ? (
                <span className={fieldHintClass}>
                  {errors.requestedLaunchDate.message}
                </span>
              ) : null}
            </label>

            <label className="grid gap-2 text-sm font-semibold text-ink md:col-span-2">
              Requested Launch Time
              <input className="input-field" type="time" {...register('requestedLaunchTime')} />
              {errors.requestedLaunchTime ? (
                <span className={fieldHintClass}>
                  {errors.requestedLaunchTime.message}
                </span>
              ) : null}
            </label>
          </div>

          <fieldset className="grid gap-3">
            <legend className="text-sm font-semibold text-ink">Launch destination</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {launchLocations.map((location) => (
                <label
                  key={location}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-4 text-sm font-semibold transition ${
                    launchLocation === location
                      ? 'border-lake bg-lake/10 text-ink'
                      : 'border-ink/10 bg-white text-slate'
                  }`}
                >
                  <span>{location}</span>
                  <input
                    className="sr-only"
                    type="radio"
                    value={location}
                    {...register('launchLocation')}
                  />
                  <span
                    className={`h-3 w-3 rounded-full ${
                      launchLocation === location ? 'bg-lake' : 'bg-ink/10'
                    }`}
                  />
                </label>
              ))}
            </div>
            {errors.launchLocation ? (
              <span className={fieldHintClass}>{errors.launchLocation.message}</span>
            ) : null}
          </fieldset>

          <fieldset className="grid gap-3">
            <legend className="text-sm font-semibold text-ink">Would you like cleaning?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Yes, add cleaning', value: 'yes' },
                { label: 'No cleaning needed', value: 'no' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-4 text-sm font-semibold transition ${
                    cleaningRequested === option.value
                      ? 'border-lake bg-lake/10 text-ink'
                      : 'border-ink/10 bg-white text-slate'
                  }`}
                >
                  <span>{option.label}</span>
                  <input
                    className="sr-only"
                    type="radio"
                    value={option.value}
                    {...register('cleaningRequested')}
                  />
                  <span
                    className={`h-3 w-3 rounded-full ${
                      cleaningRequested === option.value ? 'bg-lake' : 'bg-ink/10'
                    }`}
                  />
                </label>
              ))}
            </div>
            {errors.cleaningRequested ? (
              <span className={fieldHintClass}>{errors.cleaningRequested.message}</span>
            ) : null}
          </fieldset>

          <label className="grid gap-2 text-sm font-semibold text-ink">
            Special Instructions
            <textarea
              className="text-area"
              placeholder="Share dock timing notes, handling instructions, or let us know if this boat is not currently stored with North Shore Nautical."
              {...register('specialInstructions')}
            />
            {errors.specialInstructions ? (
              <span className={fieldHintClass}>{errors.specialInstructions.message}</span>
            ) : null}
          </label>

          <label className="sr-only" htmlFor="companyWebsite">
            Leave this field empty
          </label>
          <input
            autoComplete="off"
            className="sr-only"
            id="companyWebsite"
            tabIndex={-1}
            type="text"
            {...register('companyWebsite')}
          />

          <label className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-[#f8fbfc] px-4 py-4 text-sm text-slate">
            <input
              className="mt-1 h-4 w-4 rounded border-ink/20 text-ink focus:ring-lake"
              type="checkbox"
              {...register('policyAcknowledged')}
            />
            <span>
              I understand that launch delivery reservations must be submitted at
              least 24 hours before the requested launch time and that reservation
              submission is subject to scheduling confirmation.
            </span>
          </label>
          {errors.policyAcknowledged ? (
            <span className={fieldHintClass}>{errors.policyAcknowledged.message}</span>
          ) : null}

          {submitStatus === 'error' ? (
            <div
              className="rounded-2xl border border-[#d7b0ac] bg-[#fff7f6] px-4 py-4 text-sm text-[#7f2f29]"
              role="alert"
            >
              {submitMessage || reservationWindowMessage}
            </div>
          ) : null}

          {submitStatus === 'success' ? (
            <div
              className="rounded-2xl border border-[#b8d7ca] bg-[#f4fbf7] px-4 py-4 text-sm text-[#1d5c42]"
              role="status"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold text-[#174731]">Launch delivery request received</p>
                  <p className="mt-1">{submitMessage}</p>
                  {confirmedDateTime ? (
                    <p className="mt-2 font-semibold text-[#174731]">
                      Requested launch: {confirmedDateTime}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <button
            className="button-dark w-full justify-center md:w-fit"
            disabled={submitStatus === 'submitting'}
            type="submit"
          >
            {submitStatus === 'submitting' ? 'Submitting request...' : 'Submit Launch Request'}
          </button>
        </form>
      </div>

      <div className="grid gap-5 self-start">
        <div className="soft-panel p-6">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-lake" />
            <h3 className="text-lg font-semibold text-ink">Scheduling standard</h3>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate">
            Requests inside the 24-hour window are declined automatically so launch
            delivery stays dependable and storage prep can be handled properly.
          </p>
        </div>

        <div className="soft-panel p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-lake" />
            <h3 className="text-lg font-semibold text-ink">Launch options</h3>
          </div>
          <ul className="mt-4 grid gap-3 text-sm leading-7 text-slate">
            <li>Lloyd Boat Launch</li>
            <li>Evanston Boat Launch</li>
            <li>Stored-client coordination reviewed before confirmation</li>
          </ul>
        </div>

        <div className="soft-panel p-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-lake" />
            <h3 className="text-lg font-semibold text-ink">Optional cleaning</h3>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate">
            Add pre-launch cleaning during the request so the boat can be prepared the
            way you want before delivery to the ramp.
          </p>
        </div>
      </div>
    </div>
  )
}
