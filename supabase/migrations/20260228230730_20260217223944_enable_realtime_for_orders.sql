/*
  # Enable Realtime for Orders Table
  
  This migration enables Supabase Realtime notifications for the orders table,
  allowing the restaurant owner to receive instant notifications when new orders
  are created without needing to refresh the page.
  
  1. Changes
    - Add the orders table to the supabase_realtime publication
    
  2. Benefits
    - Automatic real-time notifications via WebSocket
    - Instant alerts when new orders arrive
    - No need to manually refresh the page
    - Better user experience for restaurant staff
*/

-- Enable realtime for the orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel
    WHERE prrelid = 'orders'::regclass
    AND prpubid = (SELECT oid FROM pg_publication WHERE pubname = 'supabase_realtime')
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
END $$;
