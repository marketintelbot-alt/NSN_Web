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

alter table public.service_requests enable row level security;

drop trigger if exists set_service_requests_updated_at on public.service_requests;
create trigger set_service_requests_updated_at
before update on public.service_requests
for each row
execute function public.set_updated_at_timestamp();
