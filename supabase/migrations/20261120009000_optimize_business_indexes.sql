create index if not exists discount_coupons_business_product_idx on public.discount_coupons (business_id, product_id);
create index if not exists orders_business_customer_idx on public.orders (business_id, customer_id);
create index if not exists reservations_business_table_idx on public.reservations (business_id, table_id);
drop index if exists public.discount_coupons_product_business_idx;
drop index if exists public.orders_customer_business_idx;
alter policy "Users can view own record" on public.users using ((select auth.uid()) = id);
