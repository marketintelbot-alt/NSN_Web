import { Anchor, CalendarClock, Sparkles, Waves } from 'lucide-react'

import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { FadeIn } from '../components/ui/FadeIn'
import { CtaBanner } from '../components/ui/CtaBanner'
import { SectionIntro } from '../components/ui/SectionIntro'
import { services } from '../content/site'

const icons = [Anchor, Sparkles, Waves, CalendarClock]

export function ServicesPage() {
  return (
    <>
      <Seo
        title="Services"
        description="Explore North Shore Nautical services for premium boat storage, optional pre-launch cleaning, launch delivery, and secure saved-boat accounts."
        path="/services"
      />
      <PageHero
        eyebrow="Services"
        title="Storage, care, launch delivery, and client accounts designed to work together."
        description="Each service is structured to support the others, creating a cleaner ownership experience from stored-boat planning to launch-day execution."
      />

      <section className="section-pad">
        <div className="container">
          <SectionIntro
            label="Service Overview"
            title="A premium local service business should feel operationally polished."
            copy="North Shore Nautical keeps the offer focused: no unnecessary layers, no false automation, and no guesswork about how scheduling works."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {services.map((service, index) => {
              const Icon = icons[index]
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

      <section className="section-pad bg-[#eef4f7]">
        <div className="container grid gap-6 lg:grid-cols-3">
          {[
            {
              title: 'Storage with intention',
              copy:
                'Storage is handled with organization and future launch readiness in mind, not as an isolated warehouse task.',
            },
            {
              title: 'Care that supports readiness',
              copy:
                'Boat care is part of how the overall service stays polished, with attention paid to presentation, handling notes, and launch preparation.',
            },
            {
              title: 'Reservation process that stays honest',
              copy:
                'Launch reservations are requests for review, not live calendar slots. That keeps the process clear, accurate, and dependable.',
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
        title="Need scheduled launch delivery?"
        copy="If your boat is already stored with North Shore Nautical and you know the launch date and destination you want, submit the reservation request and the schedule will be reviewed promptly."
        primaryLabel="Reserve Launch"
        primaryTo="/reserve-launch"
        secondaryLabel="View Storage Service"
        secondaryTo="/storage"
      />
    </>
  )
}
