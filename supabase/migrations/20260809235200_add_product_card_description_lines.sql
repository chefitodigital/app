/*
  # Add configurable product-card description line limit

  Allows each restaurant to hide the description or show from one to seven
  lines on product cards. The full description remains available in the modal.
*/

ALTER TABLE public.restaurant_settings
  ADD COLUMN IF NOT EXISTS product_card_description_lines integer NOT NULL DEFAULT 4;

ALTER TABLE public.restaurant_settings
  DROP CONSTRAINT IF EXISTS restaurant_settings_product_card_description_lines_range;

ALTER TABLE public.restaurant_settings
  ADD CONSTRAINT restaurant_settings_product_card_description_lines_range
  CHECK (product_card_description_lines BETWEEN 0 AND 7);
