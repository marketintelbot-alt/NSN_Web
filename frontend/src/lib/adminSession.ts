const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:4000'

export type AdminSession = {
  authenticated: boolean
  email: string
  expiresAt?: string
}

type AdminSessionResponse = {
  session?: AdminSession
  authenticated?: boolean
  email?: string
  expiresAt?: string
  message?: string
}

export async function adminApiRequest<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  })

  const payload = (await response.json().catch(() => ({}))) as T & { message?: string }

  return {
    ok: response.ok,
    status: response.status,
    payload,
  }
}

export async function createAdminSession(email: string, password: string) {
  const response = await adminApiRequest<AdminSessionResponse>('/api/admin/session', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  return {
    ok: response.ok,
    status: response.status,
    session:
      response.payload.session ||
      (response.payload.authenticated && response.payload.email
        ? {
            authenticated: true,
            email: response.payload.email,
            expiresAt: response.payload.expiresAt,
          }
        : null),
    message: response.payload.message || '',
  }
}

export async function readAdminSession() {
  const response = await adminApiRequest<AdminSessionResponse>('/api/admin/session')

  return {
    ok: response.ok,
    status: response.status,
    session:
      response.payload.authenticated && response.payload.email
        ? {
            authenticated: true,
            email: response.payload.email,
            expiresAt: response.payload.expiresAt,
          }
        : null,
    message: response.payload.message || '',
  }
}

export async function destroyAdminSession() {
  await fetch(`${apiBaseUrl}/api/admin/session`, {
    method: 'DELETE',
    credentials: 'include',
  }).catch(() => undefined)
}
