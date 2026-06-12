import Stripe from 'stripe'

import type { ClientAccount } from './clientAccounts.js'
import type { ValidatedALaCarteCheckoutAmount } from './aLaCarteServices.js'

const stripeApiVersion = '2026-05-27.dahlia'

let cachedStripeClient: Stripe | null = null

function normalizeOrigin(value: string) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return ''
  }

  try {
    return new URL(trimmedValue).origin
  } catch {
    return trimmedValue.replace(/\/$/, '')
  }
}

function getSiteUrl() {
  const explicitSiteUrl = process.env.SITE_URL?.trim()

  if (explicitSiteUrl) {
    return normalizeOrigin(explicitSiteUrl)
  }

  const configuredCorsOrigin = `${process.env.CORS_ORIGIN || ''}`
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .find(Boolean)

  if (configuredCorsOrigin) {
    return configuredCorsOrigin
  }

  return process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173'
}

function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY?.trim() || ''
}

export function hasStripeCheckoutConfig() {
  return Boolean(getStripeSecretKey() && getSiteUrl())
}

export function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || ''
}

export function getStripeClient() {
  const secretKey = getStripeSecretKey()

  if (!secretKey) {
    throw new Error('Stripe is not configured yet.')
  }

  if (!cachedStripeClient) {
    cachedStripeClient = new Stripe(secretKey, {
      apiVersion: stripeApiVersion,
    })
  }

  return cachedStripeClient
}

export async function createALaCarteCheckoutSession(
  clientAccount: ClientAccount,
  checkout: ValidatedALaCarteCheckoutAmount,
) {
  const siteUrl = getSiteUrl()

  if (!siteUrl) {
    throw new Error('The site URL is not configured yet for Stripe checkout.')
  }

  const stripe = getStripeClient()
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    // NSN currently does not enable Stripe Tax automatically. Do not enable automatic_tax unless NSN has confirmed tax registration/compliance requirements.
    automatic_tax: { enabled: false },
    client_reference_id: clientAccount.id,
    customer_email: clientAccount.email,
    success_url: `${siteUrl}/portal?checkout=success&service=${checkout.service.serviceKey}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/portal?checkout=cancelled&service=${checkout.service.serviceKey}`,
    metadata: {
      checkoutKind: 'a_la_carte',
      clientAccountId: clientAccount.id,
      serviceKey: checkout.service.serviceKey,
      serviceName: checkout.service.serviceName,
      amountCents: String(checkout.amountCents),
    },
    payment_intent_data: {
      metadata: {
        checkoutKind: 'a_la_carte',
        clientAccountId: clientAccount.id,
        serviceKey: checkout.service.serviceKey,
        serviceName: checkout.service.serviceName,
        amountCents: String(checkout.amountCents),
      },
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: checkout.amountCents,
          product_data: {
            name: checkout.service.serviceName,
            description: checkout.service.checkoutBlurb,
            metadata: {
              serviceKey: checkout.service.serviceKey,
              clientAccountId: clientAccount.id,
            },
          },
        },
      },
    ],
  })

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL.')
  }

  return {
    id: session.id,
    url: session.url,
  }
}
