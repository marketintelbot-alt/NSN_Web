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
    title: 'Maintenance Detail',
    description:
      'A seasonal reset for recurring upkeep, light interior care, clean exterior surfaces, and a polished ready-to-enjoy feel.',
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
  'Oxidation Removal',
  'Interior Cleaning',
  'Vinyl Deep Clean',
  'Carpet / Mat Shampoo',
  'Non-Skid Deck Scrub',
  'Metal Polishing',
  'Teak Cleaning & Oiling',
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
        <div className="container grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <SectionIntro
            label="What We Do"
            title="A premium local marine care company should feel polished, calm, and operationally clear."
            copy="The public service story is simple: marine care comes first, advisory is available where useful, and every request is reviewed with real boat condition and marina context in mind."
          />
          <div className="grid gap-5">
            {coreServices.map((service, index) => {
              const Icon = service.icon
              return (
                <FadeIn key={service.title} className="panel p-6 md:p-7" delay={index * 0.08}>
                  <div className="flex items-start gap-4">
                    <span className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-lake/14 text-lake">
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
            title="Instant checkout where it makes sense. Inquiry review when it does not."
            copy="Routine per-foot services for boats from 10-30 feet can move to secure checkout after the estimate is calculated. Larger boats, heavier oxidation, mildew, neglected condition, unusual access, restoration work, and advisory needs go to manual review instead."
          />
        </div>
      </section>

      <CtaBanner
        title="Need pricing or want to move straight into the request flow?"
        copy="Use the pricing page to compare instant-checkout services and quote-only work, then submit the request with your boat details, marina, timing, and condition notes."
        primaryLabel="View Pricing"
        primaryTo="/pricing"
        secondaryLabel="Book Marine Care"
        secondaryTo="/booking"
      />
    </>
  )
}
