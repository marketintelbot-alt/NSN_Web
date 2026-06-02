import { useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Seo } from '../components/seo/Seo'
import { CtaBanner } from '../components/ui/CtaBanner'
import { FadeIn } from '../components/ui/FadeIn'
import { PageHero } from '../components/ui/PageHero'
import { SectionIntro } from '../components/ui/SectionIntro'
import { galleryCategories, galleryStories, type GalleryStory } from '../content/site'

function GalleryStoryCard({ story, index }: { story: GalleryStory; index: number }) {
  const comparisonImages =
    story.beforeImage && story.afterImage
      ? [
          {
            label: 'Before',
            image: story.beforeImage,
            alt: story.beforeAlt ?? `${story.title} before detailing`,
          },
          {
            label: 'After',
            image: story.afterImage,
            alt: story.afterAlt ?? `${story.title} after detailing`,
          },
        ]
      : null

  return (
    <FadeIn
      key={story.title}
      className={`overflow-hidden rounded-[2rem] border border-ink/10 bg-[#f8fbf7]/90 shadow-soft ${
        comparisonImages ? 'lg:col-span-2' : ''
      }`}
      delay={index * 0.06}
    >
      {comparisonImages ? (
        <div className="grid grid-cols-2 gap-px bg-ink/10">
          {comparisonImages.map((item) => (
            <div key={item.label} className="relative aspect-[3/4] overflow-hidden bg-[#edf5fa]">
              <img
                alt={item.alt}
                className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]"
                src={item.image}
              />
              <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white shadow-soft sm:left-4 sm:top-4">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="aspect-[4/3] overflow-hidden bg-[#edf5fa]">
          <img
            alt={story.imageAlt}
            className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]"
            src={story.image}
          />
        </div>
      )}
      <div className="p-6 md:p-7">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-navy/70">
          {story.category}
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-ink">{story.title}</h2>
        <p className="mt-3 text-base leading-8 text-slate">{story.caption}</p>
        {story.tags ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {story.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-ink/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </FadeIn>
  )
}

export function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState('all')

  const categoryCounts = useMemo(() => {
    return galleryStories.reduce<Record<string, number>>(
      (counts, story) => ({
        ...counts,
        [story.categorySlug]: (counts[story.categorySlug] ?? 0) + 1,
      }),
      { all: galleryStories.length },
    )
  }, [])

  const visibleStories = useMemo(() => {
    if (activeCategory === 'all') {
      return galleryStories
    }

    return galleryStories.filter((story) => story.categorySlug === activeCategory)
  }, [activeCategory])

  return (
    <>
      <Seo
        title="Gallery"
        description="Browse Sea Doo before-and-after detailing, marine care imagery, and seasonal detailing presentation from North Shore Nautical."
        path="/gallery"
      />

      <PageHero
        eyebrow="Gallery"
        title="Before-and-after marine care organized by the boat or watercraft owners know best."
        description="Choose a category, compare similar work, and see the kind of cleaned-up presentation North Shore Nautical builds toward."
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
            label="Work Gallery"
            title="Find examples that feel close to your own boat or watercraft."
            copy="Gallery categories are grouped around recognizable boat and personal watercraft types, with before-and-after projects highlighted when matching photos are available."
          />

          <div className="mt-10 flex flex-wrap gap-3" aria-label="Gallery categories">
            {galleryCategories.map((category) => {
              const isActive = activeCategory === category.slug
              const count = categoryCounts[category.slug] ?? 0

              return (
                <button
                  key={category.slug}
                  type="button"
                  aria-pressed={isActive}
                  className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                    isActive
                      ? 'border-ink bg-ink text-white'
                      : 'border-ink/10 bg-[#f8fbf7]/90 text-ink hover:border-lake/40 hover:bg-lake/10'
                  }`}
                  onClick={() => setActiveCategory(category.slug)}
                >
                  {category.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.68rem] ${
                      isActive ? 'bg-white/15 text-white' : 'bg-lake/15 text-slate'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {visibleStories.map((story, index) => (
              <GalleryStoryCard key={story.title} story={story} index={index} />
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
