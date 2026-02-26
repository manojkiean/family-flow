-- 1. Create families table
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    owner_id UUID REFERENCES auth.users(id)
);

-- 2. Add family_id to profiles, family_members, and activities
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id);
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id);
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id);

-- 3. Migration: Create a family for every existing profile (if they don't have one)
-- Each existing "parent" (profile) gets a family created for them
INSERT INTO public.families (name, owner_id)
SELECT COALESCE(family_name, name || '''s Family', 'Our Family'), user_id
FROM public.profiles
WHERE family_id IS NULL;

-- Link those profiles back to the new families
UPDATE public.profiles p
SET family_id = f.id
FROM public.families f
WHERE p.user_id = f.owner_id AND p.family_id IS NULL;

-- Link existing family_members and activities to the owner's family
UPDATE public.family_members fm
SET family_id = p.family_id
FROM public.profiles p
WHERE fm.user_id = p.user_id AND fm.family_id IS NULL;

UPDATE public.activities a
SET family_id = p.family_id
FROM public.profiles p
WHERE a.user_id = p.user_id AND a.family_id IS NULL;

-- 4. Enable RLS and setup policies based on family_id
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (assuming standard user_id based ones)
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can manage their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can view their own family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can manage their own family members" ON public.family_members;

-- Generic Family Policy: Users can see/manage everything in their family
CREATE POLICY "Family members can view family activities" 
ON public.activities FOR SELECT 
USING (family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Family members can manage family activities" 
ON public.activities FOR ALL 
USING (family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Family members can view family members" 
ON public.family_members FOR SELECT 
USING (family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Family members can manage family members" 
ON public.family_members FOR ALL 
USING (family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Family members can view profiles" 
ON public.profiles FOR SELECT 
USING (family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid()));
