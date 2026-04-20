import type { Request, Response } from 'express'

import Stripe from 'stripe'

import {
  findALaCarteServiceByKey,
  fulfillALaCarteCheckoutPurchase,
  listPublicALaCarteServices,
} from '../lib/aLaCarteServices.js'
import { getStripeClient, getStripeWebhookSecret } from '../lib/stripeCheckout.js'

function readStripeSignature(request: Request) {
  const signature = request.headers['stripe-signature']
  return typeof signature === 'string' ? signature : ''
}

async function fulfillCompletedCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.metadata?.checkoutKind !== 'a_la_carte') {
    return
  }

  const clientAccountId = session.metadata.clientAccountId || ''
  const serviceKey = session.metadata.serviceKey || ''
  const amountCents = Number(session.metadata.amountCents || 0)

  if (!clientAccountId || !serviceKey || !Number.isFinite(amountCents) || amountCents <= 0) {
    throw new Error('The Stripe session was missing required a la carte metadata.')
  }

  const catalogEntry = findALaCarteServiceByKey(serviceKey)

  if (!catalogEntry) {
    throw new Error('The purchased Stripe service is not recognized.')
  }

  await fulfillALaCarteCheckoutPurchase({
    clientAccountId,
    serviceKey,
    serviceName: catalogEntry.serviceName,
    amountCents,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === 'string' ? session.payment_intent : null,
    customerEmail: session.customer_details?.email || session.customer_email || null,
  })
}

export function listPublicALaCarteServicesHandler(_request: Request, response: Response) {
  return response.status(200).json({
    services: listPublicALaCarteServices(),
  })
}

export async function handleStripeWebhook(request: Request, response: Response) {
  const webhookSecret = getStripeWebhookSecret()

  if (!webhookSecret) {
    return response.status(503).json({
      message: 'Stripe webhook signing is not configured yet.',
    })
  }

  const signature = readStripeSignature(request)

  if (!signature) {
    return response.status(400).json({
      message: 'Stripe signature header is required.',
    })
  }

  try {
    const stripe = getStripeClient()
    const event = stripe.webhooks.constructEvent(request.body, signature, webhookSecret)

    switch (event.type) {
      case 'checkout.session.async_payment_succeeded':
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode !== 'payment') {
          break
        }

        if (
          event.type === 'checkout.session.completed' &&
          session.payment_status !== 'paid'
        ) {
          break
        }

        await fulfillCompletedCheckoutSession(session)
        break
      }
      default:
        break
    }

    return response.status(200).json({ received: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to verify the Stripe webhook payload.'

    return response.status(400).json({
      message,
    })
  }
}
