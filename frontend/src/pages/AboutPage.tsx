import { ArrowRight, Mail, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Seo } from '../components/seo/Seo'
import { CtaBanner } from '../components/ui/CtaBanner'
import { FadeIn } from '../components/ui/FadeIn'
import { PageHero } from '../components/ui/PageHero'
import { SectionIntro } from '../components/ui/SectionIntro'
import { publicContact, serviceAreas, teamMembers } from '../content/site'

export function AboutPage() {
  return (
    <>
      <Seo
        title="About Us"
        description="About North Shore Nautical, a marine detailing and care team serving Chicago’s North Shore."
        path="/about"
      />

      <PageHero
        eyebrow="About Us"
        title="A local marine care team built around clean boats, clear communication, and practical follow-through."
        description="North Shore Nautical is run by Carter Ellis and Johnny Maris. We are lifelong boaters with 10+ years of experience."
      >
        <Link className="button-primary w-full justify-center sm:w-auto" to="/booking">
          Book Marine Care
          <ArrowRight className="h-4 w-4" />
        </Link>
      </PageHero>

      <section className="section-pad">
        <div className="container">
          <FadeIn className="panel p-6 md:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <SectionIntro
                label="About North Shore Nautical"
                title="Marine detailing and care for Chicago’s North Shore."
                copy="North Shore Nautical provides marine detailing, interior refreshes, maintenance details, exterior washes, restoration support, and owner advisory services for boat owners across Chicago’s North Shore."
              />
              <div className="grid gap-4 text-sm leading-7 text-slate">
                <p>
                  {publicContact.mobileServiceStatement}
                </p>
                <p>
                  Service area includes {serviceAreas.join(', ')}.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="section-pad">
        <div className="container grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionIntro
            label="The Team"
            title="Two direct contacts, one shared service standard."
            copy="We are lifelong boaters with 10+ years of experience."
          />

          <div className="grid gap-5 md:grid-cols-2">
            {teamMembers.map((member, index) => (
              <FadeIn key={member.name} className="panel p-6 md:p-7" delay={index * 0.08}>
                <h2 className="text-3xl font-semibold text-ink">{member.name}</h2>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-navy/70">
                  {member.role}
                </p>
                <div className="mt-6 grid gap-3">
                  <a className="button-secondary w-full justify-center" href={member.phoneHref}>
                    <Phone className="h-4 w-4" />
                    {member.phoneDisplay}
                  </a>
                  <a className="button-secondary w-full justify-center" href={member.emailHref}>
                    <Mail className="h-4 w-4" />
                    {member.emailDisplay}
                  </a>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-[#edf6f2]/60">
        <div className="container">
          <div className="panel grid gap-8 p-6 md:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <SectionIntro
              label="How We Work"
              title="Review first, approve second, capture payment only after approval."
              copy="The site can estimate eligible marine care services, but North Shore Nautical still reviews condition, access, timing, and safety before work is confirmed."
            />
            <div className="grid gap-4 text-sm leading-7 text-slate">
              <p>
                Routine work stays simple: choose the service, share the boat details, and submit the preferred date and time.
              </p>
              <p>
                If the boat needs heavier correction, has unsafe access, or falls outside the standard scope, the request moves into manual review before scheduling or payment approval.
              </p>
            </div>
          </div>
        </div>
      </section>

      <CtaBanner
        title="Ready to talk through your boat?"
        copy="Use the booking flow for marine care or send an inquiry when the condition, timing, or access needs a closer look."
        primaryLabel="Book Marine Care"
        primaryTo="/booking"
        secondaryLabel="Contact Us"
        secondaryTo="/contact"
      />
    </>
  )
}
