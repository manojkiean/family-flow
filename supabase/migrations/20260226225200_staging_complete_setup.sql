-- ============================================================
-- FAMILY BOARD — COMPLETE STAGING DATABASE SETUP
-- Run this entire script in Supabase SQL Editor on a fresh project.
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. EXTENSIONS
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- uuid_generate_v4() fallback


-- ─────────────────────────────────────────────────────────────
-- 1. TABLES
-- ─────────────────────────────────────────────────────────────

-- 1a. families
CREATE TABLE IF NOT EXISTS public.families (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  owner_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1b. profiles  (one row per auth user)
CREATE TABLE IF NOT EXISTS public.profiles (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id                  UUID REFERENCES public.families(id) ON DELETE SET NULL,
  name                       TEXT,
  family_name                TEXT,
  email                      TEXT,
  -- notification preferences
  push_notifications         BOOLEAN DEFAULT false,
  email_notifications        BOOLEAN DEFAULT true,
  reminder_time              TEXT DEFAULT '30min',
  timezone                   TEXT DEFAULT 'UTC',
  week_starts_on             TEXT DEFAULT 'sunday',
  require_pin_for_children   BOOLEAN DEFAULT false,
  activity_history_retention TEXT DEFAULT '6months',
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_user_id_key UNIQUE (user_id)
);

-- 1c. family_members  (parents, children, or any household member)
CREATE TABLE IF NOT EXISTS public.family_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID REFERENCES public.families(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- NULL for children / non-auth members
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'parent',  -- 'parent' | 'child' | 'guardian'
  email      TEXT,
  image_url  TEXT,
  color      TEXT NOT NULL DEFAULT 'hsl(210 60% 50%)',
  pin        TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1d. activities
CREATE TABLE IF NOT EXISTS public.activities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id         UUID REFERENCES public.families(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- creator's auth uid
  created_by        TEXT,                                                -- family_member.id of creator
  title             TEXT NOT NULL,
  description       TEXT,
  category          TEXT NOT NULL DEFAULT 'personal',  -- school | sports | health | home | personal
  start_time        TIMESTAMPTZ NOT NULL,
  end_time          TIMESTAMPTZ,
  recurrence        TEXT NOT NULL DEFAULT 'once',      -- once | daily | weekly | monthly
  assigned_to       TEXT[] NOT NULL DEFAULT '{}',      -- array of family_member.id (parents)
  assigned_children TEXT[] NOT NULL DEFAULT '{}',      -- array of family_member.id (children)
  location          TEXT,
  notes             TEXT,
  priority          TEXT NOT NULL DEFAULT 'medium',    -- low | medium | high
  completed         BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1e. posts  (family wall / feed)
CREATE TABLE IF NOT EXISTS public.posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID REFERENCES public.families(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  content    TEXT NOT NULL,
  image_url  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ─────────────────────────────────────────────────────────────
-- 2. AUTO-UPDATE updated_at TRIGGER
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach trigger to tables that have updated_at
DO $$ BEGIN
  -- profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_profiles_updated_at'
    AND tgrelid = 'public.profiles'::regclass
  ) THEN
    CREATE TRIGGER set_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;

  -- activities
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_activities_updated_at'
    AND tgrelid = 'public.activities'::regclass
  ) THEN
    CREATE TRIGGER set_activities_updated_at
      BEFORE UPDATE ON public.activities
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;

  -- posts
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_posts_updated_at'
    AND tgrelid = 'public.posts'::regclass
  ) THEN
    CREATE TRIGGER set_posts_updated_at
      BEFORE UPDATE ON public.posts
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────
-- 3. INDEXES  (performance for common queries)
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_user_id        ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_family_id      ON public.profiles(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family   ON public.family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user     ON public.family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_family       ON public.activities(family_id);
CREATE INDEX IF NOT EXISTS idx_activities_start_time   ON public.activities(start_time);
CREATE INDEX IF NOT EXISTS idx_posts_family            ON public.posts(family_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at        ON public.posts(created_at DESC);


-- ─────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.families       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts          ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────
-- 5. RLS POLICIES
-- Drop existing policies first (idempotent re-run safety)
-- ─────────────────────────────────────────────────────────────

DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('families','profiles','family_members','activities','posts')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ── families ─────────────────────────────────────────────────
-- The owner created the family; only they can manage it.
CREATE POLICY "families_owner_all" ON public.families
  FOR ALL
  USING   (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Family members (via profile) can read their own family's row.
CREATE POLICY "families_member_read" ON public.families
  FOR SELECT
  USING (
    id IN (
      SELECT family_id FROM public.profiles
      WHERE user_id = auth.uid() AND family_id IS NOT NULL
    )
  );

-- ── profiles ─────────────────────────────────────────────────
-- Users can read & write their own profile only.
CREATE POLICY "profiles_own_all" ON public.profiles
  FOR ALL
  USING   (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── family_members ───────────────────────────────────────────
-- Family owner has full control over all members in their family.
CREATE POLICY "members_owner_all" ON public.family_members
  FOR ALL
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

-- Any authenticated user whose profile points to this family can read members.
CREATE POLICY "members_family_read" ON public.family_members
  FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.profiles
      WHERE user_id = auth.uid() AND family_id IS NOT NULL
    )
  );

-- A linked user can read their own member row (before profile is set up).
CREATE POLICY "members_self_read" ON public.family_members
  FOR SELECT
  USING (user_id = auth.uid());

-- ── activities ───────────────────────────────────────────────
-- Family owner + any family member (via profile) can read & write activities.
CREATE POLICY "activities_family_all" ON public.activities
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

-- ── posts ────────────────────────────────────────────────────
-- Same rule as activities: owner + family member can read & write.
CREATE POLICY "posts_family_all" ON public.posts
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


-- ─────────────────────────────────────────────────────────────
-- 6. STORAGE BUCKET  (for post images & avatars)
-- ─────────────────────────────────────────────────────────────
-- Run this block only if the bucket doesn't already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'family-app'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('family-app', 'family-app', true);
  END IF;
END $$;

-- Storage RLS: any authenticated user can upload & read
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname IN ('storage_family_app_select','storage_family_app_insert','storage_family_app_delete')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "storage_family_app_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'family-app');

CREATE POLICY "storage_family_app_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'family-app' AND auth.role() = 'authenticated');

CREATE POLICY "storage_family_app_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'family-app' AND auth.uid() = owner);


-- ─────────────────────────────────────────────────────────────
-- 7. REALTIME  (enable for the tables the app subscribes to)
-- ─────────────────────────────────────────────────────────────
-- These are safe no-ops if already published.
ALTER PUBLICATION supabase_realtime ADD TABLE public.family_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;


-- ─────────────────────────────────────────────────────────────
-- DONE — schema is ready for Family Board staging.
-- ─────────────────────────────────────────────────────────────
