-- ==============================================================================
-- Supabase Storage Setup Migration for 'product-images' Bucket
-- Idempotent Storage Bucket Creation and Storage RLS Policies
-- ==============================================================================

-- Create bucket if it does not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Public read access to all objects in product-images bucket
DROP POLICY IF EXISTS "Public can view product images bucket" ON storage.objects;
CREATE POLICY "Public can view product images bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 2. Staff and Admin can upload images to product-images bucket
DROP POLICY IF EXISTS "Staff and Admin can insert product images" ON storage.objects;
CREATE POLICY "Staff and Admin can insert product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff')
  )
);

-- 3. Staff and Admin can update/delete images in product-images bucket
DROP POLICY IF EXISTS "Staff and Admin can update product images" ON storage.objects;
CREATE POLICY "Staff and Admin can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff')
  )
);

DROP POLICY IF EXISTS "Staff and Admin can delete product images" ON storage.objects;
CREATE POLICY "Staff and Admin can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff')
  )
);
