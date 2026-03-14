-- ============================================================
-- FINAL CLEAN SLATE FIX
-- Run this entire block in Supabase SQL Editor
-- ============================================================

-- 1. Drop ALL user-defined triggers on family_members (clears any junk triggers)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT tgname FROM pg_trigger 
    WHERE tgrelid = 'public.family_members'::regclass
    AND tgisinternal = false
  )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.family_members CASCADE', r.tgname);
    RAISE NOTICE 'Dropped trigger: %', r.tgname;
  END LOOP;
END $$;

-- 2. Add missing columns (safe: IF NOT EXISTS)
ALTER TABLE public.family_members 
  ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id),
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS pin TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id),
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS family_name TEXT;

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id);

-- 3. DROP ALL existing RLS policies (clean slate)
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('families','profiles','family_members','activities','posts')
  )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 4. Enable RLS
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- 5. Simple, non-recursive RLS policies

-- families: only the owner can see/manage their family
CREATE POLICY "families_owner" ON public.families
FOR ALL USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- profiles: users manage their own profile
CREATE POLICY "profiles_own" ON public.profiles
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- family_members: owner of the family can do everything
CREATE POLICY "members_owner_full" ON public.family_members
FOR ALL
USING   (family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid()))
WITH CHECK (family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid()));

-- family_members: a member can read their own row + family-mates
CREATE POLICY "members_read_self" ON public.family_members
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "members_read_family" ON public.family_members
FOR SELECT USING (
  family_id IN (
    SELECT family_id FROM public.profiles 
    WHERE user_id = auth.uid() AND family_id IS NOT NULL
  )
);

-- activities: owners + family members can manage
CREATE POLICY "activities_family" ON public.activities
FOR ALL
USING (
  family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  OR family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid() AND family_id IS NOT NULL)
)
WITH CHECK (
  family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  OR family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid() AND family_id IS NOT NULL)
);
