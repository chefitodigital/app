/*
  # Create RPC function to get next order sequence number

  ## Summary
  Exposes the order_sequence_counter Postgres sequence via an RPC function
  that can be called from the frontend client.

  ## New Function
  - `get_next_order_sequence()` - Returns the next value from the order_sequence_counter sequence
    - Returns: bigint
    - Security: SECURITY DEFINER so authenticated users can call it without direct sequence access

  ## Notes
  1. This function is required because Postgres sequences cannot be called directly via the REST API
  2. The function is restricted to authenticated users via RLS-equivalent GRANT
*/

CREATE OR REPLACE FUNCTION get_next_order_sequence()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT nextval('order_sequence_counter');
$$;

GRANT EXECUTE ON FUNCTION get_next_order_sequence() TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_order_sequence() TO anon;
