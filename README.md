# North Shore Nautical

North Shore Nautical is now positioned as a premium marine detailing, marine care, and owner-advisory business. The public site sells marine care first, advisory second, and routes every public request through review before scheduling and invoicing.

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
  - starting-rate marine care services
  - custom-review services
  - condition-heavy invoice review
- server-side validation of service, boat length, pricing, and agreement acceptance
- protected `/admin` dashboard for request review and follow-up
- preserved private `/portal` route for legacy internal or invited-user workflows that are intentionally not linked from the public site
- Supabase-backed request records plus preserved legacy tables
- updated email templates for the invoice-review request model

## Architecture

- `frontend/`
  - Vite + React + TypeScript public site, booking flow, confirmation states, and admin UI
- `backend/`
  - Express API for auth, public service requests, Stripe webhooks, admin actions, and private legacy portal endpoints
- `backend/src/lib/serviceCatalog.ts`
  - source of truth for public services, pricing, display order, and invoice-review routing
- `backend/src/lib/serviceRequests.ts`
  - request creation, published estimate storage, and admin actions
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
  - stores every public submission as a pending-review inquiry
  - recalculates and stores published starting estimates server-side when applicable
- `GET /api/service-requests/:requestId/confirmation`
  - returns the latest request and review state

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
ADMIN_EMAILS=
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
ADMIN_SESSION_SECRET=
ADMIN_SESSION_TTL_HOURS=12
```

Frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_SITE_URL=https://nsnautical.com
```

Notes:

- Public service requests do not require Stripe configuration because customers are invoiced after review.
- `BUSINESS_NOTIFICATION_EMAIL` or `BUSINESS_NOTIFICATION_EMAILS` can be used for internal notifications.
- `FROM_EMAIL` must be a verified Resend sender.
- `ADMIN_PASSWORD_HASH` must be a bcrypt hash.
- keep Supabase server keys backend-only

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
- public submissions start with `payment_status = not_started` and are handled through direct invoice follow-up
- legacy tables remain in place for private or historical workflows

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
- the public site is go-live ready once Supabase, admin auth, and Resend are connected

## Quick production checklist

1. Run `supabase/schema.sql` or the new migration set in production.
2. Configure admin auth, Supabase, and Resend env vars.
3. Deploy frontend and backend.
4. Test:
   - one package request
   - one custom-review request
   - one over-40-foot request
   - one admin review follow-up
