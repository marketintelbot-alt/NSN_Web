import 'dotenv/config'

import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import morgan from 'morgan'

import {
  adminLoginLimiter,
  createAdminSession,
  destroyAdminSession,
  readAdminSession,
} from './routes/adminSession.js'
import {
  createClientBookingHandler,
  readClientPortalHandler,
  requireClientSession,
  updateClientBookingHandler,
  updateClientProfileHandler,
} from './routes/accountPortal.js'
import { getPrimaryAdminEmail } from './lib/adminSession.js'
import { getBusinessNotificationEmails } from './lib/notificationEmails.js'
import {
  createAdminBookingHandler,
  createAdminClientAccount,
  createAdminSlot,
  readAdminDashboard,
  requireAdminSession,
  removeAdminSlot,
  resendAdminBookingEmails,
  updateAdminBookingHandler,
  updateAdminClientAccount,
  updateAdminSlot,
} from './routes/adminDashboard.js'
import { createPublicBookingRouter } from './routes/publicBooking.js'

const app = express()
const port = Number(process.env.PORT || 4000)
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 1)

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'https://nsnautical.com',
  'https://www.nsnautical.com',
  'https://north-shore-nautical.onrender.com',
  'https://north-shore-nautical-site.onrender.com',
  'https://northshorenautical.com',
  'https://www.northshorenautical.com',
] as const

function normalizeOrigin(origin: string) {
  const trimmedOrigin = origin.trim()

  if (!trimmedOrigin) {
    return ''
  }

  try {
    return new URL(trimmedOrigin).origin
  } catch {
    return trimmedOrigin.replace(/\/$/, '')
  }
}

const allowedOrigins = [
  ...new Set(
    [...defaultAllowedOrigins, ...(process.env.CORS_ORIGIN || '').split(',')]
      .map((origin) => normalizeOrigin(origin))
      .filter(Boolean),
  ),
]

function isAllowedOrigin(origin?: string) {
  if (!origin) {
    return true
  }

  const normalizedOrigin = normalizeOrigin(origin)
  const isLocalPreviewOrigin = Boolean(
    normalizedOrigin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/),
  )

  return isLocalPreviewOrigin || allowedOrigins.includes(normalizedOrigin)
}

const reservationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message:
      'Too many reservation attempts were submitted from this network. Please wait a few minutes and try again.',
  },
})

const publicBookingRouter = createPublicBookingRouter({
  resendApiKey: process.env.RESEND_API_KEY,
  fromEmail: process.env.FROM_EMAIL,
  businessNotificationEmails: getBusinessNotificationEmails(getPrimaryAdminEmail()),
})

app.disable('x-powered-by')
app.set('trust proxy', Number.isNaN(trustProxyHops) ? 1 : trustProxyHops)
app.use(
  cors({
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin))
    },
    credentials: true,
    methods: ['DELETE', 'GET', 'POST', 'PUT'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    maxAge: 86400,
  }),
)
app.use(
  helmet({
    referrerPolicy: {
      policy: 'no-referrer',
    },
  }),
)
app.use('/api', (_request, response, next) => {
  response.setHeader('Cache-Control', 'no-store')
  next()
})
app.use(express.json({ limit: '25kb', strict: true }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'))

app.get('/api/health', (_request, response) => {
  response.status(200).json({
    status: 'ok',
    service: 'north-shore-nautical-api',
  })
})

app.post('/api/admin/session', adminLoginLimiter, createAdminSession)
app.get('/api/admin/session', readAdminSession)
app.delete('/api/admin/session', destroyAdminSession)
app.post('/api/account/session', adminLoginLimiter, createAdminSession)
app.get('/api/account/session', readAdminSession)
app.delete('/api/account/session', destroyAdminSession)
app.get('/api/admin/dashboard', requireAdminSession, readAdminDashboard)
app.post('/api/admin/slots', requireAdminSession, createAdminSlot)
app.put('/api/admin/slots/:slotId', requireAdminSession, updateAdminSlot)
app.delete('/api/admin/slots/:slotId', requireAdminSession, removeAdminSlot)
app.post('/api/admin/bookings', requireAdminSession, createAdminBookingHandler)
app.put('/api/admin/bookings/:bookingId', requireAdminSession, updateAdminBookingHandler)
app.post(
  '/api/admin/bookings/:bookingId/resend-emails',
  requireAdminSession,
  resendAdminBookingEmails,
)
app.post('/api/admin/clients', requireAdminSession, createAdminClientAccount)
app.put('/api/admin/clients/:clientId', requireAdminSession, updateAdminClientAccount)

app.get('/api/account/portal', requireClientSession, readClientPortalHandler)
app.post('/api/account/bookings', requireClientSession, createClientBookingHandler)
app.put('/api/account/bookings/:bookingId', requireClientSession, updateClientBookingHandler)
app.put('/api/account/profile', requireClientSession, updateClientProfileHandler)

app.get('/api/booking-slots', publicBookingRouter.listSlots)
app.post('/api/bookings', reservationLimiter, publicBookingRouter.createBooking)

app.use('/api', (_request, response) => {
  response.status(404).json({
    message: 'API route not found.',
  })
})

app.use(
  (
    error: Error,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(error)

    response.status(500).json({
      message: 'An unexpected error occurred while processing the request.',
    })
  },
)

app.listen(port, () => {
  console.log(`North Shore Nautical API listening on http://localhost:${port}`)
})
