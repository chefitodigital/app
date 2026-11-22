/*
  # Adicionar campos de Story às configurações do restaurante

  ## Mudanças
  1. Novos campos na tabela `restaurant_settings`:
    - `story_image_url` (text): URL da imagem do story/anúncio
    - `story_image_format` (text): formato da imagem ('vertical', 'portrait', 'square')
    - `story_enabled` (boolean): controla se o story está ativo
    - `story_auto_open` (boolean): controla abertura automática do modal

  ## Notas
  - Os campos são opcionais para manter compatibilidade com dados existentes
  - `story_auto_open` só deve ser true quando `story_enabled` também for true
  - Formatos suportados: 'vertical' (9:16), 'portrait' (3:4), 'square' (1:1)
*/

DO $$ 
BEGIN
  -- Adicionar campo story_image_url se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurant_settings' AND column_name = 'story_image_url'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN story_image_url text;
  END IF;

  -- Adicionar campo story_image_format se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurant_settings' AND column_name = 'story_image_format'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN story_image_format text DEFAULT 'vertical'
      CHECK (story_image_format IN ('vertical', 'portrait', 'square'));
  END IF;

  -- Adicionar campo story_enabled se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurant_settings' AND column_name = 'story_enabled'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN story_enabled boolean DEFAULT false;
  END IF;

  -- Adicionar campo story_auto_open se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurant_settings' AND column_name = 'story_auto_open'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN story_auto_open boolean DEFAULT false;
  END IF;
END $$;