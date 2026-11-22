/*
  # Add mbway_phone and mbway_reference_prefix to restaurant_settings

  ## Summary
  Adds the two missing MBWay columns to the restaurant_settings table.

  ## Changes
  - `restaurant_settings`: added `mbway_phone` (text, nullable)
  - `restaurant_settings`: added `mbway_reference_prefix` (text, nullable)

  ## Notes
  - mbway_enabled already existed; only the phone and prefix columns were missing
  - Both columns are optional (nullable) with no default value
*/

ALTER TABLE restaurant_settings
  ADD COLUMN IF NOT EXISTS mbway_phone text,
  ADD COLUMN IF NOT EXISTS mbway_reference_prefix text;
