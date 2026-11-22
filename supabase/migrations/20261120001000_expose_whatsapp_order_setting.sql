-- Keep the public business view in sync with the checkout option.
do $$
declare definition text;
begin
  select pg_get_viewdef('public.business_public_settings'::regclass, true) into definition;
  if position('s.whatsapp_auto_send' in definition) > 0 then return; end if;
  if position('s.mbway_phone' in definition) = 0 then
    raise exception 'Expected view column not found';
  end if;
  execute 'create or replace view public.business_public_settings with (security_barrier=true) as '
    || replace(definition, 's.mbway_phone', 's.mbway_phone, s.whatsapp_auto_send');
end $$;
