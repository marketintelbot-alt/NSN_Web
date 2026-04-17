import type { Request, Response } from 'express'
import rateLimit from 'express-rate-limit'

import {
  authenticateAccountCredentials,
  createAccountSessionToken,
  verifyAccountSessionToken,
} from '../lib/adminSession.js'
import {
  clearAdminSessionCookie,
  readAdminSessionCookie,
  writeAdminSessionCookie,
} from '../lib/adminCookie.js'

type AccountSessionResponse = {
  authenticated: boolean
  role?: 'admin' | 'client'
  email?: string
  clientAccountId?: string | null
  fullName?: string | null
  expiresAt?: string
}

function getVerifiedSession(request: Request) {
  const token = readAdminSessionCookie(request)

  if (!token) {
    return null
  }

  return verifyAccountSessionToken(token)
}

export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts. Please wait a few minutes and try again.',
  },
})

export async function createAdminSession(request: Request, response: Response) {
  const email = typeof request.body?.email === 'string' ? request.body.email : ''
  const password = typeof request.body?.password === 'string' ? request.body.password : ''
  const authenticatedAccount = await authenticateAccountCredentials(email, password)

  if (!authenticatedAccount) {
    return response.status(401).json({
      message: 'That email and password combination did not match our records.',
    })
  }

  const token = createAccountSessionToken(
    authenticatedAccount,
    authenticatedAccount.sessionDurationMs,
    authenticatedAccount.sessionSecret,
  )
  const session = verifyAccountSessionToken(token)

  if (session) {
    writeAdminSessionCookie(response, token, session.expiresAt)
  }

  return response.status(200).json({
    session: {
      authenticated: true,
      role: authenticatedAccount.role,
      email: authenticatedAccount.email,
      clientAccountId: authenticatedAccount.clientAccountId,
      fullName: authenticatedAccount.fullName,
      expiresAt: session?.expiresAt,
    } satisfies AccountSessionResponse,
  })
}

export function readAdminSession(request: Request, response: Response) {
  const session = getVerifiedSession(request)

  if (!session) {
    return response.status(401).json({
      message: 'Account session is not valid.',
    })
  }

  return response.status(200).json({
    authenticated: true,
    role: session.role,
    email: session.email,
    clientAccountId: session.clientAccountId,
    fullName: session.fullName,
    expiresAt: session.expiresAt,
  } satisfies AccountSessionResponse)
}

export function destroyAdminSession(_request: Request, response: Response) {
  clearAdminSessionCookie(response)
  return response.status(204).send()
}
