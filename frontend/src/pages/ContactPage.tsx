import { CalendarClock, Mail, Phone, ShipWheel } from 'lucide-react'

import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { FadeIn } from '../components/ui/FadeIn'
import { CtaBanner } from '../components/ui/CtaBanner'
import { contactDetails, contacts } from '../content/site'

export function ContactPage() {
  return (
    <>
      <Seo
        title="Contact"
        description="Contact North Shore Nautical for storage inquiries, launch delivery questions, and booking support."
        path="/contact"
      />
      <PageHero
        eyebrow="Contact"
        title="Direct, professional communication for scheduling and service inquiries."
        description="North Shore Nautical keeps inquiries simple: clear contact channels, measured response expectations, and practical guidance for the next step."
      />

      <section className="section-pad">
        <div className="container grid gap-6 lg:grid-cols-2">
          <FadeIn className="panel p-8">
            <h2 className="font-display text-4xl font-semibold text-ink">Direct inquiry</h2>
            <p className="mt-4 text-base leading-8 text-slate">
              For general service conversations, storage questions, or launch planning
              details, reach out directly using the contact information below.
            </p>
            <div className="mt-8 grid gap-5">
              {contacts.map((contact) => (
                <div key={contact.email} className="soft-panel p-5">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-lake" />
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate">
                        {contact.role}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-ink">{contact.name}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4">
                    <a
                      className="inline-flex items-center gap-3 font-semibold text-ink hover:text-navy"
                      href={`mailto:${contact.email}`}
                    >
                      <Mail className="h-5 w-5 text-lake" />
                      {contact.email}
                    </a>
                    {contact.phoneDisplay && contact.phoneHref ? (
                      <a
                        className="inline-flex items-center gap-3 font-semibold text-ink hover:text-navy"
                        href={contact.phoneHref}
                      >
                        <Phone className="h-5 w-5 text-lake" />
                        {contact.phoneDisplay}
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>

          <div className="grid gap-5">
            <FadeIn className="soft-panel p-7">
              <div className="flex items-center gap-3">
                <ShipWheel className="h-5 w-5 text-lake" />
                <h2 className="text-xl font-semibold text-ink">Response expectations</h2>
              </div>
              <p className="mt-4 text-base leading-8 text-slate">
                {contactDetails.responseExpectation}
              </p>
            </FadeIn>
            <FadeIn className="soft-panel p-7" delay={0.08}>
              <div className="flex items-center gap-3">
                <CalendarClock className="h-5 w-5 text-lake" />
                <h2 className="text-xl font-semibold text-ink">Scheduling note</h2>
              </div>
              <p className="mt-4 text-base leading-8 text-slate">
                Launch delivery reservations require a minimum of 24 hours&apos; notice.
                If you already know your preferred launch timing, the reservation form
                is the best place to start.
              </p>
            </FadeIn>
            <FadeIn className="soft-panel p-7" delay={0.16}>
              <h2 className="text-xl font-semibold text-ink">Urgent changes or special requests</h2>
              <p className="mt-4 text-base leading-8 text-slate">
                {contactDetails.urgentNote}
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      <CtaBanner
        title="Need launch coordination rather than a general inquiry?"
        copy="Move directly to the booking page if you are ready to choose an available time and confirm it online."
        primaryLabel="Client Login"
        primaryTo="/account"
      />
    </>
  )
}
