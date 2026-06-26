import { ArrowRight, CheckCircle2, Mail, Phone, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Seo } from '../components/seo/Seo'
import { CtaBanner } from '../components/ui/CtaBanner'
import { FadeIn } from '../components/ui/FadeIn'
import { FaqList } from '../components/ui/FaqList'
import { SectionIntro } from '../components/ui/SectionIntro'
import {
  advisoryHighlights,
  brandPromise,
  faqItems,
  galleryStories,
  homeMetrics,
  localSearchFocus,
  marineCareHighlights,
  publicContact,
  serviceAreas,
  siteMeta,
  teamMembers,
  trustHighlights,
} from '../content/site'

export function HomePage() {
  return (
    <>
      <Seo
        title="Premium Boat Detailing & Marine Care on Chicago’s North Shore"
        description="North Shore Nautical provides marine detailing, boat detailing, marine care, and owner advisory for Chicago’s North Shore."
        path="/"
        image={siteMeta.heroImage}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: siteMeta.name,
          slogan: siteMeta.tagline,
          url: publicContact.websiteUrl,
          telephone: publicContact.phoneE164,
          email: publicContact.emailDisplay,
          description: siteMeta.description,
          areaServed: serviceAreas,
          knowsAbout: [
            'Wilmette boat detailing',
            'Winnetka boat detailing',
            'Wilmette Harbor marine care',
            'Lake Michigan boat detailing',
          ],
          serviceType: ['Marine detailing', 'Boat cleaning', 'Marine care', 'Boat owner advisory'],
        }}
      />

      <section className="relative min-h-[92svh] overflow-hidden bg-ink pt-28 text-white md:pt-36">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${siteMeta.heroImage})`,
          }}
        />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-[#f7fbff]" />

        <div className="container relative flex min-h-[calc(92svh-7rem)] items-end pb-16 md:pb-20">
          <FadeIn className="max-w-4xl">
            <span className="eyebrow">{siteMeta.tagline}</span>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-white/80">
              Chicago&apos;s North Shore
            </p>
            <h1 className="display-title-inverse mt-4 max-w-5xl">
              Premium Boat Detailing &amp; Marine Care on Chicago&apos;s North Shore
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90 md:text-xl">
              Professional detailing, seasonal upkeep, and owner advisory designed to keep your boat
              clean, protected, and ready to enjoy all summer.
            </p>
            <p className="mt-5 hidden max-w-2xl text-base leading-8 text-white/90 sm:block">
              {brandPromise}
            </p>
            <p className="mt-4 hidden max-w-2xl text-sm leading-7 text-white/85 md:block">
              {localSearchFocus}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
              <Link className="button-primary w-full justify-center sm:w-auto" to="/booking">
                Book Marine Care
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link className="button-secondary w-full justify-center sm:w-auto" to="/pricing">
                Request an Estimate
              </Link>
              <Link className="button-secondary w-full justify-center sm:w-auto" to="/services">
                Explore Services
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="grid gap-6 lg:grid-cols-3">
            {homeMetrics.map((metric, index) => (
              <FadeIn key={metric.label} className="soft-panel p-6" delay={index * 0.06}>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-navy/70">
                  {metric.label}
                </p>
                <h2 className="mt-4 font-display text-4xl font-semibold text-ink">{metric.value}</h2>
                <p className="mt-3 text-sm leading-7 text-slate">{metric.description}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <SectionIntro
            label="Marine Care"
            title="Marine care is the first conversation, not an add-on."
            copy="Detailing, upkeep, finish care, and condition-aware service planning are at the heart of North Shore Nautical. Practical owner advisory is available whenever the next step needs a little more thought."
          />
          <div className="grid gap-5">
            {marineCareHighlights.map((item, index) => (
              <FadeIn key={item.title} className="panel p-6 md:p-7" delay={index * 0.08}>
                <div className="flex items-start gap-4">
                  <span className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-lake/14 text-lake">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-2xl font-semibold text-ink">{item.title}</h3>
                    <p className="mt-3 text-base leading-8 text-slate">{item.description}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-[#edf6f2]/60">
        <div className="container grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="grid gap-5">
            {advisoryHighlights.map((item, index) => (
              <FadeIn key={item.title} className="soft-panel p-6 md:p-7" delay={index * 0.08}>
                <h3 className="text-2xl font-semibold text-ink">{item.title}</h3>
                <p className="mt-3 text-base leading-8 text-slate">{item.description}</p>
              </FadeIn>
            ))}
          </div>
          <SectionIntro
            label="Advisory"
            title="Owner advisory that stays practical."
            copy="Get practical buying guidance, upkeep planning, seasonal support, and trusted referral direction without unnecessary complexity."
          />
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <SectionIntro
            align="center"
            label="Why Owners Choose North Shore Nautical"
            title="Clear communication, polished work, and a summer-ready feel without the clutter."
            copy="Owners get straightforward communication, tidy scheduling expectations, and care work focused on keeping the boat protected for the season."
          />
          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            {trustHighlights.map((highlight, index) => (
              <FadeIn key={highlight} className="rounded-3xl border border-ink/10 bg-[#f8fbf7]/85 px-5 py-5 backdrop-blur-sm" delay={index * 0.05}>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-lake" />
                  <p className="text-base leading-8 text-slate">{highlight}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-[#edf6f2]/60">
        <div className="container">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <SectionIntro
              label="Gallery"
              title="Clean finishes, careful details, and a closer look at the work."
              copy="A concise gallery highlights the presentation owners can expect, with room for fresh seasonal photos and before-and-after projects as the season grows."
            />
            <Link className="button-quiet justify-start md:justify-center" to="/gallery">
              View full gallery
            </Link>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {galleryStories.slice(0, 2).map((story, index) => {
              const comparisonImages =
                story.beforeImage && story.afterImage
                  ? [
                      {
                        alt: story.beforeAlt ?? `${story.title} before detailing`,
                        image: story.beforeImage,
                        label: 'Before',
                      },
                      {
                        alt: story.afterAlt ?? `${story.title} after detailing`,
                        image: story.afterImage,
                        label: 'After',
                      },
                    ]
                  : null

              return (
                <FadeIn
                  key={story.title}
                  className="overflow-hidden rounded-[2rem] border border-ink/10 bg-[#f8fbf7]/90 shadow-soft"
                  delay={index * 0.08}
                >
                  {comparisonImages ? (
                    <div className="grid grid-cols-2 gap-px bg-ink/10">
                      {comparisonImages.map((item) => (
                        <div key={item.label} className="relative aspect-[3/4] overflow-hidden">
                          <img
                            alt={item.alt}
                            className="h-full w-full object-cover"
                            decoding={index === 0 ? 'sync' : 'async'}
                            loading={index === 0 ? 'eager' : 'lazy'}
                            src={item.image}
                          />
                          <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white shadow-soft">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        alt={story.imageAlt}
                        className="h-full w-full object-cover"
                        decoding={index === 0 ? 'sync' : 'async'}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        src={story.image}
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-2xl font-semibold text-ink">{story.title}</h3>
                    <p className="mt-3 text-base leading-8 text-slate">{story.caption}</p>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <SectionIntro
            label="Common Questions"
            title="A few clear answers before you submit."
            copy="Start with the service that fits your boat. Routine care can go through booking, while heavier-condition work and advisory requests go through review first."
          />
          <div className="mt-10">
            <FaqList items={faqItems} />
          </div>
        </div>
      </section>

      <CtaBanner
        title="Ready to price the work or submit your request?"
        copy="Choose an instant-checkout marine care service or route the request to review when the boat needs heavier-condition work, advisory support, or a custom scope."
        primaryLabel="Book Marine Care"
        primaryTo="/booking"
        secondaryLabel="View Pricing"
        secondaryTo="/pricing"
      />

      <section className="section-pad bg-[#edf6f2]/60">
        <div className="container">
          <SectionIntro
            align="center"
            label="Direct Contacts"
            title="Carter Ellis and Johnny Maris are your direct North Shore Nautical contacts."
            copy="We are lifelong boaters with 10+ years of experience."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {teamMembers.map((member, index) => (
              <FadeIn key={member.name} className="panel p-6 md:p-7" delay={index * 0.08}>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-[#edf6f2]/90 font-display text-3xl font-semibold text-ink shadow-soft">
                    {member.initials}
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-ink">{member.name}</h2>
                    <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-navy/70">
                      {member.role}
                    </p>
                  </div>
                </div>
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
    </>
  )
}
