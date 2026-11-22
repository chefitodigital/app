/*
  # Fix Storage Bucket RLS Policies

  ## Changes
  
  1. Storage Policies Update
    - Remove folder-based restrictions from INSERT policy
    - Remove folder-based restrictions from UPDATE policy
    - Remove folder-based restrictions from DELETE policy
    - Allow authenticated users to upload files directly to bucket root
    - Maintain public read access for all files
  
  ## Security
  
  - Public: Can read all files in the bucket
  - Authenticated users: Can upload, update, and delete any file in the bucket
  
  ## Notes
  
  This fixes the "new row violates row-level security policy" error that occurs
  when uploading images directly to the bucket root without a user-specific folder.
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can upload to chefito bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their own images in chefito" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their own images in chefito" ON storage.objects;

-- Create new permissive policies for authenticated users
CREATE POLICY "Authenticated users can upload to chefito bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chefito');

CREATE POLICY "Authenticated users can update images in chefito"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'chefito')
  WITH CHECK (bucket_id = 'chefito');

CREATE POLICY "Authenticated users can delete images in chefito"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'chefito');