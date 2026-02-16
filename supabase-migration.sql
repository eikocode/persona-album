-- ================================================
-- Photo Colorization App - Authentication Migration
-- ================================================
-- This migration adds user authentication support while
-- maintaining backward compatibility with anonymous uploads.
--
-- Run this in Supabase Dashboard > SQL Editor
-- ================================================

-- Step 1: Add user_id column to photos table (nullable)
ALTER TABLE photos
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create index for performance
CREATE INDEX idx_photos_user_id ON photos(user_id);

-- Step 3: Enable RLS (Row Level Security)
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Step 4: Create permissive policies for both authenticated and anonymous users

-- Policy: Allow all reads (authenticated AND anonymous)
CREATE POLICY "Anyone can view photos"
ON photos FOR SELECT
USING (true);

-- Policy: Authenticated users can insert with their user_id
CREATE POLICY "Authenticated users can insert own photos"
ON photos FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR
  (auth.role() = 'anon' AND user_id IS NULL)
);

-- Policy: Allow anonymous inserts (user_id = NULL)
CREATE POLICY "Anonymous users can insert photos"
ON photos FOR INSERT
WITH CHECK (auth.role() = 'anon' AND user_id IS NULL);

-- Policy: Users can delete their own photos
CREATE POLICY "Users can delete own photos"
ON photos FOR DELETE
USING (auth.uid() = user_id);

-- Policy: Anonymous can delete photos with NULL user_id
CREATE POLICY "Anonymous can delete orphan photos"
ON photos FOR DELETE
USING (auth.role() = 'anon' AND user_id IS NULL);

-- Policy: Users can update their own photos
CREATE POLICY "Users can update own photos"
ON photos FOR UPDATE
USING (auth.uid() = user_id);

-- Step 5: Grant permissions
GRANT ALL ON photos TO authenticated;
GRANT ALL ON photos TO anon;

-- ================================================
-- Migration complete!
-- ================================================
-- Next steps:
-- 1. Enable Email authentication in Supabase Dashboard
-- 2. Deploy the application code changes
-- 3. Test both authenticated and anonymous uploads
-- ================================================
