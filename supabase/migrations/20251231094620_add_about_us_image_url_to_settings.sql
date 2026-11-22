/*
  # Add About Us Image URL to Restaurant Settings

  1. Changes
    - Adds `about_us_image_url` column to `restaurant_settings` table
    - This column stores the URL of an image to display in the "Quem somos" (About Us) modal
    - Default value is NULL (no image)

  2. Notes
    - The image URL will be stored from Supabase Storage uploads
    - This enhances the About Us section by allowing restaurants to showcase their establishment
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'about_us_image_url'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN about_us_image_url text DEFAULT NULL;
  END IF;
END $$;