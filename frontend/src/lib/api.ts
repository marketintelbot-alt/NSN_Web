const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:4000'

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers,
    })
    const payload = (await response.json().catch(() => ({}))) as T & { message?: string }

    return {
      ok: response.ok,
      status: response.status,
      payload,
    }
  } catch {
    return {
      ok: false,
      status: 503,
      payload: {
        message: 'We could not reach the North Shore Nautical service right now.',
      } as T & { message?: string },
    }
  }
}

export { apiBaseUrl }
