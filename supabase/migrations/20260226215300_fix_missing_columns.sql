-- Fix missing columns on family_members table
-- The "no field email" error means these columns were wiped when DB was cleaned

ALTER TABLE public.family_members 
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS pin TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id);

-- Drop any trigger that might reference missing columns
DROP TRIGGER IF EXISTS on_family_member_created ON public.family_members;
DROP FUNCTION IF EXISTS public.handle_new_family_member() CASCADE;
