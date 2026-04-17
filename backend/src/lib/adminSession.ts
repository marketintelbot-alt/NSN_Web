import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

import bcrypt from 'bcryptjs'

type AdminSessionPayload = {
  sub: 'admin'
  email: string
  exp: number
}

type VerifiedAdminSession = {
  email: string
  expiresAt: string
}

const defaultSessionDurationHours = 12

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function sha256(value: string) {
  return createHash('sha256').update(value, 'utf8').digest()
}

function secureStringEquals(left: string, right: string) {
  return timingSafeEqual(sha256(left), sha256(right))
}

function getAdminSessionSecret() {
  const configuredSecret = process.env.ADMIN_SESSION_SECRET?.trim()

  if (configuredSecret) {
    return configuredSecret
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'north-shore-admin-dev-secret'
  }

  return ''
}

function getAdminPasswordHash() {
  const configuredHash =
    process.env.ADMIN_PASSWORD_HASH?.trim() || process.env.ADMIN_PASSWORD?.trim() || ''

  if (configuredHash.startsWith('$2')) {
    return configuredHash
  }

  return ''
}

export function getAdminAuthConfig() {
  const email = process.env.ADMIN_EMAIL?.trim()
  const passwordHash = getAdminPasswordHash()
  const sessionSecret = getAdminSessionSecret()
  const sessionDurationHours = Number(process.env.ADMIN_SESSION_TTL_HOURS || defaultSessionDurationHours)

  if (!email || !passwordHash || !sessionSecret) {
    return null
  }

  return {
    email,
    passwordHash,
    sessionSecret,
    sessionDurationMs:
      (Number.isNaN(sessionDurationHours) ? defaultSessionDurationHours : sessionDurationHours) *
      60 *
      60 *
      1000,
  }
}

function createSignature(payloadSegment: string, sessionSecret: string) {
  return createHmac('sha256', sessionSecret).update(payloadSegment).digest('base64url')
}

export async function authenticateAdminCredentials(email: string, password: string) {
  const config = getAdminAuthConfig()

  if (!config) {
    return null
  }

  if (!secureStringEquals(email.trim().toLowerCase(), config.email.toLowerCase())) {
    return null
  }

  const passwordMatches = await bcrypt.compare(password, config.passwordHash)

  if (!passwordMatches) {
    return null
  }

  return config
}

export function createAdminSessionToken(email: string, sessionDurationMs: number, sessionSecret: string) {
  const payload: AdminSessionPayload = {
    sub: 'admin',
    email,
    exp: Date.now() + sessionDurationMs,
  }

  const payloadSegment = base64UrlEncode(JSON.stringify(payload))
  const signature = createSignature(payloadSegment, sessionSecret)

  return `${payloadSegment}.${signature}`
}

export function verifyAdminSessionToken(token: string): VerifiedAdminSession | null {
  const config = getAdminAuthConfig()

  if (!config) {
    return null
  }

  const [payloadSegment, signature] = token.split('.')

  if (!payloadSegment || !signature) {
    return null
  }

  const expectedSignature = createSignature(payloadSegment, config.sessionSecret)

  if (!secureStringEquals(signature, expectedSignature)) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadSegment)) as AdminSessionPayload

    if (payload.sub !== 'admin' || typeof payload.email !== 'string' || typeof payload.exp !== 'number') {
      return null
    }

    if (payload.exp <= Date.now()) {
      return null
    }

    if (!secureStringEquals(payload.email.toLowerCase(), config.email.toLowerCase())) {
      return null
    }

    return {
      email: payload.email,
      expiresAt: new Date(payload.exp).toISOString(),
    }
  } catch {
    return null
  }
}
