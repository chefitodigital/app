/*
  # Add delivered_at timestamp to orders table

  1. Changes
    - Add `delivered_at` column (timestamptz, nullable) to the orders table
    - This column stores when an order was marked as delivered/sent
    - Used to calculate delivery time from acceptance to delivery

  2. Notes
    - Column is nullable to support existing orders without this data
    - No default value - will be set explicitly when order status changes to delivered
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;