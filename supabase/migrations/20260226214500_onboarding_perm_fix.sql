-- 1. FIX FAMILIES POLICIES
DROP POLICY IF EXISTS "Users can create families" ON public.families;
DROP POLICY IF EXISTS "Users can view their families" ON public.families;
DROP POLICY IF EXISTS "Owners can update their families" ON public.families;

CREATE POLICY "Users can create families" 
ON public.families FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can view their families" 
ON public.families FOR SELECT 
USING (
    owner_id = auth.uid() OR 
    id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their families" 
ON public.families FOR UPDATE 
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- 2. FIX PROFILES POLICIES
-- We need to ensure users can always manage their own profile record
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Family members can view profiles" ON public.profiles;

CREATE POLICY "Users can manage their own profile" 
ON public.profiles FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Family members can view other family profiles"
ON public.profiles FOR SELECT
USING (family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid()));

-- 3. FIX FAMILY_MEMBERS POLICIES
DROP POLICY IF EXISTS "Users can view their own family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can insert their own family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can update their own family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can delete their own family members" ON public.family_members;
DROP POLICY IF EXISTS "Family members can manage family members" ON public.family_members;
DROP POLICY IF EXISTS "Family members can view family members" ON public.family_members;

-- Allow users to see members in their family
CREATE POLICY "Family members can view family members" 
ON public.family_members FOR SELECT 
USING (
    family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid()) OR
    user_id = auth.uid()
);

-- Allow owners to manage members in their family
CREATE POLICY "Owners can manage family members" 
ON public.family_members FOR ALL 
USING (family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid()))
WITH CHECK (family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid()));

-- fallback for when profile is not yet fully linked during onboarding
CREATE POLICY "Users can add their own member record"
ON public.family_members FOR INSERT
WITH CHECK (auth.uid() = user_id OR family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid()));
