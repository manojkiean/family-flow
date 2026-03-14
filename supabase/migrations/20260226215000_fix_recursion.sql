-- =========================================================
-- COMPLETE RLS RESET — fixes "infinite recursion" error
-- Run this in Supabase SQL Editor
-- =========================================================

-- 1. Drop ALL existing policies on affected tables
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('families','profiles','family_members','activities','posts'))
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- =========================================================
-- FAMILIES — simple owner-based policies, NO subquery to other tables
-- =========================================================
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_manage_families"
ON public.families FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- =========================================================
-- PROFILES — simple user_id-based policies, NO subquery to families
-- =========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_profile"
ON public.profiles FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =========================================================
-- FAMILY_MEMBERS — owner can manage via families table lookup
-- Using auth.uid() directly without circular references
-- =========================================================
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Owners of the family can do anything
CREATE POLICY "owners_manage_members"
ON public.family_members FOR ALL
USING (
  family_id IN (
    SELECT id FROM public.families WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  family_id IN (
    SELECT id FROM public.families WHERE owner_id = auth.uid()
  )
);

-- Members can see other members in their family (via profiles.family_id)
CREATE POLICY "members_view_family"
ON public.family_members FOR SELECT
USING (
  user_id = auth.uid()
  OR family_id IN (
    SELECT family_id FROM public.profiles WHERE user_id = auth.uid() AND family_id IS NOT NULL
  )
);

-- =========================================================
-- ACTIVITIES — family-based read/write
-- =========================================================
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_manage_activities"
ON public.activities FOR ALL
USING (
  family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  OR family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid() AND family_id IS NOT NULL)
)
WITH CHECK (
  family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  OR family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid() AND family_id IS NOT NULL)
);

-- =========================================================
-- POSTS — same family-scoped access
-- =========================================================
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_manage_posts"
ON public.posts FOR ALL
USING (
  family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  OR family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid() AND family_id IS NOT NULL)
)
WITH CHECK (
  family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  OR family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid() AND family_id IS NOT NULL)
);
