-- Orders identify customers by business, name, telephone and email.
-- The server validates delivery settings rather than trusting the browser.
do $migration$
declare
  definition text;
  start_pos integer;
  end_pos integer;
  customer_block text := $block$
  if nullif(trim(p_order->>'customer_name'), '') is null
     or nullif(trim(p_order->>'customer_email'), '') is null
     or nullif(regexp_replace(coalesce(p_order->>'customer_phone',''), '[^0-9]', '', 'g'), '') is null then
    raise exception 'Customer details required' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    v_business_id::text || lower(trim(p_order->>'customer_name')) || lower(trim(p_order->>'customer_email')) || regexp_replace(p_order->>'customer_phone', '[^0-9]', '', 'g'), 0));
  select c.id into v_customer_id from public.customers c
    where c.business_id = v_business_id
      and lower(trim(c.name)) = lower(trim(p_order->>'customer_name'))
      and lower(trim(c.email)) = lower(trim(p_order->>'customer_email'))
      and regexp_replace(c.phone, '[^0-9]', '', 'g') = regexp_replace(p_order->>'customer_phone', '[^0-9]', '', 'g')
    order by c.created_at asc limit 1;
  if v_customer_id is null then
    insert into public.customers (business_id, name, email, phone, addresses)
    values (v_business_id, trim(p_order->>'customer_name'), lower(trim(p_order->>'customer_email')),
      trim(p_order->>'customer_phone'),
      case when p_order->>'order_type' = 'delivery' and nullif(trim(p_order->>'address'), '') is not null
        then jsonb_build_array(trim(p_order->>'address')) else '[]'::jsonb end)
    returning id into v_customer_id;
  elsif p_order->>'order_type' = 'delivery' and nullif(trim(p_order->>'address'), '') is not null then
    update public.customers c set addresses = c.addresses || jsonb_build_array(trim(p_order->>'address'))
      where c.id = v_customer_id and not exists
        (select 1 from jsonb_array_elements_text(c.addresses) a where lower(trim(a)) = lower(trim(p_order->>'address')));
  end if;
  $block$;
  delivery_block text := $block$
  if not exists (select 1 from public.restaurant_settings s where s.business_id = v_business_id
    and case p_order->>'order_type'
      when 'delivery' then s.has_delivery
      when 'takeaway' then s.has_takeaway
      when 'table' then s.has_table_service
      else false end) then
    raise exception 'Order type unavailable' using errcode = '22023';
  end if;
  if round(coalesce((p_order->>'delivery_fee')::numeric, -1), 2) <> coalesce(
    (select case when p_order->>'order_type' = 'delivery' then round(s.delivery_base_price::numeric, 2) else 0 end
       from public.restaurant_settings s where s.business_id = v_business_id), 0) then
    raise exception 'Delivery fee changed' using errcode = '22023';
  end if;
  $block$;
begin
  select pg_get_functiondef('public.create_order_with_coupon(jsonb,uuid)'::regprocedure) into definition;
  definition := replace(definition, E'\r\n', E'\n');
  start_pos := strpos(definition, '  v_customer_id := nullif(p_order->>');
  end_pos := strpos(definition, '  if p_coupon_id is not null then');
  if start_pos = 0 or end_pos <= start_pos then raise exception 'Customer validation block not found'; end if;
  definition := substr(definition, 1, start_pos - 1) || customer_block || substr(definition, end_pos);
  start_pos := strpos(definition, '  if coalesce((p_order->>''subtotal'')::numeric, -1) < 0');
  if start_pos = 0 then raise exception 'Order total validation block not found'; end if;
  definition := substr(definition, 1, start_pos - 1) || delivery_block || substr(definition, start_pos);
  execute definition;
end $migration$;
