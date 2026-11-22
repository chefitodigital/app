-- ============================================================
-- Migration: Add "require_extra" + "extras_label" to products
-- ============================================================
-- Run this SQL once in your Supabase SQL Editor.
--
-- Purpose:
--   Enables a product to act as a "variation parent". When
--   require_extra = true, the customer MUST pick exactly one extra
--   before being able to add the product to the cart (e.g. a "Cerveja"
--   product with extras "Heineken", "Super Bock", "Sagres").
--
--   extras_label is an optional title for the extras group shown to
--   the customer (e.g. "Marca", "Tamanho", "Escolha a versão").
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS require_extra boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS extras_label text;

-- Reload PostgREST schema cache so the Data API exposes the new columns.
NOTIFY pgrst, 'reload schema';
