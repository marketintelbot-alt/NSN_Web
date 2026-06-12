import assert from 'node:assert/strict'
import test from 'node:test'

import bcrypt from 'bcryptjs'
import type { Request, Response } from 'express'

import {
  createAccountSessionToken,
  readAccountSessionToken,
  verifyAccountSessionToken,
} from './adminSession.js'
import { createAdminSession } from '../routes/adminSession.js'

test('account sessions use bearer authorization and ignore cookies', () => {
  process.env.ADMIN_SESSION_SECRET = 'test-session-secret-with-sufficient-entropy'

  const token = createAccountSessionToken(
    {
      role: 'client',
      email: 'client@example.com',
      clientAccountId: 'client-account-id',
      fullName: 'Test Client',
    },
    60_000,
    process.env.ADMIN_SESSION_SECRET,
  )

  assert.equal(
    readAccountSessionToken({
      headers: {
        authorization: `Bearer ${token}`,
        cookie: `nsn_admin_session=${token}`,
      },
    }),
    token,
  )
  assert.equal(
    readAccountSessionToken({
      headers: {
        cookie: `nsn_admin_session=${token}`,
      },
    }),
    '',
  )
  assert.equal(verifyAccountSessionToken(token)?.email, 'client@example.com')
})

test('login returns the bearer token at the response top level', async () => {
  process.env.ADMIN_EMAILS = 'admin@example.com'
  process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash('correct-password', 4)
  process.env.ADMIN_SESSION_SECRET = 'test-session-secret-with-sufficient-entropy'

  let statusCode = 0
  let payload: Record<string, unknown> = {}
  const request = {
    body: {
      email: 'admin@example.com',
      password: 'correct-password',
    },
    is: (contentType: string) => contentType === 'application/json',
  } as unknown as Request
  const response = {
    status(code: number) {
      statusCode = code
      return this
    },
    json(body: Record<string, unknown>) {
      payload = body
      return this
    },
  } as unknown as Response

  await createAdminSession(request, response)

  assert.equal(statusCode, 200)
  assert.equal(typeof payload.sessionToken, 'string')
  assert.equal('sessionToken' in (payload.session as Record<string, unknown>), false)
})
