/*
  # Add mbway_enabled column to restaurant_settings

  ## Summary
  Adds a boolean toggle to control whether MBWay payment method is available to customers.

  ## Changes
  ### Modified Tables
  - `restaurant_settings`
    - Added `mbway_enabled` (boolean, default false) — master switch for the MBWay payment option

  ## Notes
  - Defaults to false so existing restaurants won't have MBWay suddenly appear without configuration
  - When false, the MBWay payment option is hidden from customers in the checkout flow
*/

ALTER TABLE restaurant_settings
  ADD COLUMN IF NOT EXISTS mbway_enabled boolean NOT NULL DEFAULT false;
