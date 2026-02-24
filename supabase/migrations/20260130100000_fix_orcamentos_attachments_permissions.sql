-- Migration to fix RLS policies for Orcamentos feature (Storage and Tables)
-- Ensures authenticated users can upload attachments and manage them.

-- 1. Ensure 'orcamentos' bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('orcamentos', 'orcamentos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies on storage.objects for 'orcamentos' bucket to start fresh
-- We attempt to drop policies by various names used in past/potential migrations
DROP POLICY IF EXISTS "Orcamentos Insert" ON storage.objects;
DROP POLICY IF EXISTS "Orcamentos Select" ON storage.objects;
DROP POLICY IF EXISTS "Orcamentos Update" ON storage.objects;
DROP POLICY IF EXISTS "Orcamentos Delete" ON storage.objects;
DROP POLICY IF EXISTS "storage_orcamentos_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_orcamentos_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_orcamentos_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_orcamentos_delete" ON storage.objects;
DROP POLICY IF EXISTS "policy_storage_orcamentos_insert" ON storage.objects;
DROP POLICY IF EXISTS "policy_storage_orcamentos_select" ON storage.objects;
DROP POLICY IF EXISTS "policy_storage_orcamentos_update" ON storage.objects;
DROP POLICY IF EXISTS "policy_storage_orcamentos_delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files orcamentos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view files orcamentos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files orcamentos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files orcamentos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Orcamentos Select" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Orcamentos Insert" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Orcamentos Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Orcamentos Delete" ON storage.objects;

-- 3. Create new policies for storage.objects for 'orcamentos' bucket
-- Allow authenticated users to upload (INSERT)
CREATE POLICY "policy_storage_orcamentos_insert_final"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'orcamentos');

-- Allow public access for SELECT (needed for viewing attachments)
CREATE POLICY "policy_storage_orcamentos_select_final"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'orcamentos');

-- Allow authenticated users to update their files
CREATE POLICY "policy_storage_orcamentos_update_final"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'orcamentos');

-- Allow authenticated users to delete files
CREATE POLICY "policy_storage_orcamentos_delete_final"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'orcamentos');


-- 4. Enable RLS on 'anexos_orcamentos' table
ALTER TABLE public.anexos_orcamentos ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies on 'anexos_orcamentos' table
DROP POLICY IF EXISTS "Anexos Orcamentos Insert" ON public.anexos_orcamentos;
DROP POLICY IF EXISTS "Anexos Orcamentos Select" ON public.anexos_orcamentos;
DROP POLICY IF EXISTS "Anexos Orcamentos Update" ON public.anexos_orcamentos;
DROP POLICY IF EXISTS "Anexos Orcamentos Delete" ON public.anexos_orcamentos;
DROP POLICY IF EXISTS "anexos_orcamentos_select" ON public.anexos_orcamentos;
DROP POLICY IF EXISTS "anexos_orcamentos_insert" ON public.anexos_orcamentos;
DROP POLICY IF EXISTS "anexos_orcamentos_update" ON public.anexos_orcamentos;
DROP POLICY IF EXISTS "anexos_orcamentos_delete" ON public.anexos_orcamentos;
DROP POLICY IF EXISTS "policy_anexos_orcamentos_select" ON public.anexos_orcamentos;
DROP POLICY IF EXISTS "policy_anexos_orcamentos_insert" ON public.anexos_orcamentos;
DROP POLICY IF EXISTS "policy_anexos_orcamentos_update" ON public.anexos_orcamentos;
DROP POLICY IF EXISTS "policy_anexos_orcamentos_delete" ON public.anexos_orcamentos;
DROP POLICY IF EXISTS "Authenticated users can select anexos_orcamentos" ON public.anexos_orcamentos;
DROP POLICY IF EXISTS "Authenticated users can insert anexos_orcamentos" ON public.anexos_orcamentos;
DROP POLICY IF EXISTS "Authenticated users can update anexos_orcamentos" ON public.anexos_orcamentos;
DROP POLICY IF EXISTS "Authenticated users can delete anexos_orcamentos" ON public.anexos_orcamentos;

-- 6. Create new permissive policy for 'anexos_orcamentos' table
-- Using FOR ALL to cover SELECT, INSERT, UPDATE, DELETE for authenticated users
CREATE POLICY "policy_anexos_orcamentos_all_final"
ON public.anexos_orcamentos FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
