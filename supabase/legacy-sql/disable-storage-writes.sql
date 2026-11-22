/*
  Execute este SQL no Supabase do restaurante se o bucket legacy `chefito`
  já existir. Ele mantém imagens antigas legíveis, mas impede novos uploads,
  updates e deletes no Supabase Storage para forçar o fluxo pelo Cloudflare R2.

  Importante: isto bloqueia apenas o bucket `chefito` do Supabase Storage.
  O bucket `chefito` do Cloudflare R2 continua sendo usado normalmente pela
  edge function `r2-sign-upload`.
*/

DROP POLICY IF EXISTS "Authenticated users can upload to chefito bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their own images in chefito" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their own images in chefito" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images in chefito" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images in chefito" ON storage.objects;

DROP POLICY IF EXISTS "Public read access for chefito bucket" ON storage.objects;
CREATE POLICY "Public read access for chefito bucket"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'chefito');

DROP POLICY IF EXISTS "Block inserts to chefito legacy storage" ON storage.objects;
CREATE POLICY "Block inserts to chefito legacy storage"
  ON storage.objects AS RESTRICTIVE FOR INSERT
  TO public
  WITH CHECK (bucket_id <> 'chefito');

DROP POLICY IF EXISTS "Block updates to chefito legacy storage" ON storage.objects;
CREATE POLICY "Block updates to chefito legacy storage"
  ON storage.objects AS RESTRICTIVE FOR UPDATE
  TO public
  USING (bucket_id <> 'chefito')
  WITH CHECK (bucket_id <> 'chefito');

DROP POLICY IF EXISTS "Block deletes from chefito legacy storage" ON storage.objects;
CREATE POLICY "Block deletes from chefito legacy storage"
  ON storage.objects AS RESTRICTIVE FOR DELETE
  TO public
  USING (bucket_id <> 'chefito');

CREATE OR REPLACE FUNCTION public.is_supabase_storage_url(_value text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(_value, '') ILIKE '%.supabase.co/storage/v1/object/%'
    OR COALESCE(_value, '') ILIKE '%/storage/v1/object/public/chefito/%'
$$;

CREATE OR REPLACE FUNCTION public.reject_legacy_supabase_storage_urls()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_TABLE_NAME = 'products' THEN
    IF (TG_OP = 'INSERT' OR NEW.image_url IS DISTINCT FROM OLD.image_url)
      AND public.is_supabase_storage_url(NEW.image_url) THEN
      RAISE EXCEPTION 'Supabase Storage URLs are blocked. Upload images through Cloudflare R2.';
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'restaurant_settings' THEN
    IF (TG_OP = 'INSERT' OR NEW.story_image_url IS DISTINCT FROM OLD.story_image_url)
      AND public.is_supabase_storage_url(NEW.story_image_url) THEN
      RAISE EXCEPTION 'Supabase Storage story_image_url is blocked. Upload story images through Cloudflare R2.';
    END IF;

    IF (TG_OP = 'INSERT' OR NEW.story_images IS DISTINCT FROM OLD.story_images)
      AND public.is_supabase_storage_url(to_jsonb(NEW.story_images)::text) THEN
      RAISE EXCEPTION 'Supabase Storage story_images are blocked. Upload story images through Cloudflare R2.';
    END IF;

    IF (TG_OP = 'INSERT' OR NEW.logo_url IS DISTINCT FROM OLD.logo_url)
      AND public.is_supabase_storage_url(NEW.logo_url) THEN
      RAISE EXCEPTION 'Supabase Storage logo_url is blocked. Upload images through Cloudflare R2.';
    END IF;

    IF (TG_OP = 'INSERT' OR NEW.favicon_url IS DISTINCT FROM OLD.favicon_url)
      AND public.is_supabase_storage_url(NEW.favicon_url) THEN
      RAISE EXCEPTION 'Supabase Storage favicon_url is blocked. Upload images through Cloudflare R2.';
    END IF;

    IF (TG_OP = 'INSERT' OR NEW.about_us_image_url IS DISTINCT FROM OLD.about_us_image_url)
      AND public.is_supabase_storage_url(NEW.about_us_image_url) THEN
      RAISE EXCEPTION 'Supabase Storage about_us_image_url is blocked. Upload images through Cloudflare R2.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reject_legacy_supabase_storage_urls_products ON public.products;
CREATE TRIGGER reject_legacy_supabase_storage_urls_products
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_legacy_supabase_storage_urls();

DROP TRIGGER IF EXISTS reject_legacy_supabase_storage_urls_settings ON public.restaurant_settings;
CREATE TRIGGER reject_legacy_supabase_storage_urls_settings
  BEFORE INSERT OR UPDATE ON public.restaurant_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_legacy_supabase_storage_urls();