do $migration$
declare definition text; marker text := '  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_business_id::text, 0));';
  validation text := $validation$
  if p_order->>'order_type' = 'delivery' and
     v_subtotal - coalesce(v_expected_discount, 0) < coalesce(
       (select s.delivery_minimum_order_value from public.restaurant_settings s where s.business_id = v_business_id), 0) then
    raise exception 'Delivery minimum not reached' using errcode = '22023';
  end if;
  $validation$;
begin
  select pg_get_functiondef('public.create_order_with_coupon(jsonb,uuid)'::regprocedure) into definition;
  if strpos(definition, marker) = 0 then raise exception 'Order locking marker not found'; end if;
  execute replace(definition, marker, validation || marker);
end $migration$;
