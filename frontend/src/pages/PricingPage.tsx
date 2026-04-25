import { useEffect, useMemo, useState } from 'react'

import { ArrowRight, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Seo } from '../components/seo/Seo'
import { FadeIn } from '../components/ui/FadeIn'
import { PageHero } from '../components/ui/PageHero'
import { SectionIntro } from '../components/ui/SectionIntro'
import { apiRequest } from '../lib/api'
import type { PublicServiceCatalogResponse, ServiceCatalogItem } from '../types/service'

function groupServices(services: ServiceCatalogItem[]) {
  return {
    instantCheckout: services.filter(
      (service) => service.category === 'marine_care' && !service.quoteOnly,
    ),
    quoteOnly: services.filter((service) => service.quoteOnly),
    advisory: services.filter((service) => service.category === 'advisory'),
  }
}

export function PricingPage() {
  const [services, setServices] = useState<ServiceCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadCatalog() {
      const response = await apiRequest<PublicServiceCatalogResponse>('/api/services/catalog')

      if (!isMounted) {
        return
      }

      setLoading(false)

      if (!response.ok) {
        setMessage(response.payload.message || 'We could not load pricing right now.')
        return
      }

      setServices(response.payload.services)
    }

    void loadCatalog()

    return () => {
      isMounted = false
    }
  }, [])

  const groupedServices = useMemo(() => groupServices(services), [services])

  return (
    <>
      <Seo
        title="Pricing"
        description="View instant-checkout marine care pricing, quote-only specialty work, and advisory request options for North Shore Nautical."
        path="/pricing"
      />

      <PageHero
        eyebrow="Pricing"
        title="Transparent pricing for routine marine care, with quote review for specialty work."
        description="Per-foot services can move to secure checkout after the estimate is calculated. Restoration, heavier-condition work, and advisory requests stay inquiry-first."
      />

      <section className="section-pad">
        <div className="container">
          <SectionIntro
            label="How Pricing Works"
            title="Per-foot pricing stays clear. Heavier-condition work gets reviewed first."
            copy="Boat length is rounded up to the nearest whole foot for instant checkout services. Requests above 60 feet, condition-heavy jobs, and advisory work are routed to manual review."
          />

          {loading ? (
            <div className="mt-10 flex items-center gap-3 rounded-3xl border border-ink/10 bg-white/80 px-5 py-4 text-sm text-slate">
              <LoaderCircle className="h-4 w-4 animate-spin text-lake" />
              Loading pricing...
            </div>
          ) : null}

          {message ? (
            <div className="mt-10 rounded-3xl border border-[#ead4bf] bg-[#fffaf4] px-5 py-4 text-sm text-[#6e4f38]">
              {message}
            </div>
          ) : null}

          {!loading && !message ? (
            <>
              <div className="mt-10">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-navy/70">
                  Instant Checkout Services
                </h2>
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  {groupedServices.instantCheckout.map((service, index) => (
                    <FadeIn key={service.id} className="panel p-6" delay={index * 0.06}>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-2xl font-semibold text-ink">{service.name}</h3>
                          <p className="mt-3 max-w-xl text-base leading-8 text-slate">
                            {service.description}
                          </p>
                        </div>
                        <span className="status-pill">{service.pricingLabel}</span>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <span className="rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                          Instant checkout eligible
                        </span>
                        {service.requiresBoatLength ? (
                          <span className="rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                            {service.minBoatLengthFeet}-{service.maxBoatLengthFeet} ft
                          </span>
                        ) : null}
                      </div>
                      {service.warningNotes.length > 0 ? (
                        <p className="mt-4 text-sm leading-7 text-slate">{service.warningNotes[0]}</p>
                      ) : null}
                      <div className="mt-6">
                        <Link className="button-primary" to={`/booking?service=${service.id}`}>
                          {service.quoteOnly ? 'Request an Estimate' : 'Book This Service'}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </div>

              <div className="mt-14">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-navy/70">
                  Quote-Only Services
                </h2>
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  {[...groupedServices.quoteOnly, ...groupedServices.advisory].map(
                    (service, index) => (
                      <FadeIn key={service.id} className="soft-panel p-6" delay={index * 0.06}>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h3 className="text-2xl font-semibold text-ink">{service.name}</h3>
                            <p className="mt-3 max-w-xl text-base leading-8 text-slate">
                              {service.description}
                            </p>
                          </div>
                          <span className="status-pill">{service.pricingLabel}</span>
                        </div>
                        {service.warningNotes.length > 0 ? (
                          <div className="mt-4 grid gap-2 text-sm leading-7 text-slate">
                            {service.warningNotes.map((note) => (
                              <p key={note}>{note}</p>
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-6">
                          <Link className="button-secondary" to={`/booking?service=${service.id}`}>
                            Submit for Review
                          </Link>
                        </div>
                      </FadeIn>
                    ),
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </section>
    </>
  )
}
