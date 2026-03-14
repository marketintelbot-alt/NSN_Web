import {
  Anchor,
  ArrowRight,
  CalendarClock,
  MapPinned,
  ShipWheel,
  ShieldCheck,
  Sparkles,
  Waves,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Seo } from '../components/seo/Seo'
import { FadeIn } from '../components/ui/FadeIn'
import { FaqList } from '../components/ui/FaqList'
import { CtaBanner } from '../components/ui/CtaBanner'
import { SectionIntro } from '../components/ui/SectionIntro'
import {
  contactDetails,
  faqs,
  howItWorks,
  principles,
  serviceAreas,
  services,
  siteMeta,
  trustIndicators,
} from '../content/site'

const serviceIcons = {
  storage: Anchor,
  care: Sparkles,
  'launch-coordination': Waves,
  'driver-reservation': CalendarClock,
}

export function HomePage() {
  return (
    <>
      <Seo
        title="Premium Boat Care on Chicago's North Shore"
        description="North Shore Nautical provides premium boat storage, launch delivery to Lloyd or Evanston Boat Launch, optional pre-launch cleaning, and secure client accounts across Chicago's North Shore."
        path="/"
        image={siteMeta.heroImage}
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: siteMeta.name,
            url: siteMeta.siteUrl,
            description: siteMeta.description,
            telephone: contactDetails.phoneDisplay,
            email: contactDetails.email,
            areaServed: serviceAreas,
            serviceType: services.map((service) => service.name),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.slice(0, 4).map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
              },
            })),
          },
        ]}
      />

      <section className="relative min-h-screen overflow-hidden bg-ink pt-32 text-white md:pt-40">
        <div
          className="absolute inset-0 bg-cover"
          style={{
            backgroundImage: `url(${siteMeta.heroImage})`,
            backgroundPosition: 'center 58%',
          }}
        />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-[#f5f8fa]" />
        <div className="container relative pb-20 pt-16 md:pb-28 md:pt-24">
          <FadeIn className="max-w-4xl">
            <span className="eyebrow">Premium Stored-Boat Concierge</span>
            <h1 className="display-title-inverse max-w-4xl">
              Your boat, prepared and brought to launch with North Shore precision.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75 md:text-xl">
              Most North Shore Nautical clients already keep their boats in storage
              with us. Reserve delivery to Lloyd Boat Launch or Evanston Boat Launch,
              add cleaning if you want it, and let the details be handled with calm,
              professional coordination.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link className="button-primary" to="/reserve-launch">
                Reserve Launch
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link className="button-secondary" to="/services">
                Explore Services
              </Link>
            </div>
            <p className="mt-5 text-sm uppercase tracking-[0.16em] text-white/70">
              Invited clients can also use the{' '}
              <Link className="border-b border-white/30 pb-0.5 text-white" to="/account">
                client login
              </Link>{' '}
              to keep boats on file for faster reservations.
            </p>
          </FadeIn>

          <FadeIn className="mt-20 panel p-6 md:mt-28 md:p-8" delay={0.15}>
            <div className="grid gap-6 md:grid-cols-4">
              {trustIndicators.map((indicator) => (
                <div key={indicator} className="border-l border-ink/10 pl-4 first:border-l-0 first:pl-0">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate/80">
                    {indicator}
                  </p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <SectionIntro
            label="Services"
            title="A refined service model for owners who prefer readiness over friction."
            copy="From stored-boat oversight to launch-day delivery, North Shore Nautical keeps each service intentionally aligned so your boat feels prepared before the lake is."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {services.map((service, index) => {
              const Icon = serviceIcons[service.slug as keyof typeof serviceIcons]

              return (
                <FadeIn key={service.slug} className="soft-panel p-7" delay={index * 0.08}>
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

      <section className="section-pad bg-[#edf3f6]">
        <div className="container">
          <SectionIntro
            label="How It Works"
            title="A launch request process designed to feel composed and dependable."
            copy="The reservation process is straightforward by design: clear details, clear lead time, and a professional review before launch-day delivery begins."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {howItWorks.map((step, index) => (
              <FadeIn key={step.title} className="soft-panel p-7" delay={index * 0.1}>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">
                  Step {index + 1}
                </p>
                <h2 className="mt-4 font-display text-3xl font-semibold text-ink">
                  {step.title}
                </h2>
                <p className="mt-4 text-base leading-8 text-slate">{step.description}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <FadeIn>
            <SectionIntro
              label="Why North Shore Nautical"
              title="Convenience, professionalism, and peace of mind without the usual clutter."
              copy="The standard is simple: careful handling, polished communication, and a schedule that respects the realities of launch-day operations."
            />
          </FadeIn>
          <div className="grid gap-6">
            {principles.map((principle, index) => (
              <FadeIn key={principle.title} className="soft-panel p-7" delay={index * 0.08}>
                <div className="flex items-center gap-3">
                  {index === 0 ? (
                    <ShieldCheck className="h-5 w-5 text-lake" />
                  ) : index === 1 ? (
                    <MapPinned className="h-5 w-5 text-lake" />
                  ) : (
                    <ShipWheel className="h-5 w-5 text-lake" />
                  )}
                  <h2 className="text-xl font-semibold text-ink">{principle.title}</h2>
                </div>
                <p className="mt-3 text-base leading-8 text-slate">{principle.description}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-[#f0f5f7]">
        <div className="container grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <FadeIn>
            <SectionIntro
              label="Service Area"
              title="Serving Chicago's North Shore with a local, launch-minded approach."
              copy="North Shore Nautical supports clients across Chicago's North Shore communities and nearby launch points with a service model built around planning, readiness, and responsible coordination."
            />
          </FadeIn>
          <FadeIn className="panel p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              {serviceAreas.map((community) => (
                <div
                  key={community}
                  className="rounded-2xl border border-ink/10 bg-white px-4 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-ink"
                >
                  {community}
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <SectionIntro
            label="FAQ"
            title="Clear answers before you schedule."
            copy="A few of the questions owners ask most often before reserving launch delivery or reviewing stored-boat service details."
          />
          <div className="mt-12">
            <FaqList items={faqs.slice(0, 4)} />
          </div>
          <div className="mt-8">
            <Link className="button-dark" to="/faq">
              View All FAQs
            </Link>
          </div>
        </div>
      </section>

      <CtaBanner
        title="Reserve early and keep launch day calm."
        copy="Launch delivery requests are reviewed manually so every timing request, destination, and cleaning preference can be coordinated with care. Submit at least 24 hours ahead to stay within the scheduling window."
        primaryLabel="Reserve Launch"
        primaryTo="/reserve-launch"
        secondaryLabel="Contact North Shore Nautical"
        secondaryTo="/contact"
      />
    </>
  )
}
