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

type AdminAuthConfig = {
  emails: string[]
  primaryEmail: string
  passwordHash: string
  sessionSecret: string
  sessionDurationMs: number
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

function getConfiguredAdminEmails() {
  const configuredEmails = `${process.env.ADMIN_EMAILS || ''}\n${process.env.ADMIN_EMAIL || ''}`
    .split(/[,\n]/)
    .map((email) => email.trim())
    .filter(Boolean)

  return configuredEmails.filter(
    (email, index) =>
      configuredEmails.findIndex(
        (candidate) => candidate.toLowerCase() === email.toLowerCase(),
      ) === index,
  )
}

function hasConfiguredAdminEmail(emails: string[], targetEmail: string) {
  return emails.some((email) => secureStringEquals(email.toLowerCase(), targetEmail.toLowerCase()))
}

export function getPrimaryAdminEmail() {
  return getConfiguredAdminEmails()[0] || ''
}

export function getAdminAuthConfig() {
  const emails = getConfiguredAdminEmails()
  const passwordHash = getAdminPasswordHash()
  const sessionSecret = getAdminSessionSecret()
  const sessionDurationHours = Number(process.env.ADMIN_SESSION_TTL_HOURS || defaultSessionDurationHours)

  if (!emails.length || !passwordHash || !sessionSecret) {
    return null
  }

  const config: AdminAuthConfig = {
    emails,
    primaryEmail: emails[0],
    passwordHash,
    sessionSecret,
    sessionDurationMs:
      (Number.isNaN(sessionDurationHours) ? defaultSessionDurationHours : sessionDurationHours) *
      60 *
      60 *
      1000,
  }

  return config
}

function createSignature(payloadSegment: string, sessionSecret: string) {
  return createHmac('sha256', sessionSecret).update(payloadSegment).digest('base64url')
}

export async function authenticateAdminCredentials(email: string, password: string) {
  const config = getAdminAuthConfig()

  if (!config) {
    return null
  }

  const normalizedEmail = email.trim().toLowerCase()
  const matchedEmail = config.emails.find((configuredEmail) =>
    secureStringEquals(configuredEmail.toLowerCase(), normalizedEmail),
  )

  if (!matchedEmail) {
    return null
  }

  const passwordMatches = await bcrypt.compare(password, config.passwordHash)

  if (!passwordMatches) {
    return null
  }

  return {
    ...config,
    email: matchedEmail,
  }
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

    if (!hasConfiguredAdminEmail(config.emails, payload.email)) {
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
