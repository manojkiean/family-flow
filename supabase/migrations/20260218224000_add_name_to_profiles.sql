
-- Add name column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;

-- Sync existing family_name to name
UPDATE public.profiles SET name = family_name WHERE name IS NULL;
