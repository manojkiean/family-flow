-- Enable RLS on families
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- Allow users to create families
CREATE POLICY "Users can create families" 
ON public.families FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Allow users to view families they own or are members of
CREATE POLICY "Users can view their families" 
ON public.families FOR SELECT 
USING (
    owner_id = auth.uid() OR 
    id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
);

-- Allow owners to update their families
CREATE POLICY "Owners can update their families" 
ON public.families FOR UPDATE 
USING (owner_id = auth.uid());

-- Fix profiles policies to allow initial creation and updates
DROP POLICY IF EXISTS "Family members can view profiles" ON public.profiles;
CREATE POLICY "Users can manage their own profile" 
ON public.profiles FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Family members can view profiles" 
ON public.profiles FOR SELECT 
USING (family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid()));

-- Fix family_members to allow the owner to add the first members
DROP POLICY IF EXISTS "Family members can manage family_members" ON public.family_members;
CREATE POLICY "Family members can manage family members" 
ON public.family_members FOR ALL 
USING (
    family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid()) OR
    family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
);
