-- Migration 10: Add image_url to products & create product-images storage bucket
-- Run this in your Supabase SQL editor

-- 1. Add image_url column to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

-- 2. Create Supabase Storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS
CREATE POLICY IF NOT EXISTS "Users can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY IF NOT EXISTS "Anyone can view product images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

CREATE POLICY IF NOT EXISTS "Users can update their product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY IF NOT EXISTS "Users can delete their product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');
