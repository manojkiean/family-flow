
-- Create family_members table
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'parent' CHECK (role IN ('parent', 'child', 'caregiver')),
  avatar TEXT NOT NULL DEFAULT '👤',
  color TEXT NOT NULL DEFAULT 'hsl(210 60% 50%)',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activities table
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'personal' CHECK (category IN ('school', 'sports', 'health', 'home', 'personal')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  recurrence TEXT NOT NULL DEFAULT 'once' CHECK (recurrence IN ('once', 'daily', 'weekly', 'monthly')),
  assigned_to TEXT[] NOT NULL DEFAULT '{}',
  assigned_children TEXT[] NOT NULL DEFAULT '{}',
  location TEXT,
  notes TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public access for now, no auth)
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth required)
CREATE POLICY "Allow public read family_members" ON public.family_members FOR SELECT USING (true);
CREATE POLICY "Allow public insert family_members" ON public.family_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update family_members" ON public.family_members FOR UPDATE USING (true);
CREATE POLICY "Allow public delete family_members" ON public.family_members FOR DELETE USING (true);

CREATE POLICY "Allow public read activities" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Allow public insert activities" ON public.activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update activities" ON public.activities FOR UPDATE USING (true);
CREATE POLICY "Allow public delete activities" ON public.activities FOR DELETE USING (true);

-- Trigger for updated_at on activities
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed family members
INSERT INTO public.family_members (name, role, avatar, color) VALUES
  ('Sarah', 'parent', '👩', 'hsl(15 85% 60%)'),
  ('Michael', 'parent', '👨', 'hsl(210 60% 50%)'),
  ('Emma', 'child', '👧', 'hsl(340 70% 60%)'),
  ('Lucas', 'child', '👦', 'hsl(160 50% 45%)');
