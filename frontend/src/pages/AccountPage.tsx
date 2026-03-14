import { useCallback, useEffect, useState, type FormEvent } from 'react'

import { CircleUserRound, KeyRound, LogOut, Plus, Sailboat, ShieldCheck } from 'lucide-react'

import { useAuth } from '../components/account/useAuth'
import { Seo } from '../components/seo/Seo'
import { FadeIn } from '../components/ui/FadeIn'
import { PageHero } from '../components/ui/PageHero'
import { siteMeta } from '../content/site'
import { selfSignupEnabled, supabase } from '../lib/supabase'
import type { SavedBoat } from '../types/account'

type AuthMode = 'sign-in' | 'sign-up'

function isStrongEnoughPassword(password: string) {
  return password.trim().length >= 12
}

export function AccountPage() {
  const { accountsEnabled, loading, session, signOut } = useAuth()
  const [authMode, setAuthMode] = useState<AuthMode>('sign-in')
  const [boats, setBoats] = useState<SavedBoat[]>([])
  const [boatsLoading, setBoatsLoading] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [accountMessage, setAccountMessage] = useState('')
  const [authState, setAuthState] = useState<'idle' | 'submitting'>('idle')
  const [boatState, setBoatState] = useState<'idle' | 'submitting'>('idle')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newBoat, setNewBoat] = useState({
    boat_name: '',
    boat_type: '',
    boat_length: '',
    notes: '',
    is_primary: true,
  })

  const loadBoats = useCallback(async () => {
    if (!session?.user || !supabase) {
      return
    }

    setBoatsLoading(true)
    setAccountMessage('')

    const { data, error } = await supabase
      .from('client_boats')
      .select('*')
      .eq('user_id', session.user.id)
      .order('is_primary', { ascending: false })
      .order('boat_name', { ascending: true })

    if (error) {
      setAccountMessage(error.message)
      setBoatsLoading(false)
      return
    }

    setBoats((data ?? []) as SavedBoat[])
    setBoatsLoading(false)
  }, [session])

  useEffect(() => {
    if (!session?.user || !supabase) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void loadBoats()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadBoats, session])

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase) {
      return
    }

    if (authMode === 'sign-up' && !selfSignupEnabled) {
      setAuthMessage(
        'Client accounts are configured for invitation-only access right now. Contact North Shore Nautical if you need an account created.',
      )
      return
    }

    if (authMode === 'sign-up' && !isStrongEnoughPassword(password)) {
      setAuthMessage('Use a password with at least 12 characters for your client account.')
      return
    }

    if (authMode === 'sign-up' && password !== confirmPassword) {
      setAuthMessage('The password confirmation does not match.')
      return
    }

    setAuthState('submitting')
    setAuthMessage('')

    const response =
      authMode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${siteMeta.siteUrl}/account`,
            },
          })

    setAuthState('idle')

    if (response.error) {
      setAuthMessage(response.error.message)
      return
    }

    if (authMode === 'sign-up') {
      setAuthMessage(
        'Your client account has been created. If email confirmation is enabled in Supabase, complete that step from your inbox before signing in.',
      )
      setConfirmPassword('')
    } else {
      setAuthMessage('Signed in successfully.')
    }
  }

  async function addBoat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!session?.user || !supabase) {
      return
    }

    const trimmedBoatName = newBoat.boat_name.trim()
    const trimmedBoatType = newBoat.boat_type.trim()
    const trimmedBoatLength = newBoat.boat_length.trim()
    const trimmedNotes = newBoat.notes.trim()

    if (!trimmedBoatName || !trimmedBoatType || !trimmedBoatLength) {
      setAccountMessage('Boat name, model, and length are all required.')
      return
    }

    setBoatState('submitting')
    setAccountMessage('')

    if (newBoat.is_primary) {
      await supabase
        .from('client_boats')
        .update({ is_primary: false })
        .eq('user_id', session.user.id)
    }

    const { error } = await supabase.from('client_boats').insert({
      user_id: session.user.id,
      boat_name: trimmedBoatName,
      boat_type: trimmedBoatType,
      boat_length: trimmedBoatLength,
      notes: trimmedNotes || null,
      is_primary: newBoat.is_primary,
    })

    setBoatState('idle')

    if (error) {
      setAccountMessage(error.message)
      return
    }

    setNewBoat({
      boat_name: '',
      boat_type: '',
      boat_length: '',
      notes: '',
      is_primary: false,
    })
    setAccountMessage('Boat saved to your account.')
    await loadBoats()
  }

  async function makePrimary(boatId: string) {
    if (!session?.user || !supabase) {
      return
    }

    setAccountMessage('')

    const { error: clearError } = await supabase
      .from('client_boats')
      .update({ is_primary: false })
      .eq('user_id', session.user.id)

    if (clearError) {
      setAccountMessage(clearError.message)
      return
    }

    const { error } = await supabase
      .from('client_boats')
      .update({ is_primary: true })
      .eq('id', boatId)
      .eq('user_id', session.user.id)

    if (error) {
      setAccountMessage(error.message)
      return
    }

    setAccountMessage('Primary boat updated.')
    await loadBoats()
  }

  async function deleteBoat(boatId: string) {
    if (!session?.user || !supabase) {
      return
    }

    setAccountMessage('')

    const { error } = await supabase
      .from('client_boats')
      .delete()
      .eq('id', boatId)
      .eq('user_id', session.user.id)

    if (error) {
      setAccountMessage(error.message)
      return
    }

    setAccountMessage('Boat removed from your account.')
    await loadBoats()
  }

  return (
    <>
      <Seo
        title="Client Account"
        description="Client login and saved boat management for North Shore Nautical."
        path="/account"
        noIndex
      />
      <PageHero
        eyebrow="Client Account"
        title="Secure client access for saved boats and faster launch reservations."
        description="Repeat clients can keep boat details on file, sign in securely, and move through future launch requests without re-entering the same vessel information every time."
      />

      <section className="section-pad">
        <div className="container">
          {!accountsEnabled ? (
            <FadeIn className="panel max-w-3xl p-8">
              <h2 className="section-title">Invitation-only client login.</h2>
              <p className="mt-4 section-copy max-w-none">
                North Shore Nautical can issue secure client credentials for repeat
                owners who keep boats on file. Once the portal is connected to its
                live authentication service, invited clients can sign in, review their
                saved boats, and move through future launch requests without re-entering
                vessel details each time.
              </p>
              <p className="mt-4 text-base leading-8 text-slate">
                If you are reviewing this build before launch, the client portal is
                prepared for invitation-only access and can be connected without
                changing the public experience.
              </p>
            </FadeIn>
          ) : loading ? (
            <FadeIn className="panel max-w-3xl p-8">
              <p className="text-base leading-8 text-slate">Loading secure client access...</p>
            </FadeIn>
          ) : !session ? (
            <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
              <FadeIn className="panel p-8">
                <div className="flex items-center gap-3">
                  <CircleUserRound className="h-5 w-5 text-lake" />
                  <h2 className="section-title text-3xl">Client login</h2>
                </div>
                <p className="mt-4 text-base leading-8 text-slate">
                  Sign in to keep your boat information on file, submit launch
                  requests faster, and avoid re-entering the same vessel details for
                  every delivery.
                </p>
                {!selfSignupEnabled ? (
                  <div className="mt-6 rounded-3xl border border-ink/10 bg-[#f6fafb] px-5 py-4 text-sm leading-7 text-slate">
                    Client logins are issued directly by North Shore Nautical. If your
                    account has already been created for you, sign in below.
                  </div>
                ) : null}

                <div className="mt-6 flex gap-3">
                  <button
                    className={`rounded-full px-5 py-3 text-sm font-semibold tracking-[0.08em] ${
                      authMode === 'sign-in'
                        ? 'bg-ink text-white'
                        : 'border border-ink/10 bg-white text-ink'
                    }`}
                    type="button"
                    onClick={() => setAuthMode('sign-in')}
                  >
                    Sign In
                  </button>
                  {selfSignupEnabled ? (
                    <button
                      className={`rounded-full px-5 py-3 text-sm font-semibold tracking-[0.08em] ${
                        authMode === 'sign-up'
                          ? 'bg-ink text-white'
                          : 'border border-ink/10 bg-white text-ink'
                      }`}
                      type="button"
                      onClick={() => setAuthMode('sign-up')}
                    >
                      Create Account
                    </button>
                  ) : null}
                </div>

                <form className="mt-8 grid gap-5" onSubmit={handleAuthSubmit}>
                  <label className="grid gap-2 text-sm font-semibold text-ink">
                    Email Address
                    <input
                      autoComplete="email"
                      className="input-field"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-ink">
                    Password
                    <input
                      autoComplete={
                        authMode === 'sign-up' ? 'new-password' : 'current-password'
                      }
                      className="input-field"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </label>

                  {authMode === 'sign-up' ? (
                    <>
                      <label className="grid gap-2 text-sm font-semibold text-ink">
                        Confirm Password
                        <input
                          autoComplete="new-password"
                          className="input-field"
                          type="password"
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                        />
                      </label>
                      <p className="text-sm leading-7 text-slate">
                        Use at least 12 characters. For the strongest setup, keep
                        Supabase email confirmation and leaked-password protection enabled.
                      </p>
                    </>
                  ) : null}

                  {authMessage ? (
                    <div
                      aria-live="polite"
                      className="rounded-2xl border border-ink/10 bg-[#f6fafb] px-4 py-4 text-sm text-slate"
                    >
                      {authMessage}
                    </div>
                  ) : null}

                  <button className="button-dark w-full justify-center md:w-fit" type="submit">
                    {authState === 'submitting'
                      ? 'Working...'
                      : authMode === 'sign-in'
                        ? 'Sign In'
                        : 'Create Client Account'}
                  </button>
                </form>
              </FadeIn>

              <div className="grid gap-5">
                {[
                  {
                    icon: Sailboat,
                    title: 'Save each boat once',
                    copy:
                      'Stored clients can keep their boat details on file so future reservations start with the right vessel already selected.',
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Client-specific access controls',
                    copy:
                      'Saved boats are protected with Supabase authentication and row-level access rules so each client only reaches their own records.',
                  },
                  {
                    icon: KeyRound,
                    title: 'Faster reservation flow',
                    copy:
                      'Launch destination, optional cleaning, and timing can be handled quickly once the vessel is already saved on the account.',
                  },
                ].map((item, index) => (
                  <FadeIn key={item.title} className="soft-panel p-7" delay={index * 0.08}>
                    <item.icon className="h-5 w-5 text-lake" />
                    <h3 className="mt-4 text-xl font-semibold text-ink">{item.title}</h3>
                    <p className="mt-3 text-base leading-8 text-slate">{item.copy}</p>
                  </FadeIn>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr]">
              <FadeIn className="panel p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="section-label w-fit">Signed In</span>
                    <h2 className="section-title text-3xl">Client profile</h2>
                    <p className="mt-4 text-base leading-8 text-slate">{session.user.email}</p>
                  </div>
                  <button className="button-dark" type="button" onClick={() => void signOut()}>
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>

                <div className="mt-8 rounded-3xl border border-ink/10 bg-[#f6fafb] p-6">
                  <h3 className="text-xl font-semibold text-ink">What this account does</h3>
                  <p className="mt-3 text-base leading-8 text-slate">
                    Save the boats you keep with North Shore Nautical, set a primary
                    vessel, and move through future launch delivery reservations without
                    re-entering the same boat information.
                  </p>
                </div>
              </FadeIn>

              <div className="grid gap-6">
                <FadeIn className="panel p-8">
                  <h2 className="section-title text-3xl">Saved boats</h2>
                  <p className="mt-4 text-base leading-8 text-slate">
                    Choose a primary boat for the quickest reservation experience.
                  </p>

                  <div className="mt-6 grid gap-4">
                    {boatsLoading ? (
                      <p className="text-sm text-slate">Loading saved boats...</p>
                    ) : boats.length === 0 ? (
                      <p className="text-sm text-slate">
                        No saved boats yet. Add your first vessel below.
                      </p>
                    ) : (
                      boats.map((boat) => (
                        <div key={boat.id} className="soft-panel p-5">
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-lg font-semibold text-ink">{boat.boat_name}</p>
                              <p className="mt-1 text-sm leading-7 text-slate">
                                {boat.boat_type} · {boat.boat_length}
                              </p>
                              {boat.notes ? (
                                <p className="mt-2 text-sm leading-7 text-slate">{boat.notes}</p>
                              ) : null}
                            </div>
                            <div className="flex gap-3">
                              {!boat.is_primary ? (
                                <button
                                  className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink"
                                  type="button"
                                  onClick={() => void makePrimary(boat.id)}
                                >
                                  Make Primary
                                </button>
                              ) : (
                                <span className="rounded-full bg-lake/10 px-4 py-2 text-sm font-semibold text-ink">
                                  Primary
                                </span>
                              )}
                              <button
                                className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink"
                                type="button"
                                onClick={() => void deleteBoat(boat.id)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </FadeIn>

                <FadeIn className="panel p-8" delay={0.08}>
                  <div className="flex items-center gap-3">
                    <Plus className="h-5 w-5 text-lake" />
                    <h2 className="section-title text-3xl">Add a boat</h2>
                  </div>
                  <form className="mt-6 grid gap-5" onSubmit={addBoat}>
                    <div className="grid gap-5 md:grid-cols-2">
                      <label className="grid gap-2 text-sm font-semibold text-ink">
                        Boat Name
                        <input
                          className="input-field"
                          value={newBoat.boat_name}
                          onChange={(event) =>
                            setNewBoat((current) => ({
                              ...current,
                              boat_name: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="grid gap-2 text-sm font-semibold text-ink">
                        Boat Type / Model
                        <input
                          className="input-field"
                          value={newBoat.boat_type}
                          onChange={(event) =>
                            setNewBoat((current) => ({
                              ...current,
                              boat_type: event.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>

                    <label className="grid gap-2 text-sm font-semibold text-ink">
                      Boat Length
                      <input
                        className="input-field"
                        value={newBoat.boat_length}
                        onChange={(event) =>
                          setNewBoat((current) => ({
                            ...current,
                            boat_length: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-semibold text-ink">
                      Notes
                      <textarea
                        className="text-area"
                        value={newBoat.notes}
                        onChange={(event) =>
                          setNewBoat((current) => ({
                            ...current,
                            notes: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-[#f8fbfc] px-4 py-4 text-sm text-slate">
                      <input
                        checked={newBoat.is_primary}
                        className="mt-1 h-4 w-4 rounded border-ink/20 text-ink focus:ring-lake"
                        type="checkbox"
                        onChange={(event) =>
                          setNewBoat((current) => ({
                            ...current,
                            is_primary: event.target.checked,
                          }))
                        }
                      />
                      <span>Set this boat as my primary saved vessel.</span>
                    </label>

                    {accountMessage ? (
                      <div
                        aria-live="polite"
                        className="rounded-2xl border border-ink/10 bg-[#f6fafb] px-4 py-4 text-sm text-slate"
                      >
                        {accountMessage}
                      </div>
                    ) : null}

                    <button className="button-dark w-full justify-center md:w-fit" type="submit">
                      {boatState === 'submitting' ? 'Saving...' : 'Save Boat'}
                    </button>
                  </form>
                </FadeIn>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
