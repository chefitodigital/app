/*
  # Reload PostgREST schema cache for MBWay columns

  ## Summary
  Forces the PostgREST schema cache to refresh by adding comments to the MBWay columns
  in restaurant_settings. This resolves the PGRST204 error that occurs when the API
  cannot find columns that already exist in the database.

  ## Affected Table: restaurant_settings
  - `mbway_phone` - adds comment to force cache invalidation
  - `mbway_reference_prefix` - adds comment to force cache invalidation
  - `mbway_enabled` - adds comment to force cache invalidation

  ## Notes
  1. No data is modified - this is a metadata-only operation
  2. Applying migrations via the official Supabase system triggers an automatic PostgREST reload
*/

COMMENT ON COLUMN restaurant_settings.mbway_phone IS 'MBWay phone number shown to customers';
COMMENT ON COLUMN restaurant_settings.mbway_reference_prefix IS 'Short prefix used to build the order reference shown to customers';
COMMENT ON COLUMN restaurant_settings.mbway_enabled IS 'Whether MBWay payment option is enabled';
