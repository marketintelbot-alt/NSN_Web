import type { Request, Response } from 'express'
import rateLimit from 'express-rate-limit'

import {
  authenticateAdminCredentials,
  createAdminSessionToken,
  getAdminAuthConfig,
  verifyAdminSessionToken,
} from '../lib/adminSession.js'
import {
  clearAdminSessionCookie,
  readAdminSessionCookie,
  writeAdminSessionCookie,
} from '../lib/adminCookie.js'

type AdminSessionResponse = {
  authenticated: boolean
  email?: string
  expiresAt?: string
}

function getVerifiedSession(request: Request) {
  const token = readAdminSessionCookie(request)

  if (!token) {
    return null
  }

  return verifyAdminSessionToken(token)
}

export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: 'Too many admin login attempts. Please wait a few minutes and try again.',
  },
})

export async function createAdminSession(request: Request, response: Response) {
  const config = getAdminAuthConfig()

  if (!config) {
    return response.status(503).json({
      message: 'Admin login is not configured yet. Add ADMIN_EMAIL, ADMIN_PASSWORD_HASH, and ADMIN_SESSION_SECRET.',
    })
  }

  const email = typeof request.body?.email === 'string' ? request.body.email : ''
  const password = typeof request.body?.password === 'string' ? request.body.password : ''
  const authenticatedConfig = await authenticateAdminCredentials(email, password)

  if (!authenticatedConfig) {
    return response.status(401).json({
      message: 'Invalid admin email or password.',
    })
  }

  const token = createAdminSessionToken(
    authenticatedConfig.email,
    authenticatedConfig.sessionDurationMs,
    authenticatedConfig.sessionSecret,
  )
  const session = verifyAdminSessionToken(token)

  if (session) {
    writeAdminSessionCookie(response, token, session.expiresAt)
  }

  return response.status(200).json({
    session: {
      authenticated: true,
      email: authenticatedConfig.email,
      expiresAt: session?.expiresAt,
    } satisfies AdminSessionResponse,
  })
}

export function readAdminSession(request: Request, response: Response) {
  const config = getAdminAuthConfig()

  if (!config) {
    return response.status(503).json({
      message: 'Admin login is not configured yet.',
    })
  }

  const session = getVerifiedSession(request)

  if (!session) {
    return response.status(401).json({
      message: 'Admin session is not valid.',
    })
  }

  return response.status(200).json({
    authenticated: true,
    email: session.email,
    expiresAt: session.expiresAt,
  } satisfies AdminSessionResponse)
}

export function destroyAdminSession(_request: Request, response: Response) {
  clearAdminSessionCookie(response)
  return response.status(204).send()
}
