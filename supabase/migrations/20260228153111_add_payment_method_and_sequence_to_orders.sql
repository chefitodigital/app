/*
  # Add Payment Method, Payment Status, Order Sequence and MBWay Settings

  ## Summary
  This migration adds manual payment tracking support to the ordering system.

  ## Changes

  ### New Sequence
  - `order_sequence_counter` - Global Postgres sequence for generating unique, sequential, crash-safe order numbers

  ### Modified Table: orders
  - `order_sequence` (integer, nullable) - Unique sequential order number generated from the sequence above
  - `payment_method` (text, default 'cash') - Payment method chosen by the customer: 'cash' or 'mbway'
  - `payment_status` (text, default 'pending') - Manual payment confirmation by the restaurant staff: 'pending' or 'paid'

  ### Modified Table: restaurant_settings
  - `mbway_phone` (text, nullable) - The restaurant's MBWay phone number shown to customers
  - `mbway_reference_prefix` (text, nullable) - Short prefix used to build the order reference shown to customers (e.g. "chefito" -> "chefito-00001")

  ## Security
  - No RLS changes needed; existing policies on both tables cover the new columns

  ## Notes
  1. All new columns are added with safe defaults so existing rows are not affected
  2. The sequence starts at 1 and increments by 1 per order
  3. payment_method and payment_status columns use CHECK constraints to enforce valid values
*/

-- Create global sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_sequence_counter START WITH 1 INCREMENT BY 1;

-- Add order_sequence column to orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_sequence'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_sequence integer;
  END IF;
END $$;

-- Add payment_method column to orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_method text NOT NULL DEFAULT 'cash'
      CHECK (payment_method IN ('cash', 'mbway'));
  END IF;
END $$;

-- Add payment_status column to orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_status text NOT NULL DEFAULT 'pending'
      CHECK (payment_status IN ('pending', 'paid'));
  END IF;
END $$;

-- Add mbway_phone column to restaurant_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'mbway_phone'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN mbway_phone text;
  END IF;
END $$;

-- Add mbway_reference_prefix column to restaurant_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'mbway_reference_prefix'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN mbway_reference_prefix text;
  END IF;
END $$;
