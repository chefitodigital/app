/*
  # Add Order Confirmation Message Field

  1. Changes
    - Add `order_confirmation_message` column to `restaurant_settings` table
    - This field stores the customizable message shown to customers after order submission
    - Default message is set in Portuguese (Portugal)

  2. Notes
    - The message is displayed in a modal after successful order submission
    - Restaurants can customize this message through the settings page
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'order_confirmation_message'
  ) THEN
    ALTER TABLE restaurant_settings 
    ADD COLUMN order_confirmation_message TEXT DEFAULT 'Obrigado pelo seu pedido!
Recebemos o seu pedido e estamos a prepará-lo com todo o cuidado.
Entraremos em contacto consigo brevemente para confirmar os detalhes.
Caso tenha alguma dúvida, não hesite em contactar-nos.';
  END IF;
END $$;