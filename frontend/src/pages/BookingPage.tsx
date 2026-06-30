import { ShieldCheck } from 'lucide-react'
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
      'Start with the marine care service that best fits the boat. Every submission is reviewed before scheduling or invoice next steps are sent.',
  },
  {
    title: 'Enter boat and scheduling details',
    copy:
      'Share boat length, make and model, marina or location, preferred timing, and any notes that help North Shore Nautical review the request clearly.',
  },
  {
    title: 'Review before invoicing',
    copy:
      'North Shore Nautical confirms scope, timing, access, and final pricing first, then follows up directly with invoice details.',
  },
]

export function BookingPage() {
  const [searchParams] = useSearchParams()
  const presetServiceId = searchParams.get('service') || ''

  return (
    <>
      <Seo
        title="Book Marine Care"
        description="Build your North Shore Nautical service request, review the starting estimate, and submit it for invoice review."
        path="/booking"
      />

      <PageHero
        eyebrow="Booking"
        title="Request marine care and review a starting estimate before invoicing."
        description="Every request is reviewed personally before scheduling and invoice pricing are finalized."
      >
        <div className="flex max-w-2xl items-start gap-3 rounded-3xl border border-white/20 bg-white/15 px-5 py-4 text-left text-sm leading-7 text-white/90">
          <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-lake" />
          <span>
            No online payment is required. North Shore Nautical reviews the request first, then follows up directly with invoice next steps.
          </span>
        </div>
      </PageHero>

      <section className="section-pad">
        <div className="container grid gap-10">
          <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <SectionIntro
              label="How The Flow Works"
              title="A simple request, a clear estimate, and a personal review."
              copy="The starting estimate is checked against the selected service, boat length, and project condition. North Shore Nautical reviews every request before confirming the appointment or sending invoice next steps."
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
