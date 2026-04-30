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
    <section className="relative isolate overflow-hidden pb-12 pt-28 text-white md:pb-24 md:pt-40">
      <div
        aria-hidden
        className="absolute inset-0 -z-30 bg-[url('/images/north-shore-hero.jpeg')] bg-cover bg-center md:bg-fixed"
      />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(6,19,31,0.74),rgba(6,19,31,0.58)_56%,rgba(6,19,31,0.5))]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-[#edf6f2]/20" />
      <div className="container relative">
        <FadeIn className="max-w-4xl">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="display-title-inverse max-w-4xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/90 md:mt-6 md:text-xl md:leading-8">
            {description}
          </p>
          {children ? <div className="mt-8">{children}</div> : null}
        </FadeIn>
      </div>
    </section>
  )
}
