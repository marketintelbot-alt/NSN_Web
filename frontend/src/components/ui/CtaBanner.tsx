import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { FadeIn } from './FadeIn'

type CtaBannerProps = {
  title: string
  copy: string
  primaryLabel: string
  primaryTo: string
  secondaryLabel?: string
  secondaryTo?: string
}

export function CtaBanner({
  title,
  copy,
  primaryLabel,
  primaryTo,
  secondaryLabel,
  secondaryTo,
}: CtaBannerProps) {
  return (
    <section className="section-pad">
      <div className="container">
        <FadeIn className="rounded-4xl bg-ink bg-section-glow px-8 py-12 text-white shadow-panel md:px-14 md:py-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="eyebrow">Plan Ahead</span>
              <h2 className="display-title-inverse text-4xl md:text-5xl">{title}</h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-white/70 md:text-lg">
                {copy}
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link className="button-primary" to={primaryTo}>
                {primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {secondaryLabel && secondaryTo ? (
                <Link className="button-secondary" to={secondaryTo}>
                  {secondaryLabel}
                </Link>
              ) : null}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
