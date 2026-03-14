-- DEFINITIVE DATABASE SCHEMA REPAIR
-- This ensures all tables and columns exist for the family architecture

-- 1. Ensure families table
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    owner_id UUID REFERENCES auth.users(id)
);

-- 2. Ensure profiles columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id),
ADD COLUMN IF NOT EXISTS family_name TEXT,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS family_password TEXT DEFAULT 'family123';

-- 3. Ensure family_members columns
ALTER TABLE public.family_members 
ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id),
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS pin TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 4. FIX RLS POLICIES (MOST CRITICAL FOR ONBOARDING)
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Allow creation of the first family hub
DROP POLICY IF EXISTS "Users can create families" ON public.families;
CREATE POLICY "Users can create families" 
ON public.families FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can manage their own families" ON public.families;
CREATE POLICY "Users can manage their own families" 
ON public.families FOR ALL 
USING (owner_id = auth.uid());

-- Allow managing own profile always
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
CREATE POLICY "Users can manage their own profile" 
ON public.profiles FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow owner to add family members
DROP POLICY IF EXISTS "Owners can manage family members" ON public.family_members;
CREATE POLICY "Owners can manage family members" 
ON public.family_members FOR ALL 
USING (family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid()))
WITH CHECK (family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid()));

-- Fallback for first member insertion
DROP POLICY IF EXISTS "Users can add their own member record" ON public.family_members;
CREATE POLICY "Users can add their own member record"
ON public.family_members FOR INSERT
WITH CHECK (auth.uid() = user_id OR family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid()));

-- Allow family members to see each other
DROP POLICY IF EXISTS "Family members can view family members" ON public.family_members;
CREATE POLICY "Family members can view family members" 
ON public.family_members FOR SELECT 
USING (
    family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid()) OR
    owner_id IN (SELECT owner_id FROM public.families WHERE id = family_members.family_id AND owner_id = auth.uid()) OR
    user_id = auth.uid()
);
