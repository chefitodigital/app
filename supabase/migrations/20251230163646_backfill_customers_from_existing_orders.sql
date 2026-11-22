/*
  # Backfill Customers from Existing Orders

  1. Changes
    - Creates customers from orders that have status 'accepted' or 'delivered' but no customer_id
    - Links those orders to the newly created customers
    - Handles duplicate customers by matching on phone or email

  2. Notes
    - This is a one-time data fix for orders that were accepted before the customer creation logic was moved
    - Future orders will have customers created when the order is accepted
*/

DO $$
DECLARE
  order_record RECORD;
  existing_customer_id uuid;
  new_customer_id uuid;
  normalized_phone text;
  normalized_email text;
  current_addresses jsonb;
BEGIN
  FOR order_record IN 
    SELECT id, customer_name, customer_phone, customer_email, address
    FROM orders
    WHERE status IN ('accepted', 'delivered')
      AND customer_id IS NULL
      AND customer_phone IS NOT NULL
      AND customer_phone != ''
  LOOP
    normalized_phone := regexp_replace(order_record.customer_phone, '\D', '', 'g');
    normalized_email := lower(trim(order_record.customer_email));
    existing_customer_id := NULL;
    new_customer_id := NULL;

    SELECT id INTO existing_customer_id
    FROM customers
    WHERE phone ILIKE '%' || normalized_phone || '%'
    LIMIT 1;

    IF existing_customer_id IS NULL AND normalized_email != '' THEN
      SELECT id INTO existing_customer_id
      FROM customers
      WHERE lower(email) = normalized_email
      LIMIT 1;
    END IF;

    IF existing_customer_id IS NOT NULL THEN
      UPDATE orders SET customer_id = existing_customer_id WHERE id = order_record.id;
      
      SELECT addresses INTO current_addresses FROM customers WHERE id = existing_customer_id;
      
      IF order_record.address IS NOT NULL 
         AND order_record.address != '' 
         AND NOT (current_addresses ? order_record.address)
      THEN
        UPDATE customers
        SET addresses = current_addresses || to_jsonb(order_record.address)
        WHERE id = existing_customer_id;
      END IF;
    ELSE
      INSERT INTO customers (name, phone, email, addresses)
      VALUES (
        order_record.customer_name,
        order_record.customer_phone,
        COALESCE(NULLIF(normalized_email, ''), NULL),
        CASE 
          WHEN order_record.address IS NOT NULL AND order_record.address != '' 
          THEN jsonb_build_array(order_record.address)
          ELSE '[]'::jsonb
        END
      )
      RETURNING id INTO new_customer_id;

      UPDATE orders SET customer_id = new_customer_id WHERE id = order_record.id;
    END IF;
  END LOOP;
END $$;
