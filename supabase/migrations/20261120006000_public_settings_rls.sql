-- Store only the public projection, so the public view can enforce RLS
-- without exposing the private settings table.
create table public.business_public_settings_data as
  select * from public.business_public_settings with no data;
alter table public.business_public_settings_data add primary key (business_id);
insert into public.business_public_settings_data select * from public.business_public_settings;
alter table public.business_public_settings_data enable row level security;
grant select on public.business_public_settings_data to anon, authenticated;
create policy "Read active business settings" on public.business_public_settings_data
  for select to anon, authenticated
  using (exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active'));

create function private.sync_public_business_settings() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    delete from public.business_public_settings_data where business_id = old.business_id;
    return old;
  end if;
  delete from public.business_public_settings_data where business_id = new.business_id;
  insert into public.business_public_settings_data
    select (pg_catalog.jsonb_populate_record(null::public.business_public_settings_data, pg_catalog.to_jsonb(new))).*;
  return new;
end $$;
create trigger sync_public_business_settings
  after insert or update or delete on public.restaurant_settings
  for each row execute function private.sync_public_business_settings();

create or replace view public.business_public_settings
  with (security_invoker = true, security_barrier = true) as
  select * from public.business_public_settings_data;
