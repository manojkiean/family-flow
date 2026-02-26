-- Create a new storage bucket for family member avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('family-app', 'family-app', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read files from the family-app bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'family-app');

-- Allow authenticated users to upload files to the family-app bucket
CREATE POLICY "Authenticated users can upload" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'family-app' AND auth.role() = 'authenticated');

-- Allow users to update and delete their own uploads
CREATE POLICY "Users can update their own uploads" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'family-app' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own uploads" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'family-app' AND auth.uid() = owner);
