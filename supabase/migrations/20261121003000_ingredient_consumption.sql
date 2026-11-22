create table public.product_ingredients (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 product_id uuid not null references public.products(id) on delete cascade,
 name text not null check (length(trim(name)) between 1 and 100),
 unit text not null check (unit in ('g','kg','ml','l','unidade','folha','rodela')),
 quantity numeric not null check (quantity > 0 and quantity <= 1000000),
 unique(product_id,name,unit)
);
create index product_ingredients_business_product_idx on public.product_ingredients(business_id,product_id);
alter table public.product_ingredients enable row level security;
revoke all on public.product_ingredients from public, anon, authenticated;
create table public.order_ingredient_usage (
 order_id uuid not null references public.orders(id) on delete cascade,
 business_id uuid not null references public.businesses(id) on delete cascade,
 name text not null, unit text not null, quantity numeric not null,
 primary key(order_id,name,unit)
);
alter table public.order_ingredient_usage enable row level security;
revoke all on public.order_ingredient_usage from public, anon, authenticated;

create function public.get_product_ingredients(p_product uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not exists(select 1 from public.products p join public.businesses b on b.id=p.business_id where p.id=p_product and b.owner_user_id=(select auth.uid())) then raise exception 'Acesso negado' using errcode='42501'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('name',name,'unit',unit,'quantity',quantity) order by name),'[]'::jsonb) into result from public.product_ingredients where product_id=p_product;
 return result;
end $$;
create function public.save_product_ingredients(p_product uuid,p_items jsonb) returns void language plpgsql security definer set search_path='' as $$
declare bid uuid; item jsonb;
begin
 select p.business_id into bid from public.products p join public.businesses b on b.id=p.business_id where p.id=p_product and b.owner_user_id=(select auth.uid());
 if bid is null then raise exception 'Acesso negado' using errcode='42501'; end if;
 if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)>100 then raise exception 'Lista inválida'; end if;
 delete from public.product_ingredients where product_id=p_product;
 for item in select * from jsonb_array_elements(p_items) loop
 insert into public.product_ingredients(business_id,product_id,name,unit,quantity) values(bid,p_product,trim(item->>'name'),item->>'unit',(item->>'quantity')::numeric);
 end loop;
end $$;
create function public.snapshot_order_ingredients() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='delivered' and (tg_op='INSERT' or old.status is distinct from 'delivered') then
 delete from public.order_ingredient_usage where order_id=new.id;
 insert into public.order_ingredient_usage(order_id,business_id,name,unit,quantity)
 select new.id,new.business_id,i.name,i.unit,sum(i.quantity * (it->>'quantity')::numeric)
 from jsonb_array_elements(new.items) it join public.product_ingredients i on i.product_id::text=it->>'id' and i.business_id=new.business_id
 where (it->>'quantity') ~ '^[0-9]+(\.[0-9]+)?$'
 group by i.name,i.unit;
 elsif tg_op='UPDATE' and old.status='delivered' and new.status<>'delivered' then
 delete from public.order_ingredient_usage where order_id=new.id;
 end if;
 return new;
end $$;
create trigger snapshot_order_ingredients after insert or update of status on public.orders for each row execute function public.snapshot_order_ingredients();
create function public.ingredient_consumption(p_business uuid,p_from timestamptz,p_to timestamptz) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not exists(select 1 from public.businesses b where b.id=p_business and b.owner_user_id=(select auth.uid())) then raise exception 'Acesso negado' using errcode='42501'; end if;
 if p_from is null or p_to is null or p_from>=p_to then raise exception 'Período inválido'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('name',name,'unit',unit,'quantity',quantity) order by name),'[]'::jsonb) into result from (
 select min(u.name) name, case when u.unit in ('g','kg') then 'g' when u.unit in ('ml','l') then 'ml' else u.unit end unit,
 sum(u.quantity * case when u.unit in ('kg','l') then 1000 else 1 end) quantity
 from public.order_ingredient_usage u join public.orders o on o.id=u.order_id
 where u.business_id=p_business and o.status='delivered' and o.delivered_at>=p_from and o.delivered_at<p_to
 group by lower(trim(u.name)),case when u.unit in ('g','kg') then 'g' when u.unit in ('ml','l') then 'ml' else u.unit end
 ) totals;
 return result;
end $$;
revoke all on function public.get_product_ingredients(uuid),public.save_product_ingredients(uuid,jsonb),public.ingredient_consumption(uuid,timestamptz,timestamptz),public.snapshot_order_ingredients() from public,anon;
grant execute on function public.get_product_ingredients(uuid),public.save_product_ingredients(uuid,jsonb),public.ingredient_consumption(uuid,timestamptz,timestamptz) to authenticated;
