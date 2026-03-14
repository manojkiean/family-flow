-- ============================================================
-- Fix posts table: add family_id column + RLS policy
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add family_id to posts if missing
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id);

-- 2. Enable RLS on posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 3. Drop any old posts policies
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'posts'
  )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.posts', r.policyname);
  END LOOP;
END $$;

-- 4. Posts policy: family owner OR family member (via profile) can read/write
CREATE POLICY "posts_family" ON public.posts
FOR ALL
USING (
  family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  OR family_id IN (
    SELECT family_id FROM public.profiles
    WHERE user_id = auth.uid() AND family_id IS NOT NULL
  )
)
WITH CHECK (
  family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  OR family_id IN (
    SELECT family_id FROM public.profiles
    WHERE user_id = auth.uid() AND family_id IS NOT NULL
  )
);
