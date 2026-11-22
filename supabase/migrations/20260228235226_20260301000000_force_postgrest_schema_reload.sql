/*
  # Force PostgREST schema cache reload for MBWay columns

  ## Summary
  The PostgREST schema cache is not recognizing the mbway_phone and mbway_reference_prefix
  columns despite them existing in the database. This migration forces a schema reload
  by making a safe structural change (altering the DEFAULT of existing columns).

  ## Affected Table: restaurant_settings
  - `mbway_phone` - re-applies NOT NULL default to trigger cache invalidation
  - `mbway_reference_prefix` - re-applies NOT NULL default to trigger cache invalidation

  ## Notes
  1. No data is modified or lost
  2. Applying a migration via the Supabase system guarantees PostgREST schema reload
*/

ALTER TABLE restaurant_settings
  ALTER COLUMN mbway_phone SET DEFAULT NULL;

ALTER TABLE restaurant_settings
  ALTER COLUMN mbway_reference_prefix SET DEFAULT NULL;
