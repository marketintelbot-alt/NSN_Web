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

export function PortalPage() {
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
              ? 'Private Operations Portal'
              : 'Private Client Portal'
            : 'Private Portal'
        }
        description="Private access for North Shore Nautical portal users."
        path={location.pathname}
        noIndex
      />
      <PageHero
        eyebrow="Private Portal"
        title={
          session?.role === 'admin'
            ? 'Private operations access for existing internal workflows.'
            : session?.role === 'client'
              ? 'Your private North Shore Nautical portal is ready.'
              : 'Private portal access for invited clients and legacy internal workflows.'
        }
        description={
          session?.role === 'admin'
            ? 'This private route preserves legacy operations that are intentionally kept separate from the public marine care website.'
            : session?.role === 'client'
              ? 'Access your saved portal information, upcoming reservations, and account details from one private place.'
              : 'This route is not linked from the public site and is only for invited portal users.'
        }
      >
        <div className="flex max-w-2xl items-start gap-3 rounded-3xl border border-white/20 bg-white/15 px-5 py-4 text-left text-sm leading-7 text-white/90">
          <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-lake" />
          <span>
            Portal access is provisioned directly by North Shore Nautical and protected with secure, cookie-based sessions.
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
                  <h2 className="section-title text-3xl">Portal sign-in</h2>
                </div>
                <p className="mt-4 text-base leading-8 text-slate">
                  Sign in with the email and password tied to your private North Shore Nautical portal.
                </p>

                <div className="mt-6 rounded-3xl border border-ink/10 bg-[#f7fbfc] px-5 py-5 text-sm leading-7 text-slate">
                  <p className="font-semibold text-ink">Need portal access or help signing in?</p>
                  <p className="mt-2">
                    Access is arranged directly through North Shore Nautical so current portal users can get back in quickly without a public signup flow.
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
                    title: 'Private access only',
                    copy:
                      'This route remains intentionally separate from the public marine care site and is only for existing portal users.',
                  },
                  {
                    title: 'Saved account details',
                    copy:
                      'Returning users can access their account details and existing workflow information without starting over each time.',
                  },
                  {
                    title: 'Protected sessions',
                    copy:
                      'Portal access is provisioned directly by North Shore Nautical so the experience stays simple for invited users without opening a public signup flow.',
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
