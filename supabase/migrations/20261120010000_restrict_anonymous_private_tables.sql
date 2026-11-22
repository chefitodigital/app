-- Public settings are served by the RLS-protected public projection.
-- Guest orders are created through the validated function, not direct writes.
revoke all on public.customers, public.restaurant_settings, public.orders, public.staff, public.staff_schedules from anon;
