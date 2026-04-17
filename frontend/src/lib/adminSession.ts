import type { AccountSession } from '../types/booking'

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:4000'

type AccountSessionResponse = {
  session?: AccountSession
  authenticated?: boolean
  role?: AccountSession['role']
  email?: string
  clientAccountId?: string | null
  fullName?: string | null
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

function normalizeSession(payload: AccountSessionResponse) {
  if (payload.session) {
    return payload.session
  }

  if (payload.authenticated && payload.email && payload.role) {
    return {
      authenticated: true,
      role: payload.role,
      email: payload.email,
      clientAccountId: payload.clientAccountId,
      fullName: payload.fullName,
      expiresAt: payload.expiresAt,
    } satisfies AccountSession
  }

  return null
}

export async function createAccountSession(email: string, password: string) {
  const response = await adminApiRequest<AccountSessionResponse>('/api/account/session', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  return {
    ok: response.ok,
    status: response.status,
    session: normalizeSession(response.payload),
    message: response.payload.message || '',
  }
}

export async function readAccountSession() {
  const response = await adminApiRequest<AccountSessionResponse>('/api/account/session')

  return {
    ok: response.ok,
    status: response.status,
    session: normalizeSession(response.payload),
    message: response.payload.message || '',
  }
}

export async function destroyAccountSession() {
  await fetch(`${apiBaseUrl}/api/account/session`, {
    method: 'DELETE',
    credentials: 'include',
  }).catch(() => undefined)
}

export type { AccountSession }
