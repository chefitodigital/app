/*
  # Add WhatsApp Auto-Send Setting

  1. Changes
    - Add `whatsapp_auto_send` column to `restaurant_settings` table
      - Type: boolean
      - Default: false
      - Description: When enabled, automatically opens WhatsApp with pre-filled order message after checkout

  2. Notes
    - This is an optional feature that restaurant owners can enable/disable
    - Does not affect existing order flow if disabled
    - Requires WhatsApp number to be configured in social_links
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'whatsapp_auto_send'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN whatsapp_auto_send boolean DEFAULT false;
  END IF;
END $$;
