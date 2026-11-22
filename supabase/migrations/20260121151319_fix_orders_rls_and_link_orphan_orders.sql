/*
  # Fix Orders RLS and Link Orphan Orders to Customers

  ## Summary
  This migration addresses two issues:
  1. Links orphan orders (orders without customer_id) to existing customers using email matching
  2. Adds RLS policy allowing customers to view their own orders in their profile

  ## Changes Made

  ### 1. Data Migration - Link Orphan Orders
  - Finds orders where customer_id IS NULL
  - Matches orders to customers using the customer_email field
  - Updates orders with the corresponding customer_id

  ### 2. New RLS Policy
  - Adds "Customers can view own orders" policy
  - Allows authenticated users to see orders where:
    - The order's customer_id matches their customer record, OR
    - The order's customer_email matches their email (for legacy orders)

  ## Security Notes
  - Policy is restrictive: customers can ONLY see their own orders
  - Uses direct email comparison without recursive queries
  - Staff/admin access remains unchanged (existing policy with USING(true))
*/

-- =====================================================
-- SECTION 1: LINK ORPHAN ORDERS TO CUSTOMERS
-- =====================================================

UPDATE orders o
SET customer_id = c.id
FROM customers c
WHERE o.customer_id IS NULL
  AND o.customer_email IS NOT NULL
  AND o.customer_email != ''
  AND LOWER(TRIM(o.customer_email)) = LOWER(TRIM(c.email));

-- =====================================================
-- SECTION 2: ADD CUSTOMER-SPECIFIC RLS POLICY FOR ORDERS
-- =====================================================

DROP POLICY IF EXISTS "Customers can view own orders" ON orders;

CREATE POLICY "Customers can view own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
    OR
    LOWER(TRIM(customer_email)) = LOWER(TRIM((SELECT email FROM customers WHERE user_id = auth.uid())))
  );
