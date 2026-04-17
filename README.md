# North Shore Nautical

North Shore Nautical is a mobile-first booking site and lightweight API for a small seasonal client list. The app is tuned for the simplest reliable flow:

- clients open the site
- see available time slots
- choose one
- enter a few details
- get a confirmation email

Admin management lives behind a single protected `/admin` dashboard.

## What this build includes

- public slot-based booking flow with a minimal form
- secure single-admin sign-in with bcrypt-hashed password verification
- HTTP-only cookie sessions for admin access
- protected admin dashboard for slots, bookings, and email status
- Resend transactional emails:
  - customer confirmation
  - internal admin notification
- server-side validation, rate limiting, and double-booking protection
- Render-compatible deployment without changing platforms
- PWA-ready manifest, install metadata, and placeholder icons

## Architecture

- `frontend/`
  - Vite + React + TypeScript site and booking UI
- `backend/`
  - Express API for auth, booking, slot management, and email delivery
- `supabase/schema.sql`
  - tables and constraints for booking slots and launch bookings
- `render.yaml`
  - Render Blueprint for the frontend static site and backend web service

## Booking behavior

### Public booking

- `GET /api/booking-slots`
  - returns future active slots that are not already booked
- `POST /api/bookings`
  - validates and sanitizes user input
  - blocks double-booking on the server
  - saves the booking before email delivery
  - keeps the booking even if email delivery fails

### Admin dashboard

- `POST /api/admin/session`
  - validates the single admin login
  - sets a secure HTTP-only cookie
- `GET /api/admin/dashboard`
  - returns all relevant slots and bookings
- admin can:
  - add, edit, and delete available slots
  - create or edit bookings manually
  - review customer and admin email delivery state
  - retry booking confirmation emails

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
npm run sync:copy
```

Local URLs:

- frontend: `http://localhost:5173`
- backend: `http://localhost:4000`
- admin: `http://localhost:5173/admin`

## Environment variables

Backend `.env`:

```env
PORT=4000
RESEND_API_KEY=
BUSINESS_NOTIFICATION_EMAIL=
FROM_EMAIL=
CORS_ORIGIN=http://localhost:5173
TRUST_PROXY_HOPS=1
SUPABASE_URL=
SUPABASE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
ADMIN_SESSION_SECRET=
ADMIN_SESSION_TTL_HOURS=12
```

Frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_SITE_URL=https://www.northshorenautical.com
```

Notes:

- `BUSINESS_NOTIFICATION_EMAIL` can match `ADMIN_EMAIL` if one inbox should receive internal notifications.
- `FROM_EMAIL` must be a verified Resend sender, for example `North Shore Nautical <bookings@yourdomain.com>`.
- `ADMIN_PASSWORD_HASH` must be a bcrypt hash, not a plaintext password.
- `ADMIN_SESSION_TTL_HOURS` is optional and defaults to `12`.
- `SUPABASE_SECRET_KEY` is the preferred current Supabase server key.
- `SUPABASE_SERVICE_ROLE_KEY` is supported as a legacy fallback.
- Keep whichever server key you use backend-only and never expose it to the frontend.

## One-time admin password setup

Generate the bcrypt hash locally:

```bash
cd backend
npm run hash:admin-password -- "replace-with-a-strong-password"
```

Copy the printed hash into `ADMIN_PASSWORD_HASH`, then set:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_SESSION_SECRET`

Admin sign-in lives at `/admin`.

## Supabase setup

This app uses Supabase as the database layer for availability and bookings.

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. Add these backend environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
   - or `SUPABASE_SERVICE_ROLE_KEY` if you are using the legacy keys tab

There is also a short setup handoff at [supabase/SETUP.md](/Users/johnnymaris/Desktop/New%20project/NSN_Web/supabase/SETUP.md).

The active booking flow uses:

- `booking_slots`
- `launch_bookings`

Important behavior:

- slot availability is always derived on the server
- a database uniqueness constraint prevents double-booking
- email delivery status is written back to each booking for admin follow-up

## Resend setup

1. Create a Resend account.
2. Verify your sender domain or sender identity.
3. Create a transactional API key.
4. Set:
   - `RESEND_API_KEY`
   - `FROM_EMAIL`
   - `BUSINESS_NOTIFICATION_EMAIL`

The app sends two transactional emails per booking:

- customer confirmation
- internal admin notification

If delivery fails, the booking still stays saved and the admin dashboard shows the failure state.

## Render deployment

This repo is configured for two Render services:

- `north-shore-nautical-site`
  - Static Site
  - root directory: `frontend`
- `north-shore-nautical-api`
  - Web Service
  - root directory: `backend`

You can use `render.yaml` as a Blueprint or match the same settings manually in the Render dashboard.

### Frontend service

- build command: `npm install && npm run build`
- publish directory: `dist`
- env vars:
  - `VITE_API_BASE_URL=https://YOUR-BACKEND.onrender.com`
  - `VITE_SITE_URL=https://YOUR-LIVE-DOMAIN.com`

### Backend service

- build command: `npm install && npm run build`
- start command: `npm run start`
- health check path: `/api/health`
- env vars:
  - `RESEND_API_KEY`
  - `BUSINESS_NOTIFICATION_EMAIL`
  - `FROM_EMAIL`
  - `CORS_ORIGIN=https://YOUR-FRONTEND.onrender.com`
  - `TRUST_PROXY_HOPS=1`
  - `SUPABASE_URL`
  - `SUPABASE_SECRET_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD_HASH`
  - `ADMIN_SESSION_SECRET`
  - `ADMIN_SESSION_TTL_HOURS=12`

Deployment notes:

- keep `CORS_ORIGIN` set to the exact frontend origin
- after adding a custom domain, update both `CORS_ORIGIN` and `VITE_SITE_URL`
- the admin cookie is configured for secure cross-origin use in production so the split Render frontend/API setup works cleanly

## PWA and home screen readiness

The frontend now includes:

- `manifest.webmanifest`
- standalone display metadata
- Apple mobile web app tags
- placeholder install icons in `frontend/public/icons/`
- a minimal service worker for installability

Replace the placeholder icons later if brand-ready artwork becomes available:

- `frontend/public/icons/icon-192.png`
- `frontend/public/icons/icon-512.png`
- `frontend/public/icons/icon-512-maskable.png`
- `frontend/public/icons/apple-touch-icon.png`

## Quick production checklist

1. Run `supabase/schema.sql` in the production Supabase project.
2. Generate a bcrypt hash and set `ADMIN_PASSWORD_HASH`.
3. Verify the Resend sender and API key.
4. Set the backend and frontend environment variables in Render.
5. Deploy both services.
6. Visit `/admin`, sign in, create a slot, and complete one real booking test.
