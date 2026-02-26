-- Create the posts table for Family Wall
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    image_url TEXT,
    author_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Policies for posts
CREATE POLICY "Family members can view all posts in their family" 
ON public.posts FOR SELECT 
USING (family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Family members can create posts in their family" 
ON public.posts FOR INSERT 
WITH CHECK (family_id IN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Authors can update their own posts" 
ON public.posts FOR UPDATE 
USING (author_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid()));

CREATE POLICY "Authors can delete their own posts" 
ON public.posts FOR DELETE 
USING (author_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid()));

-- Parents can delete any post in their family
CREATE POLICY "Parents can delete any post in their family" 
ON public.posts FOR DELETE 
USING (
    family_id IN (
        SELECT p.family_id 
        FROM public.profiles p 
        JOIN public.family_members fm ON fm.user_id = p.user_id
        WHERE p.user_id = auth.uid() AND fm.role = 'parent'
    )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_post_updated
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
