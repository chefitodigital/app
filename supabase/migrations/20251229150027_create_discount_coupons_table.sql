/*
  # Create Discount Coupons Table

  1. New Tables
    - `discount_coupons`
      - `id` (uuid, primary key)
      - `code` (text, unique) - the coupon code customers will enter
      - `discount_type` (text) - either 'percentage' or 'fixed'
      - `discount_value` (numeric) - the discount amount
      - `active` (boolean) - whether the coupon is currently active
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `discount_coupons` table
    - Add policy for public read access (customers need to validate coupons)
    - Add policy for authenticated users to manage coupons
*/

CREATE TABLE IF NOT EXISTS discount_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE discount_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active coupons"
  ON discount_coupons
  FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated users can read all coupons"
  ON discount_coupons
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert coupons"
  ON discount_coupons
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update coupons"
  ON discount_coupons
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete coupons"
  ON discount_coupons
  FOR DELETE
  TO authenticated
  USING (true);