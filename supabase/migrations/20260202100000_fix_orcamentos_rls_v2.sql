-- Fix RLS policies for Orcamentos feature (Storage and Tables)
-- Fixes "new row violates row-level security policy" errors.

-- 1. Ensure 'orcamentos' bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('orcamentos', 'orcamentos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Storage Policies for 'orcamentos' bucket
-- Drop potentially conflicting policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Orcamentos Insert" ON storage.objects;
    DROP POLICY IF EXISTS "Orcamentos Select" ON storage.objects;
    DROP POLICY IF EXISTS "Orcamentos Update" ON storage.objects;
    DROP POLICY IF EXISTS "Orcamentos Delete" ON storage.objects;
    DROP POLICY IF EXISTS "orcamentos_storage_insert_policy" ON storage.objects;
    DROP POLICY IF EXISTS "orcamentos_storage_select_policy" ON storage.objects;
    DROP POLICY IF EXISTS "orcamentos_storage_update_policy" ON storage.objects;
    DROP POLICY IF EXISTS "orcamentos_storage_delete_policy" ON storage.objects;
    DROP POLICY IF EXISTS "orcamentos_storage_insert_policy_v2" ON storage.objects;
    DROP POLICY IF EXISTS "orcamentos_storage_select_policy_v2" ON storage.objects;
    DROP POLICY IF EXISTS "orcamentos_storage_update_policy_v2" ON storage.objects;
    DROP POLICY IF EXISTS "orcamentos_storage_delete_policy_v2" ON storage.objects;
END $$;

-- Create new policies for storage
-- Allow authenticated users to upload (INSERT)
CREATE POLICY "orcamentos_storage_insert_policy_v2"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'orcamentos');

-- Allow public access for SELECT (needed for viewing attachments via public URL)
CREATE POLICY "orcamentos_storage_select_policy_v2"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'orcamentos');

-- Allow authenticated users to update their files
CREATE POLICY "orcamentos_storage_update_policy_v2"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'orcamentos');

-- Allow authenticated users to delete files
CREATE POLICY "orcamentos_storage_delete_policy_v2"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'orcamentos');


-- 3. Table Policies for 'anexos_orcamentos'
ALTER TABLE public.anexos_orcamentos ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
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

-- Create ALL policy for authenticated users (Select, Insert, Update, Delete)
CREATE POLICY "anexos_orcamentos_all_policy_v2"
ON public.anexos_orcamentos FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- 4. Table Policies for 'orcamentos'
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
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

-- Create ALL policy for authenticated users (Select, Insert, Update, Delete)
CREATE POLICY "orcamentos_all_policy_v2"
ON public.orcamentos FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
