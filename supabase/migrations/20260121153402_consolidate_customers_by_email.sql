/*
  # Consolidate Customers by Email

  1. Problem
    - Multiple customer records exist for the same email
    - Addresses are scattered across duplicate records
    - Orders are linked to different customer_ids for the same person

  2. Solution
    - Merge all addresses from duplicates into a single record per email
    - Update all orders to point to the consolidated customer record
    - Delete duplicate records
    - Add UNIQUE constraint on email to prevent future duplicates

  3. Changes
    - Consolidates customer records by email
    - Updates orders.customer_id to point to consolidated record
    - Adds UNIQUE constraint on customers.email
*/

DO $$
DECLARE
  dup_record RECORD;
  keeper_id uuid;
  all_addresses jsonb;
  keeper_user_id uuid;
  keeper_name text;
  keeper_phone text;
  keeper_birth_date date;
BEGIN
  FOR dup_record IN
    SELECT email, array_agg(id ORDER BY updated_at DESC NULLS LAST) as ids
    FROM customers
    WHERE email IS NOT NULL AND email != ''
    GROUP BY email
    HAVING COUNT(*) > 1
  LOOP
    keeper_id := dup_record.ids[1];
    
    SELECT 
      COALESCE(
        (SELECT jsonb_agg(DISTINCT addr) 
         FROM customers c, jsonb_array_elements(c.addresses) addr 
         WHERE c.email = dup_record.email AND jsonb_array_length(c.addresses) > 0),
        '[]'::jsonb
      )
    INTO all_addresses;
    
    SELECT user_id INTO keeper_user_id
    FROM customers 
    WHERE email = dup_record.email AND user_id IS NOT NULL
    ORDER BY updated_at DESC NULLS LAST
    LIMIT 1;
    
    SELECT name INTO keeper_name
    FROM customers 
    WHERE email = dup_record.email AND name IS NOT NULL AND name != ''
    ORDER BY LENGTH(name) DESC, updated_at DESC NULLS LAST
    LIMIT 1;
    
    SELECT phone INTO keeper_phone
    FROM customers 
    WHERE email = dup_record.email AND phone IS NOT NULL AND phone != ''
    ORDER BY updated_at DESC NULLS LAST
    LIMIT 1;
    
    SELECT birth_date INTO keeper_birth_date
    FROM customers 
    WHERE email = dup_record.email AND birth_date IS NOT NULL
    ORDER BY updated_at DESC NULLS LAST
    LIMIT 1;
    
    UPDATE customers
    SET 
      addresses = all_addresses,
      user_id = keeper_user_id,
      name = COALESCE(keeper_name, name),
      phone = COALESCE(keeper_phone, phone),
      birth_date = COALESCE(keeper_birth_date, birth_date),
      updated_at = NOW()
    WHERE id = keeper_id;
    
    UPDATE orders
    SET customer_id = keeper_id
    WHERE customer_id = ANY(dup_record.ids) AND customer_id != keeper_id;
    
    DELETE FROM customers
    WHERE id = ANY(dup_record.ids) AND id != keeper_id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS customers_email_unique_idx ON customers (email) WHERE email IS NOT NULL AND email != '';
