
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  family_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Add user_id to family_members
ALTER TABLE public.family_members ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to activities
ALTER TABLE public.activities ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old public RLS policies on family_members
DROP POLICY IF EXISTS "Allow public delete family_members" ON public.family_members;
DROP POLICY IF EXISTS "Allow public insert family_members" ON public.family_members;
DROP POLICY IF EXISTS "Allow public read family_members" ON public.family_members;
DROP POLICY IF EXISTS "Allow public update family_members" ON public.family_members;

-- New user-scoped RLS for family_members
CREATE POLICY "Users can view their own family members"
  ON public.family_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own family members"
  ON public.family_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family members"
  ON public.family_members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family members"
  ON public.family_members FOR DELETE
  USING (auth.uid() = user_id);

-- Drop old public RLS policies on activities
DROP POLICY IF EXISTS "Allow public delete activities" ON public.activities;
DROP POLICY IF EXISTS "Allow public insert activities" ON public.activities;
DROP POLICY IF EXISTS "Allow public read activities" ON public.activities;
DROP POLICY IF EXISTS "Allow public update activities" ON public.activities;

-- New user-scoped RLS for activities
CREATE POLICY "Users can view their own activities"
  ON public.activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
  ON public.activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities"
  ON public.activities FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
