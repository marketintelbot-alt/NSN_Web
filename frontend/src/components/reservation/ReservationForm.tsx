import { useCallback, useEffect, useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  CalendarClock,
  CheckCircle2,
  LoaderCircle,
  Mail,
  Phone,
  Waves,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'

import {
  formatSlotDate,
  formatSlotDateTime,
  formatSlotTime,
  reservationInitialValues,
  reservationSchema,
  type ReservationFormValues,
} from '../../lib/reservation'
import type { PublicSlot } from '../../types/booking'

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:4000'

type ApiErrorResponse = {
  message?: string
  slot?: PublicSlot
}

type SlotsResponse = {
  slots?: PublicSlot[]
  message?: string
}

export function ReservationForm() {
  const [slots, setSlots] = useState<PublicSlot[]>([])
  const [slotsState, setSlotsState] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading')
  const [slotsMessage, setSlotsMessage] = useState('')
  const [selectedSlotId, setSelectedSlotId] = useState('')
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>(
    'idle',
  )
  const [submitMessage, setSubmitMessage] = useState('')
  const [confirmedSlot, setConfirmedSlot] = useState<PublicSlot | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: reservationInitialValues,
  })

  const replaceSlots = useCallback((nextSlots: PublicSlot[]) => {
    setSlots(nextSlots)
    setSelectedSlotId((current) =>
      nextSlots.some((slot) => slot.id === current) ? current : nextSlots[0]?.id || '',
    )
    setSlotsState(nextSlots.length > 0 ? 'ready' : 'empty')
  }, [])

  const loadSlots = useCallback(
    async (signal?: AbortSignal) => {
      setSlotsState('loading')
      setSlotsMessage('')

      try {
        const response = await fetch(`${apiBaseUrl}/api/booking-slots`, {
          signal,
        })
        const payload = (await response.json().catch(() => ({}))) as SlotsResponse

        if (!response.ok) {
          setSlotsState('error')
          setSlotsMessage(payload.message || 'Unable to load the available time slots right now.')
          return
        }

        replaceSlots(payload.slots ?? [])
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return
        }

        setSlotsState('error')
        setSlotsMessage('Unable to load the available time slots right now.')
      }
    },
    [replaceSlots],
  )

  useEffect(() => {
    const controller = new AbortController()
    const loadTimer = window.setTimeout(() => {
      void loadSlots(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(loadTimer)
      controller.abort()
    }
  }, [loadSlots])

  async function onSubmit(values: ReservationFormValues) {
    if (!selectedSlotId) {
      setError('slotId', {
        type: 'manual',
        message: 'Please choose an available time slot.',
      })
      return
    }

    setSubmitStatus('submitting')
    setSubmitMessage('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          slotId: selectedSlotId,
        }),
      })

      const payload = (await response.json()) as ApiErrorResponse

      if (!response.ok) {
        if (response.status === 409 || response.status === 404) {
          replaceSlots(slots.filter((slot) => slot.id !== selectedSlotId))
        }

        setSubmitStatus('error')
        setSubmitMessage(payload.message || 'We were unable to confirm your booking just now.')
        return
      }

      const confirmed = payload.slot || slots.find((slot) => slot.id === selectedSlotId) || null
      setConfirmedSlot(confirmed)
      setSubmitStatus('success')
      setSubmitMessage(
        'Your time is reserved. If you do not see a confirmation email shortly, your booking is still safely on file with North Shore Nautical.',
      )
      replaceSlots(slots.filter((slot) => slot.id !== selectedSlotId))
      reset(reservationInitialValues)
    } catch {
      setSubmitStatus('error')
      setSubmitMessage(
        'We were unable to confirm your booking just now. Please try again in a moment.',
      )
    }
  }

  const fieldHintClass = 'mt-2 text-sm text-[#b43e37]'
  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) || confirmedSlot
  const groupedSlots = useMemo(() => {
    return slots.reduce<Record<string, PublicSlot[]>>((groups, slot) => {
      const key = formatSlotDate(slot.startsAt)
      groups[key] = [...(groups[key] || []), slot]
      return groups
    }, {})
  }, [slots])

  return (
    <div className="grid gap-8 xl:grid-cols-[1.12fr_0.88fr]">
      <div className="panel p-6 md:p-8">
        <div className="flex flex-col gap-4 border-b border-ink/10 pb-6">
          <span className="section-label w-fit">Available Summer Times</span>
          <h2 className="section-title text-3xl md:text-4xl">
            Choose a time and book it in a minute.
          </h2>
          <p className="section-copy max-w-none">
            Open slots are listed below in real time. Pick the time that works, enter your
            contact details once, and North Shore Nautical will lock it in.
          </p>
        </div>

        <div className="mt-8">
          {slotsState === 'loading' ? (
            <div className="flex items-center gap-3 rounded-3xl border border-ink/10 bg-[#f7fbfc] px-5 py-5 text-sm text-slate">
              <LoaderCircle className="h-4 w-4 animate-spin text-lake" />
              Loading available time slots...
            </div>
          ) : slotsState === 'error' ? (
            <div className="rounded-3xl border border-[#d7b0ac] bg-[#fff7f6] px-5 py-5 text-sm text-[#7f2f29]">
              <p>{slotsMessage}</p>
              <button
                className="mt-4 rounded-full border border-[#c88854]/50 px-4 py-2 text-sm font-semibold text-[#7f2f29] transition hover:bg-white/70"
                type="button"
                onClick={() => void loadSlots()}
              >
                Try Again
              </button>
            </div>
          ) : slotsState === 'empty' ? (
            <div className="rounded-3xl border border-ink/10 bg-[#f7fbfc] px-5 py-6 text-sm leading-7 text-slate">
              No booking times are currently open online. Reach out directly and North Shore
              Nautical can add the next available slot for you.
            </div>
          ) : (
            <div className="grid gap-6">
              <p className="text-sm leading-7 text-slate">
                Pick a day below, then tap the time that works best.
              </p>
              {Object.entries(groupedSlots).map(([dayLabel, daySlots]) => (
                <div key={dayLabel} className="grid gap-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">
                    {dayLabel}
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {daySlots.map((slot) => {
                      const isSelected = slot.id === selectedSlotId

                      return (
                        <motion.button
                          key={slot.id}
                          whileTap={{ scale: 0.985 }}
                          className={`slot-button ${isSelected ? 'slot-button-active' : ''}`}
                          type="button"
                          onClick={() => setSelectedSlotId(slot.id)}
                        >
                          <div>
                            <p className="text-lg font-semibold text-ink">{formatSlotTime(slot.startsAt)}</p>
                            <p className="mt-1 text-sm leading-7 text-slate">{slot.launchLocation}</p>
                            {slot.notes ? (
                              <p className="mt-1 text-sm leading-7 text-slate/90">{slot.notes}</p>
                            ) : null}
                          </div>
                          <span className={`status-pill ${isSelected ? 'status-pill-active' : ''}`}>
                            {isSelected ? 'Selected' : 'Open'}
                          </span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 self-start">
        <div className="soft-panel p-6">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-lake" />
            <h3 className="text-lg font-semibold text-ink">Selected booking time</h3>
          </div>
          {selectedSlot ? (
            <div className="mt-4 rounded-3xl bg-[#f4f8fa] px-5 py-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">
                {selectedSlot.launchLocation}
              </p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink">
                {formatSlotTime(selectedSlot.startsAt)}
              </p>
              <p className="mt-2 text-sm leading-7 text-slate">
                {formatSlotDate(selectedSlot.startsAt)}
              </p>
              {selectedSlot.notes ? (
                <p className="mt-2 text-sm leading-7 text-slate">{selectedSlot.notes}</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-7 text-slate">
              Choose one of the available times to unlock the booking form.
            </p>
          )}
        </div>

        <div className="panel p-6">
          <div className="flex items-center gap-3">
            <Waves className="h-5 w-5 text-lake" />
            <h3 className="text-2xl font-semibold text-ink">Book your slot</h3>
          </div>

          <form className="mt-6 grid gap-5" noValidate onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" value={selectedSlotId} {...register('slotId')} />

            <label className="field-label">
              Client Name
              <input className="input-field" autoComplete="name" {...register('fullName')} />
              {errors.fullName ? (
                <span className={fieldHintClass}>{errors.fullName.message}</span>
              ) : null}
            </label>

            <label className="field-label">
              Email Address
              <input className="input-field" autoComplete="email" type="email" {...register('email')} />
              {errors.email ? <span className={fieldHintClass}>{errors.email.message}</span> : null}
            </label>

            <label className="field-label">
              Phone Number
              <input className="input-field" autoComplete="tel" type="tel" {...register('phone')} />
              {errors.phone ? <span className={fieldHintClass}>{errors.phone.message}</span> : null}
            </label>

            <label className="field-label">
              Notes
              <textarea
                className="text-area"
                placeholder="Optional dock note, timing detail, or anything helpful for day-of coordination."
                {...register('notes')}
              />
              {errors.notes ? <span className={fieldHintClass}>{errors.notes.message}</span> : null}
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

            {errors.slotId ? <span className={fieldHintClass}>{errors.slotId.message}</span> : null}

            {submitStatus === 'error' ? (
              <div
                className="rounded-2xl border border-[#d7b0ac] bg-[#fff7f6] px-4 py-4 text-sm text-[#7f2f29]"
                role="alert"
              >
                {submitMessage}
              </div>
            ) : null}

            {submitStatus === 'success' && confirmedSlot ? (
              <div
                className="rounded-2xl border border-[#b8d7ca] bg-[#f4fbf7] px-4 py-4 text-sm text-[#1d5c42]"
                role="status"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold text-[#174731]">Booking confirmed</p>
                    <p className="mt-1">{submitMessage}</p>
                    <p className="mt-2 font-semibold text-[#174731]">
                      {formatSlotDateTime(confirmedSlot.startsAt)} · {confirmedSlot.launchLocation}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <button
              className="button-dark w-full justify-center"
              disabled={submitStatus === 'submitting' || !selectedSlotId}
              type="submit"
            >
              {submitStatus === 'submitting' ? 'Confirming booking...' : 'Confirm Booking'}
            </button>
          </form>
        </div>

        <div className="soft-panel p-6">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-lake" />
            <h3 className="text-lg font-semibold text-ink">What happens next</h3>
          </div>
          <ul className="mt-4 grid gap-3 text-sm leading-7 text-slate">
            <li>Your selected slot is saved before email delivery is attempted.</li>
            <li>You receive a confirmation email with the date, time, and location.</li>
            <li>North Shore Nautical also receives an internal notification immediately.</li>
          </ul>
        </div>

        <div className="soft-panel p-6">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-lake" />
            <h3 className="text-lg font-semibold text-ink">Need a different time?</h3>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate">
            If you do not see a workable slot, contact North Shore Nautical directly and a
            new time can be opened for you without adding booking friction to the website.
          </p>
        </div>
      </div>
    </div>
  )
}
