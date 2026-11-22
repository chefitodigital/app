/*
  # Add use_image_urls Column

  1. Changes
    - Add `use_image_urls` column to `restaurant_settings` table
      - Type: boolean
      - Default: false
      - Description: When true, users can input image URLs directly instead of uploading to Cloudinary

  2. Notes
    - This setting allows toggling between Cloudinary uploads and direct URL input
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'use_image_urls'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN use_image_urls boolean DEFAULT false;
  END IF;
END $$;