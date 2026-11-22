-- Reservations feature

-- Extend restaurant_settings with reservation config
ALTER TABLE public.restaurant_settings
  ADD COLUMN IF NOT EXISTS reservations_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reservation_duration_min int DEFAULT 90,
  ADD COLUMN IF NOT EXISTS reservation_min_advance_min int DEFAULT 120,
  ADD COLUMN IF NOT EXISTS reservation_max_advance_days int DEFAULT 30;

-- Tables (physical dining tables)
CREATE TABLE IF NOT EXISTS public.reservation_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  seats int NOT NULL CHECK (seats > 0),
  location text NOT NULL DEFAULT 'interior',
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.reservation_tables TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reservation_tables TO authenticated;
GRANT ALL ON public.reservation_tables TO service_role;

ALTER TABLE public.reservation_tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read tables" ON public.reservation_tables;
CREATE POLICY "read tables" ON public.reservation_tables FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin manage tables" ON public.reservation_tables;
CREATE POLICY "admin manage tables" ON public.reservation_tables
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin'));

-- Reservations
DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM ('pending','confirmed','rejected','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  table_id uuid REFERENCES public.reservation_tables(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  party_size int NOT NULL CHECK (party_size > 0),
  notes text,
  status reservation_status NOT NULL DEFAULT 'pending',
  viewed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reservations_table_starts_idx ON public.reservations (table_id, starts_at);
CREATE INDEX IF NOT EXISTS reservations_user_idx ON public.reservations (user_id);
CREATE INDEX IF NOT EXISTS reservations_status_idx ON public.reservations (status);

GRANT SELECT, INSERT, UPDATE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own reservations select" ON public.reservations;
CREATE POLICY "own reservations select" ON public.reservations
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

DROP POLICY IF EXISTS "own reservations insert" ON public.reservations;
CREATE POLICY "own reservations insert" ON public.reservations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "own reservations update" ON public.reservations;
CREATE POLICY "own reservations update" ON public.reservations
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;