alter table public.platform_ticker
  add column if not exists hero_image_url text;

alter table public.platform_ticker
  add constraint platform_hero_image_url_check
  check (hero_image_url is null or (char_length(hero_image_url) <= 2048 and hero_image_url ~ '^https://[^[:space:]]+$'));
