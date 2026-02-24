-- Migration to fix RLS policies for Orcamentos feature (Storage and Tables)
-- Ensures that authenticated users can INSERT, SELECT, UPDATE, DELETE on orcamentos table.

-- 1. Table Policies for 'orcamentos'
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

-- Dynamic cleanup of all existing policies on 'orcamentos'
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

-- Create permissive policy for authenticated users (Select, Insert, Update, Delete)
CREATE POLICY "orcamentos_manage_policy_final"
ON public.orcamentos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- 2. Table Policies for 'anexos_orcamentos'
ALTER TABLE public.anexos_orcamentos ENABLE ROW LEVEL SECURITY;

-- Dynamic cleanup of all existing policies on 'anexos_orcamentos'
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

-- Create permissive policy for authenticated users (Select, Insert, Update, Delete)
CREATE POLICY "anexos_orcamentos_manage_policy_final"
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

-- Drop existing storage policies for this bucket to ensure clean state
DROP POLICY IF EXISTS "orcamentos_bucket_insert_policy_v5" ON storage.objects;
DROP POLICY IF EXISTS "orcamentos_bucket_select_policy_v5" ON storage.objects;
DROP POLICY IF EXISTS "orcamentos_bucket_update_policy_v5" ON storage.objects;
DROP POLICY IF EXISTS "orcamentos_bucket_delete_policy_v5" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files orcamentos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view files orcamentos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files orcamentos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files orcamentos" ON storage.objects;
DROP POLICY IF EXISTS "policy_storage_orcamentos_insert_final" ON storage.objects;
DROP POLICY IF EXISTS "policy_storage_orcamentos_select_final" ON storage.objects;
DROP POLICY IF EXISTS "policy_storage_orcamentos_update_final" ON storage.objects;
DROP POLICY IF EXISTS "policy_storage_orcamentos_delete_final" ON storage.objects;
DROP POLICY IF EXISTS "orcamentos_bucket_insert_policy_final" ON storage.objects;
DROP POLICY IF EXISTS "orcamentos_bucket_select_policy_final" ON storage.objects;
DROP POLICY IF EXISTS "orcamentos_bucket_update_policy_final" ON storage.objects;
DROP POLICY IF EXISTS "orcamentos_bucket_delete_policy_final" ON storage.objects;

-- Create policies for storage bucket 'orcamentos'
CREATE POLICY "orcamentos_bucket_insert_policy_final"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'orcamentos');

CREATE POLICY "orcamentos_bucket_select_policy_final"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'orcamentos');

CREATE POLICY "orcamentos_bucket_update_policy_final"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'orcamentos');

CREATE POLICY "orcamentos_bucket_delete_policy_final"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'orcamentos');
