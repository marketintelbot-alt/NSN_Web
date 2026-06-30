import { useEffect, useMemo, useState } from 'react'

import { ArrowRight, AlertTriangle, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Seo } from '../components/seo/Seo'
import { FadeIn } from '../components/ui/FadeIn'
import { PageHero } from '../components/ui/PageHero'
import { SectionIntro } from '../components/ui/SectionIntro'
import { pricingConditionNotes } from '../content/site'
import { apiRequest } from '../lib/api'
import {
  formatCurrency,
  maximumBoatLengthFeet,
  minimumBoatLengthFeet,
  publishedEstimateMaximumBoatLengthFeet,
} from '../lib/servicePricing'
import type { PublicServiceCatalogResponse, ServiceCatalogItem } from '../types/service'

const maintenancePackageNames = new Set([
  'Interior Refresh',
  'Maintenance Detail',
  'Signature Detail',
  'Restoration Detail',
])

function isMaintenancePackage(service: ServiceCatalogItem) {
  return maintenancePackageNames.has(service.name)
}

function groupServices(services: ServiceCatalogItem[]) {
  return {
    maintenancePackages: services.filter(
      (service) => service.category === 'marine_care' && isMaintenancePackage(service),
    ),
    additionalMarineCare: services.filter(
      (service) =>
        service.category === 'marine_care' &&
        !isMaintenancePackage(service) &&
        service.pricingModel !== 'custom',
    ),
    customReview: services.filter(
      (service) =>
        service.category === 'marine_care' &&
        !isMaintenancePackage(service) &&
        service.pricingModel === 'custom',
    ),
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
        description="View starting marine care pricing, custom-review specialty work, and invoice-after-review request options for North Shore Nautical."
        path="/pricing"
      />

      <PageHero
        eyebrow="Pricing"
        title="Transparent pricing for routine marine care, with quote review for specialty work."
        description="Published rates are starting estimates. Every request is reviewed before scheduling and invoicing so scope, condition, and access stay clear."
      />

      <section className="section-pad">
        <div className="container">
          <SectionIntro
            label="How Pricing Works"
            title="Flat and per-foot pricing stay clear. Heavier-condition work gets reviewed first."
            copy={`Published starting estimates assume routine condition and boats from ${minimumBoatLengthFeet}-${publishedEstimateMaximumBoatLengthFeet} feet. Boats over ${publishedEstimateMaximumBoatLengthFeet} feet and up to ${maximumBoatLengthFeet} feet, heavier-condition jobs, and unusual access are reviewed directly before invoice pricing is finalized.`}
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {pricingConditionNotes.map((note) => (
              <div
                key={note.title}
                className="rounded-3xl border border-gold/25 bg-[#f8fbf7]/88 px-5 py-5 shadow-soft backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-gold" />
                  <div>
                    <h2 className="text-lg font-semibold text-ink">{note.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-slate">{note.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="mt-10 flex items-center gap-3 rounded-3xl border border-ink/10 bg-[#f8fbf7]/90 px-5 py-4 text-sm text-slate">
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
              <div className="mt-10 rounded-[2rem] border border-lake/20 bg-[#edf6f2]/76 p-5 shadow-soft md:p-7">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-navy/70">
                      Maintenance Packages
                    </p>
                    <h2 className="mt-3 max-w-3xl text-3xl font-semibold text-ink md:text-4xl">
                      Choose the service block that matches the level of care the boat needs.
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate">
                      These are the core North Shore Nautical packages. Routine boats from{' '}
                      {minimumBoatLengthFeet}-{publishedEstimateMaximumBoatLengthFeet} ft can use the
                      published starting estimate; larger boats, restoration, and heavier-condition work
                      are reviewed before invoice pricing is finalized.
                    </p>
                  </div>
                  <Link className="button-secondary shrink-0" to="/booking">
                    Start a Request
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {groupedServices.maintenancePackages.map((service, index) => (
                    <FadeIn
                      key={service.id}
                      className="flex h-full flex-col rounded-3xl border border-white/80 bg-[#f8fbf7]/95 p-5 shadow-soft"
                      delay={index * 0.06}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h3 className="text-xl font-semibold text-ink">{service.name}</h3>
                        <span className="status-pill">{service.pricingLabel}</span>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-slate">{service.description}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <span className="rounded-full border border-ink/10 bg-white/70 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate">
                          Invoice review
                        </span>
                        {service.requiresBoatLength ? (
                          <span className="rounded-full border border-ink/10 bg-white/70 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate">
                            {service.pricingModel === 'starting_at_per_foot'
                              ? `Review up to ${maximumBoatLengthFeet} ft`
                              : `Estimate ${service.minBoatLengthFeet}-${publishedEstimateMaximumBoatLengthFeet} ft`}
                          </span>
                        ) : null}
                      </div>
                      {service.warningNotes.length > 0 ? (
                        <p className="mt-4 text-xs leading-6 text-slate/90">
                          {service.warningNotes[0]}
                        </p>
                      ) : null}
                      {service.contractValueCents ? (
                        <p className="mt-3 text-xs leading-6 text-slate/90">
                          Interior Refresh packages start at{' '}
                          {formatCurrency(service.contractValueCents)} per week.
                        </p>
                      ) : null}
                      <div className="mt-auto pt-5">
                        <Link
                          className="button-primary w-full"
                          to={`/booking?service=${service.id}`}
                        >
                          Request This Package
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </div>

              <div className="mt-14">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-navy/70">
                  Additional Marine Care
                </h2>
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  {groupedServices.additionalMarineCare.map((service, index) => (
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
                        <span className="rounded-full border border-ink/10 bg-[#f8fbf7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                          Invoice review
                        </span>
                        {service.requiresBoatLength ? (
                          <span className="rounded-full border border-ink/10 bg-[#f8fbf7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate">
                            Estimate {service.minBoatLengthFeet}-{publishedEstimateMaximumBoatLengthFeet} ft
                          </span>
                        ) : null}
                      </div>
                      {service.warningNotes.length > 0 ? (
                        <p className="mt-4 text-sm leading-7 text-slate">{service.warningNotes[0]}</p>
                      ) : null}
                      {service.contractValueCents ? (
                        <p className="mt-3 text-sm leading-7 text-slate">
                          Interior Refresh packages start at{' '}
                          {formatCurrency(service.contractValueCents)} per week for approved
                          seasonal or invoiced clients.
                        </p>
                      ) : null}
                      <p className="mt-3 text-sm leading-7 text-slate">
                        Final price can change after review when condition, access, oxidation, mildew, staining, or restoration needs fall outside routine service assumptions.
                      </p>
                      {service.requiresBoatLength ? (
                        <p className="mt-2 text-sm leading-7 text-slate">
                          Boats over {publishedEstimateMaximumBoatLengthFeet} ft route to direct invoice review. Boats over {maximumBoatLengthFeet} ft should contact North Shore Nautical directly for a custom quote.
                        </p>
                      ) : null}
                      <div className="mt-6">
                        <Link className="button-primary" to={`/booking?service=${service.id}`}>
                          Request This Service
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </div>

              <div className="mt-14">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-navy/70">
                  Specialty & Custom Review
                </h2>
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  {[...groupedServices.customReview, ...groupedServices.advisory].map(
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
