-- Allow visitors to place orders while retaining the existing server-side
-- product, price, coupon and business validation.
do $$
declare
  definition text;
  guard text := E'  if (select auth.uid()) is null then\r\n    raise exception ''Authentication required'' using errcode = ''42501'';\r\n  end if;';
begin
  select pg_get_functiondef('public.create_order_with_coupon(jsonb,uuid)'::regprocedure) into definition;
  if position(guard in definition) = 0 then
    guard := replace(guard, E'\r\n', E'\n');
  end if;
  if position(guard in definition) = 0 then
    raise exception 'Expected authentication guard not found';
  end if;
  execute replace(definition, guard, '');
end $$;

grant execute on function public.create_order_with_coupon(jsonb, uuid) to anon;
