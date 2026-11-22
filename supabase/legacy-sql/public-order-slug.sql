-- =====================================================================
-- Public order slug + read policy
-- Adds a short public URL slug (e.g. /pedido/d8r2t5) to each order and
-- exposes it to anonymous visitors, hiding orders whose delivery
-- happened more than 24h ago.
-- =====================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS public_slug text;

CREATE UNIQUE INDEX IF NOT EXISTS orders_public_slug_key
  ON public.orders (public_slug)
  WHERE public_slug IS NOT NULL;

-- Anonymous read of a single order by its slug, hidden 24h after delivery.
DROP POLICY IF EXISTS "Public can view order by slug" ON public.orders;
CREATE POLICY "Public can view order by slug"
  ON public.orders
  FOR SELECT
  TO anon, authenticated
  USING (
    public_slug IS NOT NULL
    AND (
      delivered_at IS NULL
      OR delivered_at > (now() - interval '24 hours')
    )
  );

GRANT SELECT ON public.orders TO anon;