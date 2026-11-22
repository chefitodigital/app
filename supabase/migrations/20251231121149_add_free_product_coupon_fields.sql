/*
  # Add Free Product Coupon Fields

  1. Changes to `discount_coupons` table
    - Add 'free_product' to discount_type check constraint
    - Add `product_id` (uuid, nullable) - references products table for free product coupons
    - Add `ambassador_name` (text, nullable) - identifies the ambassador/creator of the coupon
    - Add `usage_limit` (integer, nullable) - maximum number of times coupon can be used (null = unlimited)
    - Add `usage_count` (integer, default 0) - tracks how many times the coupon has been used

  2. Modifications
    - Update discount_type CHECK constraint to allow 'free_product'
    - Modify discount_value constraint to allow 0 for free product coupons

  3. Notes
    - For 'free_product' type, product_id should be set
    - For 'percentage' and 'fixed' types, discount_value should be > 0
    - usage_limit = null or 0 means unlimited usage
*/

ALTER TABLE discount_coupons DROP CONSTRAINT IF EXISTS discount_coupons_discount_type_check;

ALTER TABLE discount_coupons 
ADD CONSTRAINT discount_coupons_discount_type_check 
CHECK (discount_type IN ('percentage', 'fixed', 'free_product'));

ALTER TABLE discount_coupons DROP CONSTRAINT IF EXISTS discount_coupons_discount_value_check;

ALTER TABLE discount_coupons 
ADD CONSTRAINT discount_coupons_discount_value_check 
CHECK (discount_value >= 0);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discount_coupons' AND column_name = 'product_id'
  ) THEN
    ALTER TABLE discount_coupons ADD COLUMN product_id uuid REFERENCES products(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discount_coupons' AND column_name = 'ambassador_name'
  ) THEN
    ALTER TABLE discount_coupons ADD COLUMN ambassador_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discount_coupons' AND column_name = 'usage_limit'
  ) THEN
    ALTER TABLE discount_coupons ADD COLUMN usage_limit integer;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discount_coupons' AND column_name = 'usage_count'
  ) THEN
    ALTER TABLE discount_coupons ADD COLUMN usage_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_discount_coupons_product_id ON discount_coupons(product_id);
CREATE INDEX IF NOT EXISTS idx_discount_coupons_ambassador ON discount_coupons(ambassador_name);
