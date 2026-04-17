import type { PropsWithChildren } from 'react'

import { Footer } from './Footer'
import { Header } from './Header'
import { InstallAppPrompt } from '../ui/InstallAppPrompt'

export function Layout({ children }: PropsWithChildren) {
  return (
    <div className="page-shell">
      <div aria-hidden className="site-backdrop">
        <div className="site-backdrop-image" />
        <div className="site-backdrop-overlay" />
        <div className="site-backdrop-vignette" />
      </div>
      <div className="relative z-[1]">
        <a
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-ink"
          href="#main-content"
        >
          Skip to content
        </a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
        <InstallAppPrompt />
      </div>
    </div>
  )
}
