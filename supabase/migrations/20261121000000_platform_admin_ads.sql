create table public.platform_ads (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 120),
  message text not null check (length(trim(message)) between 1 and 3000),
  button_label text,
  button_url text check (button_url is null or button_url ~ '^https?://'),
  status text not null default 'draft' check (status in ('draft', 'published', 'ended')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((button_label is null and button_url is null) or (length(trim(button_label)) between 1 and 60 and button_url is not null)),
  check (starts_at is null or ends_at is null or ends_at > starts_at)
);
create table public.platform_ad_views (
  ad_id uuid not null references public.platform_ads(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  first_viewed_at timestamptz not null default now(),
  last_viewed_at timestamptz not null default now(),
  view_count integer not null default 1 check (view_count > 0),
  primary key (ad_id, business_id)
);
create index platform_ad_views_business_idx on public.platform_ad_views(business_id);
alter table public.platform_ads enable row level security;
alter table public.platform_ad_views enable row level security;
revoke all on public.platform_ads, public.platform_ad_views from anon, public;
grant select, insert, update on public.platform_ads to authenticated;
grant select on public.platform_ad_views to authenticated;
create policy "Platform admin manages ads" on public.platform_ads for all to authenticated
  using ((select auth.uid()) = '706060a8-224f-43b9-ac78-ba86da094da5'::uuid)
  with check ((select auth.uid()) = '706060a8-224f-43b9-ac78-ba86da094da5'::uuid);
create policy "Owners read published ads" on public.platform_ads for select to authenticated
  using (status = 'published' and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())
    and exists (select 1 from public.businesses b where b.owner_user_id = (select auth.uid()) and b.status = 'active'));
create policy "Admin and owner read ad views" on public.platform_ad_views for select to authenticated
  using ((select auth.uid()) = '706060a8-224f-43b9-ac78-ba86da094da5'::uuid
    or exists (select 1 from public.businesses b where b.id = business_id and b.owner_user_id = (select auth.uid())));

create function public.record_platform_ad_views(p_ad_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
declare v_business uuid;
begin
  select b.id into v_business from public.businesses b where b.owner_user_id = (select auth.uid()) and b.status = 'active';
  if v_business is null then raise exception 'Acesso negado' using errcode = '42501'; end if;
  if coalesce(array_length(p_ad_ids, 1), 0) > 100 then raise exception 'Limite excedido' using errcode = '22023'; end if;
  insert into public.platform_ad_views (ad_id, business_id)
    select a.id, v_business from public.platform_ads a where a.id = any(p_ad_ids)
      and a.status = 'published' and (a.starts_at is null or a.starts_at <= now()) and (a.ends_at is null or a.ends_at > now())
    on conflict (ad_id, business_id) do update set last_viewed_at = now(), view_count = public.platform_ad_views.view_count + 1;
end $$;
revoke all on function public.record_platform_ad_views(uuid[]) from public, anon;
grant execute on function public.record_platform_ad_views(uuid[]) to authenticated;

create function public.platform_admin_overview() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  if (select auth.uid()) is distinct from '706060a8-224f-43b9-ac78-ba86da094da5'::uuid then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'businesses', coalesce((select jsonb_agg(jsonb_build_object(
      'id', b.id, 'name', b.name, 'slug', b.slug, 'status', b.status, 'created_at', b.created_at,
      'owner_email', u.email, 'location', s.location,
      'products', (select count(*) from public.products p where p.business_id = b.id),
      'orders', (select count(*) from public.orders o where o.business_id = b.id),
      'customers', (select count(*) from public.customers c where c.business_id = b.id),
      'sales', (select coalesce(sum(o.total), 0) from public.orders o where o.business_id = b.id and o.status = 'delivered'),
      'last_order', (select max(o.created_at) from public.orders o where o.business_id = b.id)
    ) order by b.created_at desc) from public.businesses b left join auth.users u on u.id = b.owner_user_id left join public.restaurant_settings s on s.business_id = b.id), '[]'::jsonb),
    'ad_views', coalesce((select jsonb_agg(jsonb_build_object('ad_id', v.ad_id, 'business_id', v.business_id, 'business_name', b.name, 'first_viewed_at', v.first_viewed_at, 'last_viewed_at', v.last_viewed_at, 'view_count', v.view_count) order by v.last_viewed_at desc) from public.platform_ad_views v join public.businesses b on b.id = v.business_id), '[]'::jsonb)
  ) into result;
  return result;
end $$;
revoke all on function public.platform_admin_overview() from public, anon;
grant execute on function public.platform_admin_overview() to authenticated;
