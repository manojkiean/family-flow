-- Add pin column to family_members for profile security
ALTER TABLE public.family_members 
ADD COLUMN IF NOT EXISTS pin TEXT;

-- Note: In a production app, these should be hashed. 
-- For this family flow app, we will use plain 4-digit pins as requested.
