-- Ensure crm-docs bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('crm-docs', 'crm-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket (if not already enabled by default)
-- Note: In Supabase, RLS is on storage.objects.

-- Create policies for the bucket
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload files 170000"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'crm-docs');

-- Allow authenticated users to view
CREATE POLICY "Authenticated users can view files 170000"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'crm-docs');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update files 170000"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'crm-docs');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete files 170000"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'crm-docs');

-- Ensure columns in works table are nullable for flexibility
ALTER TABLE public.obras ALTER COLUMN cnpj DROP NOT NULL;
ALTER TABLE public.obras ALTER COLUMN data_inicio DROP NOT NULL;
ALTER TABLE public.obras ALTER COLUMN previsao_termino DROP NOT NULL;
ALTER TABLE public.obras ALTER COLUMN estado DROP NOT NULL;
ALTER TABLE public.obras ALTER COLUMN cliente DROP NOT NULL;

