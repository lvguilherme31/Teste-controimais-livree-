-- Migration to fix RLS permissions for Orcamentos and Attachments
-- This ensures authenticated users can perform CRUD operations on budgets and upload files

-- 1. Ensure 'pendente' status exists in the enum
DO $$
BEGIN
    ALTER TYPE status_orcamento ADD VALUE IF NOT EXISTS 'pendente';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Enable RLS on tables
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anexos_orcamentos ENABLE ROW LEVEL SECURITY;

-- 3. Clean up existing policies to avoid conflicts
-- Drop policies on 'orcamentos'
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'orcamentos'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.orcamentos', pol.policyname);
    END LOOP;
END $$;

-- Drop policies on 'anexos_orcamentos'
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'anexos_orcamentos'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.anexos_orcamentos', pol.policyname);
    END LOOP;
END $$;

-- 4. Create new permissive policies for authenticated users on Tables
CREATE POLICY "authenticated_manage_orcamentos"
ON public.orcamentos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_manage_anexos_orcamentos"
ON public.anexos_orcamentos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Storage Bucket Configuration
-- Ensure bucket 'orcamentos' exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('orcamentos', 'orcamentos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 6. Clean up existing policies on Storage
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        -- Check if policy is related to orcamentos bucket by name convention or just drop specific known ones
        -- Since we can't easily filter by definition in this loop, we will drop the known policies created by previous migrations
        IF pol.policyname LIKE '%orcamentos%' THEN
            EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
        END IF;
    END LOOP;
END $$;

-- Explicitly drop known policy names to be safe
DROP POLICY IF EXISTS "Authenticated users can upload files orcamentos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view files orcamentos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files orcamentos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files orcamentos" ON storage.objects;
DROP POLICY IF EXISTS "orcamentos_bucket_insert_policy_final" ON storage.objects;
DROP POLICY IF EXISTS "orcamentos_bucket_select_policy_final" ON storage.objects;
DROP POLICY IF EXISTS "orcamentos_bucket_update_policy_final" ON storage.objects;
DROP POLICY IF EXISTS "orcamentos_bucket_delete_policy_final" ON storage.objects;

-- 7. Create new Storage Policies
-- Allow authenticated users to upload (INSERT)
CREATE POLICY "orcamentos_storage_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'orcamentos');

-- Allow authenticated users to update (UPDATE)
CREATE POLICY "orcamentos_storage_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'orcamentos');

-- Allow authenticated users to delete (DELETE)
CREATE POLICY "orcamentos_storage_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'orcamentos');

-- Allow public access for SELECT (needed for getPublicUrl to work for image preview)
CREATE POLICY "orcamentos_storage_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'orcamentos');
