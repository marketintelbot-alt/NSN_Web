import { useEffect, useState } from 'react'

import { Menu, X } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

import { navigation } from '../../content/site'
import { LogoMark } from '../ui/LogoMark'

export function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const hasScrolled = window.scrollY > 24
      setScrolled(hasScrolled)
      if (hasScrolled) {
        setOpen(false)
      }
    }

    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = open ? 'hidden' : previousOverflow
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div
        className={`mx-auto max-w-7xl rounded-full border transition duration-300 ${
          scrolled || open
            ? 'border-white/10 bg-ink/95 shadow-panel backdrop-blur-xl'
            : 'border-white/10 bg-ink/60 backdrop-blur-md'
        }`}
      >
        <div className="flex items-center justify-between gap-4 px-5 py-3 lg:px-7">
          <Link aria-label="North Shore Nautical home" to="/">
            <LogoMark inverse />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link className="button-primary hidden lg:inline-flex" to="/reserve-launch">
              Book a Time
            </Link>
            <button
              aria-expanded={open}
              aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake lg:hidden"
              type="button"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {open ? (
          <div className="border-t border-white/10 px-5 py-5 lg:hidden">
            <nav className="flex flex-col gap-3">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-3 text-base font-semibold transition ${
                      isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/10'
                    }`
                  }
                  to={item.to}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
              <Link
                className="button-primary mt-2"
                to="/reserve-launch"
                onClick={() => setOpen(false)}
              >
                Book a Time
              </Link>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  )
}
