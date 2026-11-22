/*
  # Create 'chefito' Storage Bucket for Product Images

  1. Storage Bucket
    - `chefito` - Public bucket for storing product images
    - Structure: chefito/{user_email_sanitized}/{filename}

  2. Security Policies
    - Public read access for all images (for menu display)
    - Authenticated users can upload images to their own folder
    - Authenticated users can update their own images
    - Authenticated users can delete their own images

  3. Notes
    - Bucket is public to allow external CDN (like Gumlet) to fetch images
    - Each restaurant owner has their own folder based on sanitized email
    - File names include timestamps for uniqueness
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chefito',
  'chefito',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read access for chefito bucket" ON storage.objects;
CREATE POLICY "Public read access for chefito bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chefito');

DROP POLICY IF EXISTS "Authenticated users can upload to chefito bucket" ON storage.objects;
CREATE POLICY "Authenticated users can upload to chefito bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chefito'
  AND (storage.foldername(name))[1] = replace(replace(auth.jwt()->>'email', '@', '_at_'), '.', '_')
);

DROP POLICY IF EXISTS "Authenticated users can update their own images in chefito" ON storage.objects;
CREATE POLICY "Authenticated users can update their own images in chefito"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chefito'
  AND (storage.foldername(name))[1] = replace(replace(auth.jwt()->>'email', '@', '_at_'), '.', '_')
)
WITH CHECK (
  bucket_id = 'chefito'
  AND (storage.foldername(name))[1] = replace(replace(auth.jwt()->>'email', '@', '_at_'), '.', '_')
);

DROP POLICY IF EXISTS "Authenticated users can delete their own images in chefito" ON storage.objects;
CREATE POLICY "Authenticated users can delete their own images in chefito"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chefito'
  AND (storage.foldername(name))[1] = replace(replace(auth.jwt()->>'email', '@', '_at_'), '.', '_')
);