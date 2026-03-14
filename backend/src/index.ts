import 'dotenv/config'

import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import morgan from 'morgan'

import { createReservationsHandler } from './routes/reservations.js'

const app = express()
const port = Number(process.env.PORT || 4000)
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 1)
const hasConfiguredOrigins = Boolean(process.env.CORS_ORIGIN?.trim())

const allowedOrigins = (
  process.env.CORS_ORIGIN ||
  'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

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

app.disable('x-powered-by')
app.set('trust proxy', Number.isNaN(trustProxyHops) ? 1 : trustProxyHops)
app.use(
  cors({
    origin(origin, callback) {
      const isLocalPreviewOrigin =
        !hasConfiguredOrigins &&
        Boolean(origin?.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/))

      if (!origin || allowedOrigins.includes(origin) || isLocalPreviewOrigin) {
        callback(null, true)
        return
      }

      callback(new Error('Origin not allowed by CORS'))
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
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

app.post(
  '/api/reservations',
  reservationLimiter,
  createReservationsHandler({
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.FROM_EMAIL,
    businessNotificationEmail: process.env.BUSINESS_NOTIFICATION_EMAIL,
  }),
)

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
