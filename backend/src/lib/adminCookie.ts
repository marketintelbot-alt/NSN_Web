import type { Request, Response } from 'express'
import { parse, serialize } from 'cookie'

const adminSessionCookieName = 'nsn_admin_session'

function isSecureCookieEnabled() {
  return process.env.NODE_ENV === 'production'
}

function getSameSitePolicy() {
  return isSecureCookieEnabled() ? ('none' as const) : ('lax' as const)
}

function getCookieOptions(expiresAt?: string) {
  return {
    expires: expiresAt ? new Date(expiresAt) : new Date(0),
    httpOnly: true,
    path: '/',
    sameSite: getSameSitePolicy(),
    secure: isSecureCookieEnabled(),
  }
}

export function readAdminSessionCookie(request: Request) {
  const cookieHeader = request.headers.cookie

  if (!cookieHeader) {
    return ''
  }

  const cookies = parse(cookieHeader)
  return cookies[adminSessionCookieName] || ''
}

export function writeAdminSessionCookie(response: Response, token: string, expiresAt: string) {
  response.append(
    'Set-Cookie',
    serialize(adminSessionCookieName, token, getCookieOptions(expiresAt)),
  )
}

export function clearAdminSessionCookie(response: Response) {
  response.append('Set-Cookie', serialize(adminSessionCookieName, '', getCookieOptions()))
}
