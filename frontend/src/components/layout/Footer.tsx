import { ArrowUpRight, Mail, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'

import {
  contactDetails,
  navigation,
  serviceAreas,
  services,
} from '../../content/site'
import { LogoMark } from '../ui/LogoMark'

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-[#f0f4f6]">
      <div className="container py-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
          <div className="max-w-md">
            <LogoMark />
            <p className="mt-5 text-sm leading-7 text-slate md:text-base">
              Premium boat storage, open online booking times, launch delivery, and calm
              communication for owners across Chicago&apos;s North Shore.
            </p>
            <div className="mt-6 space-y-3 text-sm text-ink">
              <a
                className="inline-flex items-center gap-3 font-semibold hover:text-navy"
                href={`mailto:${contactDetails.email}`}
              >
                <Mail className="h-4 w-4 text-lake" />
                {contactDetails.email}
              </a>
              <a
                className="inline-flex items-center gap-3 font-semibold hover:text-navy"
                href={contactDetails.phoneHref}
              >
                <Phone className="h-4 w-4 text-lake" />
                {contactDetails.phoneDisplay}
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink">
              Navigation
            </h2>
            <div className="mt-5 grid gap-3 text-sm text-slate">
              {navigation.map((item) => (
                <Link key={item.to} className="hover:text-ink" to={item.to}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink">
              Services
            </h2>
            <div className="mt-5 grid gap-3 text-sm text-slate">
              {services.map((service) => (
                <span key={service.slug}>{service.name}</span>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink">
              Service Area
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate">
              {serviceAreas.join(', ')}, and nearby North Shore launch points by arrangement.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-slate">
              <Link className="inline-flex items-center gap-2 hover:text-ink" to="/privacy-policy">
                Privacy Policy
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link className="inline-flex items-center gap-2 hover:text-ink" to="/terms-of-service">
                Terms of Service
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link className="inline-flex items-center gap-2 hover:text-ink" to="/account">
                Client Login
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-ink/10 pt-6 text-sm text-slate">
          North Shore Nautical is designed for straightforward communication, careful
          coordination, and a higher standard of local service.
        </div>
      </div>
    </footer>
  )
}
