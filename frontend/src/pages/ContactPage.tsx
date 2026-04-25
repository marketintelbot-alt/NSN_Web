import { CalendarClock, Mail, ShieldCheck, Sparkles } from 'lucide-react'

import { MarineServiceRequestForm } from '../components/service-request/MarineServiceRequestForm'
import { Seo } from '../components/seo/Seo'
import { CtaBanner } from '../components/ui/CtaBanner'
import { FadeIn } from '../components/ui/FadeIn'
import { PageHero } from '../components/ui/PageHero'

const contactCards = [
  {
    title: 'Inquiry review',
    copy:
      'Use the form to share service interest, boat details, timing, and notes. North Shore Nautical reviews every inquiry directly before following up.',
    icon: Mail,
  },
  {
    title: 'Scheduling expectations',
    copy:
      'Requested date and time helps North Shore Nautical review fit, marina context, and approval timing in the business time zone.',
    icon: CalendarClock,
  },
  {
    title: 'Clear follow-up',
    copy:
      'A North Shore Nautical team member will follow up directly if additional access details, condition notes, or scope clarification is needed.',
    icon: ShieldCheck,
  },
]

export function ContactPage() {
  return (
    <>
      <Seo
        title="Contact"
        description="Submit a professional North Shore Nautical inquiry for marine care estimates, advisory support, and scheduling review."
        path="/contact"
      />

      <PageHero
        eyebrow="Contact"
        title="A professional inquiry form built for marine care requests, estimates, and owner advisory."
        description="North Shore Nautical keeps contact simple: submit the key details once, route the request to review, and let the team follow up directly."
      />

      <section className="section-pad">
        <div className="container grid gap-10">
          <div className="grid gap-5 lg:grid-cols-3">
            {contactCards.map((item, index) => {
              const Icon = item.icon
              return (
                <FadeIn key={item.title} className="soft-panel p-6" delay={index * 0.06}>
                  <Icon className="h-5 w-5 text-lake" />
                  <h2 className="mt-4 text-2xl font-semibold text-ink">{item.title}</h2>
                  <p className="mt-3 text-base leading-8 text-slate">{item.copy}</p>
                </FadeIn>
              )
            })}
          </div>

          <FadeIn className="rounded-3xl border border-ink/10 bg-white/76 px-5 py-4 text-sm leading-7 text-slate">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 h-5 w-5 shrink-0 text-lake" />
              <span>
                Photo upload is not part of the public form yet. If photos would help clarify the scope, North Shore Nautical can request them during follow-up.
              </span>
            </div>
          </FadeIn>

          <MarineServiceRequestForm mode="contact" />
        </div>
      </section>

      <CtaBanner
        title="Prefer to compare services before submitting?"
        copy="Explore marine care pricing, review quote-only services, and then return here if the request needs a more tailored scope."
        primaryLabel="View Pricing"
        primaryTo="/pricing"
        secondaryLabel="Explore Services"
        secondaryTo="/services"
      />
    </>
  )
}
