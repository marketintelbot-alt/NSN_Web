create extension if not exists pgcrypto;

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
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
    check (preferred_launch_location in ('Lloyd Boat Launch', 'Evanston Boat Launch')),
  constraint client_accounts_boat_length_check
    check (boat_length_feet is null or (boat_length_feet > 0 and boat_length_feet <= 120)),
  constraint client_accounts_notes_length
    check (notes is null or char_length(notes) <= 1000)
);

create unique index if not exists client_accounts_email_idx
  on public.client_accounts (lower(email));

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

create table if not exists public.launch_bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.booking_slots (id) on delete restrict,
  client_account_id uuid references public.client_accounts (id) on delete set null,
  service_entitlement_id uuid references public.client_service_entitlements (id) on delete set null,
  service_name varchar(120),
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

alter table public.launch_bookings
  add column if not exists client_account_id uuid references public.client_accounts (id) on delete set null;

alter table public.launch_bookings
  add column if not exists service_entitlement_id uuid references public.client_service_entitlements (id) on delete set null;

alter table public.launch_bookings
  add column if not exists service_name varchar(120);

alter table public.booking_slots enable row level security;
alter table public.client_accounts enable row level security;
alter table public.client_service_entitlements enable row level security;
alter table public.launch_bookings enable row level security;

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

drop trigger if exists set_launch_bookings_updated_at on public.launch_bookings;
create trigger set_launch_bookings_updated_at
before update on public.launch_bookings
for each row
execute function public.set_updated_at_timestamp();
