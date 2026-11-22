/*
  # Create Orders Table

  1. New Tables
    - `orders`
      - `id` (uuid, primary key) - Unique identifier for each order
      - `customer_name` (text) - Customer's name
      - `customer_email` (text) - Customer's email address
      - `customer_phone` (text) - Customer's phone number
      - `address` (text) - Delivery address, table number, or pickup time
      - `notes` (text, nullable) - Additional order notes
      - `order_type` (text) - Type of order: 'delivery', 'table', or 'takeaway'
      - `items` (jsonb) - JSON array containing order items with extras
      - `subtotal` (numeric) - Order subtotal before discount
      - `discount_amount` (numeric) - Discount amount applied
      - `total` (numeric) - Final order total
      - `coupon_code` (text, nullable) - Applied coupon code if any
      - `status` (text) - Order status: 'pending', 'accepted', 'delivered'
      - `accepted_at` (timestamptz, nullable) - Timestamp when order was accepted
      - `created_at` (timestamptz) - Timestamp when order was created

  2. Security
    - Enable RLS on `orders` table
    - Add policy for authenticated users to read all orders
    - Add policy for authenticated users to insert orders
    - Add policy for authenticated users to update orders
    - Add policy for authenticated users to delete orders
    - Add policy for anonymous users to insert orders (for customers placing orders)

  3. Notes
    - The items column stores product details as JSON to preserve order history
    - Status workflow: pending -> accepted -> delivered (or cancelled/deleted)
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  address text NOT NULL,
  notes text,
  order_type text NOT NULL CHECK (order_type IN ('delivery', 'table', 'takeaway')),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  coupon_code text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'delivered')),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read all orders" ON orders;
CREATE POLICY "Authenticated users can read all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
CREATE POLICY "Anyone can insert orders"
  ON orders
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
CREATE POLICY "Authenticated users can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete orders" ON orders;
CREATE POLICY "Authenticated users can delete orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (true);