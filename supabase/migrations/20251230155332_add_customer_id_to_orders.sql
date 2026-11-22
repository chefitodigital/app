/*
  # Add Customer ID to Orders Table

  1. Changes
    - Add `customer_id` column to orders table as optional foreign key
    - References the customers table
    - ON DELETE SET NULL to preserve order history if customer is deleted

  2. Notes
    - customer_id is nullable to maintain backwards compatibility with existing orders
    - Existing orders will have NULL customer_id until manually linked
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);