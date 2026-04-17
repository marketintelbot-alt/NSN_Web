import { Flag, Handshake, Waves } from 'lucide-react'

import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { FadeIn } from '../components/ui/FadeIn'
import { CtaBanner } from '../components/ui/CtaBanner'
import { SectionIntro } from '../components/ui/SectionIntro'

export function AboutPage() {
  return (
    <>
      <Seo
        title="About"
        description="Learn about the North Shore Nautical service philosophy: premium local coordination, professional handling, and launch-day readiness."
        path="/about"
      />
      <PageHero
        eyebrow="About"
        title="A premium local brand built around professionalism, readiness, and care."
        description="North Shore Nautical is positioned for owners who want service that feels composed, trustworthy, and operationally polished from the first conversation."
      />

      <section className="section-pad">
        <div className="container grid gap-12 lg:grid-cols-[0.92fr_1.08fr]">
          <FadeIn>
            <SectionIntro
              inverse
              label="Brand Story"
              title="Boat ownership should feel supported, not administratively heavy."
              copy="North Shore Nautical is designed around a clear idea: storage, care, and launch coordination should be handled with the same level of polish owners expect from the rest of their lives. The business does not rely on overstatement or gimmicks. It focuses on preparation, communication, and local execution."
            />
          </FadeIn>
          <FadeIn className="panel p-8" delay={0.08}>
            <p className="text-base leading-8 text-slate">
              The result is a service experience that feels more concierge than
              contractor: clear standards, thoughtful coordination, and careful
              respect for timing, equipment, and client trust. North Shore Nautical
              serves Chicago&apos;s North Shore with a local orientation and a steady,
              professional tone.
            </p>
            <p className="mt-6 text-base leading-8 text-slate">
              The service model is intentionally focused. Instead of pretending to be
              a live logistics platform, North Shore Nautical keeps the process honest:
              stored clients submit requests, the schedule is reviewed carefully, and
              launch details are confirmed with clarity.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="section-pad bg-[#eef4f7]">
        <div className="container grid gap-6 lg:grid-cols-3">
          {[
            {
              icon: Flag,
              title: 'North Shore grounded',
              copy:
                'The tone, service model, and language are built for local owners who value professionalism and regional familiarity.',
            },
            {
              icon: Handshake,
              title: 'Trust built through process',
              copy:
                'Trust comes from reliable communication, thoughtful scheduling, and a service standard that stays consistent from inquiry to execution.',
            },
            {
              icon: Waves,
              title: 'Readiness before launch day',
              copy:
                'The business is built around helping launch days feel prepared, calm, and properly coordinated instead of rushed.',
            },
          ].map((item, index) => (
            <FadeIn key={item.title} className="soft-panel p-7" delay={index * 0.08}>
              <item.icon className="h-5 w-5 text-lake" />
              <h2 className="mt-4 font-display text-3xl font-semibold text-ink">
                {item.title}
              </h2>
              <p className="mt-4 text-base leading-8 text-slate">{item.copy}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      <CtaBanner
        title="Prefer a direct conversation first?"
        copy="If you would like to discuss storage, service expectations, or a future launch request, North Shore Nautical welcomes direct outreach."
        primaryLabel="Contact North Shore Nautical"
        primaryTo="/contact"
        secondaryLabel="Reserve Launch"
        secondaryTo="/reserve-launch"
      />
    </>
  )
}
