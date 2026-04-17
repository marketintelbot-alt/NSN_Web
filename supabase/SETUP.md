# Supabase Setup

Use this when creating the brand-new North Shore Nautical database.

## 1. Create the project

Create a new Supabase project in the region you want to use for production.

## 2. Run the schema

Open the Supabase SQL Editor and run:

- [schema.sql](/Users/johnnymaris/Desktop/New%20project/NSN_Web/supabase/schema.sql)

That creates the only two tables the live app needs:

- `booking_slots`
- `launch_bookings`

The schema also turns on Row Level Security for both tables without adding public policies, which is intentional. This app talks to Supabase only through a backend server key.

## 3. Copy the backend credentials

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

Do not put the secret key or service role key in the frontend.

## 4. Quick verification

After running the schema, this query should work:

```sql
select tablename
from pg_tables
where schemaname = 'public'
  and tablename in ('booking_slots', 'launch_bookings')
order by tablename;
```

You should see both tables returned.

## 5. After deploy

Once the backend is live and admin auth is configured:

1. Sign in at `/admin`
2. Add a time slot
3. Create one test booking
4. Confirm the row appears in `launch_bookings`

## Notes

- This app uses Supabase as a database only.
- There is no client self-signup or Supabase Auth flow in the current production build.
- All live reads and writes go through the backend API.
