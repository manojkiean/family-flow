-- ============================================
-- STEP 1: Show all triggers on family_members (for info)
-- ============================================
-- SELECT tgname, tgenabled FROM pg_trigger 
-- WHERE tgrelid = 'public.family_members'::regclass;

-- ============================================
-- STEP 2: Drop ALL triggers on family_members
-- ============================================
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT tgname FROM pg_trigger 
    WHERE tgrelid = 'public.family_members'::regclass
    AND tgisinternal = false
  )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.family_members', r.tgname);
    RAISE NOTICE 'Dropped trigger: %', r.tgname;
  END LOOP;
END $$;

-- ============================================
-- STEP 3: Drop ALL triggers on profiles too
-- ============================================
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
    RAISE NOTICE 'Dropped trigger: %', r.tgname;
  END LOOP;
END $$;

-- ============================================
-- STEP 4: Ensure families table exists
-- ============================================
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    owner_id UUID REFERENCES auth.users(id)
);

-- ============================================
-- STEP 5: Add ALL missing columns 
-- ============================================
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

-- ============================================
-- STEP 6: Add only the updated_at trigger (safe)
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- STEP 7: Clean RLS — drop all, re-add simply
-- ============================================
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

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- families: owner only
CREATE POLICY "families_owner_all" ON public.families
FOR ALL USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- profiles: own row only
CREATE POLICY "profiles_own_all" ON public.profiles
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- family_members: families owner can insert/manage
CREATE POLICY "members_owner_all" ON public.family_members
FOR ALL
USING (family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid()))
WITH CHECK (family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid()));

-- family_members: member can read their own record
CREATE POLICY "members_self_read" ON public.family_members
FOR SELECT USING (user_id = auth.uid());

-- family_members: member can read others in same family (via profile)
CREATE POLICY "members_family_read" ON public.family_members
FOR SELECT USING (
  family_id IN (
    SELECT family_id FROM public.profiles 
    WHERE user_id = auth.uid() AND family_id IS NOT NULL
  )
);

-- activities: family members can manage
CREATE POLICY "activities_family_all" ON public.activities
FOR ALL
USING (
  family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  OR family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid() AND family_id IS NOT NULL)
)
WITH CHECK (
  family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  OR family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid() AND family_id IS NOT NULL)
);
