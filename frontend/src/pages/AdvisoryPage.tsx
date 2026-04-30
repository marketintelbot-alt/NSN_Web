import { ArrowRight, ClipboardCheck, Compass, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Seo } from '../components/seo/Seo'
import { CtaBanner } from '../components/ui/CtaBanner'
import { FadeIn } from '../components/ui/FadeIn'
import { PageHero } from '../components/ui/PageHero'
import { SectionIntro } from '../components/ui/SectionIntro'
import { advisoryHighlights, advisoryPillars } from '../content/site'

const advisoryCards = [
  {
    title: 'Boat buying guidance',
    description:
      'Support for thinking through listings, ownership fit, marina realities, and the upkeep questions that matter before you buy.',
    icon: Compass,
  },
  {
    title: 'Maintenance planning',
    description:
      'A practical owner-side roadmap for recurring care, seasonal timing, and keeping service decisions organized.',
    icon: ClipboardCheck,
  },
  {
    title: 'Referral guidance',
    description:
      'Clear direction toward trusted technicians or specialty vendors when a request falls outside North Shore Nautical’s direct scope.',
    icon: Wrench,
  },
]

export function AdvisoryPage() {
  return (
    <>
      <Seo
        title="Advisory"
        description="Owner-focused advisory for boat buying guidance, upkeep planning, seasonal support, and referral direction on Chicago’s North Shore."
        path="/advisory"
      />

      <PageHero
        eyebrow="Advisory"
        title="Practical advisory for boat owners who want clear next steps, not vague consulting."
        description="North Shore Nautical advisory is owner support: buying guidance, upkeep planning, seasonal decision-making, and referral direction when a specialist is the better fit."
      >
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link className="button-primary w-full justify-center sm:w-auto" to="/contact">
            Request Advisory
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link className="button-secondary w-full justify-center sm:w-auto" to="/services">
            Explore Marine Care
          </Link>
        </div>
      </PageHero>

      <section className="section-pad">
        <div className="container grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <SectionIntro
            label="How Advisory Fits"
            title="Advisory stays useful when it is practical, bounded, and clearly owner-focused."
            copy="This is owner-side guidance that helps people make better care, planning, and ownership decisions without overpromising beyond scope."
          />
          <div className="grid gap-5">
            {advisoryCards.map((item, index) => {
              const Icon = item.icon
              return (
                <FadeIn key={item.title} className="panel p-6 md:p-7" delay={index * 0.08}>
                  <div className="flex items-start gap-4">
                    <span className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-lake/14 text-lake">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-2xl font-semibold text-ink">{item.title}</h2>
                      <p className="mt-3 text-base leading-8 text-slate">{item.description}</p>
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
            label="Advisory Topics"
            title="Guidance designed around real ownership decisions."
            copy="The public positioning keeps advisory grounded in upkeep, planning, referrals, and ownership clarity instead of overpromising beyond scope."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {advisoryHighlights.map((item, index) => (
              <FadeIn key={item.title} className="soft-panel p-6" delay={index * 0.06}>
                <h3 className="text-2xl font-semibold text-ink">{item.title}</h3>
                <p className="mt-3 text-base leading-8 text-slate">{item.description}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <SectionIntro
            label="What To Expect"
            title="Useful support, clear boundaries, and practical follow-through."
            copy="Advisory requests are reviewed directly by North Shore Nautical and may include buying guidance, maintenance planning, seasonal ownership support, or vendor referral direction."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {advisoryPillars.map((item, index) => (
              <FadeIn key={item.title} className="panel p-6" delay={index * 0.06}>
                <h3 className="text-2xl font-semibold text-ink">{item.title}</h3>
                <p className="mt-3 text-base leading-8 text-slate">{item.description}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner
        title="Need care planning or owner-side guidance?"
        copy="Submit an advisory inquiry with your boat details, current goals, and timing. North Shore Nautical will review the request and follow up directly."
        primaryLabel="Request Advisory"
        primaryTo="/contact"
        secondaryLabel="Book Marine Care"
        secondaryTo="/booking"
      />
    </>
  )
}
