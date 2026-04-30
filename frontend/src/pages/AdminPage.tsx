import { useEffect, useState, type FormEvent } from 'react'

import { CircleAlert, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { MarineServiceAdminDashboard } from '../components/admin/MarineServiceAdminDashboard'
import { Seo } from '../components/seo/Seo'
import { FadeIn } from '../components/ui/FadeIn'
import { PageHero } from '../components/ui/PageHero'
import {
  createAccountSession,
  destroyAccountSession,
  readAccountSession,
  type AccountSession,
} from '../lib/adminSession'

export function AdminPage() {
  const location = useLocation()
  const [session, setSession] = useState<AccountSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authState, setAuthState] = useState<'idle' | 'submitting'>('idle')
  const [message, setMessage] = useState('')

  function formatLoginMessage(status: number, responseMessage: string) {
    if (status === 401) {
      return 'That email and password combination did not match our records. Please try again.'
    }

    if (status === 503) {
      return 'Sign-in is temporarily unavailable right now. Please try again in a moment.'
    }

    return responseMessage || 'Unable to sign in right now. Please try again shortly.'
  }

  useEffect(() => {
    let isMounted = true

    readAccountSession()
      .then((response) => {
        if (!isMounted) {
          return
        }

        if (response.ok && response.session) {
          setSession(response.session)
          return
        }

        setSession((current) => current ?? null)
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthState('submitting')
    setMessage('')

    const normalizedEmail = email.trim()

    if (normalizedEmail !== email) {
      setEmail(normalizedEmail)
    }

    const response = await createAccountSession(normalizedEmail, password)
    setAuthState('idle')

    if (!response.ok || !response.session) {
      setMessage(formatLoginMessage(response.status, response.message))
      return
    }

    setSession(response.session)
    setPassword('')
  }

  return (
    <>
      <Seo
        title={
          session
            ? session.role === 'admin'
              ? 'Admin Dashboard'
              : 'Admin Access'
            : 'Admin Access'
        }
        description={
          session
            ? session.role === 'admin'
              ? 'Secure marine care request administration for North Shore Nautical.'
              : 'Secure admin-only access for North Shore Nautical.'
            : 'Secure admin-only access for North Shore Nautical.'
        }
        path={location.pathname}
        noIndex
      />
      <PageHero
        eyebrow="Admin Access"
        title={
          session?.role === 'admin'
            ? 'Secure control for marine care requests, approvals, and payment capture.'
            : session?.role === 'client'
              ? 'This area is reserved for North Shore Nautical administrators.'
              : 'Protected access for reviewing requests, approvals, and payment status.'
        }
        description={
          session?.role === 'admin'
            ? 'Review incoming bookings and inquiries, capture approved authorizations, request changes, and manage customer communication from one protected dashboard.'
            : session?.role === 'client'
              ? 'If you are looking for the private client portal, use the dedicated portal route instead of the admin dashboard.'
              : 'Admin access is protected with secure session handling and is intended only for North Shore Nautical team members.'
        }
      >
        <div className="flex max-w-2xl items-start gap-3 rounded-3xl border border-white/20 bg-white/15 px-5 py-4 text-left text-sm leading-7 text-white/90">
          <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-lake" />
          <span>
            Admin access is set up directly by North Shore Nautical and protected with secure, cookie-based sessions.
          </span>
        </div>
      </PageHero>

      <section className="section-pad">
        <div className="container">
          {session ? (
            session.role === 'admin' ? (
              <MarineServiceAdminDashboard
                accountSession={session}
                onSignedOut={() => setSession(null)}
              />
            ) : (
              <FadeIn className="panel p-6 md:p-8">
                <h2 className="section-title text-3xl">Admin access only</h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate">
                  This dashboard is reserved for North Shore Nautical administrators. Your current session is a private portal session instead.
                </p>
                <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                  <Link className="button-primary justify-center" to="/portal">
                    Go To Private Portal
                  </Link>
                  <button
                    className="button-secondary justify-center"
                    type="button"
                    onClick={async () => {
                      await destroyAccountSession()
                      setSession(null)
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </FadeIn>
            )
          ) : (
            <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
              <FadeIn className="panel p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <LockKeyhole className="h-5 w-5 text-lake" />
                  <h2 className="section-title text-3xl">Administrator sign-in</h2>
                </div>
                <p className="mt-4 text-base leading-8 text-slate">
                  Sign in with the email and password connected to North Shore Nautical administrative access.
                </p>

                <div className="mt-6 rounded-3xl border border-ink/10 bg-[#f7fbfc] px-5 py-5 text-sm leading-7 text-slate">
                  <p className="font-semibold text-ink">Need access help?</p>
                  <p className="mt-2">
                    Administrator accounts are provisioned directly by North Shore Nautical. There is no public signup flow for this dashboard.
                  </p>
                </div>

                {loading ? (
                  <div className="mt-6 rounded-3xl border border-ink/10 bg-[#f7fbfc] px-4 py-4 text-sm text-slate">
                    Checking for saved portal access while the page loads...
                  </div>
                ) : null}

                <form className="mt-6 grid gap-4 md:mt-8 md:gap-5" onSubmit={handleSubmit}>
                  <label className="field-label">
                    Email Address
                    <input
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      className="input-field"
                      enterKeyHint="next"
                      inputMode="email"
                      spellCheck={false}
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </label>
                  <label className="field-label">
                    Password
                    <input
                      autoComplete="current-password"
                      autoCapitalize="none"
                      autoCorrect="off"
                      className="input-field"
                      enterKeyHint="go"
                      spellCheck={false}
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </label>

                  {message ? (
                    <div
                      aria-live="polite"
                      className="rounded-3xl border border-[#ead4bf] bg-[#fffaf4] px-5 py-4 text-sm text-[#6e4f38] shadow-soft"
                    >
                      <div className="flex items-start gap-3">
                        <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#c88854]" />
                        <div>
                          <p className="font-semibold text-[#5f4129]">We couldn&apos;t sign you in.</p>
                          <p className="mt-1 leading-7">{message}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <button className="button-dark w-full justify-center md:w-fit" type="submit">
                    {authState === 'submitting' ? 'Opening portal...' : 'Open Portal'}
                  </button>
                </form>
              </FadeIn>

              <div className="grid gap-5">
                {[
                  {
                    title: 'Pending review workflow',
                    copy:
                      'Requests stay in pending review until North Shore Nautical approves them and captures payment.',
                  },
                  {
                    title: 'Payment authorization visibility',
                    copy:
                      'The dashboard surfaces authorization, capture, cancelation, and refund status in one place.',
                  },
                  {
                    title: 'Protected operations',
                    copy:
                      'Access is limited to authenticated team members so booking approvals and customer details stay protected.',
                  },
                ].map((item, index) => (
                  <FadeIn key={item.title} className="soft-panel p-5 md:p-7" delay={index * 0.08}>
                    <h3 className="text-xl font-semibold text-ink">{item.title}</h3>
                    <p className="mt-3 text-base leading-8 text-slate">{item.copy}</p>
                  </FadeIn>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
