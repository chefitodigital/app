/*
  # Create Customers Table

  1. New Tables
    - `customers`
      - `id` (uuid, primary key) - Unique identifier for each customer
      - `name` (text) - Customer's name
      - `phone` (text) - Customer's phone number
      - `email` (text) - Customer's email address
      - `addresses` (jsonb) - Array of customer addresses (supports multiple)
      - `notes` (text, nullable) - Additional notes about the customer
      - `created_at` (timestamptz) - Timestamp when customer was created
      - `updated_at` (timestamptz) - Timestamp when customer was last updated

  2. Indexes
    - Index on phone for faster lookups
    - Index on email for faster lookups

  3. Security
    - Enable RLS on `customers` table
    - Add policy for authenticated users to read all customers
    - Add policy for authenticated users to insert customers
    - Add policy for authenticated users to update customers
    - Add policy for authenticated users to delete customers

  4. Notes
    - The addresses column stores multiple addresses as a JSON array
    - Each address is stored as a string in the array
    - Updated_at is automatically set on updates via trigger
*/

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  addresses jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_customers_updated_at ON customers;
CREATE TRIGGER trigger_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete customers"
  ON customers
  FOR DELETE
  TO authenticated
  USING (true);