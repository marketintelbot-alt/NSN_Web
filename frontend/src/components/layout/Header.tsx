import { useEffect, useState } from 'react'

import { ChevronDown, Menu, X } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'

import { navigation } from '../../content/site'
import { LogoMark } from '../ui/LogoMark'

export function Header() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false)
  const [desktopServicesOpen, setDesktopServicesOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 16)
    }

    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = mobileOpen ? 'hidden' : previousOverflow
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileOpen])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMobileOpen(false)
      setMobileServicesOpen(false)
      setDesktopServicesOpen(false)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [location.pathname])

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div
        className={`mx-auto max-w-7xl rounded-full border transition duration-300 ${
          scrolled || mobileOpen
            ? 'border-white/70 bg-[#f8fbf7]/95 shadow-soft backdrop-blur-xl'
            : 'border-white/70 bg-[#f8fbf7]/95 backdrop-blur-xl'
        }`}
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <Link aria-label="North Shore Nautical home" to="/">
            <LogoMark />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {navigation.map((item) =>
              item.children?.length ? (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setDesktopServicesOpen(true)}
                  onMouseLeave={() => setDesktopServicesOpen(false)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setDesktopServicesOpen(false)
                    }
                  }}
                >
                  <NavLink
                    className={({ isActive }) =>
                      `nav-link inline-flex items-center gap-2 ${isActive ? 'nav-link-active' : ''}`
                    }
                    to={item.to}
                    onFocus={() => setDesktopServicesOpen(true)}
                  >
                    {item.label}
                    <ChevronDown
                      className={`h-4 w-4 transition ${desktopServicesOpen ? 'rotate-180' : ''}`}
                    />
                  </NavLink>
                  {desktopServicesOpen ? (
                    <div className="absolute left-0 top-full z-50 w-64 pt-3">
                      <div className="overflow-hidden rounded-2xl border border-navy/20 bg-[#f8fbf7] p-2 shadow-panel ring-1 ring-white/90">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.to}
                            className={({ isActive }) =>
                              `block rounded-xl px-4 py-3 text-[0.95rem] font-semibold transition ${
                                isActive
                                  ? 'bg-lake/20 text-ink'
                                  : 'text-ink/80 hover:bg-[#edf6f2] hover:text-ink'
                              }`
                            }
                            to={child.to}
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <NavLink
                  key={item.to}
                  className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              ),
            )}
          </nav>

          <div className="flex items-center gap-3">
            <Link className="button-primary hidden min-h-12 lg:inline-flex" to="/booking">
              Book Marine Care
            </Link>
            <button
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-ink/10 bg-[#f8fbf7] text-ink transition hover:bg-[#edf6f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake lg:hidden"
              type="button"
              onClick={() => setMobileOpen((current) => !current)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="border-t border-ink/10 px-4 pb-5 pt-3 lg:hidden">
            <nav className="grid gap-2">
              {navigation.map((item) =>
                item.children?.length ? (
                  <div key={item.label} className="rounded-3xl border border-ink/10 bg-[#f8fbf7] p-2 shadow-soft">
                    <button
                      aria-expanded={mobileServicesOpen}
                      className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-semibold text-ink"
                      type="button"
                      onClick={() => setMobileServicesOpen((current) => !current)}
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        className={`h-4 w-4 transition ${mobileServicesOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {mobileServicesOpen ? (
                      <div className="grid gap-1 px-2 pb-2">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.to}
                            className={({ isActive }) =>
                              `rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                                isActive
                                  ? 'bg-lake/20 text-ink'
                                  : 'text-ink/80 hover:bg-[#edf6f2] hover:text-ink'
                              }`
                            }
                            to={child.to}
                            onClick={() => setMobileOpen(false)}
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <NavLink
                    key={item.to}
                    className={({ isActive }) =>
                      `rounded-3xl border px-4 py-3 text-sm font-semibold transition ${
                        isActive
                          ? 'border-lake/30 bg-lake/10 text-ink'
                          : 'border-ink/10 bg-[#f8fbf7]/95 text-slate hover:bg-[#edf6f2] hover:text-ink'
                      }`
                    }
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ),
              )}

              <Link className="button-primary mt-2 w-full justify-center" to="/booking" onClick={() => setMobileOpen(false)}>
                Book Marine Care
              </Link>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  )
}
