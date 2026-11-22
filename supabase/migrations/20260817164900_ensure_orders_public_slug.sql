-- Makes the public order URL column safe for both new and existing projects.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS public_slug text;

CREATE UNIQUE INDEX IF NOT EXISTS orders_public_slug_key
  ON public.orders (public_slug)
  WHERE public_slug IS NOT NULL;
