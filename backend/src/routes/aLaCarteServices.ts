import type { Request, Response } from 'express'

import Stripe from 'stripe'

import {
  findALaCarteServiceByKey,
  fulfillALaCarteCheckoutPurchase,
  listPublicALaCarteServices,
  refundALaCarteCheckoutPurchase,
} from '../lib/aLaCarteServices.js'
import { getPrimaryAdminEmail } from '../lib/adminSession.js'
import { getBusinessNotificationEmails } from '../lib/notificationEmails.js'
import {
  sendAuthorizationReceivedEmails,
  sendRefundedBookingEmail,
} from '../lib/serviceRequestEmailDelivery.js'
import {
  syncServiceRequestAuthorizationFromCheckoutSession,
  syncServiceRequestAuthorizationFromPaymentIntent,
  syncServiceRequestCheckoutExpired,
  syncServiceRequestFailureFromPaymentIntent,
  syncServiceRequestRefundFromCharge,
} from '../lib/serviceRequests.js'
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

function getEmailOptions() {
  return {
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.FROM_EMAIL,
    businessNotificationEmails: getBusinessNotificationEmails(getPrimaryAdminEmail()),
    throwOnFailure: true,
  }
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

  const stripe = getStripeClient()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(request.body, signature, webhookSecret)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to verify the Stripe webhook payload.'

    return response.status(400).json({
      message,
    })
  }

  try {
    switch (event.type) {
      case 'checkout.session.async_payment_succeeded':
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode !== 'payment') {
          break
        }

        if (session.metadata?.checkoutKind === 'a_la_carte') {
          if (
            event.type === 'checkout.session.completed' &&
            session.payment_status !== 'paid'
          ) {
            break
          }

          await fulfillCompletedCheckoutSession(session)
          break
        }

        const updatedRequest = await syncServiceRequestAuthorizationFromCheckoutSession(session)

        if (updatedRequest.paymentStatus === 'authorized') {
          await sendAuthorizationReceivedEmails(updatedRequest, getEmailOptions())
        }

        break
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        await syncServiceRequestCheckoutExpired(session)
        break
      }
      case 'payment_intent.amount_capturable_updated':
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const updatedRequest =
          await syncServiceRequestAuthorizationFromPaymentIntent(paymentIntent)

        if (updatedRequest?.paymentStatus === 'authorized') {
          await sendAuthorizationReceivedEmails(updatedRequest, getEmailOptions())
        }

        break
      }
      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await syncServiceRequestAuthorizationFromPaymentIntent(paymentIntent)
        break
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await syncServiceRequestFailureFromPaymentIntent(paymentIntent)
        break
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const refundedRequest = await syncServiceRequestRefundFromCharge(charge)

        if (refundedRequest) {
          await sendRefundedBookingEmail(refundedRequest, getEmailOptions())
          break
        }

        const paymentIntent =
          typeof charge.payment_intent === 'string'
            ? await stripe.paymentIntents.retrieve(charge.payment_intent)
            : charge.payment_intent

        if (!paymentIntent) {
          break
        }

        const refundResult = await refundALaCarteCheckoutPurchase(
          paymentIntent.id,
          charge.id,
        )

        if (
          refundResult === 'not_found' &&
          paymentIntent.metadata.checkoutKind === 'a_la_carte'
        ) {
          throw new Error(
            'The refunded add-on purchase has not been fulfilled yet. Stripe will retry this event.',
          )
        }

        break
      }
      default:
        break
    }

    return response.status(200).json({ received: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to process the Stripe event.'

    console.error('Stripe webhook processing failed.', {
      eventId: event.id,
      eventType: event.type,
      message,
    })

    return response.status(500).json({
      message,
    })
  }
}
