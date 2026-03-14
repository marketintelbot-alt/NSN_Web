import type { PropsWithChildren } from 'react'

import { Footer } from './Footer'
import { Header } from './Header'

export function Layout({ children }: PropsWithChildren) {
  return (
    <div className="page-shell">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-ink"
        href="#main-content"
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
    </div>
  )
}
