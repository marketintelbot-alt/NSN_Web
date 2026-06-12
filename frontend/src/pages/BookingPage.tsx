import { CircleAlert, ShieldCheck } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { MarineServiceRequestForm } from '../components/service-request/MarineServiceRequestForm'
import { Seo } from '../components/seo/Seo'
import { FadeIn } from '../components/ui/FadeIn'
import { PageHero } from '../components/ui/PageHero'
import { SectionIntro } from '../components/ui/SectionIntro'

const bookingSteps = [
  {
    title: 'Choose the service',
    copy:
      'Start with the marine care service that best fits the boat. If the condition is heavier, the boat is over 30 feet, or you are unsure, the flow routes the request to review instead.',
  },
  {
    title: 'Enter boat and scheduling details',
    copy:
      'Share boat length, make and model, marina or location, preferred timing, and any notes that help North Shore Nautical review the request clearly.',
  },
  {
    title: 'Authorize payment only when eligible',
    copy:
      'Instant-checkout services move to Stripe for card authorization. Payment is not captured until North Shore Nautical approves the request.',
  },
]

export function BookingPage() {
  const [searchParams] = useSearchParams()
  const presetServiceId = searchParams.get('service') || ''
  const checkoutCanceled = searchParams.get('cancelled') === '1'

  return (
    <>
      <Seo
        title="Book Marine Care"
        description="Build your North Shore Nautical service request, review the estimate, and authorize eligible marine care services for pending review."
        path="/booking"
      />

      <PageHero
        eyebrow="Booking"
        title="Request marine care and review a clear estimate before anything is charged."
        description="Routine services can move to secure card authorization. Larger boats, custom work, and condition-heavy projects are reviewed personally before pricing is finalized."
      >
        <div className="flex max-w-2xl items-start gap-3 rounded-3xl border border-white/20 bg-white/15 px-5 py-4 text-left text-sm leading-7 text-white/90">
          <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-lake" />
          <span>
            Checkout authorizes payment only. North Shore Nautical reviews the request before any payment is captured or the appointment is considered confirmed.
          </span>
        </div>
      </PageHero>

      <section className="section-pad">
        <div className="container grid gap-10">
          {checkoutCanceled ? (
            <FadeIn className="rounded-3xl border border-[#ead4bf] bg-[#fffaf4] px-5 py-4 text-sm text-[#6e4f38]">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#c88854]" />
                <span>
                  Your checkout was not completed. No payment was captured, and you can review the request details below before submitting again.
                </span>
              </div>
            </FadeIn>
          ) : null}

          <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <SectionIntro
              label="How The Flow Works"
              title="A simple request, a clear estimate, and a personal review."
              copy="The estimate is checked against the selected service, boat length, and project condition before secure checkout is offered. North Shore Nautical reviews every authorized request before confirming the appointment."
            />
            <div className="grid gap-5">
              {bookingSteps.map((step, index) => (
                <FadeIn key={step.title} className="soft-panel p-6" delay={index * 0.08}>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-navy/70">
                    Step {index + 1}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-ink">{step.title}</h2>
                  <p className="mt-3 text-base leading-8 text-slate">{step.copy}</p>
                </FadeIn>
              ))}
            </div>
          </div>

          <MarineServiceRequestForm mode="booking" presetServiceId={presetServiceId} />
        </div>
      </section>
    </>
  )
}
