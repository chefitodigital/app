/*
  # Add Minimum Order Value to Discount Coupons

  1. Changes
    - Add `minimum_order_value` column to `discount_coupons` table
    - This field is optional (nullable) and applies only to fixed and free_product discount types
    - Existing coupons will have NULL value (no minimum)
  
  2. Purpose
    - Allow merchants to set minimum order requirements for fixed and free product coupons
    - Encourages larger purchases when using specific coupon types
    - Percentage coupons are not affected by this constraint
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discount_coupons' AND column_name = 'minimum_order_value'
  ) THEN
    ALTER TABLE discount_coupons ADD COLUMN minimum_order_value numeric(10,2) DEFAULT NULL;
  END IF;
END $$;