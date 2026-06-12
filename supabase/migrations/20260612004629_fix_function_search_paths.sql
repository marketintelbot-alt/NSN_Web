alter function public.set_updated_at_timestamp()
  set search_path = '';

do $$
begin
  if to_regprocedure(
    'public.fulfill_stripe_add_on_purchase(uuid,character varying,character varying,integer,integer,character varying,character varying,character varying,character varying)'
  ) is not null then
    alter function public.fulfill_stripe_add_on_purchase(
      uuid,
      character varying,
      character varying,
      integer,
      integer,
      character varying,
      character varying,
      character varying,
      character varying
    )
      set search_path = '';
  end if;
end;
$$;
