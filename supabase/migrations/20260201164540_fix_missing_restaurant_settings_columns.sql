/*
  # Fix Missing Columns in restaurant_settings Table

  This migration adds missing columns to the restaurant_settings table to ensure
  compatibility with the application code.

  ## Changes Made

  1. Columns Added (if not exist):
    - `about_us_image_url` (text) - URL for the about us section image
    - `order_confirmation_message` (text) - Custom message shown after order confirmation
    - `story_image_url` (text) - URL for the story feature image (deprecated, kept for compatibility)
    - `story_image_format` (text) - Format of story images: vertical, portrait, or square
    - `story_enabled` (boolean) - Enable/disable story feature
    - `story_auto_open` (boolean) - Auto-open story on page load
    - `story_images` (jsonb) - Array of story images (max 3)

  2. Security
    - No RLS changes needed (existing policies cover new columns)

  ## Important Notes
    - All columns are added with appropriate default values
    - Migration is idempotent and can be run multiple times safely
    - Existing data is preserved
*/

-- Add about_us_image_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'about_us_image_url'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN about_us_image_url text;
    COMMENT ON COLUMN restaurant_settings.about_us_image_url IS 'URL da imagem da seção Sobre Nós';
  END IF;
END $$;

-- Add order_confirmation_message column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'order_confirmation_message'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN order_confirmation_message text DEFAULT 'Obrigado pelo seu pedido!

Recebemos o seu pedido e estamos a prepará-lo com todo o cuidado.

Entraremos em contacto consigo brevemente para confirmar os detalhes.

Caso tenha alguma dúvida, não hesite em contactar-nos.';
    COMMENT ON COLUMN restaurant_settings.order_confirmation_message IS 'Mensagem de confirmação exibida após finalizar pedido';
  END IF;
END $$;

-- Add story_image_url column if it doesn't exist (deprecated but kept for compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'story_image_url'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN story_image_url text;
    COMMENT ON COLUMN restaurant_settings.story_image_url IS 'URL da imagem do story (deprecated - usar story_images)';
  END IF;
END $$;

-- Add story_image_format column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'story_image_format'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN story_image_format text DEFAULT 'vertical';
    
    -- Add constraint for valid values
    ALTER TABLE restaurant_settings 
    DROP CONSTRAINT IF EXISTS restaurant_settings_story_image_format_check;
    
    ALTER TABLE restaurant_settings 
    ADD CONSTRAINT restaurant_settings_story_image_format_check 
    CHECK (story_image_format IN ('vertical', 'portrait', 'square'));
    
    COMMENT ON COLUMN restaurant_settings.story_image_format IS 'Formato das imagens do story: vertical, portrait ou square';
  END IF;
END $$;

-- Add story_enabled column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'story_enabled'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN story_enabled boolean DEFAULT false;
    COMMENT ON COLUMN restaurant_settings.story_enabled IS 'Ativar/desativar funcionalidade de stories';
  END IF;
END $$;

-- Add story_auto_open column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'story_auto_open'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN story_auto_open boolean DEFAULT false;
    COMMENT ON COLUMN restaurant_settings.story_auto_open IS 'Abrir story automaticamente ao carregar página';
  END IF;
END $$;

-- Add story_images column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'story_images'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN story_images jsonb DEFAULT '[]'::jsonb;
    
    -- Add constraint to limit array length to 3
    ALTER TABLE restaurant_settings 
    DROP CONSTRAINT IF EXISTS restaurant_settings_story_images_check;
    
    ALTER TABLE restaurant_settings 
    ADD CONSTRAINT restaurant_settings_story_images_check 
    CHECK (jsonb_array_length(story_images) <= 3);
    
    COMMENT ON COLUMN restaurant_settings.story_images IS 'Array de URLs de imagens do story (máximo 3)';
  END IF;
END $$;