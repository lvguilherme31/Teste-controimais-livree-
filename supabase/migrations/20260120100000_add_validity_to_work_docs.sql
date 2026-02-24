-- Migration to add validity date to work documents and storage setup

-- 1. Add data_validade to documentos_obras
ALTER TABLE public.documentos_obras ADD COLUMN IF NOT EXISTS data_validade DATE;

-- 2. Setup Storage Bucket (Try to insert if not exists - dependent on permissions)
INSERT INTO storage.buckets (id, name, public)
VALUES ('crm-docs', 'crm-docs', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies
CREATE POLICY "Authenticated users can upload docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'crm-docs');

CREATE POLICY "Authenticated users can select docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'crm-docs');

CREATE POLICY "Authenticated users can update docs"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'crm-docs');

CREATE POLICY "Authenticated users can delete docs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'crm-docs');
