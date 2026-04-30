create extension if not exists pgcrypto;

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.booking_slots (
  id uuid primary key default gen_random_uuid(),
  launch_location varchar(80) not null,
  starts_at timestamptz not null,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint booking_slots_location_check
    check (launch_location in ('Lloyd Boat Launch', 'Evanston Boat Launch')),
  constraint booking_slots_notes_length
    check (notes is null or char_length(notes) <= 500)
);

create unique index if not exists booking_slots_unique_idx
  on public.booking_slots (launch_location, starts_at);

create index if not exists booking_slots_starts_at_idx
  on public.booking_slots (starts_at asc);

create table if not exists public.client_accounts (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) not null,
  password_hash text not null,
  full_name varchar(80) not null,
  phone varchar(30) not null,
  boat_name varchar(120),
  boat_make_model varchar(120),
  boat_length_feet double precision,
  preferred_launch_location varchar(80) not null,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint client_accounts_preferred_launch_location_check
    check (preferred_launch_location in ('Lloyd Boat Launch', 'Evanston Boat Launch', 'Not needed')),
  constraint client_accounts_boat_length_check
    check (boat_length_feet is null or (boat_length_feet > 0 and boat_length_feet <= 120)),
  constraint client_accounts_notes_length
    check (notes is null or char_length(notes) <= 1000)
);

create unique index if not exists client_accounts_email_idx
  on public.client_accounts (lower(email));

alter table public.client_accounts
  drop constraint if exists client_accounts_preferred_launch_location_check;

alter table public.client_accounts
  add constraint client_accounts_preferred_launch_location_check
  check (preferred_launch_location in ('Lloyd Boat Launch', 'Evanston Boat Launch', 'Not needed'));

create table if not exists public.client_service_entitlements (
  id uuid primary key default gen_random_uuid(),
  client_account_id uuid not null references public.client_accounts (id) on delete cascade,
  service_key varchar(120) not null,
  service_name varchar(120) not null,
  total_units integer not null default 0,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint client_service_entitlements_total_units_check
    check (total_units >= 0),
  constraint client_service_entitlements_notes_length
    check (notes is null or char_length(notes) <= 500)
);

create unique index if not exists client_service_entitlements_unique_idx
  on public.client_service_entitlements (client_account_id, service_key);

create index if not exists client_service_entitlements_client_idx
  on public.client_service_entitlements (client_account_id);

create table if not exists public.client_paid_add_on_credits (
  id uuid primary key default gen_random_uuid(),
  client_account_id uuid not null references public.client_accounts (id) on delete cascade,
  service_key varchar(120) not null,
  service_name varchar(120) not null,
  total_units integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint client_paid_add_on_credits_total_units_check
    check (total_units >= 0)
);

create unique index if not exists client_paid_add_on_credits_unique_idx
  on public.client_paid_add_on_credits (client_account_id, service_key);

create index if not exists client_paid_add_on_credits_client_idx
  on public.client_paid_add_on_credits (client_account_id);

create table if not exists public.stripe_checkout_purchases (
  id uuid primary key default gen_random_uuid(),
  client_account_id uuid not null references public.client_accounts (id) on delete cascade,
  service_key varchar(120) not null,
  service_name varchar(120) not null,
  quantity integer not null default 1,
  unit_amount_cents integer not null,
  currency varchar(12) not null default 'usd',
  stripe_checkout_session_id varchar(255) not null,
  stripe_payment_intent_id varchar(255),
  customer_email varchar(255),
  fulfilled_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint stripe_checkout_purchases_quantity_check
    check (quantity > 0 and quantity <= 1000),
  constraint stripe_checkout_purchases_amount_check
    check (unit_amount_cents > 0)
);

create unique index if not exists stripe_checkout_purchases_session_idx
  on public.stripe_checkout_purchases (stripe_checkout_session_id);

create index if not exists stripe_checkout_purchases_client_idx
  on public.stripe_checkout_purchases (client_account_id);

create table if not exists public.launch_bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.booking_slots (id) on delete restrict,
  client_account_id uuid references public.client_accounts (id) on delete set null,
  service_entitlement_id uuid references public.client_service_entitlements (id) on delete set null,
  service_name varchar(120),
  add_on_services text[] not null default '{}',
  full_name varchar(80) not null,
  email varchar(255) not null,
  phone varchar(30) not null,
  notes text,
  status varchar(20) not null default 'confirmed',
  created_by varchar(20) not null default 'public',
  email_customer_status varchar(20) not null default 'pending',
  email_customer_error text,
  email_customer_sent_at timestamptz,
  email_admin_status varchar(20) not null default 'pending',
  email_admin_error text,
  email_admin_sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint launch_bookings_status_check
    check (status in ('confirmed', 'completed', 'cancelled')),
  constraint launch_bookings_created_by_check
    check (created_by in ('public', 'admin', 'client')),
  constraint launch_bookings_customer_email_status_check
    check (email_customer_status in ('pending', 'sent', 'failed')),
  constraint launch_bookings_admin_email_status_check
    check (email_admin_status in ('pending', 'sent', 'failed')),
  constraint launch_bookings_notes_length
    check (notes is null or char_length(notes) <= 1000)
);

alter table public.launch_bookings
  add column if not exists client_account_id uuid references public.client_accounts (id) on delete set null;

alter table public.launch_bookings
  add column if not exists service_entitlement_id uuid references public.client_service_entitlements (id) on delete set null;

alter table public.launch_bookings
  add column if not exists service_name varchar(120);

alter table public.launch_bookings
  add column if not exists add_on_services text[] not null default '{}';

create unique index if not exists launch_bookings_active_slot_idx
  on public.launch_bookings (slot_id)
  where status <> 'cancelled';

create index if not exists launch_bookings_created_at_idx
  on public.launch_bookings (created_at desc);

create index if not exists launch_bookings_status_idx
  on public.launch_bookings (status);

create index if not exists launch_bookings_client_account_idx
  on public.launch_bookings (client_account_id);

create index if not exists launch_bookings_service_entitlement_idx
  on public.launch_bookings (service_entitlement_id);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  request_kind varchar(20) not null default 'inquiry',
  booking_status varchar(32) not null default 'draft',
  payment_status varchar(20) not null default 'not_started',
  source varchar(40) not null default 'public_site',
  selected_service_id varchar(120),
  selected_service_name varchar(160),
  selected_service_category varchar(40),
  payment_type varchar(32),
  quote_only boolean not null default false,
  quote_trigger_reasons text[] not null default '{}',
  selected_add_ons text[] not null default '{}',
  boat_length_feet double precision,
  boat_length_rounded integer,
  calculated_price_cents integer,
  currency varchar(12) not null default 'usd',
  requested_date_time timestamptz,
  customer_name varchar(120) not null,
  customer_email varchar(255) not null,
  customer_phone varchar(40) not null,
  boat_make_model_year varchar(160),
  boat_location_marina varchar(160),
  customer_notes text,
  agreement_accepted boolean not null default false,
  agreement_accepted_at timestamptz,
  agreement_policy_version varchar(64),
  stripe_checkout_session_id varchar(255),
  stripe_payment_intent_id varchar(255),
  stripe_charge_id varchar(255),
  payment_authorized_at timestamptz,
  payment_captured_at timestamptz,
  payment_canceled_at timestamptz,
  refunded_at timestamptz,
  admin_notes text,
  last_customer_email_type varchar(40),
  last_customer_email_sent_at timestamptz,
  last_internal_email_type varchar(40),
  last_internal_email_sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint service_requests_request_kind_check
    check (request_kind in ('booking', 'inquiry')),
  constraint service_requests_booking_status_check
    check (
      booking_status in (
        'draft',
        'pending_review',
        'changes_requested',
        'confirmed',
        'completed',
        'canceled',
        'declined',
        'refunded',
        'failed_payment'
      )
    ),
  constraint service_requests_payment_status_check
    check (payment_status in ('not_started', 'authorized', 'captured', 'canceled', 'refunded', 'failed')),
  constraint service_requests_category_check
    check (
      selected_service_category is null
      or selected_service_category in ('marine_care', 'advisory')
    ),
  constraint service_requests_payment_type_check
    check (payment_type is null or payment_type in ('instant_checkout', 'quote_only')),
  constraint service_requests_boat_length_check
    check (boat_length_feet is null or (boat_length_feet > 0 and boat_length_feet <= 200)),
  constraint service_requests_boat_length_rounded_check
    check (boat_length_rounded is null or (boat_length_rounded > 0 and boat_length_rounded <= 200)),
  constraint service_requests_price_check
    check (calculated_price_cents is null or calculated_price_cents > 0),
  constraint service_requests_agreement_timestamp_check
    check ((agreement_accepted = false) or (agreement_accepted_at is not null)),
  constraint service_requests_customer_notes_length
    check (customer_notes is null or char_length(customer_notes) <= 1500),
  constraint service_requests_admin_notes_length
    check (admin_notes is null or char_length(admin_notes) <= 1500),
  constraint service_requests_customer_email_type_check
    check (
      last_customer_email_type is null
      or last_customer_email_type in (
        'inquiry_received',
        'authorization_received',
        'booking_approved',
        'changes_requested',
        'request_declined',
        'booking_canceled',
        'service_completed',
        'booking_refunded'
      )
    ),
  constraint service_requests_internal_email_type_check
    check (
      last_internal_email_type is null
      or last_internal_email_type in ('new_inquiry', 'authorization_received')
    )
);

drop index if exists public.service_requests_checkout_session_idx;

create unique index service_requests_checkout_session_idx
  on public.service_requests (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

drop index if exists public.service_requests_payment_intent_idx;

create unique index service_requests_payment_intent_idx
  on public.service_requests (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

drop index if exists public.service_requests_created_at_idx;

create index service_requests_created_at_idx
  on public.service_requests (created_at desc);

drop index if exists public.service_requests_booking_status_idx;

create index service_requests_booking_status_idx
  on public.service_requests (booking_status);

drop index if exists public.service_requests_payment_status_idx;

create index service_requests_payment_status_idx
  on public.service_requests (payment_status);

drop index if exists public.service_requests_request_kind_idx;

create index service_requests_request_kind_idx
  on public.service_requests (request_kind);

drop index if exists public.service_requests_requested_date_idx;

create index service_requests_requested_date_idx
  on public.service_requests (requested_date_time);

alter table public.booking_slots enable row level security;
alter table public.client_accounts enable row level security;
alter table public.client_service_entitlements enable row level security;
alter table public.client_paid_add_on_credits enable row level security;
alter table public.stripe_checkout_purchases enable row level security;
alter table public.launch_bookings enable row level security;
alter table public.service_requests enable row level security;

create or replace function public.fulfill_stripe_add_on_purchase(
  p_client_account_id uuid,
  p_service_key varchar,
  p_service_name varchar,
  p_quantity integer,
  p_unit_amount_cents integer,
  p_currency varchar,
  p_stripe_checkout_session_id varchar,
  p_stripe_payment_intent_id varchar,
  p_customer_email varchar
)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  inserted_rows integer := 0;
begin
  insert into public.stripe_checkout_purchases (
    client_account_id,
    service_key,
    service_name,
    quantity,
    unit_amount_cents,
    currency,
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    customer_email
  )
  values (
    p_client_account_id,
    p_service_key,
    p_service_name,
    p_quantity,
    p_unit_amount_cents,
    coalesce(nullif(p_currency, ''), 'usd'),
    p_stripe_checkout_session_id,
    nullif(p_stripe_payment_intent_id, ''),
    nullif(p_customer_email, '')
  )
  on conflict (stripe_checkout_session_id) do nothing;

  get diagnostics inserted_rows = row_count;

  if inserted_rows = 0 then
    return false;
  end if;

  insert into public.client_paid_add_on_credits (
    client_account_id,
    service_key,
    service_name,
    total_units
  )
  values (
    p_client_account_id,
    p_service_key,
    p_service_name,
    p_quantity
  )
  on conflict (client_account_id, service_key)
  do update set
    service_name = excluded.service_name,
    total_units = public.client_paid_add_on_credits.total_units + excluded.total_units,
    updated_at = timezone('utc', now());

  return true;
end;
$$;

drop trigger if exists set_booking_slots_updated_at on public.booking_slots;
create trigger set_booking_slots_updated_at
before update on public.booking_slots
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists set_client_accounts_updated_at on public.client_accounts;
create trigger set_client_accounts_updated_at
before update on public.client_accounts
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists set_client_service_entitlements_updated_at on public.client_service_entitlements;
create trigger set_client_service_entitlements_updated_at
before update on public.client_service_entitlements
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists set_client_paid_add_on_credits_updated_at on public.client_paid_add_on_credits;
create trigger set_client_paid_add_on_credits_updated_at
before update on public.client_paid_add_on_credits
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists set_stripe_checkout_purchases_updated_at on public.stripe_checkout_purchases;
create trigger set_stripe_checkout_purchases_updated_at
before update on public.stripe_checkout_purchases
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists set_launch_bookings_updated_at on public.launch_bookings;
create trigger set_launch_bookings_updated_at
before update on public.launch_bookings
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists set_service_requests_updated_at on public.service_requests;
create trigger set_service_requests_updated_at
before update on public.service_requests
for each row
execute function public.set_updated_at_timestamp();
