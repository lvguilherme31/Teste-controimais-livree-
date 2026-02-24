-- Migration to fix RLS policies for Orcamentos feature (Storage and Tables)
-- Ensures authenticated users can upload attachments and manage them without RLS errors.
-- This migration cleans up any conflicting policies from previous attempts.

-- 1. Ensure 'orcamentos' bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('orcamentos', 'orcamentos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop all potential existing policies on storage.objects for 'orcamentos' to start fresh
-- We loop through policies that match naming patterns used for orcamentos to ensure a clean slate
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
        AND (
            policyname ILIKE '%orcamento%'
            OR policyname ILIKE '%orcamentos%'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- 3. Create new definitive policies for storage.objects for 'orcamentos' bucket
-- Allow authenticated users to upload (INSERT)
CREATE POLICY "orcamentos_storage_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'orcamentos');

-- Allow public access for SELECT (needed for viewing attachments)
CREATE POLICY "orcamentos_storage_select_policy"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'orcamentos');

-- Allow authenticated users to update their files
CREATE POLICY "orcamentos_storage_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'orcamentos');

-- Allow authenticated users to delete files
CREATE POLICY "orcamentos_storage_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'orcamentos');


-- 4. Fix Table RLS for 'anexos_orcamentos'
ALTER TABLE public.anexos_orcamentos ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for anexos_orcamentos
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

-- Create permissive policy for authenticated users for anexos_orcamentos
CREATE POLICY "anexos_orcamentos_all_policy"
ON public.anexos_orcamentos FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- 5. Fix Table RLS for 'orcamentos'
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for orcamentos
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

-- Create permissive policy for authenticated users for orcamentos
CREATE POLICY "orcamentos_all_policy"
ON public.orcamentos FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
