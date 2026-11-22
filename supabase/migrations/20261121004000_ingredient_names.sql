create function public.list_ingredient_names(p_business uuid) returns text[] language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.businesses b where b.id=p_business and b.owner_user_id=(select auth.uid())) then raise exception 'Acesso negado' using errcode='42501'; end if;
 return array(select distinct name from public.product_ingredients where business_id=p_business order by name);
end $$;
revoke all on function public.list_ingredient_names(uuid) from public,anon;
grant execute on function public.list_ingredient_names(uuid) to authenticated;
