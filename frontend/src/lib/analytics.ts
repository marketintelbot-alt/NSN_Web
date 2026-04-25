declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
    __nsnTrack?: (eventName: string, payload?: Record<string, unknown>) => void
  }
}

export function trackEvent(eventName: string, payload: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') {
    return
  }

  window.dataLayer?.push({
    event: eventName,
    ...payload,
  })

  window.__nsnTrack?.(eventName, payload)

  window.dispatchEvent(
    new CustomEvent('nsn:analytics', {
      detail: {
        event: eventName,
        payload,
      },
    }),
  )
}
