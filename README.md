# North Shore Nautical

North Shore Nautical is now positioned as a premium marine detailing, marine care, and owner-advisory business. The public site sells marine care first, advisory second, and keeps every booking in a pending-review state until admin approval and payment capture.

## What this build includes

- public website with the final navigation:
  - Home
  - Services
  - Pricing
  - Gallery
  - Advisory
  - Contact
- centralized public service catalog and pricing config in `backend/src/lib/serviceCatalog.ts`
- public booking flow for:
  - instant-checkout marine care services
  - quote-only services
  - condition-heavy inquiry routing
- server-side validation of service, boat length, pricing, agreement acceptance, and checkout eligibility
- dynamic Stripe Checkout Sessions with manual capture
- protected `/admin` dashboard for request review and payment capture
- preserved private `/portal` route for legacy internal or invited-user workflows that are intentionally not linked from the public site
- Supabase-backed request records plus preserved legacy tables
- updated email templates and Stripe webhook synchronization for the new approval model

## Architecture

- `frontend/`
  - Vite + React + TypeScript public site, booking flow, confirmation states, and admin UI
- `backend/`
  - Express API for auth, public service requests, Stripe webhooks, admin actions, and private legacy portal endpoints
- `backend/src/lib/serviceCatalog.ts`
  - source of truth for public services, pricing, display order, and checkout eligibility
- `backend/src/lib/serviceRequests.ts`
  - request creation, Stripe authorization, admin actions, and webhook synchronization
- `supabase/schema.sql`
  - Supabase schema including `service_requests` and preserved legacy tables
- `render.yaml`
  - Render Blueprint for the frontend static site, backend web service, and reminder job

## Public request flow

### Public APIs

- `GET /api/services/catalog`
  - returns the centralized public service catalog
- `POST /api/service-requests`
  - validates the request
  - routes quote-only or condition-heavy work to inquiry review
  - recalculates pricing server-side before Stripe is used
  - creates a Stripe Checkout Session only for eligible instant-checkout services
- `GET /api/service-requests/:requestId/confirmation`
  - returns the latest request, booking, and payment state

### Stripe behavior

- instant-checkout services use Stripe Checkout Sessions created on the backend
- per-foot service line item quantity equals rounded-up boat length in feet
- flat service line item quantity is `1`
- `payment_intent_data.capture_method` is set to `manual`
- checkout authorizes the card but does not confirm the appointment
- admin approval captures the PaymentIntent and changes the request to `confirmed`
- admin decline cancels the uncaptured authorization and changes the request to `declined`

### Admin APIs

- `GET /api/admin/service-requests`
- `POST /api/admin/service-requests/:requestId/approve-capture`
- `POST /api/admin/service-requests/:requestId/request-changes`
- `POST /api/admin/service-requests/:requestId/decline`
- `POST /api/admin/service-requests/:requestId/complete`
- `POST /api/admin/service-requests/:requestId/cancel`

All admin routes require authenticated admin sessions.

## Local development

Frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Backend:

```bash
cd backend
npm install
cp ../.env.example .env
npm run dev
```

Repo-level helpers:

```bash
npm run build
npm run lint
```

Local URLs:

- frontend: `http://localhost:5173`
- backend: `http://localhost:4000`
- admin: `http://localhost:5173/admin`
- private portal: `http://localhost:5173/portal`

## Environment variables

Backend `.env`:

```env
PORT=4000
RESEND_API_KEY=
BUSINESS_NOTIFICATION_EMAIL=
BUSINESS_NOTIFICATION_EMAILS=
FROM_EMAIL=
SITE_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
TRUST_PROXY_HOPS=1
SUPABASE_URL=
SUPABASE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_INTERIOR_REFRESH=
STRIPE_PRICE_MAINTENANCE_DETAIL=price_1TPubeCobOhggrgBFtN5kPlc
STRIPE_PRICE_SIGNATURE_DETAIL=price_1TPujvCobOhggrgBNXw0hiqs
STRIPE_PRICE_EXTERIOR_WASH=price_1TPukPCobOhggrgBeEaSfxpP
STRIPE_PRICE_BUFF_WAX=price_1TPukvCobOhggrgBI1gCnPHz
STRIPE_PRICE_VINYL_DEEP_CLEAN=price_1TPulKCobOhggrgBi3IHdn4Y
STRIPE_PRICE_CARPET_MAT_SHAMPOO=price_1TPuloCobOhggrgBUAtakSk0
STRIPE_PRICE_NON_SKID_DECK_SCRUB=price_1TPumECobOhggrgBcSx9r6Gf
SUCCESS_URL=https://www.nsnautical.com/booking/confirmation?request={REQUEST_ID}&session_id={CHECKOUT_SESSION_ID}
CANCEL_URL=https://www.nsnautical.com/booking?cancelled=1&service={SERVICE_ID}
ADMIN_EMAILS=
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
ADMIN_SESSION_SECRET=
ADMIN_SESSION_TTL_HOURS=12
```

Frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_SITE_URL=https://www.nsnautical.com
```

Notes:

- `STRIPE_PUBLISHABLE_KEY` is optional for the current hosted Checkout flow and is included as a placeholder only.
- `SUCCESS_URL` and `CANCEL_URL` support token replacement:
  - `{REQUEST_ID}`
  - `{CHECKOUT_SESSION_ID}`
  - `{SERVICE_ID}`
- `BUSINESS_NOTIFICATION_EMAIL` or `BUSINESS_NOTIFICATION_EMAILS` can be used for internal notifications.
- `FROM_EMAIL` must be a verified Resend sender.
- `ADMIN_PASSWORD_HASH` must be a bcrypt hash.
- keep Supabase server keys and Stripe secret keys backend-only

## One-time admin password setup

Generate the bcrypt hash locally:

```bash
cd backend
npm run hash:admin-password -- "replace-with-a-strong-password"
```

Copy the printed hash into `ADMIN_PASSWORD_HASH`, then set:

- `ADMIN_EMAILS`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_SESSION_SECRET`

## Supabase setup

1. Create the Supabase project.
2. Run [supabase/schema.sql](/Users/johnnymaris/Desktop/New%20project/NSN_Web/supabase/schema.sql).
3. Add backend env vars:
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
   - or `SUPABASE_SERVICE_ROLE_KEY` as the fallback legacy key

There is a shorter operational handoff at [supabase/SETUP.md](/Users/johnnymaris/Desktop/New%20project/NSN_Web/supabase/SETUP.md).

Important public data flow:

- `service_requests` stores public inquiries and booking/payment review states
- agreement acceptance metadata is stored with the request
- Stripe IDs and payment status are stored server-side only
- legacy tables remain in place for private or historical workflows

## Stripe webhook setup

Point Stripe to:

- `https://YOUR-BACKEND/api/stripe/webhook`

Subscribe to:

- `checkout.session.completed`
- `payment_intent.amount_capturable_updated`
- `payment_intent.succeeded`
- `payment_intent.canceled`
- `charge.refunded`

The webhook handlers are idempotent and update booking/payment status without creating duplicates.

## Render deployment

This repo is configured for:

- `north-shore-nautical-site`
  - static site
  - root directory: `frontend`
- `north-shore-nautical-api`
  - web service
  - root directory: `backend`
- `north-shore-nautical-reminders`
  - cron worker
  - root directory: `backend`

Key deployment notes:

- keep `CORS_ORIGIN` set to the exact frontend origin
- keep `SITE_URL` and `VITE_SITE_URL` aligned with the live public domain
- set the live Stripe secret and webhook secret before using instant-checkout services in production
- the public site is go-live ready once Stripe, Supabase, admin auth, and Resend are connected

## Quick production checklist

1. Run `supabase/schema.sql` or the new migration set in production.
2. Configure admin auth, Supabase, and Resend env vars.
3. Create Stripe prices for the instant-checkout services, including the $79.95 Interior Refresh price, and paste those IDs into env vars.
4. Configure the Stripe webhook endpoint and secret.
5. Deploy frontend and backend.
6. Test:
   - one inquiry-only request
   - one instant-checkout authorization
   - one admin approve and capture
   - one admin decline and cancel authorization
