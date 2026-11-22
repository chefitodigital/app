alter table public.platform_ads add constraint platform_ads_button_pair_check check ((button_label is null and button_url is null) or (button_label is not null and button_url is not null and length(trim(button_label)) between 1 and 60));
create function public.platform_admin_daily_orders(p_days integer default 30) returns table(day date, orders bigint)
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is distinct from '706060a8-224f-43b9-ac78-ba86da094da5'::uuid then raise exception 'Acesso negado' using errcode = '42501'; end if;
  if p_days < 1 or p_days > 90 then raise exception 'Período inválido' using errcode = '22023'; end if;
  return query select d.day::date, count(o.id) from generate_series(current_date - (p_days - 1), current_date, interval '1 day') as d(day)
  left join public.orders o on (o.created_at at time zone 'America/Sao_Paulo')::date = d.day::date group by d.day order by d.day;
end $$;
revoke all on function public.platform_admin_daily_orders(integer) from public, anon;
grant execute on function public.platform_admin_daily_orders(integer) to authenticated;
