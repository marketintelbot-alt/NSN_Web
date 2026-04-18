import { useEffect, useState } from 'react'

import { Download, Share2, Smartphone } from 'lucide-react'

import { FadeIn } from './FadeIn'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const dismissedStorageKey = 'nsn-install-prompt-dismissed'

function readIsStandalone() {
  if (typeof window === 'undefined') {
    return false
  }

  const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  return displayModeStandalone || iosStandalone
}

function readIsMobile() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(max-width: 900px)').matches
}

function readIsIos() {
  if (typeof window === 'undefined') {
    return false
  }

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

export function InstallAppPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem(dismissedStorageKey) === 'true'
  })
  const [isStandalone, setIsStandalone] = useState(readIsStandalone)
  const [isMobile, setIsMobile] = useState(readIsMobile)
  const [isIos] = useState(readIsIos)

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 900px)')
    const standaloneQuery = window.matchMedia('(display-mode: standalone)')

    function syncEnvironment() {
      setIsMobile(readIsMobile())
      setIsStandalone(readIsStandalone())
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    syncEnvironment()
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('focus', syncEnvironment)

    if (typeof mobileQuery.addEventListener === 'function') {
      mobileQuery.addEventListener('change', syncEnvironment)
      standaloneQuery.addEventListener('change', syncEnvironment)
    } else {
      mobileQuery.addListener(syncEnvironment)
      standaloneQuery.addListener(syncEnvironment)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('focus', syncEnvironment)

      if (typeof mobileQuery.removeEventListener === 'function') {
        mobileQuery.removeEventListener('change', syncEnvironment)
        standaloneQuery.removeEventListener('change', syncEnvironment)
      } else {
        mobileQuery.removeListener(syncEnvironment)
        standaloneQuery.removeListener(syncEnvironment)
      }
    }
  }, [])

  if (dismissed || isStandalone || !isMobile || (!installPrompt && !isIos)) {
    return null
  }

  async function handleInstall() {
    if (!installPrompt) {
      return
    }

    await installPrompt.prompt()
    const choice = await installPrompt.userChoice

    if (choice.outcome === 'accepted') {
      setDismissed(true)
      window.localStorage.setItem(dismissedStorageKey, 'true')
      setInstallPrompt(null)
    }
  }

  function handleDismiss() {
    setDismissed(true)
    window.localStorage.setItem(dismissedStorageKey, 'true')
  }

  return (
    <FadeIn className="mt-6 md:mt-8" delay={0.1}>
      <section className="panel p-5 md:p-7">
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <img
              alt="North Shore Nautical home screen icon preview"
              className="h-16 w-16 shrink-0 rounded-[1.35rem] border border-ink/10 bg-ink object-cover shadow-soft"
              src="/icons/apple-touch-icon.png"
            />
            <div>
              <span className="section-label w-fit">Optional Home Screen Shortcut</span>
              <h2 className="mt-3 text-2xl font-semibold text-ink">
                Save North Shore Nautical to your phone
              </h2>
              <p className="mt-3 text-base leading-7 text-slate">
                Keep booking one tap away without an intrusive pop-up. This is optional, and the website still works normally if you skip it.
              </p>
            </div>
          </div>

          {installPrompt ? (
            <div className="rounded-3xl border border-ink/10 bg-[#f7fbfc] px-4 py-4 text-sm leading-7 text-slate">
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-ink text-white">
                  <Smartphone className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-ink">Android and supported browsers</p>
                  <p className="mt-1">
                    Tap the button below and your phone will save this site like an app.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-ink/10 bg-[#f7fbfc] px-4 py-4 text-sm leading-7 text-slate">
              <div className="flex items-center gap-2 font-semibold text-ink">
                <Share2 className="h-4 w-4 text-lake" />
                iPhone / iPad
              </div>
              <div className="mt-3 grid gap-3">
                <p className="rounded-2xl border border-white bg-white px-4 py-3">
                  1. Open this site in <span className="font-semibold text-ink">Safari</span>.
                </p>
                <p className="rounded-2xl border border-white bg-white px-4 py-3">
                  2. Tap the <span className="font-semibold text-ink">Share</span> button.
                </p>
                <p className="rounded-2xl border border-white bg-white px-4 py-3">
                  3. Choose <span className="font-semibold text-ink">Add to Home Screen</span>.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            {installPrompt ? (
              <button
                className="button-dark w-full justify-center sm:w-fit"
                type="button"
                onClick={() => void handleInstall()}
              >
                <Download className="h-4 w-4" />
                Add to Home Screen
              </button>
            ) : null}
            <button
              className="inline-flex min-h-14 w-full items-center justify-center rounded-full border border-ink/10 px-6 py-3.5 text-base font-semibold text-ink transition hover:bg-white sm:w-fit md:text-sm"
              type="button"
              onClick={handleDismiss}
            >
              Hide This Tip
            </button>
          </div>
        </div>
      </section>
    </FadeIn>
  )
}
