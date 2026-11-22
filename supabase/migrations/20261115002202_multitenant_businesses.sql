begin;

-- Each owner has one business. Public rows are readable; private rows are RLS scoped.
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 60),
  name text not null check (length(trim(name)) between 2 and 120),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  constraint business_slug_reserved check (slug not in ('entrar', 'cadastro', 'criar-negocio', 'conta', 'pedido', 'produto', 'api', 'admin'))
);

create index businesses_owner_idx on public.businesses(owner_user_id);
grant select, insert, update on public.businesses to authenticated;
grant select on public.businesses to anon;
alter table public.businesses enable row level security;
create policy "Anyone reads active businesses" on public.businesses
  for select to anon, authenticated using (status = 'active' or owner_user_id = (select auth.uid()));
create policy "Account creates own business" on public.businesses
  for insert to authenticated with check (owner_user_id = (select auth.uid()) and status = 'active');
create policy "Owner updates own business" on public.businesses
  for update to authenticated using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create schema if not exists private;
create or replace function private.prevent_business_identity_change() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.slug is distinct from old.slug or new.owner_user_id is distinct from old.owner_user_id then
    raise exception 'Business slug and owner cannot be changed';
  end if;
  if new.status is distinct from old.status and current_user not in ('service_role', 'postgres') then
    raise exception 'Only platform administration can change business status';
  end if;
  return new;
end; $$;

create trigger prevent_business_identity_change before update on public.businesses
for each row execute function private.prevent_business_identity_change();

create or replace function private.owned_business_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select b.id from public.businesses b where b.owner_user_id = (select auth.uid()) limit 1
$$;
revoke all on function private.owned_business_id() from public;
grant usage on schema private to authenticated;
grant execute on function private.owned_business_id() to authenticated;

-- The only existing settings row is the empty installation placeholder. Abort if
-- operational data appeared between the inventory and this migration.
do $$
declare n bigint;
declare t text;
begin
  foreach t in array array[
    'categories','tags','extras','products','product_extras','product_tags',
    'customers','discount_coupons','orders','staff','staff_schedules','story_views',
    'product_modal_views','reservation_tables','reservations','restaurant_awards'
  ] loop
    execute format('select count(*) from public.%I', t) into n;
    if n > 0 then
      raise exception 'Business data exists in %, perform an explicit backfill before multitenant migration', t;
    end if;
  end loop;
end; $$;

delete from public.restaurant_settings where name = 'Meu Restaurante' and logo_url is null and about_us_image_url is null and story_image_url is null;
do $$ begin
  if exists (select 1 from public.restaurant_settings) then
    raise exception 'Unmapped restaurant settings exist; migration stopped';
  end if;
end; $$;

-- Every operational row belongs to exactly one business. The owner default
-- preserves the current CRUD calls; public mutations must pass business_id.
do $$
declare t text;
begin
  foreach t in array array[
    'categories','tags','extras','products','product_extras','product_tags',
    'restaurant_settings','customers','discount_coupons','orders','staff',
    'staff_schedules','story_views','product_modal_views','reservation_tables',
    'reservations','restaurant_awards'
  ] loop
    execute format('alter table public.%I add column business_id uuid not null default private.owned_business_id() references public.businesses(id) on delete cascade', t);
    execute format('create index %I on public.%I (business_id)', t || '_business_id_idx', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
end; $$;

create or replace function private.prevent_business_reassignment() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.business_id is distinct from old.business_id then
    raise exception 'Cannot move a row to another business';
  end if;
  return new;
end; $$;
do $$
declare t text;
begin
  foreach t in array array[
    'categories','tags','extras','products','product_extras','product_tags',
    'restaurant_settings','customers','discount_coupons','orders','staff',
    'staff_schedules','story_views','product_modal_views','reservation_tables',
    'reservations','restaurant_awards'
  ] loop
    execute format('create trigger prevent_business_reassignment before update on public.%I for each row execute function private.prevent_business_reassignment()', t);
  end loop;
end; $$;

alter table public.restaurant_settings add constraint restaurant_settings_one_per_business unique (business_id);
alter table public.products drop constraint if exists products_slug_key;
create unique index products_business_slug_key on public.products (business_id, slug);
alter table public.discount_coupons drop constraint if exists discount_coupons_code_key;
create unique index coupons_business_code_key on public.discount_coupons (business_id, code);

-- Composite keys prevent a row from referencing another business's records.
do $$
declare t text;
begin
  foreach t in array array['categories','products','extras','tags','customers','reservation_tables','staff'] loop
    execute format('create unique index %I on public.%I (business_id, id)', t || '_business_id_id_key', t);
  end loop;
end; $$;
do $$
declare link record;
begin
  for link in select * from (values
    ('products','category_id','categories','products_category_id_fkey','cascade'),
    ('discount_coupons','product_id','products','discount_coupons_product_id_fkey','set null'),
    ('orders','customer_id','customers','orders_customer_id_fkey','set null'),
    ('product_extras','product_id','products','product_extras_product_id_fkey','cascade'),
    ('product_extras','extra_id','extras','product_extras_extra_id_fkey','cascade'),
    ('product_tags','product_id','products','product_tags_product_id_fkey','cascade'),
    ('product_tags','tag_id','tags','product_tags_tag_id_fkey','cascade'),
    ('product_modal_views','product_id','products','product_modal_views_product_id_fkey','cascade'),
    ('reservations','table_id','reservation_tables','reservations_table_id_fkey','set null'),
    ('staff_schedules','staff_id','staff','staff_schedules_staff_id_fkey','cascade')
  ) as v(child_table, child_column, parent_table, old_constraint, delete_action) loop
    execute format('alter table public.%I drop constraint %I', link.child_table, link.old_constraint);
    execute format('alter table public.%I add constraint %I foreign key (business_id, %I) references public.%I (business_id, id) on delete %s',
      link.child_table, link.child_table || '_' || link.child_column || '_business_fkey', link.child_column, link.parent_table,
      case when link.delete_action = 'set null' then format('set null (%I)', link.child_column) else 'cascade' end);
  end loop;
end; $$;
create unique index orders_business_sequence_key on public.orders (business_id, order_sequence) where order_sequence is not null;
drop index if exists public.orders_public_slug_key;
create unique index orders_business_public_slug_key on public.orders (business_id, public_slug) where public_slug is not null;

alter table public.restaurant_settings alter column country set default 'BR';
alter table public.restaurant_settings alter column currency set default 'BRL';

create or replace function private.create_business_settings() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.restaurant_settings (business_id, name, country, currency)
  values (new.id, new.name, 'BR', 'BRL');
  update public.users set role = 'super_admin' where id = new.owner_user_id;
  if not found then
    raise exception 'Owner profile is missing';
  end if;
  return new;
end; $$;
create trigger create_business_settings after insert on public.businesses
for each row execute function private.create_business_settings();

-- The authentication trigger inserts customer role. Authenticated users must
-- never be able to promote themselves through the public users table.
drop policy if exists "Users can insert own record" on public.users;
create policy "Users insert customer profile" on public.users for insert to authenticated
  with check (id = (select auth.uid()) and role = 'customer');
drop policy if exists "Users can update own record" on public.users;
create policy "Users update own record" on public.users for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create or replace function private.protect_user_role() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user = 'authenticated' then
    if tg_op = 'INSERT' and new.role <> 'customer' then
      raise exception 'Cannot assign privileged role';
    end if;
    if tg_op = 'UPDATE' and new.role is distinct from old.role then
      raise exception 'Cannot change role';
    end if;
  end if;
  return new;
end; $$;
create trigger protect_user_role before insert or update on public.users
for each row execute function private.protect_user_role();

-- Remove all legacy global policies before creating business-scoped policies.
do $$
declare p record;
begin
  for p in select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public' and tablename = any(array[
      'categories','tags','extras','products','product_extras','product_tags',
      'restaurant_settings','customers','discount_coupons','orders','staff',
      'staff_schedules','story_views','product_modal_views','reservation_tables',
      'reservations','restaurant_awards'
    ]) loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end; $$;

-- Owner-only management. A customer can read their own rows where needed.
do $$
declare t text;
begin
  foreach t in array array[
    'categories','tags','extras','products','product_extras','product_tags',
    'restaurant_settings','discount_coupons','orders','staff','staff_schedules',
    'story_views','product_modal_views','reservation_tables','reservations',
    'restaurant_awards','customers'
  ] loop
    execute format('create policy "Owner reads %1$s" on public.%1$I for select to authenticated using (business_id = (select private.owned_business_id()))', t);
    execute format('create policy "Owner inserts %1$s" on public.%1$I for insert to authenticated with check (business_id = (select private.owned_business_id()))', t);
    execute format('create policy "Owner updates %1$s" on public.%1$I for update to authenticated using (business_id = (select private.owned_business_id())) with check (business_id = (select private.owned_business_id()))', t);
    execute format('create policy "Owner deletes %1$s" on public.%1$I for delete to authenticated using (business_id = (select private.owned_business_id()))', t);
  end loop;
end; $$;

do $$
declare t text;
begin
  foreach t in array array[
    'categories','tags','extras','product_extras','product_tags',
    'reservation_tables','restaurant_awards'
  ] loop
    execute format('create policy "Public reads %1$s" on public.%1$I for select to anon,authenticated using (exists (select 1 from public.businesses b where b.id = business_id and b.status = ''active''))', t);
  end loop;
end; $$;

create policy "Public reads active coupons" on public.discount_coupons
  for select to anon,authenticated using (active and exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active'));
create policy "Public reads active products" on public.products
  for select to anon,authenticated using (active and exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active'));

create policy "Customer reads own customer row" on public.customers
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Customer inserts own customer row" on public.customers
  for insert to authenticated with check (user_id = (select auth.uid()) and exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active'));
create policy "Customer updates own customer row" on public.customers
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Customer reads own orders" on public.orders
  for select to authenticated using (exists (select 1 from public.customers c where c.id = customer_id and c.business_id = orders.business_id and c.user_id = (select auth.uid())));
create policy "Customer reads own reservations" on public.reservations
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Customer creates reservation" on public.reservations
  for insert to authenticated with check (
    user_id = (select auth.uid()) and status = 'pending'
    and exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active')
  );
create policy "Customer cancels pending reservation" on public.reservations
  for update to authenticated using (user_id = (select auth.uid()) and status = 'pending')
  with check (user_id = (select auth.uid()) and status = 'cancelled');
create policy "Public tracks story views" on public.story_views
  for insert to anon,authenticated with check (exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active'));
create policy "Public tracks product views" on public.product_modal_views
  for insert to anon,authenticated with check (exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active'));

-- This view deliberately exposes only the public presentation, checkout and
-- reservation settings. It is owned by the migration role so it can project
-- public fields while the base table remains owner-only.
create view public.business_public_settings with (security_barrier = true) as
select s.id, s.business_id, s.name, s.accent_color, s.title_font, s.body_font,
  s.button_font, s.restaurant_icon, s.about_us, s.about_us_image_url,
  s.location, s.currency, s.has_delivery, s.has_table_service, s.has_takeaway,
  s.custom_button_text, s.custom_button_url, s.custom_tag_name, s.logo_url,
  s.favicon_url, s.operating_hours, s.social_links, s.order_confirmation_message,
  s.story_image_url, s.story_image_format, s.story_enabled, s.story_auto_open,
  s.product_card_description_lines, s.story_images, s.delivery_fee_enabled,
  s.delivery_base_price, s.delivery_price_per_km, s.delivery_minimum_order_value,
  s.restaurant_lat, s.restaurant_lng, s.loyalty_enabled,
  s.loyalty_points_per_euro, s.loyalty_points_per_euro_discount,
  s.operating_schedule, s.created_at, s.reservations_enabled,
  s.reservation_duration_min, s.reservation_min_advance_min,
  s.reservation_max_advance_days, s.country, s.pix_enabled, s.pix_key,
  s.pix_key_type, s.pix_beneficiary_name, s.mbway_enabled, s.mbway_phone
from public.restaurant_settings s
join public.businesses b on b.id = s.business_id
where b.status = 'active';
revoke all on public.business_public_settings from public;
grant select on public.business_public_settings to anon, authenticated;

-- The old sequence is global. The order RPC allocates a per-business number.
revoke execute on function public.get_next_order_sequence() from public, anon, authenticated;

create or replace function public.create_order_with_coupon(p_order jsonb, p_coupon_id uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_business_id uuid;
  v_customer_id uuid;
  v_coupon_code text;
  v_coupon public.discount_coupons%rowtype;
  v_order_id uuid;
  v_sequence integer;
  v_item jsonb;
  v_extra jsonb;
  v_product public.products%rowtype;
  v_extra_row public.extras%rowtype;
  v_item_quantity integer;
  v_extra_quantity integer;
  v_item_extras jsonb;
  v_verified_items jsonb := '[]'::jsonb;
  v_subtotal numeric := 0;
  v_expected_discount numeric;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  v_business_id := nullif(p_order->>'business_id','')::uuid;
  if v_business_id is null or not exists (
    select 1 from public.businesses b where b.id = v_business_id and b.status = 'active'
  ) then
    raise exception 'Business is not active' using errcode = '23503';
  end if;
  if jsonb_typeof(coalesce(p_order->'items', 'null'::jsonb)) <> 'array' then
    raise exception 'Order requires items' using errcode = '22023';
  end if;
  if jsonb_array_length(p_order->'items') = 0 then
    raise exception 'Order requires items' using errcode = '22023';
  end if;
  for v_item in select value from pg_catalog.jsonb_array_elements(p_order->'items') loop
    if jsonb_typeof(v_item) <> 'object'
       or coalesce(v_item->>'quantity', '') !~ '^[1-9][0-9]*$'
       or jsonb_typeof(coalesce(v_item->'extras', 'null'::jsonb)) <> 'array' then
      raise exception 'Invalid order item' using errcode = '22023';
    end if;
    v_item_quantity := (v_item->>'quantity')::integer;
    select p.* into v_product from public.products p
    where p.id = (v_item->>'id')::uuid and p.business_id = v_business_id and p.active = true;
    if not found or (v_item->>'price')::numeric is distinct from v_product.price then
      raise exception 'Product unavailable or price changed' using errcode = '22023';
    end if;
    v_item_extras := '[]'::jsonb;
    for v_extra in select value from pg_catalog.jsonb_array_elements(v_item->'extras') loop
      if jsonb_typeof(v_extra) <> 'object'
         or coalesce(v_extra->>'quantity', '') !~ '^[1-9][0-9]*$' then
        raise exception 'Invalid product extra' using errcode = '22023';
      end if;
      v_extra_quantity := (v_extra->>'quantity')::integer;
      select e.* into v_extra_row from public.extras e
      join public.product_extras pe on pe.extra_id = e.id and pe.business_id = e.business_id
      where e.id = (v_extra->>'id')::uuid and e.business_id = v_business_id
        and pe.product_id = v_product.id;
      if not found or (v_extra->>'price')::numeric is distinct from v_extra_row.price then
        raise exception 'Product extra unavailable or price changed' using errcode = '22023';
      end if;
      v_subtotal := v_subtotal + v_extra_row.price * v_extra_quantity * v_item_quantity;
      v_item_extras := v_item_extras || pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object('id', v_extra_row.id, 'name', v_extra_row.name,
          'price', v_extra_row.price, 'quantity', v_extra_quantity)
      );
    end loop;
    v_subtotal := v_subtotal + v_product.price * v_item_quantity;
    v_verified_items := v_verified_items || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('id', v_product.id, 'name', v_product.name,
        'price', v_product.price, 'quantity', v_item_quantity, 'extras', v_item_extras)
    );
  end loop;
  if coalesce((p_order->>'subtotal')::numeric, -1) < 0
     or coalesce((p_order->>'discount_amount')::numeric, -1) < 0
     or coalesce((p_order->>'delivery_fee')::numeric, -1) < 0
     or coalesce((p_order->>'total')::numeric, -1) < 0
     or round((p_order->>'subtotal')::numeric, 2) <> v_subtotal
     or round(coalesce((p_order->>'total')::numeric, -1), 2) <>
        v_subtotal
        - round(coalesce((p_order->>'discount_amount')::numeric, -1), 2)
        + round(coalesce((p_order->>'delivery_fee')::numeric, -1), 2) then
    raise exception 'Invalid order totals' using errcode = '22023';
  end if;
  v_customer_id := nullif(p_order->>'customer_id','')::uuid;
  if v_customer_id is not null and not exists (
    select 1 from public.customers c
    where c.id = v_customer_id and c.business_id = v_business_id and c.user_id = (select auth.uid())
  ) then
    raise exception 'Customer does not belong to this account and business' using errcode = '42501';
  end if;
  if p_coupon_id is not null then
    update public.discount_coupons c set usage_count = usage_count + 1
    where c.id = p_coupon_id and c.business_id = v_business_id and c.active = true
      and c.code = p_order->>'coupon_code'
      and (c.minimum_order_value is null or c.minimum_order_value <= v_subtotal)
      and (c.usage_limit is null or c.usage_count < c.usage_limit)
    returning c.* into v_coupon;
    if not found then
      raise exception 'coupon_unavailable' using errcode = 'P0001';
    end if;
    v_coupon_code := v_coupon.code;
    if v_coupon.discount_type = 'percentage' then
      v_expected_discount := round(v_subtotal * v_coupon.discount_value / 100, 2);
    elsif v_coupon.discount_type = 'fixed' then
      v_expected_discount := least(v_coupon.discount_value, v_subtotal);
    elsif v_coupon.discount_type = 'free_product' then
      v_expected_discount := 0;
    else
      raise exception 'Invalid coupon type' using errcode = '22023';
    end if;
    if round((p_order->>'discount_amount')::numeric, 2) <> v_expected_discount then
      raise exception 'Invalid coupon discount' using errcode = '22023';
    end if;
  elsif nullif(p_order->>'coupon_code','') is not null then
    raise exception 'coupon_unavailable' using errcode = 'P0001';
  elsif (p_order->>'discount_amount')::numeric <> 0 then
    raise exception 'Discount requires a coupon' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_business_id::text, 0));
  select coalesce(max(o.order_sequence), 0) + 1 into v_sequence
  from public.orders o where o.business_id = v_business_id;

  insert into public.orders (
    business_id, customer_id, customer_name, customer_email, customer_phone,
    address, notes, order_type, items, subtotal, discount_amount, total,
    delivery_fee, coupon_code, payment_method, order_sequence, public_slug
  ) values (
    v_business_id, v_customer_id,
    p_order->>'customer_name', p_order->>'customer_email', p_order->>'customer_phone',
    p_order->>'address', nullif(p_order->>'notes',''), p_order->>'order_type',
    v_verified_items,
    v_subtotal,
    round((p_order->>'discount_amount')::numeric, 2),
    round((p_order->>'total')::numeric, 2),
    round((p_order->>'delivery_fee')::numeric, 2),
    v_coupon_code, coalesce(p_order->>'payment_method','cash'),
    v_sequence, nullif(p_order->>'public_slug','')
  ) returning id into v_order_id;
  return v_order_id;
end; $$;
revoke all on function public.create_order_with_coupon(jsonb, uuid) from public;
grant execute on function public.create_order_with_coupon(jsonb, uuid) to authenticated;

-- The public order token is a capability. Return status details only; customer
-- contact information and delivery notes never leave this function.
create function public.get_public_order(p_business_id uuid, p_public_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select pg_catalog.jsonb_build_object(
    'id', o.id, 'public_slug', o.public_slug, 'order_type', o.order_type,
    'items', o.items, 'subtotal', o.subtotal,
    'discount_amount', o.discount_amount, 'total', o.total,
    'delivery_fee', o.delivery_fee, 'coupon_code', o.coupon_code,
    'status', o.status, 'order_sequence', o.order_sequence,
    'created_at', o.created_at, 'delivered_at', o.delivered_at
  )
  from public.orders o
  join public.businesses b on b.id = o.business_id
  where o.business_id = p_business_id and o.public_slug = p_public_slug
    and b.status = 'active'
    and (o.delivered_at is null or o.delivered_at > now() - interval '24 hours')
  limit 1
$$;
revoke all on function public.get_public_order(uuid, text) from public;
grant execute on function public.get_public_order(uuid, text) to anon, authenticated;

-- Availability contains no guest details, but must never mix table IDs from
-- unrelated businesses or return slots for suspended businesses.
create or replace function public.get_reserved_table_slots(
  p_table_ids uuid[], p_day_start timestamptz, p_day_end timestamptz
) returns table(table_id uuid, starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select r.table_id, r.starts_at, r.ends_at
  from public.reservations r
  join public.reservation_tables t on t.id = r.table_id and t.business_id = r.business_id
  join public.businesses b on b.id = r.business_id
  where r.table_id = any(p_table_ids) and b.status = 'active'
    and r.status = 'confirmed' and r.starts_at <= p_day_end and r.ends_at >= p_day_start
$$;
revoke all on function public.get_reserved_table_slots(uuid[], timestamptz, timestamptz) from public;
grant execute on function public.get_reserved_table_slots(uuid[], timestamptz, timestamptz) to anon, authenticated;

create or replace function public.award_loyalty_points() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  s public.restaurant_settings;
  pts integer;
begin
  if new.status = 'delivered'
     and (tg_op = 'INSERT' or old.status is distinct from 'delivered')
     and new.customer_id is not null then
    select * into s from public.restaurant_settings
    where business_id = new.business_id;
    if s.loyalty_enabled then
      pts := floor(coalesce(new.total, 0) * coalesce(s.loyalty_points_per_euro, 1))::int;
      if pts > 0 then
        update public.customers
           set loyalty_points = loyalty_points + pts,
               loyalty_points_total = loyalty_points_total + pts
         where id = new.customer_id and business_id = new.business_id;
      end if;
    end if;
  end if;
  return new;
end; $$;
commit;
