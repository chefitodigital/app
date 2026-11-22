/*
  # Add Free Product Description Field

  1. Changes to `discount_coupons` table
    - Add `free_product_description` (text, nullable) - free text field for describing what the customer receives
    - This replaces the product_id lookup for free product coupons

  2. Notes
    - Restaurant owners can now write any text to describe the free item
    - Examples: "Sobremesa a escolha", "Bebida gratis", "Entrada do dia"
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discount_coupons' AND column_name = 'free_product_description'
  ) THEN
    ALTER TABLE discount_coupons ADD COLUMN free_product_description text;
  END IF;
END $$;
