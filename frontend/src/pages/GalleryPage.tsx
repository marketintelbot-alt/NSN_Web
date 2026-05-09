import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Seo } from '../components/seo/Seo'
import { CtaBanner } from '../components/ui/CtaBanner'
import { FadeIn } from '../components/ui/FadeIn'
import { PageHero } from '../components/ui/PageHero'
import { SectionIntro } from '../components/ui/SectionIntro'
import { galleryStories } from '../content/site'

export function GalleryPage() {
  return (
    <>
      <Seo
        title="Gallery"
        description="Browse clean, premium marine care imagery and seasonal detailing presentation from North Shore Nautical."
        path="/gallery"
      />

      <PageHero
        eyebrow="Gallery"
        title="A bright, premium look built around clean finishes and summer-ready boats."
        description="Browse selected details, seasonal presentation, and project-ready imagery from North Shore Nautical."
      >
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link className="button-primary w-full justify-center sm:w-auto" to="/booking">
            Book Marine Care
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link className="button-secondary w-full justify-center sm:w-auto" to="/contact">
            Request an Estimate
          </Link>
        </div>
      </PageHero>

      <section className="section-pad">
        <div className="container">
          <SectionIntro
            label="Seasonal Presentation"
            title="Clean presentation for boats that should look ready to use."
            copy="The gallery focuses on finish quality, practical upkeep, and the kind of refreshed presentation owners want before time on the water."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {galleryStories.map((story, index) => (
              <FadeIn
                key={story.title}
                className="overflow-hidden rounded-[2rem] border border-ink/10 bg-[#f8fbf7]/90 shadow-soft"
                delay={index * 0.06}
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#edf5fa]">
                  <img
                    alt={story.caption}
                    className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]"
                    src={story.image}
                  />
                </div>
                <div className="p-6 md:p-7">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-navy/70">
                    North Shore Nautical
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-ink">{story.title}</h2>
                  <p className="mt-3 text-base leading-8 text-slate">{story.caption}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner
        title="Ready to submit your service request?"
        copy="Use the booking flow for routine marine care or the inquiry path for heavier-condition work, custom scopes, and advisory support."
        primaryLabel="Book Marine Care"
        primaryTo="/booking"
        secondaryLabel="Explore Services"
        secondaryTo="/services"
      />
    </>
  )
}
