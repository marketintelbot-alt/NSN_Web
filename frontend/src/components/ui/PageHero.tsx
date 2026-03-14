import type { ReactNode } from 'react'

import { FadeIn } from './FadeIn'

type PageHeroProps = {
  eyebrow: string
  title: string
  description: string
  children?: ReactNode
}

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-ink pb-16 pt-32 text-white md:pb-24 md:pt-40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(127,164,184,0.28),transparent_38%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#f5f8fa]" />
      <div className="container relative">
        <FadeIn className="max-w-4xl">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="display-title-inverse max-w-4xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70 md:text-xl">
            {description}
          </p>
          {children ? <div className="mt-8">{children}</div> : null}
        </FadeIn>
      </div>
    </section>
  )
}
