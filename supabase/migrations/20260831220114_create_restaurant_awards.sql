-- Prémios publicados no perfil público do restaurante.
-- As imagens ficam no Cloudflare R2; esta tabela armazena apenas a URL pública e a ordem.

CREATE TABLE IF NOT EXISTS public.restaurant_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS restaurant_awards_display_order_idx
  ON public.restaurant_awards (display_order, created_at);

CREATE OR REPLACE FUNCTION public.update_restaurant_awards_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS restaurant_awards_updated_at ON public.restaurant_awards;
CREATE TRIGGER restaurant_awards_updated_at
  BEFORE UPDATE ON public.restaurant_awards
  FOR EACH ROW EXECUTE FUNCTION public.update_restaurant_awards_updated_at();

ALTER TABLE public.restaurant_awards ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.restaurant_awards FROM anon, authenticated;
GRANT SELECT ON TABLE public.restaurant_awards TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.restaurant_awards TO authenticated;

DROP POLICY IF EXISTS "Public read restaurant awards" ON public.restaurant_awards;
DROP POLICY IF EXISTS "Super admins insert restaurant awards" ON public.restaurant_awards;
DROP POLICY IF EXISTS "Super admins update restaurant awards" ON public.restaurant_awards;
DROP POLICY IF EXISTS "Super admins delete restaurant awards" ON public.restaurant_awards;

CREATE POLICY "Public read restaurant awards"
  ON public.restaurant_awards FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Super admins insert restaurant awards"
  ON public.restaurant_awards FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins update restaurant awards"
  ON public.restaurant_awards FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins delete restaurant awards"
  ON public.restaurant_awards FOR DELETE TO authenticated
  USING (public.is_super_admin());
