drop function public.platform_admin_overview();
create function public.platform_admin_overview(p_from timestamptz default null, p_to timestamptz default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  if (select auth.uid()) is distinct from '706060a8-224f-43b9-ac78-ba86da094da5'::uuid then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;
  if p_from is not null and p_to is not null and p_from >= p_to then raise exception 'Período inválido' using errcode = '22023'; end if;
  select jsonb_build_object(
    'businesses', coalesce((select jsonb_agg(jsonb_build_object(
      'id', b.id, 'name', b.name, 'slug', b.slug, 'status', b.status, 'created_at', b.created_at,
      'owner_email', u.email, 'location', s.location,
      'products', (select count(*) from public.products p where p.business_id = b.id),
      'orders', (select count(*) from public.orders o where o.business_id = b.id and (p_from is null or o.created_at >= p_from) and (p_to is null or o.created_at < p_to)),
      'customers', (select count(*) from public.customers c where c.business_id = b.id),
      'sales', (select coalesce(sum(o.total), 0) from public.orders o where o.business_id = b.id and o.status = 'delivered' and (p_from is null or o.created_at >= p_from) and (p_to is null or o.created_at < p_to)),
      'last_order', (select max(o.created_at) from public.orders o where o.business_id = b.id)
    ) order by b.created_at desc) from public.businesses b left join auth.users u on u.id = b.owner_user_id left join public.restaurant_settings s on s.business_id = b.id), '[]'::jsonb),
    'ad_views', coalesce((select jsonb_agg(jsonb_build_object('ad_id', v.ad_id, 'business_id', v.business_id, 'business_name', b.name, 'first_viewed_at', v.first_viewed_at, 'last_viewed_at', v.last_viewed_at, 'view_count', v.view_count) order by v.last_viewed_at desc) from public.platform_ad_views v join public.businesses b on b.id = v.business_id), '[]'::jsonb)
  ) into result;
  return result;
end $$;
revoke all on function public.platform_admin_overview(timestamptz,timestamptz) from public, anon;
grant execute on function public.platform_admin_overview(timestamptz,timestamptz) to authenticated;
