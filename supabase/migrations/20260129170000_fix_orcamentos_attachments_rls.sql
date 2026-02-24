-- Migration to fix RLS policies for Orcamentos feature (Storage and Tables)
-- Fixes "new row violates row-level security policy" errors during upload and save.

-- 1. Storage Configuration: Ensure 'orcamentos' bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('orcamentos', 'orcamentos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Storage Policies for 'orcamentos' bucket
-- Drop potentially conflicting or duplicate policies from previous migrations to ensure a clean state
DO $$
BEGIN
    DROP POLICY IF EXISTS "Orcamentos Insert" ON storage.objects;
    DROP POLICY IF EXISTS "Orcamentos Select" ON storage.objects;
    DROP POLICY IF EXISTS "Orcamentos Update" ON storage.objects;
    DROP POLICY IF EXISTS "Orcamentos Delete" ON storage.objects;
    DROP POLICY IF EXISTS "storage_orcamentos_select" ON storage.objects;
    DROP POLICY IF EXISTS "storage_orcamentos_insert" ON storage.objects;
    DROP POLICY IF EXISTS "storage_orcamentos_update" ON storage.objects;
    DROP POLICY IF EXISTS "storage_orcamentos_delete" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload files orcamentos" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can view files orcamentos" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can update files orcamentos" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can delete files orcamentos" ON storage.objects;
    DROP POLICY IF EXISTS "Public Access Orcamentos Select" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Orcamentos Insert" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Orcamentos Update" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Orcamentos Delete" ON storage.objects;
END $$;

-- Create new robust policies for storage
-- Allow authenticated users to upload (INSERT)
CREATE POLICY "policy_storage_orcamentos_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'orcamentos');

-- Allow public access for SELECT to ensure simple links work (getPublicUrl)
CREATE POLICY "policy_storage_orcamentos_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'orcamentos');

-- Allow authenticated users to update their files (or all files in the bucket for simplicity)
CREATE POLICY "policy_storage_orcamentos_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'orcamentos');

-- Allow authenticated users to delete files
CREATE POLICY "policy_storage_orcamentos_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'orcamentos');


-- 3. Table Policies for 'anexos_orcamentos'
ALTER TABLE public.anexos_orcamentos ENABLE ROW LEVEL SECURITY;

-- Clean up old policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Anexos Orcamentos Insert" ON public.anexos_orcamentos;
    DROP POLICY IF EXISTS "Anexos Orcamentos Select" ON public.anexos_orcamentos;
    DROP POLICY IF EXISTS "Anexos Orcamentos Update" ON public.anexos_orcamentos;
    DROP POLICY IF EXISTS "Anexos Orcamentos Delete" ON public.anexos_orcamentos;
    DROP POLICY IF EXISTS "anexos_orcamentos_select" ON public.anexos_orcamentos;
    DROP POLICY IF EXISTS "anexos_orcamentos_insert" ON public.anexos_orcamentos;
    DROP POLICY IF EXISTS "anexos_orcamentos_update" ON public.anexos_orcamentos;
    DROP POLICY IF EXISTS "anexos_orcamentos_delete" ON public.anexos_orcamentos;
    DROP POLICY IF EXISTS "Authenticated users can select anexos_orcamentos" ON public.anexos_orcamentos;
    DROP POLICY IF EXISTS "Authenticated users can insert anexos_orcamentos" ON public.anexos_orcamentos;
    DROP POLICY IF EXISTS "Authenticated users can update anexos_orcamentos" ON public.anexos_orcamentos;
    DROP POLICY IF EXISTS "Authenticated users can delete anexos_orcamentos" ON public.anexos_orcamentos;
END $$;

-- Create new policies
CREATE POLICY "policy_anexos_orcamentos_select"
ON public.anexos_orcamentos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "policy_anexos_orcamentos_insert"
ON public.anexos_orcamentos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "policy_anexos_orcamentos_update"
ON public.anexos_orcamentos FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "policy_anexos_orcamentos_delete"
ON public.anexos_orcamentos FOR DELETE
TO authenticated
USING (true);


-- 4. Table Policies for 'orcamentos' (Ensuring main table is also accessible)
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

-- Clean up old policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Orcamentos Table Insert" ON public.orcamentos;
    DROP POLICY IF EXISTS "Orcamentos Table Select" ON public.orcamentos;
    DROP POLICY IF EXISTS "Orcamentos Table Update" ON public.orcamentos;
    DROP POLICY IF EXISTS "Orcamentos Table Delete" ON public.orcamentos;
    DROP POLICY IF EXISTS "orcamentos_select" ON public.orcamentos;
    DROP POLICY IF EXISTS "orcamentos_insert" ON public.orcamentos;
    DROP POLICY IF EXISTS "orcamentos_update" ON public.orcamentos;
    DROP POLICY IF EXISTS "orcamentos_delete" ON public.orcamentos;
    DROP POLICY IF EXISTS "Authenticated users can select orcamentos" ON public.orcamentos;
    DROP POLICY IF EXISTS "Authenticated users can insert orcamentos" ON public.orcamentos;
    DROP POLICY IF EXISTS "Authenticated users can update orcamentos" ON public.orcamentos;
    DROP POLICY IF EXISTS "Authenticated users can delete orcamentos" ON public.orcamentos;
END $$;

-- Create new policies
CREATE POLICY "policy_orcamentos_select"
ON public.orcamentos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "policy_orcamentos_insert"
ON public.orcamentos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "policy_orcamentos_update"
ON public.orcamentos FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "policy_orcamentos_delete"
ON public.orcamentos FOR DELETE
TO authenticated
USING (true);
