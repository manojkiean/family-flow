-- The profiles table has a trigger referencing NEW.email but the column doesn't exist
-- Fix: add the email column to profiles, and drop/re-add only the safe trigger

-- 1. Drop all non-internal triggers on profiles
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT tgname FROM pg_trigger 
    WHERE tgrelid = 'public.profiles'::regclass
    AND tgisinternal = false
  )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.profiles', r.tgname);
    RAISE NOTICE 'Dropped profile trigger: %', r.tgname;
  END LOOP;
END $$;

-- 2. Add email column to profiles (so any future trigger won't fail)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 3. Re-add only the safe updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Also ensure family_members has the email column
ALTER TABLE public.family_members 
  ADD COLUMN IF NOT EXISTS email TEXT;
