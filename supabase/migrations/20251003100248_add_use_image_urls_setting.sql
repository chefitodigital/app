/*
  # Add Image Upload Mode Setting

  This migration adds support for toggling between Cloudinary uploads and direct URL input for images.

  1. Changes
    - Add `use_image_urls` column to `restaurant_settings` table
      - Type: boolean
      - Default: false (uses Cloudinary by default)
      - Description: When true, users can input image URLs directly instead of uploading to Cloudinary
  
  2. Notes
    - This setting applies globally to both product images and logo
    - Existing images are preserved regardless of the mode
    - The setting can be toggled at any time from the Admin interface
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