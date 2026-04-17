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
        title="Book a Launch Time"
        description="See available North Shore Nautical booking times, choose one, and confirm your summer launch slot in minutes."
        path="/reserve-launch"
      />
      <PageHero
        eyebrow="Book Online"
        title="A clean, mobile-first booking flow built around open time slots."
        description="Clients only see available booking times. Pick the slot that works, confirm it, and North Shore Nautical handles the follow-through."
      >
        <div className="inline-flex max-w-2xl items-start gap-3 rounded-3xl border border-white/10 bg-white/10 px-5 py-4 text-left text-sm leading-7 text-white/80">
          <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-lake" />
          <span>
            Available times are curated by North Shore Nautical so the booking flow stays
            fast, clear, and dependable for clients on mobile.
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
              title: 'Only open times are shown',
              copy:
                'Clients are not asked to guess. They only choose from live slots that are actually available to book.',
            },
            {
              title: 'Booking is intentionally minimal',
              copy:
                'The form only asks for the contact details needed to secure the slot and support day-of coordination.',
            },
            {
              title: 'Confirmation stays calm and professional',
              copy:
                'Clients receive a clear confirmation while the admin dashboard tracks delivery status in the background.',
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
        title="Need a time you don’t see online?"
        copy="If your ideal slot is not listed, reach out directly and North Shore Nautical can open or coordinate the next available time."
        primaryLabel="Contact North Shore Nautical"
        primaryTo="/contact"
        secondaryLabel="Explore Services"
        secondaryTo="/services"
      />
    </>
  )
}
