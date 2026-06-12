alter table public.stripe_checkout_purchases
  add column if not exists stripe_charge_id varchar(255);

alter table public.stripe_checkout_purchases
  add column if not exists refunded_at timestamptz;

create unique index if not exists stripe_checkout_purchases_payment_intent_idx
  on public.stripe_checkout_purchases (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create or replace function public.refund_stripe_add_on_purchase(
  p_stripe_payment_intent_id varchar,
  p_stripe_charge_id varchar
)
returns varchar
language plpgsql
set search_path = ''
as $$
declare
  purchase public.stripe_checkout_purchases%rowtype;
begin
  select *
  into purchase
  from public.stripe_checkout_purchases
  where stripe_payment_intent_id = p_stripe_payment_intent_id
  for update;

  if not found then
    return 'not_found';
  end if;

  if purchase.refunded_at is not null then
    return 'already_refunded';
  end if;

  update public.client_paid_add_on_credits
  set
    total_units = greatest(total_units - purchase.quantity, 0),
    updated_at = timezone('utc', now())
  where client_account_id = purchase.client_account_id
    and service_key = purchase.service_key;

  update public.stripe_checkout_purchases
  set
    stripe_charge_id = nullif(p_stripe_charge_id, ''),
    refunded_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  where id = purchase.id;

  return 'refunded';
end;
$$;

revoke execute on function public.refund_stripe_add_on_purchase(
  varchar,
  varchar
) from public, anon, authenticated;

grant execute on function public.refund_stripe_add_on_purchase(
  varchar,
  varchar
) to service_role;
