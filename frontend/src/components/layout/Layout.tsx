import type { PropsWithChildren } from 'react'

import { Link, useLocation } from 'react-router-dom'

import { Footer } from './Footer'
import { Header } from './Header'
import { LogoMark } from '../ui/LogoMark'

export function Layout({ children }: PropsWithChildren) {
  const location = useLocation()
  const isPrivateRoute =
    location.pathname.startsWith('/admin') || location.pathname.startsWith('/portal')

  return (
    <div className="page-shell">
      <div aria-hidden className={`site-backdrop ${isPrivateRoute ? 'site-backdrop-private' : ''}`}>
        <div className="site-backdrop-image" />
        <div className="site-backdrop-overlay" />
        <div className="site-backdrop-vignette" />
      </div>
      <div className="relative z-[1]">
        {!isPrivateRoute ? (
          <>
            <a
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-ink"
              href="#main-content"
            >
              Skip to content
            </a>
            <Header />
          </>
        ) : (
          <div className="px-4 pt-4">
            <div className="mx-auto flex max-w-7xl justify-start">
              <Link className="rounded-full border border-white/80 bg-white/90 px-5 py-3 shadow-soft" to="/">
                <LogoMark size="compact" />
              </Link>
            </div>
          </div>
        )}
        <main id="main-content">{children}</main>
        {!isPrivateRoute ? <Footer /> : null}
      </div>
    </div>
  )
}
