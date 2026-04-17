import { useEffect, useState, type FormEvent } from 'react'

import { LockKeyhole, ShieldCheck } from 'lucide-react'

import { AdminDashboard } from '../components/admin/AdminDashboard'
import { Seo } from '../components/seo/Seo'
import { FadeIn } from '../components/ui/FadeIn'
import { PageHero } from '../components/ui/PageHero'
import { createAdminSession, readAdminSession, type AdminSession } from '../lib/adminSession'

export function AdminPage() {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authState, setAuthState] = useState<'idle' | 'submitting'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    readAdminSession()
      .then((response) => {
        if (response.ok && response.session) {
          setSession(response.session)
          return
        }

        setSession(null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthState('submitting')
    setMessage('')

    const response = await createAdminSession(email, password)
    setAuthState('idle')

    if (!response.ok || !response.session) {
      setMessage(response.message || 'Unable to sign in right now.')
      return
    }

    setSession(response.session)
    setPassword('')
  }

  return (
    <>
      <Seo
        title="Admin Dashboard"
        description="Secure booking administration for North Shore Nautical."
        path="/admin"
        noIndex
      />
      <PageHero
        eyebrow="Admin"
        title="Secure booking control for North Shore Nautical."
        description="Manage open time slots, bookings, and confirmation-email reliability from one protected dashboard."
      >
        <div className="inline-flex max-w-2xl items-start gap-3 rounded-3xl border border-white/10 bg-white/10 px-5 py-4 text-left text-sm leading-7 text-white/80">
          <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-lake" />
          <span>
            Admin access is protected with environment-configured credentials and secure
            cookie-based sessions.
          </span>
        </div>
      </PageHero>

      <section className="section-pad">
        <div className="container">
          {loading ? (
            <FadeIn className="panel max-w-3xl p-8">
              <p className="text-base leading-8 text-slate">Loading secure admin access...</p>
            </FadeIn>
          ) : session ? (
            <AdminDashboard adminSession={session} onSignedOut={() => setSession(null)} />
          ) : (
            <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
              <FadeIn className="panel p-8">
                <div className="flex items-center gap-3">
                  <LockKeyhole className="h-5 w-5 text-lake" />
                  <h2 className="section-title text-3xl">Admin sign in</h2>
                </div>
                <p className="mt-4 text-base leading-8 text-slate">
                  Use the single admin account configured on the server to manage bookings,
                  available times, and email delivery.
                </p>

                <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
                  <label className="field-label">
                    Email Address
                    <input
                      autoComplete="email"
                      className="input-field"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </label>
                  <label className="field-label">
                    Password
                    <input
                      autoComplete="current-password"
                      className="input-field"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </label>

                  {message ? (
                    <div className="rounded-2xl border border-[#d7b0ac] bg-[#fff7f6] px-4 py-4 text-sm text-[#7f2f29]">
                      {message}
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
                    title: 'Open and close time slots fast',
                    copy:
                      'Update availability in one place so clients only ever see bookable times.',
                  },
                  {
                    title: 'Confirmations are tracked for you',
                    copy:
                      'Every booking keeps customer and internal email status visible for quick operational follow-up.',
                  },
                  {
                    title: 'Manual bookings stay simple',
                    copy:
                      'Create or edit bookings directly when a client calls, texts, or needs help.',
                  },
                ].map((item, index) => (
                  <FadeIn key={item.title} className="soft-panel p-7" delay={index * 0.08}>
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
