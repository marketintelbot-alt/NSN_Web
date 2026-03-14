create extension if not exists pgcrypto;

create table if not exists public.client_boats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  boat_name varchar(80) not null,
  boat_type varchar(80) not null,
  boat_length varchar(30) not null,
  notes text,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint client_boats_notes_length check (notes is null or char_length(notes) <= 500)
);

create index if not exists client_boats_user_id_idx on public.client_boats (user_id);
create unique index if not exists client_boats_one_primary_per_user
  on public.client_boats (user_id)
  where is_primary;

create or replace function public.set_client_boats_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_client_boats_updated_at on public.client_boats;

create trigger set_client_boats_updated_at
before update on public.client_boats
for each row
execute function public.set_client_boats_updated_at();

alter table public.client_boats enable row level security;

drop policy if exists "Users can view their own boats" on public.client_boats;
create policy "Users can view their own boats"
on public.client_boats
for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their own boats" on public.client_boats;
create policy "Users can create their own boats"
on public.client_boats
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own boats" on public.client_boats;
create policy "Users can update their own boats"
on public.client_boats
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own boats" on public.client_boats;
create policy "Users can delete their own boats"
on public.client_boats
for delete
using (auth.uid() = user_id);
