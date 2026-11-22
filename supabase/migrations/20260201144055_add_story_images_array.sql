/*
  # Add Story Images Array Support

  1. Changes to restaurant_settings table
    - Add `story_images` column (JSONB array)
      - Each item: {id: string, url: string, order: number}
      - Maximum 3 images
    - Migrate existing `story_image_url` data to `story_images`
    - Keep `story_image_url` temporarily for backwards compatibility
  
  2. Migration Strategy
    - Create new column with default empty array
    - Copy existing story_image_url to story_images if present
    - Add check constraint to limit array to 3 items
  
  3. Notes
    - Data structure: [{id: "uuid", url: "https://...", order: 0}, ...]
    - Order field determines display sequence
    - Empty story_image_url will result in empty story_images array
*/

-- Add story_images column
ALTER TABLE restaurant_settings 
ADD COLUMN IF NOT EXISTS story_images JSONB DEFAULT '[]'::jsonb;

-- Migrate existing story_image_url to story_images
DO $$
DECLARE
  rec RECORD;
  new_story_array JSONB;
BEGIN
  FOR rec IN SELECT id, story_image_url FROM restaurant_settings WHERE story_image_url IS NOT NULL AND story_image_url != ''
  LOOP
    -- Create array with single image from existing story_image_url
    new_story_array := jsonb_build_array(
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'url', rec.story_image_url,
        'order', 0
      )
    );
    
    -- Update the record
    UPDATE restaurant_settings 
    SET story_images = new_story_array 
    WHERE id = rec.id;
  END LOOP;
END $$;

-- Add check constraint to limit array to 3 items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'story_images_max_3_items'
  ) THEN
    ALTER TABLE restaurant_settings 
    ADD CONSTRAINT story_images_max_3_items 
    CHECK (jsonb_array_length(story_images) <= 3);
  END IF;
END $$;