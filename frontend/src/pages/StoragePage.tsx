import { ArrowRight, CalendarClock, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { FadeIn } from '../components/ui/FadeIn'
import { CtaBanner } from '../components/ui/CtaBanner'
import { SectionIntro } from '../components/ui/SectionIntro'

export function StoragePage() {
  return (
    <>
      <Seo
        title="Boat Storage"
        description="North Shore Nautical offers secure, organized, professionally managed boat storage for owners across Chicago's North Shore."
        path="/storage"
      />
      <PageHero
        eyebrow="Boat Storage"
        title="Secure, organized storage with launch readiness built into the process."
        description="Storage at North Shore Nautical is presented as a managed service, not simply a place to leave a boat. The result is calmer launch scheduling, better preparation, and faster repeat reservations."
      />

      <section className="section-pad">
        <div className="container grid gap-12 lg:grid-cols-[0.92fr_1.08fr]">
          <FadeIn className="panel self-start p-8 md:p-10">
            <SectionIntro
              label="Overview"
              title="Professionally managed from intake through launch planning."
              copy="Owners trust storage when the process feels orderly. North Shore Nautical approaches storage with documentation-minded handling, clean communication, and a focus on future access."
            />
          </FadeIn>
          <div className="grid gap-6">
            {[
              {
                icon: LockKeyhole,
                title: 'Organized storage handling',
                copy:
                  'Storage placement, access planning, and retrieval coordination are managed in a way that protects timing and reduces avoidable friction.',
              },
              {
                icon: ShieldCheck,
                title: 'Condition-conscious oversight',
                copy:
                  'Storage is paired with a premium service mindset, with attention to presentation, handling notes, and the expectations that come with high-trust ownership.',
              },
              {
                icon: CalendarClock,
                title: 'Launch coordination built in',
                copy:
                  'Because storage and launch planning sit within the same service model, reservation requests can be reviewed with cleaner context and better preparation.',
              },
            ].map((item, index) => (
              <FadeIn key={item.title} className="soft-panel p-7" delay={index * 0.08}>
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-lake" />
                  <h2 className="text-xl font-semibold text-ink">{item.title}</h2>
                </div>
                <p className="mt-3 text-base leading-8 text-slate">{item.copy}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-[#eff4f6]">
        <div className="container grid gap-8 lg:grid-cols-2">
          <FadeIn className="panel p-8">
            <span className="section-label">What Storage Includes</span>
            <ul className="mt-6 grid gap-4 text-base leading-8 text-slate">
              <li className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-lake" />
                <span>Structured storage intake and organized handling procedures</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-lake" />
                <span>Clear coordination around access, retrieval, and future launch plans</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-lake" />
                <span>Service continuity between storage status and launch-day preparation</span>
              </li>
            </ul>
          </FadeIn>

          <FadeIn className="panel p-8" delay={0.08}>
            <span className="section-label">How Launch Coordination Fits</span>
            <p className="mt-6 text-base leading-8 text-slate">
              When your boat is already stored with North Shore Nautical, reservation
              requests can be reviewed with better awareness of location, readiness,
              and handling context. That creates a smoother path from advance request
              to launch-day delivery.
            </p>
            <Link className="button-dark mt-8" to="/reserve-launch">
              Submit a Reservation Request
              <ArrowRight className="h-4 w-4" />
            </Link>
          </FadeIn>
        </div>
      </section>

      <CtaBanner
        title="Storage that supports the rest of the ownership experience."
        copy="If you want launch timing, readiness, and communication to feel more orderly, start with a service conversation about storage and coordination."
        primaryLabel="Contact North Shore Nautical"
        primaryTo="/contact"
        secondaryLabel="Reserve Launch"
        secondaryTo="/reserve-launch"
      />
    </>
  )
}
