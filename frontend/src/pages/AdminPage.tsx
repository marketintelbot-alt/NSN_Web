import { useEffect, useState, type FormEvent } from 'react'

import { CircleAlert, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { ClientPortal } from '../components/account/ClientPortal'
import { AdminDashboard } from '../components/admin/AdminDashboard'
import { Seo } from '../components/seo/Seo'
import { FadeIn } from '../components/ui/FadeIn'
import { PageHero } from '../components/ui/PageHero'
import {
  createAccountSession,
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
              : 'Client Portal'
            : 'Client Login'
        }
        description={
          session
            ? session.role === 'admin'
              ? 'Secure booking administration for North Shore Nautical.'
              : 'Saved client booking access for North Shore Nautical.'
            : 'Secure client login for North Shore Nautical.'
        }
        path={location.pathname === '/admin' ? '/admin' : '/account'}
        noIndex
      />
      <PageHero
        eyebrow={session?.role === 'admin' ? 'Admin Access' : 'Client Login'}
        title={
          session?.role === 'admin'
            ? 'Secure booking control for North Shore Nautical.'
            : session?.role === 'client'
              ? 'Your saved launch account is ready to book.'
              : 'Secure access for North Shore Nautical clients.'
        }
        description={
          session?.role === 'admin'
            ? 'Manage clients, saved launch profiles, bookings, and scheduling from one protected dashboard.'
            : session?.role === 'client'
              ? 'Your stored launch details stay on file so booking from your phone can stay quick and simple.'
              : 'Use your North Shore Nautical login to access your account securely.'
        }
      >
        <div className="flex max-w-2xl items-start gap-3 rounded-3xl border border-white/10 bg-white/10 px-5 py-4 text-left text-sm leading-7 text-white/80">
          <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-lake" />
          <span>
            Access is protected with secure, cookie-based sessions and environment-managed credentials.
          </span>
        </div>
      </PageHero>

      <section className="section-pad">
        <div className="container">
          {session ? (
            session.role === 'admin' ? (
              <AdminDashboard accountSession={session} onSignedOut={() => setSession(null)} />
            ) : (
              <ClientPortal session={session} onSignedOut={() => setSession(null)} />
            )
          ) : (
            <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
              <FadeIn className="panel p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <LockKeyhole className="h-5 w-5 text-lake" />
                  <h2 className="section-title text-3xl">Client login</h2>
                </div>
                <p className="mt-4 text-base leading-8 text-slate">
                  Sign in with the email and password tied to your North Shore Nautical account.
                </p>

                {loading ? (
                  <div className="mt-6 rounded-3xl border border-ink/10 bg-[#f7fbfc] px-4 py-4 text-sm text-slate">
                    Checking for a saved sign-in while the page loads...
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
                    {authState === 'submitting' ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>
              </FadeIn>

              <div className="grid gap-5">
                {[
                  {
                    title: 'Saved launch profiles',
                    copy:
                      'Client accounts can keep the usual launch location, boat details, and contact information ready to go.',
                  },
                  {
                    title: 'Mobile-first booking',
                    copy:
                      'Once a client is signed in, they can focus on choosing a date and time instead of re-entering the same details each trip.',
                  },
                  {
                    title: 'Administrative tools appear after sign-in',
                    copy:
                      'The full control panel for managing clients, passwords, and bookings only appears after a successful admin login.',
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
