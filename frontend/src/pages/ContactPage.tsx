import { CalendarClock, Globe2, Mail, MapPin, Phone, ShieldCheck, Sparkles } from 'lucide-react'

import { MarineServiceRequestForm } from '../components/service-request/MarineServiceRequestForm'
import { Seo } from '../components/seo/Seo'
import { CtaBanner } from '../components/ui/CtaBanner'
import { FadeIn } from '../components/ui/FadeIn'
import { PageHero } from '../components/ui/PageHero'
import { publicContact, serviceAreas, siteMeta } from '../content/site'

const contactCards = [
  {
    title: 'Inquiry review',
    copy:
      'Use the form to share service interest, boat details, timing, and notes. North Shore Nautical reviews every inquiry directly before following up.',
    icon: Mail,
  },
  {
    title: 'Scheduling expectations',
    copy:
      'Requested date and time helps North Shore Nautical review fit, marina context, and approval timing in the business time zone.',
    icon: CalendarClock,
  },
  {
    title: 'Clear follow-up',
    copy:
      'A North Shore Nautical team member will follow up directly if additional access details, condition notes, or scope clarification is needed.',
    icon: ShieldCheck,
  },
]

export function ContactPage() {
  return (
    <>
      <Seo
        title="Contact"
        description="Contact North Shore Nautical for marine detailing, boat detailing, and marine care across Chicago’s North Shore."
        path="/contact"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: siteMeta.name,
          url: publicContact.websiteUrl,
          telephone: publicContact.phoneE164,
          email: publicContact.emailDisplay,
          description:
            'Marine detailing and care services for boat owners across Chicago’s North Shore.',
          areaServed: serviceAreas,
          serviceType: ['Marine detailing', 'Boat detailing', 'Marine care'],
        }}
      />

      <PageHero
        eyebrow="Contact"
        title="A professional inquiry form built for marine care requests, estimates, and owner advisory."
        description="North Shore Nautical keeps contact simple: submit the key details once, route the request to review, and let the team follow up directly."
      />

      <section className="section-pad">
        <div className="container grid gap-10">
          <FadeIn className="panel p-6 md:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-navy/70">
                  Contact North Shore Nautical
                </p>
                <h2 className="mt-3 font-display text-4xl font-semibold text-ink">
                  {publicContact.businessName}
                </h2>
                <p className="mt-4 text-base leading-8 text-slate">
                  {publicContact.categoryLine}. {publicContact.serviceAreaLine}.
                </p>
                <p className="mt-3 text-sm leading-7 text-slate">
                  {publicContact.mobileServiceStatement}
                </p>
              </div>

              <div className="grid gap-4 text-sm leading-7 text-slate">
                <div className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-[#f8fbf7]/90 px-4 py-4">
                  <Phone className="mt-1 h-5 w-5 shrink-0 text-lake" />
                  <a className="font-semibold text-ink hover:text-lake" href={publicContact.phoneHref}>
                    Phone: {publicContact.phoneDisplay}
                  </a>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-[#f8fbf7]/90 px-4 py-4">
                  <Mail className="mt-1 h-5 w-5 shrink-0 text-lake" />
                  <a className="font-semibold text-ink hover:text-lake" href={publicContact.emailHref}>
                    Email: {publicContact.emailDisplay}
                  </a>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-[#f8fbf7]/90 px-4 py-4">
                  <Globe2 className="mt-1 h-5 w-5 shrink-0 text-lake" />
                  <a className="font-semibold text-ink hover:text-lake" href={publicContact.websiteUrl}>
                    Website: {publicContact.websiteUrl}
                  </a>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-[#f8fbf7]/90 px-4 py-4">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-lake" />
                  <p>
                    Service area: Chicago’s North Shore / North Shore suburbs, including{' '}
                    {serviceAreas.slice(1, 10).join(', ')}.
                  </p>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/70">
                  {publicContact.officialWebsiteLine}
                </p>
              </div>
            </div>
          </FadeIn>

          <div className="grid gap-5 lg:grid-cols-3">
            {contactCards.map((item, index) => {
              const Icon = item.icon
              return (
                <FadeIn key={item.title} className="soft-panel p-6" delay={index * 0.06}>
                  <Icon className="h-5 w-5 text-lake" />
                  <h2 className="mt-4 text-2xl font-semibold text-ink">{item.title}</h2>
                  <p className="mt-3 text-base leading-8 text-slate">{item.copy}</p>
                </FadeIn>
              )
            })}
          </div>

          <FadeIn className="rounded-3xl border border-ink/10 bg-[#f8fbf7]/90 px-5 py-4 text-sm leading-7 text-slate">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 h-5 w-5 shrink-0 text-lake" />
              <span>
                Photo upload is not part of the public form yet. If photos would help clarify the scope, North Shore Nautical can request them during follow-up.
              </span>
            </div>
          </FadeIn>

          <MarineServiceRequestForm mode="contact" />
        </div>
      </section>

      <CtaBanner
        title="Prefer to compare services before submitting?"
        copy="Explore marine care pricing, review quote-only services, and then return here if the request needs a more tailored scope."
        primaryLabel="View Pricing"
        primaryTo="/pricing"
        secondaryLabel="Explore Services"
        secondaryTo="/services"
      />
    </>
  )
}
