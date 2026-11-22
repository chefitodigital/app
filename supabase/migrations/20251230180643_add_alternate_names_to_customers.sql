/*
  # Add Alternate Names System to Customers

  ## Changes
  
  1. New Columns
    - `alternate_names` (text[]): Array of alternate names used by this customer
    - `needs_review` (boolean): Flag indicating customer has multiple names and needs admin review
  
  2. Purpose
    - Track when a customer uses different names with the same phone/email
    - Allow admin to review and manage customer name variations
    - Prevent data loss when names change
  
  3. Security
    - No RLS changes needed (inherits from existing customers table policies)
*/

-- Add alternate_names column to store name variations
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS alternate_names text[] DEFAULT '{}';

-- Add needs_review flag for admin attention
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS needs_review boolean DEFAULT false;

-- Create index for faster queries on needs_review
CREATE INDEX IF NOT EXISTS idx_customers_needs_review 
ON customers(needs_review) 
WHERE needs_review = true;