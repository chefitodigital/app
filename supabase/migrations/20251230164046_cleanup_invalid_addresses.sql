/*
  # Cleanup Invalid Addresses from Customers

  1. Changes
    - Removes addresses that look like times (HH:MM or HHhMM format)
    - Removes addresses shorter than 5 characters
    - Only affects existing customer records

  2. Notes
    - This cleans up addresses that were incorrectly stored from takeaway orders
    - Future orders will not add these invalid addresses due to app-level validation
*/

UPDATE customers
SET addresses = COALESCE(
  (
    SELECT jsonb_agg(addr)
    FROM jsonb_array_elements_text(addresses) AS addr
    WHERE addr !~ '^\d{1,2}:\d{2}$'
      AND addr !~ '^\d{1,2}[hH]\d{0,2}$'
      AND length(trim(addr)) >= 5
  ),
  '[]'::jsonb
)
WHERE addresses IS NOT NULL
  AND jsonb_array_length(addresses) > 0;
