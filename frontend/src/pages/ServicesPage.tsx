import { ArrowRight, Droplets, ShieldCheck, Sparkles, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Seo } from '../components/seo/Seo'
import { CtaBanner } from '../components/ui/CtaBanner'
import { FadeIn } from '../components/ui/FadeIn'
import { PageHero } from '../components/ui/PageHero'
import { SectionIntro } from '../components/ui/SectionIntro'
import { marineCareHighlights } from '../content/site'

const coreServices = [
  {
    title: 'Interior Refresh',
    description:
      'A light interior-only reset for routine upkeep between deeper details, without protection, polishing, shampooing, or heavy-condition cleanup.',
    icon: Sparkles,
  },
  {
    title: 'Maintenance Detail',
    description:
      'A seasonal reset for recurring upkeep, full exterior wash and dry, light interior care, and a polished ready-to-enjoy feel.',
    icon: Sparkles,
  },
  {
    title: 'Signature Detail',
    description:
      'Deeper cleaning and presentation-focused care for owners who want a more complete, premium result.',
    icon: ShieldCheck,
  },
  {
    title: 'Restoration Detail',
    description:
      'Manual-review service for neglected condition, deeper recovery work, and higher-touch detailing scopes.',
    icon: Wrench,
  },
]

const specialtyServices = [
  'Exterior Wash',
  'Buff & Wax',
  'Vinyl Deep Clean',
  'Interior Cleaning',
  'Carpet / Mat Shampoo',
  'Non-Skid Deck Scrub',
  'Heavy Oxidation Removal',
  'Mold / Mildew Treatment',
  'Multi-Stage Gelcoat Correction',
  'Teak Cleaning & Oiling',
  'Metal Polishing',
  'Owner Advisory Support',
]

export function ServicesPage() {
  return (
    <>
      <Seo
        title="Marine Care Services"
        description="Explore premium marine detailing, upkeep, and finish care services for Chicago’s North Shore boat owners."
        path="/services"
      />

      <PageHero
        eyebrow="Marine Care"
        title="Marine detailing and care designed to keep your boat clean, protected, and ready to enjoy."
        description="North Shore Nautical leads with premium marine care: routine detailing, finish work, condition-aware specialty services, and a request flow that stays clear from start to approval."
      >
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link className="button-primary w-full justify-center sm:w-auto" to="/booking">
            Book Marine Care
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link className="button-secondary w-full justify-center sm:w-auto" to="/pricing">
            View Pricing
          </Link>
        </div>
      </PageHero>

      <section className="section-pad">
        <div className="container">
          <SectionIntro
            label="Maintenance Packages"
            title="Core care options are separated into clear package blocks."
            copy="Start with the package that matches the boat’s condition and how much presentation work it needs. Routine maintenance packages show starting estimates, while restoration and heavier-condition scopes stay review-first before invoicing."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {coreServices.map((service, index) => {
              const Icon = service.icon
              return (
                <FadeIn
                  key={service.title}
                  className="flex h-full flex-col rounded-3xl border border-white/80 bg-[#f8fbf7]/95 p-6 shadow-soft"
                  delay={index * 0.08}
                >
                  <div className="grid gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lake/14 text-lake">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-2xl font-semibold text-ink">{service.title}</h2>
                      <p className="mt-3 text-base leading-8 text-slate">{service.description}</p>
                    </div>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section-pad bg-[#edf6f2]/60">
        <div className="container">
          <SectionIntro
            label="Service Categories"
            title="From maintenance details to condition-aware specialty work."
            copy="The service catalog is structured around clean seasonal upkeep, premium presentation, and specialty care when a boat needs more targeted attention."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {marineCareHighlights.map((item, index) => (
              <FadeIn key={item.title} className="soft-panel p-6" delay={index * 0.08}>
                <h3 className="text-2xl font-semibold text-ink">{item.title}</h3>
                <p className="mt-3 text-base leading-8 text-slate">{item.description}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="grid gap-5">
            <FadeIn className="panel p-6 md:p-8">
              <div className="flex items-center gap-3">
                <Droplets className="h-5 w-5 text-lake" />
                <h2 className="text-2xl font-semibold text-ink">Specialty Services</h2>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {specialtyServices.map((service) => (
                  <div
                    key={service}
                    className="rounded-2xl border border-ink/10 bg-[#f8fbf7]/90 px-4 py-4 text-sm font-semibold text-ink"
                  >
                    {service}
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
          <SectionIntro
            label="How Requests Are Reviewed"
            title="Starting estimates where they make sense. Personal review before invoicing."
            copy="Routine flat and per-foot services show a starting estimate. Larger boats, heavier oxidation, mildew, neglected condition, unusual access, restoration work, and advisory needs are reviewed manually before invoice pricing is finalized."
          />
        </div>
      </section>

      <CtaBanner
        title="Need pricing or want to move straight into the request flow?"
        copy="Use the pricing page to compare starting rates and custom-review work, then submit the request with your boat details, marina, timing, and condition notes."
        primaryLabel="View Pricing"
        primaryTo="/pricing"
        secondaryLabel="Book Marine Care"
        secondaryTo="/booking"
      />
    </>
  )
}
