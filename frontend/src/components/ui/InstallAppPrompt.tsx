import { useEffect, useMemo, useState } from 'react'

import { Download, Share2, Smartphone, X } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const dismissedStorageKey = 'nsn-install-prompt-dismissed'

export function InstallAppPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem(dismissedStorageKey) === 'true'
  })
  const [isStandalone] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches
    const iosStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
    return displayModeStandalone || iosStandalone
  })
  const [isMobile] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.matchMedia('(max-width: 900px)').matches
  })

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const isIos = useMemo(
    () => /iphone|ipad|ipod/i.test(window.navigator.userAgent),
    [],
  )

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
    <div className="fixed inset-x-4 bottom-4 z-[70] md:left-auto md:right-6 md:max-w-sm">
      <div className="rounded-[2rem] border border-white/15 bg-ink/95 px-5 py-5 text-white shadow-panel backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-lake">
              <Smartphone className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">
                Mobile Access
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                Add North Shore to your home screen
              </p>
              <p className="mt-2 text-sm leading-7 text-white/70">
                Open bookings faster on your phone and keep your saved client profile one tap away.
              </p>
            </div>
          </div>
          <button
            aria-label="Dismiss install prompt"
            className="rounded-full border border-white/10 p-2 text-white/65 transition hover:bg-white/10 hover:text-white"
            type="button"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {installPrompt ? (
          <button className="button-primary mt-5 w-full justify-center" type="button" onClick={() => void handleInstall()}>
            <Download className="h-4 w-4" />
            Add to Home Screen
          </button>
        ) : (
          <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-white/75">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Share2 className="h-4 w-4 text-lake" />
              iPhone / iPad
            </div>
            <p className="mt-2">
              Tap the Share button in Safari, then choose <span className="font-semibold text-white">Add to Home Screen</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
