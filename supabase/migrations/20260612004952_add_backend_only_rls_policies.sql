-- Public clients never access these tables directly. All access is brokered by
-- the backend's service-role client.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

drop policy if exists "Backend service role only" on public.booking_slots;
create policy "Backend service role only"
  on public.booking_slots for all to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "Backend service role only" on public.client_accounts;
create policy "Backend service role only"
  on public.client_accounts for all to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "Backend service role only" on public.client_service_entitlements;
create policy "Backend service role only"
  on public.client_service_entitlements for all to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "Backend service role only" on public.client_paid_add_on_credits;
create policy "Backend service role only"
  on public.client_paid_add_on_credits for all to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "Backend service role only" on public.stripe_checkout_purchases;
create policy "Backend service role only"
  on public.stripe_checkout_purchases for all to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "Backend service role only" on public.launch_bookings;
create policy "Backend service role only"
  on public.launch_bookings for all to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "Backend service role only" on public.service_requests;
create policy "Backend service role only"
  on public.service_requests for all to anon, authenticated
  using (false)
  with check (false);

revoke execute on function public.fulfill_stripe_add_on_purchase(
  uuid,
  varchar,
  varchar,
  integer,
  integer,
  varchar,
  varchar,
  varchar,
  varchar
) from public, anon, authenticated;

grant execute on function public.fulfill_stripe_add_on_purchase(
  uuid,
  varchar,
  varchar,
  integer,
  integer,
  varchar,
  varchar,
  varchar,
  varchar
) to service_role;
