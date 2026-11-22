/*
  # Add minimum order value for delivery

  Enables the restaurant administrator to require a minimum cart value for
  delivery orders. A zero value keeps the requirement disabled.
*/

ALTER TABLE public.restaurant_settings
  ADD COLUMN IF NOT EXISTS delivery_minimum_order_value numeric(10,2) NOT NULL DEFAULT 0;

ALTER TABLE public.restaurant_settings
  DROP CONSTRAINT IF EXISTS restaurant_settings_delivery_minimum_order_value_non_negative;

ALTER TABLE public.restaurant_settings
  ADD CONSTRAINT restaurant_settings_delivery_minimum_order_value_non_negative
  CHECK (delivery_minimum_order_value >= 0);
