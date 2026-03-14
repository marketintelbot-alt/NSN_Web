# North Shore Nautical

North Shore Nautical is a production-ready website and lightweight backend for a premium boat care business serving Chicago's North Shore. The project includes a polished multi-page frontend, a secure launch reservation flow, optional secure client accounts for saved boats, and a lightweight Express API for reservation email delivery.

## What is included

- Premium React + Vite + TypeScript frontend with Tailwind CSS and subtle Framer Motion
- Homepage hero wired to the supplied Lake Michigan photo at `frontend/public/images/north-shore-hero.jpeg`
- Reservation flow designed for stored-client boats being delivered to:
  - Lloyd Boat Launch
  - Evanston Boat Launch
- Optional pre-launch cleaning selection
- 24-hour reservation rule enforced on both frontend and backend
- Resend business notification and customer confirmation emails
- Optional secure client accounts with Supabase Auth and row-level security for saved boats
- Local SEO basics:
  - page titles
  - meta descriptions
  - Open Graph tags
  - sitemap
  - robots.txt
- Render-ready deployment split:
  - frontend as a Static Site
  - backend as a Web Service

## Architecture

- `frontend/`
  - React marketing site, reservation form, account experience
- `backend/`
  - Express API with validation, abuse protection, and Resend integration
- `supabase/schema.sql`
  - secure table + RLS policies for saved client boats
- `scripts/sync-site-copy.sh`
  - mirrors the project into a maintained sibling copy

Reservations do not require a database. Supabase is only used when client accounts are enabled.

## Security posture

The project is hardened for a free-to-run deployment model while staying maintainable:

- Strict frontend and backend validation with Zod
- Server-side enforcement of the 24-hour rule
- Rate limiting on the reservation API
- `helmet` security headers on the backend
- Tight CORS allowlist instead of wildcard CORS
- `Cache-Control: no-store` on API responses
- Honeypot spam field on the reservation form
- Supabase row-level security policies so clients only access their own saved boats
- Account page excluded from search indexing
- No secrets stored in the frontend bundle

## Project structure

```text
.
├── backend/
├── frontend/
├── scripts/
├── supabase/
├── .env.example
├── package.json
└── README.md
```

## Local development

Open two terminals from the project root.

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

Local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

Project-level helpers:

```bash
npm run build
npm run lint
npm run sync:copy
```

## Exact environment variables

Backend `.env`:

```env
PORT=4000
RESEND_API_KEY=
BUSINESS_NOTIFICATION_EMAIL=
FROM_EMAIL=
CORS_ORIGIN=http://localhost:5173
TRUST_PROXY_HOPS=1
```

Frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_SITE_URL=https://www.northshorenautical.com
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ALLOW_SELF_SIGNUP=false
```

Notes:

- Leave `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` empty if you want the site to run without client accounts.
- `VITE_ALLOW_SELF_SIGNUP=false` is the recommended default for North Shore Nautical so client logins are issued manually.

## Reservation behavior

`POST /api/reservations`

Behavior:

- validates the payload with Zod
- sanitizes incoming text fields
- blocks requests inside the 24-hour scheduling window
- drops obvious bot submissions through a honeypot field
- rate-limits repeated abuse attempts
- sends:
  - a business notification email
  - a client confirmation email

The reservation flow is intentionally not a live booking calendar. Requests are submitted for scheduling review and confirmation.

## Supabase account setup

If you want secure client logins and saved boats:

1. Create a Supabase project.
2. In the Supabase SQL editor, run `supabase/schema.sql`.
3. Add the frontend environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. In Supabase Auth settings, enable these recommended protections:
   - email confirmation
   - leaked password protection
   - bot / CAPTCHA protection if you want extra signup hardening
5. Decide whether self-signup should be available:
   - `VITE_ALLOW_SELF_SIGNUP=false` for the recommended invite-only model
   - `VITE_ALLOW_SELF_SIGNUP=true` only if you intentionally want open signup
6. For manual client setup:
   - create the auth user in Supabase
   - have the client set or reset their password through the secure Supabase flow
   - insert their stored boat records into `client_boats` with that user's `id`

The saved-boat table is protected with row-level security, and all client-side boat queries are scoped to the signed-in user.

## Render deployment

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/marketintelbot-alt/NSN_Web)

### Frontend: Render Static Site

Create a new Static Site with:

- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

Frontend environment variables:

- `VITE_API_BASE_URL=https://YOUR-BACKEND.onrender.com`
- `VITE_SITE_URL=https://YOUR-FINAL-DOMAIN.com`
- `VITE_SUPABASE_URL=...` if using accounts
- `VITE_SUPABASE_ANON_KEY=...` if using accounts
- `VITE_ALLOW_SELF_SIGNUP=true` or `false`

### Backend: Render Web Service

Create a new Web Service with:

- Root Directory: `backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`

Backend environment variables:

- `PORT=4000`
- `RESEND_API_KEY=...`
- `BUSINESS_NOTIFICATION_EMAIL=...`
- `FROM_EMAIL=...`
- `CORS_ORIGIN=https://YOUR-FRONTEND.onrender.com`
- `TRUST_PROXY_HOPS=1`

Render deployment notes:

- Keep `CORS_ORIGIN` set to the exact frontend origin, never `*`
- After adding a custom domain, update:
  - `VITE_SITE_URL`
  - `CORS_ORIGIN`
- Render should serve the frontend over HTTPS; use the HTTPS site URL in all production env vars

## Custom domain later

1. Add the custom domain to the Render frontend service.
2. If the backend uses its own custom domain, add that to the backend service too.
3. Update `VITE_SITE_URL` to the final public website URL.
4. Update `CORS_ORIGIN` to the final frontend origin.
5. If using Supabase email redirects, make sure the production account URL is allowed in Supabase Auth settings.

## Mirrored copy workflow

The project includes a sync script so you can keep a maintained copy alongside the main site:

```bash
npm run sync:copy
```

That command mirrors the project into:

```text
../NSN_Web_Copy
```

It excludes build output, local env files, and `node_modules` so the copy stays clean and manageable.

## Files to update for real business details

Public phone number, public email, service copy:

- `frontend/src/content/site.ts`

Backend email delivery config:

- `.env.example`
- `backend/.env`

Hero image:

- `frontend/public/images/north-shore-hero.jpeg`

Saved boat database rules:

- `supabase/schema.sql`

## Quality notes

- The site is responsive and keyboard-friendly
- The reservation rule is enforced on both frontend and backend
- The backend stays lightweight and free to run aside from domain and email usage
- Email delivery cannot be fully tested end-to-end without valid Resend credentials
