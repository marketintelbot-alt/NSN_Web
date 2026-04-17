import {
  Anchor,
  CalendarClock,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react'

import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { FadeIn } from '../components/ui/FadeIn'
import { CtaBanner } from '../components/ui/CtaBanner'
import { SectionIntro } from '../components/ui/SectionIntro'
import { serviceMenuSections, serviceNotes, services } from '../content/site'

const serviceIcons = {
  storage: Anchor,
  detailing: Sparkles,
  waxing: ShieldCheck,
  'driver-reservation': CalendarClock,
}

const menuIcons = [Sparkles, ShieldCheck, Anchor, CalendarClock, Wrench]

export function ServicesPage() {
  return (
    <>
      <Seo
        title="Services"
        description="Explore North Shore Nautical services for boat storage, detailing, waxing, launch coordination, and premium care across Chicago's North Shore."
        path="/services"
      />
      <PageHero
        eyebrow="Services"
        title="Storage, detailing, waxing, launch delivery, and care that work together."
        description="North Shore Nautical offers operational support, presentation-focused detailing, and launch-day coordination in one service system built for stored boats."
      />

      <section className="section-pad">
        <div className="container">
          <SectionIntro
            inverse
            label="Service Overview"
            title="A premium local marine service should feel clear, capable, and complete."
            copy="The service menu now spans storage, detailing, waxing, and launch support, with both full-service work and narrower add-ons available when a boat needs something specific."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {services.map((service, index) => {
              const Icon = serviceIcons[service.slug as keyof typeof serviceIcons]
              return (
                <FadeIn key={service.slug} className="soft-panel p-8" delay={index * 0.08}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lake/10 text-lake">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h2 className="font-display text-3xl font-semibold text-ink">
                      {service.name}
                    </h2>
                  </div>
                  <p className="mt-4 text-base leading-8 text-slate">{service.summary}</p>
                  <ul className="mt-6 grid gap-3 text-sm leading-7 text-slate">
                    {service.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-lake" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section-pad bg-[#f6f8f9]">
        <div className="container">
          <SectionIntro
            label="Detailing Menu"
            title="The full service menu, without the clutter."
            copy="Everything below is available as part of North Shore Nautical&apos;s detailing and finish-care offering, with pricing intentionally left off the website."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {serviceMenuSections.map((section, index) => {
              const Icon = menuIcons[index] || Sparkles

              return (
                <FadeIn key={section.title} className="panel p-8" delay={index * 0.07}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lake/10 text-lake">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h2 className="font-display text-3xl font-semibold text-ink">
                      {section.title}
                    </h2>
                  </div>
                  <p className="mt-4 text-base leading-8 text-slate">{section.description}</p>
                  <ul className="mt-6 grid gap-3 text-sm leading-7 text-slate">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-lake" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section-pad bg-[#eef4f7]">
        <div className="container grid gap-6 lg:grid-cols-3">
          {[
            {
              title: 'Storage with intention',
              copy:
                'Storage is handled with organization and future launch readiness in mind, not as an isolated warehouse task.',
            },
            {
              title: 'Detailing that supports readiness',
              copy:
                'Detailing and waxing are treated as operational services, not cosmetic extras, so boats show up cleaner, better protected, and more launch-ready.',
            },
            {
              title: 'Reservation process that stays honest',
              copy:
                'Online booking stays clear because North Shore Nautical only opens times that are truly available.',
            },
          ].map((item, index) => (
            <FadeIn key={item.title} className="soft-panel p-7" delay={index * 0.08}>
              <h2 className="font-display text-3xl font-semibold text-ink">{item.title}</h2>
              <p className="mt-4 text-base leading-8 text-slate">{item.copy}</p>
            </FadeIn>
          ))}
        </div>
        <div className="container mt-10">
          <FadeIn className="panel p-8">
            <h2 className="font-display text-3xl font-semibold text-ink">Important notes</h2>
            <ul className="mt-6 grid gap-3 text-sm leading-7 text-slate">
              {serviceNotes.map((note) => (
                <li key={note} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-lake" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </section>

      <CtaBanner
        title="Need scheduled launch delivery?"
        copy="If your boat is already stored with North Shore Nautical and you see a time that works, book it online and receive confirmation right away."
        primaryLabel="Client Login"
        primaryTo="/account"
        secondaryLabel="View Storage Service"
        secondaryTo="/storage"
      />
    </>
  )
}
