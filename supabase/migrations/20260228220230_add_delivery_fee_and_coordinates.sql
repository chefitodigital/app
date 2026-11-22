/*
  # Add Delivery Fee and Coordinate Fields

  ## Summary
  This migration extends the system to support distance-based delivery fee calculation.

  ## Changes

  ### 1. restaurant_settings table
  - `delivery_fee_enabled` (boolean, default false) - enables distance-based delivery fee
  - `delivery_base_price` (numeric, default 0) - base price applied to all delivery orders
  - `delivery_price_per_km` (numeric, default 0) - additional price per kilometre
  - `restaurant_lat` (double precision, nullable) - restaurant latitude for distance calculation
  - `restaurant_lng` (double precision, nullable) - restaurant longitude for distance calculation

  ### 2. orders table
  - `delivery_fee` (numeric, default 0) - the delivery fee charged for this order

  ### 3. customers table
  - The `addresses` column currently stores plain strings.
    We keep it as-is and add a parallel `address_coordinates` jsonb array to store
    per-address { lat, lng } pairs indexed by position.

  ## Security
  - No new tables; existing RLS policies are unaffected.
  - New columns follow the same access patterns as surrounding columns.

  ## Notes
  - All new numeric columns default to 0 to avoid null-related issues.
  - `address_coordinates` is an array of nullable objects so existing addresses
    that have no coordinates are represented as null entries in the array.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'delivery_fee_enabled'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN delivery_fee_enabled boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'delivery_base_price'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN delivery_base_price numeric NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'delivery_price_per_km'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN delivery_price_per_km numeric NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'restaurant_lat'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN restaurant_lat double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'restaurant_lng'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN restaurant_lng double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'delivery_fee'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_fee numeric NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'address_coordinates'
  ) THEN
    ALTER TABLE customers ADD COLUMN address_coordinates jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;
