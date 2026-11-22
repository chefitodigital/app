-- Migração: adiciona coluna public_slug à tabela orders (caso já exista sem ela)
-- Corrige erro: ERROR: 42703: column "public_slug" does not exist

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'orders'
          AND column_name = 'public_slug'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN public_slug text;
    END IF;
END $$;

-- Garante o índice único para slug público
CREATE UNIQUE INDEX IF NOT EXISTS orders_public_slug_key
  ON public.orders (public_slug)
  WHERE public_slug IS NOT NULL;
