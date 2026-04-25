# Supabase Setup

Use this when creating or updating the North Shore Nautical production database.

## 1. Create the project

Create a Supabase project in the region you want to use for production.

## 2. Run the schema

Open the SQL Editor and run:

- [schema.sql](/Users/johnnymaris/Desktop/New%20project/NSN_Web/supabase/schema.sql)

The schema includes the new public marine-care request model plus the preserved legacy tables used by private workflows.

Key tables now include:

- `service_requests`
- `booking_slots`
- `launch_bookings`
- `client_accounts`
- `client_service_entitlements`
- `client_paid_add_on_credits`
- `stripe_checkout_purchases`

The schema turns on Row Level Security without adding public write policies. This app talks to Supabase only through backend server credentials.

## 3. Copy backend credentials

From Supabase project settings, copy:

- Project URL
- `secret` key

If your dashboard only exposes the legacy keys tab, you can use the `service_role` key instead.

Set these in the backend environment:

```env
SUPABASE_URL=your-project-url
SUPABASE_SECRET_KEY=your-secret-key
```

Legacy fallback:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Do not put any Supabase server key in the frontend.

## 4. Quick verification

After running the schema, this query should work:

```sql
select tablename
from pg_tables
where schemaname = 'public'
  and tablename in ('service_requests', 'booking_slots', 'launch_bookings')
order by tablename;
```

You should see all listed tables returned.

## 5. After deploy

Once the backend is live and admin auth is configured:

1. Sign in at `/admin`
2. Submit one inquiry-only request from the public site
3. Submit one instant-checkout request with Stripe in test mode
4. Confirm rows appear in `service_requests`

## Notes

- This app uses Supabase as a database only.
- There is no public Supabase Auth flow in the current production build.
- All live reads and writes go through the backend API.
