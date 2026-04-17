import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

import bcrypt from 'bcryptjs'

import { authenticateClientCredentials } from './clientAccounts.js'

export type AccountRole = 'admin' | 'client'

type AccountSessionPayload = {
  sub: 'account'
  role: AccountRole
  email: string
  clientAccountId: string | null
  fullName: string | null
  exp: number
}

export type VerifiedAccountSession = {
  role: AccountRole
  email: string
  clientAccountId: string | null
  fullName: string | null
  expiresAt: string
}

type SessionConfig = {
  sessionSecret: string
  sessionDurationMs: number
}

type AdminAuthConfig = SessionConfig & {
  emails: string[]
  primaryEmail: string
  passwordHash: string
}

type AuthenticatedAccount = SessionConfig & {
  role: AccountRole
  email: string
  clientAccountId: string | null
  fullName: string | null
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

function getAccountSessionSecret() {
  const configuredSecret = process.env.ADMIN_SESSION_SECRET?.trim()

  if (configuredSecret) {
    return configuredSecret
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'north-shore-admin-dev-secret'
  }

  return ''
}

function getSessionConfig(): SessionConfig | null {
  const sessionSecret = getAccountSessionSecret()
  const sessionDurationHours = Number(
    process.env.ADMIN_SESSION_TTL_HOURS || defaultSessionDurationHours,
  )

  if (!sessionSecret) {
    return null
  }

  return {
    sessionSecret,
    sessionDurationMs:
      (Number.isNaN(sessionDurationHours)
        ? defaultSessionDurationHours
        : sessionDurationHours) *
      60 *
      60 *
      1000,
  }
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
  return emails.some((email) =>
    secureStringEquals(email.toLowerCase(), targetEmail.toLowerCase()),
  )
}

export function getPrimaryAdminEmail() {
  return getConfiguredAdminEmails()[0] || ''
}

export function getAdminAuthConfig() {
  const emails = getConfiguredAdminEmails()
  const passwordHash = getAdminPasswordHash()
  const sessionConfig = getSessionConfig()

  if (!emails.length || !passwordHash || !sessionConfig) {
    return null
  }

  return {
    emails,
    primaryEmail: emails[0],
    passwordHash,
    ...sessionConfig,
  } satisfies AdminAuthConfig
}

function createSignature(payloadSegment: string, sessionSecret: string) {
  return createHmac('sha256', sessionSecret).update(payloadSegment).digest('base64url')
}

async function authenticateAdminCredentials(email: string, password: string) {
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
    role: 'admin' as const,
    email: matchedEmail,
    clientAccountId: null,
    fullName: matchedEmail,
    sessionDurationMs: config.sessionDurationMs,
    sessionSecret: config.sessionSecret,
  } satisfies AuthenticatedAccount
}

export async function authenticateAccountCredentials(email: string, password: string) {
  const adminAccount = await authenticateAdminCredentials(email, password)

  if (adminAccount) {
    return adminAccount
  }

  const sessionConfig = getSessionConfig()

  if (!sessionConfig) {
    return null
  }

  const clientAccount = await authenticateClientCredentials(email, password)

  if (!clientAccount) {
    return null
  }

  return {
    role: 'client' as const,
    email: clientAccount.email,
    clientAccountId: clientAccount.id,
    fullName: clientAccount.fullName,
    sessionDurationMs: sessionConfig.sessionDurationMs,
    sessionSecret: sessionConfig.sessionSecret,
  } satisfies AuthenticatedAccount
}

export function createAccountSessionToken(
  account: Pick<AuthenticatedAccount, 'role' | 'email' | 'clientAccountId' | 'fullName'>,
  sessionDurationMs: number,
  sessionSecret: string,
) {
  const payload: AccountSessionPayload = {
    sub: 'account',
    role: account.role,
    email: account.email,
    clientAccountId: account.clientAccountId,
    fullName: account.fullName,
    exp: Date.now() + sessionDurationMs,
  }

  const payloadSegment = base64UrlEncode(JSON.stringify(payload))
  const signature = createSignature(payloadSegment, sessionSecret)

  return `${payloadSegment}.${signature}`
}

export function verifyAccountSessionToken(token: string): VerifiedAccountSession | null {
  const sessionConfig = getSessionConfig()

  if (!sessionConfig) {
    return null
  }

  const [payloadSegment, signature] = token.split('.')

  if (!payloadSegment || !signature) {
    return null
  }

  const expectedSignature = createSignature(payloadSegment, sessionConfig.sessionSecret)

  if (!secureStringEquals(signature, expectedSignature)) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadSegment)) as AccountSessionPayload

    if (
      payload.sub !== 'account' ||
      (payload.role !== 'admin' && payload.role !== 'client') ||
      typeof payload.email !== 'string' ||
      typeof payload.exp !== 'number'
    ) {
      return null
    }

    if (payload.exp <= Date.now()) {
      return null
    }

    if (payload.role === 'admin') {
      const config = getAdminAuthConfig()

      if (!config || !hasConfiguredAdminEmail(config.emails, payload.email)) {
        return null
      }
    }

    if (payload.role === 'client' && typeof payload.clientAccountId !== 'string') {
      return null
    }

    return {
      role: payload.role,
      email: payload.email,
      clientAccountId: payload.clientAccountId || null,
      fullName: payload.fullName || null,
      expiresAt: new Date(payload.exp).toISOString(),
    }
  } catch {
    return null
  }
}
