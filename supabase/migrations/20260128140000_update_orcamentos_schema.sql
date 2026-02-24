-- Add CNPJ column to orcamentos
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS cnpj text;

-- Add 'pendente' to status_orcamento enum if it doesn't exist
-- Note: ALTER TYPE ... ADD VALUE cannot be executed inside a transaction block depending on Postgres version/config.
-- Supabase migrations usually handle this, but if it fails, it might be due to transaction wrapping.
-- We will try to add it.
DO $$
BEGIN
    ALTER TYPE status_orcamento ADD VALUE IF NOT EXISTS 'pendente';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create bucket for orcamentos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('orcamentos', 'orcamentos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policies for orcamentos bucket
CREATE POLICY "Authenticated users can upload files orcamentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'orcamentos');

CREATE POLICY "Authenticated users can view files orcamentos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'orcamentos');

CREATE POLICY "Authenticated users can update files orcamentos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'orcamentos');

CREATE POLICY "Authenticated users can delete files orcamentos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'orcamentos');
