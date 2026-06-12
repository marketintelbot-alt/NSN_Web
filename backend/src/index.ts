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
  createClientALaCarteCheckoutSessionHandler,
  readClientPortalHandler,
  requireClientSession,
  updateClientBookingHandler,
  updateClientPasswordHandler,
  updateClientProfileHandler,
} from './routes/accountPortal.js'
import { handleStripeWebhook } from './routes/aLaCarteServices.js'
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
import {
  approveServiceRequestHandler,
  cancelServiceRequestHandler,
  completeServiceRequestHandler,
  createServiceRequestPaymentLinkHandler,
  declineServiceRequestHandler,
  readAdminServiceRequestsHandler,
  requestServiceChangesHandler,
} from './routes/adminServiceRequests.js'
import {
  createServiceRequestHandler,
  listServiceCatalogHandler,
  readServiceRequestConfirmationHandler,
} from './routes/serviceRequests.js'
import {
  findServiceById,
  getConfiguredStripePriceId,
  listPublicServiceCatalog,
} from './lib/serviceCatalog.js'
import { getAdminAuthConfig, getPrimaryAdminEmail } from './lib/adminSession.js'
import { getBusinessNotificationEmails } from './lib/notificationEmails.js'
import { getSupabaseAdminClient, hasSupabaseAdminConfig } from './lib/supabaseAdmin.js'
import { getStripeWebhookSecret, hasStripeCheckoutConfig } from './lib/stripeCheckout.js'

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
const serviceRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message:
      'Too many requests were submitted from this network. Please wait a few minutes and try again.',
  },
})

app.disable('x-powered-by')
app.set('trust proxy', Number.isNaN(trustProxyHops) ? 1 : trustProxyHops)
app.use(
  cors({
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin))
    },
    credentials: false,
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
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook,
)
app.use(express.json({ limit: '25kb', strict: true }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'))

app.get('/api/health', (_request, response) => {
  response.status(200).json({
    status: 'ok',
    service: 'north-shore-nautical-api',
  })
})

app.get(['/api/health/ready', '/api/health/dependencies'], async (_request, response) => {
  const supabaseConfigured = hasSupabaseAdminConfig()
  const stripeConfigured = hasStripeCheckoutConfig()
  const stripeWebhookConfigured = Boolean(getStripeWebhookSecret())
  const adminAuthConfigured = Boolean(getAdminAuthConfig())
  const emailConfigured = Boolean(
    process.env.RESEND_API_KEY?.trim() &&
      process.env.FROM_EMAIL?.trim() &&
      getBusinessNotificationEmails(getPrimaryAdminEmail()).length > 0,
  )
  const operationalConfigReady =
    process.env.NODE_ENV !== 'production' ||
    (stripeWebhookConfigured && adminAuthConfigured && emailConfigured)
  const instantCheckoutServices = listPublicServiceCatalog().filter(
    (service) => service.paymentType === 'instant_checkout',
  )
  const missingStripePriceServices = instantCheckoutServices
    .filter((service) => {
      const serviceDefinition = findServiceById(service.id)
      return !serviceDefinition || !getConfiguredStripePriceId(serviceDefinition)
    })
    .map((service) => service.id)

  let serviceRequestsTable = {
    ok: false,
    message: supabaseConfigured ? 'Not checked yet.' : 'Supabase environment variables are missing.',
  }

  if (supabaseConfigured) {
    try {
      const { error } = await getSupabaseAdminClient()
        .from('service_requests')
        .select('id', { count: 'exact', head: true })
        .limit(1)

      if (error) {
        serviceRequestsTable = {
          ok: false,
          message: 'The service request store is unavailable.',
        }
      } else {
        serviceRequestsTable = {
          ok: true,
          message: 'service_requests table is reachable.',
        }
      }
    } catch (error) {
      serviceRequestsTable = {
        ok: false,
        message: 'The service request store is unavailable.',
      }
    }
  }

  const dependenciesOk =
    supabaseConfigured &&
    serviceRequestsTable.ok &&
    stripeConfigured &&
    missingStripePriceServices.length === 0 &&
    operationalConfigReady

  response.status(dependenciesOk ? 200 : 503).json({
    status: dependenciesOk ? 'ok' : 'degraded',
    checks: {
      supabaseConfigured,
      serviceRequestsTable: {
        ok: serviceRequestsTable.ok,
      },
      stripeConfigured,
      stripePricesConfigured: missingStripePriceServices.length === 0,
      stripeWebhookConfigured,
      adminAuthConfigured,
      emailConfigured,
    },
  })
})

app.post('/api/admin/session', adminLoginLimiter, createAdminSession)
app.get('/api/admin/session', readAdminSession)
app.delete('/api/admin/session', destroyAdminSession)
app.post('/api/account/session', adminLoginLimiter, createAdminSession)
app.get('/api/account/session', readAdminSession)
app.delete('/api/account/session', destroyAdminSession)
app.get('/api/admin/dashboard', requireAdminSession, readAdminDashboard)
app.get('/api/admin/service-requests', requireAdminSession, readAdminServiceRequestsHandler)
app.post(
  '/api/admin/service-requests/:requestId/approve-capture',
  requireAdminSession,
  approveServiceRequestHandler,
)
app.post(
  '/api/admin/service-requests/:requestId/payment-link',
  requireAdminSession,
  createServiceRequestPaymentLinkHandler,
)
app.post(
  '/api/admin/service-requests/:requestId/request-changes',
  requireAdminSession,
  requestServiceChangesHandler,
)
app.post(
  '/api/admin/service-requests/:requestId/decline',
  requireAdminSession,
  declineServiceRequestHandler,
)
app.post(
  '/api/admin/service-requests/:requestId/complete',
  requireAdminSession,
  completeServiceRequestHandler,
)
app.post(
  '/api/admin/service-requests/:requestId/cancel',
  requireAdminSession,
  cancelServiceRequestHandler,
)
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
app.put('/api/account/password', requireClientSession, updateClientPasswordHandler)
app.post(
  '/api/account/a-la-carte/checkout',
  requireClientSession,
  createClientALaCarteCheckoutSessionHandler,
)

app.get('/api/services/catalog', listServiceCatalogHandler)
app.post('/api/service-requests', serviceRequestLimiter, createServiceRequestHandler)
app.get('/api/service-requests/:requestId/confirmation', readServiceRequestConfirmationHandler)

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
