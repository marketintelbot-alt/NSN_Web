import type { AccountSession } from '../types/booking'

import { apiBaseUrl } from './api'

const apiUnavailableMessage =
  'We could not reach the secure booking service. Please try again in a moment.'
const accountSessionTokenStorageKey = 'nsn_account_session_token'

type AccountSessionResponse = {
  session?: AccountSession
  authenticated?: boolean
  role?: AccountSession['role']
  email?: string
  clientAccountId?: string | null
  fullName?: string | null
  expiresAt?: string
  sessionToken?: string
  message?: string
}

function readStoredAccountSessionToken() {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.sessionStorage.getItem(accountSessionTokenStorageKey) || ''
}

function writeStoredAccountSessionToken(token: string) {
  if (typeof window === 'undefined') {
    return
  }

  if (token) {
    window.sessionStorage.setItem(accountSessionTokenStorageKey, token)
    return
  }

  window.sessionStorage.removeItem(accountSessionTokenStorageKey)
}

function clearStoredAccountSessionToken() {
  writeStoredAccountSessionToken('')
}

export async function adminApiRequest<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  const sessionToken = readStoredAccountSessionToken()

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (sessionToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${sessionToken}`)
  }

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers,
    })

    const payload = (await response.json().catch(() => ({}))) as T & { message?: string }

    if (response.status === 401) {
      clearStoredAccountSessionToken()
    }

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
        message: apiUnavailableMessage,
      } as T & { message?: string },
    }
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

  if (response.ok && response.payload.sessionToken) {
    writeStoredAccountSessionToken(response.payload.sessionToken)
  }

  return {
    ok: response.ok,
    status: response.status,
    session: normalizeSession(response.payload),
    message: response.payload.message || '',
  }
}

export async function readAccountSession() {
  const response = await adminApiRequest<AccountSessionResponse>('/api/account/session')
  const session = normalizeSession(response.payload)

  if (!session) {
    clearStoredAccountSessionToken()
  }

  return {
    ok: response.ok,
    status: response.status,
    session,
    message: response.payload.message || '',
  }
}

export async function destroyAccountSession() {
  const sessionToken = readStoredAccountSessionToken()
  clearStoredAccountSessionToken()

  const headers = new Headers()

  if (sessionToken) {
    headers.set('Authorization', `Bearer ${sessionToken}`)
  }

  await fetch(`${apiBaseUrl}/api/account/session`, {
    method: 'DELETE',
    headers,
  }).catch(() => undefined)
}

export type { AccountSession }
