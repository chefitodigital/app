/*
  # Add Viewed Column to Orders Table

  ## Overview
  This migration adds a notification tracking system for new orders by introducing a 'viewed' column.

  ## Changes Made
  
  1. New Column
    - `viewed` (boolean, default: false) - Tracks whether an admin has acknowledged a new order notification
  
  ## Purpose
  This column enables the real-time notification system where:
  - New orders start with viewed = false
  - Notification bell shows count of unviewed orders
  - Orders are marked as viewed when admin clicks notification or takes action
  - Ensures admins don't miss new incoming orders
  
  ## Notes
  - Existing orders will automatically have viewed = false
  - This is intentional to ensure all pending orders get attention
  - The column is added safely with IF NOT EXISTS check
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'viewed'
  ) THEN
    ALTER TABLE orders ADD COLUMN viewed boolean DEFAULT false;
  END IF;
END $$;

-- Create an index for faster queries on unviewed orders
CREATE INDEX IF NOT EXISTS idx_orders_viewed ON orders(viewed) WHERE viewed = false;