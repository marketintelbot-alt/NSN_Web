import { ShieldCheck } from 'lucide-react'

import { ReservationForm } from '../components/reservation/ReservationForm'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { FadeIn } from '../components/ui/FadeIn'
import { CtaBanner } from '../components/ui/CtaBanner'

export function ReserveDriverPage() {
  return (
    <>
      <Seo
        title="Reserve Launch Delivery"
        description="Submit a launch delivery reservation request for a stored boat with North Shore Nautical. Requests require at least 24 hours of advance notice."
        path="/reserve-launch"
      />
      <PageHero
        eyebrow="Reserve Launch"
        title="A polished reservation request process for stored-boat launch delivery."
        description="This form is for scheduling review and confirmation. It is not a live calendar, and it will only accept launch requests submitted at least 24 hours in advance."
      >
        <div className="inline-flex max-w-2xl items-start gap-3 rounded-3xl border border-white/10 bg-white/10 px-5 py-4 text-left text-sm leading-7 text-white/80">
          <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-lake" />
          <span>
            To ensure driver availability, launch delivery reservations must be
            submitted at least 24 hours before your requested launch time.
          </span>
        </div>
      </PageHero>

      <section className="section-pad">
        <div className="container">
          <ReservationForm />
        </div>
      </section>

      <section className="section-pad bg-[#eff4f7]">
        <div className="container grid gap-6 lg:grid-cols-3">
          {[
            {
              title: 'Reservation requests are reviewed manually',
              copy:
                'North Shore Nautical evaluates timing, launch destination, and delivery availability before confirming the schedule.',
            },
            {
              title: 'Lead time protects launch-day reliability',
              copy:
                'The 24-hour policy is designed to keep launch delivery dependable rather than overpromised.',
            },
            {
              title: 'Follow-up stays concise and professional',
              copy:
                'If any details need clarification, the team follows up directly without turning the process into a cluttered back-and-forth chain.',
            },
          ].map((item, index) => (
            <FadeIn key={item.title} className="soft-panel p-7" delay={index * 0.08}>
              <h2 className="font-display text-3xl font-semibold text-ink">{item.title}</h2>
              <p className="mt-4 text-base leading-8 text-slate">{item.copy}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      <CtaBanner
        title="Have a special timing request?"
        copy="If your launch coordination needs additional handling notes or timing context, submit the request and follow up directly so the details can be reviewed together."
        primaryLabel="Contact North Shore Nautical"
        primaryTo="/contact"
        secondaryLabel="Explore Services"
        secondaryTo="/services"
      />
    </>
  )
}
