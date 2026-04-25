import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
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
  marineCareHighlights,
  serviceAreas,
  siteMeta,
  trustHighlights,
} from '../content/site'

export function HomePage() {
  return (
    <>
      <Seo
        title="Premium Boat Detailing & Marine Care on Chicago’s North Shore"
        description="Professional detailing, seasonal upkeep, and owner advisory designed to keep your boat clean, protected, and ready to enjoy all summer."
        path="/"
        image={siteMeta.heroImage}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: siteMeta.name,
          slogan: siteMeta.tagline,
          url: siteMeta.siteUrl,
          description: siteMeta.description,
          areaServed: serviceAreas,
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
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/76 md:text-xl">
              Professional detailing, seasonal upkeep, and owner advisory designed to keep your boat
              clean, protected, and ready to enjoy all summer.
            </p>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/76">{brandPromise}</p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
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
            copy="North Shore Nautical is positioned around detailing, upkeep, finish care, and condition-aware service planning. Advisory is available, but the public experience should lead with premium marine care."
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

      <section className="section-pad bg-white/60">
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
            copy="Advisory is framed as buying guidance, upkeep planning, seasonal support, and referral direction with clear owner-side boundaries."
          />
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <SectionIntro
            align="center"
            label="Why Owners Choose North Shore Nautical"
            title="Clear communication, polished work, and a summer-ready feel without the clutter."
            copy="Every section of the public site is built to feel bright, calm, and intentional because that is the same standard the service experience should carry."
          />
          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            {trustHighlights.map((highlight, index) => (
              <FadeIn key={highlight} className="rounded-3xl border border-ink/10 bg-white/80 px-5 py-5" delay={index * 0.05}>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-lake" />
                  <p className="text-base leading-8 text-slate">{highlight}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-white/60">
        <div className="container">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <SectionIntro
              label="Gallery"
              title="The gallery is ready for richer media, and the structure already feels polished."
              copy="The current image set is enough to support a polished public debut while keeping the gallery ready for seasonal updates, fresh project photos, and before-and-after stories."
            />
            <Link className="button-quiet justify-start md:justify-center" to="/gallery">
              View full gallery
            </Link>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {galleryStories.slice(0, 2).map((story, index) => (
              <FadeIn key={story.title} className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white/84 shadow-soft" delay={index * 0.08}>
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    alt={story.title}
                    className="h-full w-full object-cover"
                    src={story.image}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-semibold text-ink">{story.title}</h3>
                  <p className="mt-3 text-base leading-8 text-slate">{story.caption}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <SectionIntro
            label="Common Questions"
            title="A few clear answers before you submit."
            copy="The public site should make the flow obvious: care first, advisory second, and request review before any appointment is confirmed."
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
    </>
  )
}
