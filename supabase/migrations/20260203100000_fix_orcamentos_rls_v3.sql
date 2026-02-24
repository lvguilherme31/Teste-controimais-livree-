-- Migration to fix RLS policies for Orcamentos feature (Storage and Tables)
-- Ensures authenticated users can insert, update, select and delete budgets and attachments.

-- 1. Table Policies for 'orcamentos'
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
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
CREATE POLICY "orcamentos_manage_policy_v3"
ON public.orcamentos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- 2. Table Policies for 'anexos_orcamentos'
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
CREATE POLICY "anexos_orcamentos_manage_policy_v3"
ON public.anexos_orcamentos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- 3. Storage Policies for 'orcamentos' bucket
-- Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('orcamentos', 'orcamentos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop potentially conflicting storage policies
DO $$
BEGIN
    -- Drop v2 policies
    DROP POLICY IF EXISTS "orcamentos_storage_insert_policy_v2" ON storage.objects;
    DROP POLICY IF EXISTS "orcamentos_storage_select_policy_v2" ON storage.objects;
    DROP POLICY IF EXISTS "orcamentos_storage_update_policy_v2" ON storage.objects;
    DROP POLICY IF EXISTS "orcamentos_storage_delete_policy_v2" ON storage.objects;
    
    -- Drop v1/original policies if they linger
    DROP POLICY IF EXISTS "orcamentos_storage_insert_policy" ON storage.objects;
    DROP POLICY IF EXISTS "orcamentos_storage_select_policy" ON storage.objects;
    DROP POLICY IF EXISTS "orcamentos_storage_update_policy" ON storage.objects;
    DROP POLICY IF EXISTS "orcamentos_storage_delete_policy" ON storage.objects;

    -- Drop any other named policies for this bucket
    DROP POLICY IF EXISTS "Authenticated users can upload files orcamentos" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can view files orcamentos" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can update files orcamentos" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can delete files orcamentos" ON storage.objects;
END $$;

-- Create definitive policies for storage
-- Allow authenticated users to upload (INSERT)
CREATE POLICY "orcamentos_storage_insert_policy_v3"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'orcamentos');

-- Allow public access for SELECT (needed for viewing attachments)
CREATE POLICY "orcamentos_storage_select_policy_v3"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'orcamentos');

-- Allow authenticated users to update their files
CREATE POLICY "orcamentos_storage_update_policy_v3"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'orcamentos');

-- Allow authenticated users to delete files
CREATE POLICY "orcamentos_storage_delete_policy_v3"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'orcamentos');
