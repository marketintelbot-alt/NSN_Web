import { Link } from 'react-router-dom'

import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { FaqList } from '../components/ui/FaqList'
import { CtaBanner } from '../components/ui/CtaBanner'
import { faqs } from '../content/site'

export function FaqPage() {
  return (
    <>
      <Seo
        title="FAQ"
        description="Frequently asked questions about North Shore Nautical services, launch reservations, lead times, and North Shore service area coverage."
        path="/faq"
      />
      <PageHero
        eyebrow="FAQ"
        title="Helpful answers for planning storage, launch delivery, and online booking."
        description="A straightforward reference for the scheduling rules, service expectations, and practical details clients ask about most often."
      />

      <section className="section-pad">
        <div className="container">
          <FaqList items={faqs} />
          <div className="mt-10 rounded-4xl border border-ink/10 bg-[#f4f8fa] px-7 py-8">
            <h2 className="font-display text-3xl font-semibold text-ink">
              Need a more specific answer?
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate">
              Some scheduling questions are best handled directly, especially when
              launch timing, weather, or special requests are involved.
            </p>
            <Link className="button-dark mt-6" to="/contact">
              Contact North Shore Nautical
            </Link>
          </div>
        </div>
      </section>

      <CtaBanner
        title="Ready to book a time?"
        copy="If you see an available slot that works, move directly to the booking page and confirm it online."
        primaryLabel="Client Login"
        primaryTo="/account"
      />
    </>
  )
}
