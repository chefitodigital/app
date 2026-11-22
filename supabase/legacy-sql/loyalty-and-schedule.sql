-- ============================================================
-- MIGRATION: Loyalty points, operating schedule
-- Aplique no SQL Editor do Supabase Dashboard.
-- ============================================================

ALTER TABLE public.restaurant_settings
  ADD COLUMN IF NOT EXISTS loyalty_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS loyalty_points_per_euro integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS loyalty_points_per_euro_discount integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS operating_schedule jsonb;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS loyalty_points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_points_total integer NOT NULL DEFAULT 0;

-- Trigger: award loyalty points automatically when an order becomes 'delivered'
CREATE OR REPLACE FUNCTION public.award_loyalty_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.restaurant_settings;
  pts integer;
BEGIN
  IF NEW.status = 'delivered'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'delivered')
     AND NEW.customer_id IS NOT NULL THEN
    SELECT * INTO s FROM public.restaurant_settings LIMIT 1;
    IF s.loyalty_enabled THEN
      pts := FLOOR(COALESCE(NEW.total, 0) * COALESCE(s.loyalty_points_per_euro, 1))::int;
      IF pts > 0 THEN
        UPDATE public.customers
           SET loyalty_points       = loyalty_points + pts,
               loyalty_points_total = loyalty_points_total + pts
         WHERE id = NEW.customer_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_loyalty_points ON public.orders;
CREATE TRIGGER trg_award_loyalty_points
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.award_loyalty_points();