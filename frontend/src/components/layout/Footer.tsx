import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { advisoryHighlights, brandPromise, navigation, serviceAreas } from '../../content/site'
import { LogoMark } from '../ui/LogoMark'

const marineCareLinks = [
  'Maintenance Detail',
  'Signature Detail',
  'Exterior Wash',
  'Buff & Wax',
  'Interior + Surface Care',
]

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-white/70">
      <div className="container py-14 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_0.85fr_0.85fr_1fr]">
          <div className="max-w-md">
            <LogoMark size="footer" />
            <p className="mt-5 text-sm leading-7 text-slate md:text-base">{brandPromise}</p>
            <div className="mt-6 rounded-3xl border border-ink/10 bg-white/80 px-5 py-5">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-navy/70">
                Chicago&apos;s North Shore
              </p>
              <p className="mt-3 text-sm leading-7 text-slate">
                Serving marina-based boat owners across Chicago&apos;s North Shore with premium detailing,
                marine care, and practical ownership support.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink">Navigation</h2>
            <div className="mt-5 grid gap-3 text-sm text-slate">
              {navigation.map((item) => (
                <Link key={item.to} className="hover:text-ink" to={item.to}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink">Marine Care</h2>
            <div className="mt-5 grid gap-3 text-sm text-slate">
              {marineCareLinks.map((service) => (
                <span key={service}>{service}</span>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink">Advisory</h2>
            <div className="mt-5 grid gap-4 text-sm text-slate">
              {advisoryHighlights.map((item) => (
                <div key={item.title}>
                  <p className="font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 leading-6">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 border-t border-ink/10 pt-6 md:grid-cols-[1fr_auto] md:items-center">
          <p className="text-sm leading-7 text-slate">
            Service area includes {serviceAreas.join(', ')}, plus select nearby Lake Michigan marinas by request review.
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-slate">
            <Link className="inline-flex items-center gap-2 hover:text-ink" to="/service-agreement">
              Service Agreement
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link className="inline-flex items-center gap-2 hover:text-ink" to="/privacy-policy">
              Privacy Policy
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
