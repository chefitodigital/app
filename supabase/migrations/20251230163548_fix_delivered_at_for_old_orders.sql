/*
  # Fix delivered_at for Old Delivered Orders

  1. Changes
    - Updates all orders with status 'delivered' that have NULL delivered_at
    - Sets delivered_at to accepted_at + 30 minutes as a reasonable estimate
    - If accepted_at is also NULL, uses created_at + 30 minutes

  2. Notes
    - This is a one-time data fix for orders created before the delivered_at column existed
    - Future orders will have delivered_at set correctly when marked as delivered
*/

UPDATE orders
SET delivered_at = COALESCE(
  accepted_at + INTERVAL '30 minutes',
  created_at + INTERVAL '30 minutes'
)
WHERE status = 'delivered'
  AND delivered_at IS NULL;
