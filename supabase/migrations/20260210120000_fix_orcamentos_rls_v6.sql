-- Migration to definitively fix RLS policies for Orcamentos and Attachments
-- This migration ensures that authenticated users have full CRUD access.

-- 1. Enable RLS on tables (idempotent)
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anexos_orcamentos ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to ensure clean state
-- We use a DO block to iterate and drop policies dynamically to catch any named policy
DO $$
DECLARE
    pol record;
BEGIN
    -- Drop policies for orcamentos
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'orcamentos'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.orcamentos', pol.policyname);
    END LOOP;

    -- Drop policies for anexos_orcamentos
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'anexos_orcamentos'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.anexos_orcamentos', pol.policyname);
    END LOOP;
END $$;

-- 3. Create permissive policies for authenticated users
-- For orcamentos
CREATE POLICY "authenticated_full_access_orcamentos"
ON public.orcamentos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- For anexos_orcamentos
CREATE POLICY "authenticated_full_access_anexos_orcamentos"
ON public.anexos_orcamentos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Grant necessary permissions
GRANT ALL ON TABLE public.orcamentos TO authenticated;
GRANT ALL ON TABLE public.anexos_orcamentos TO authenticated;

-- 5. Fix Storage Permissions for 'orcamentos' bucket
-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('orcamentos', 'orcamentos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing storage policies for this bucket
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        -- Broad match to catch previous attempts related to orcamentos
        IF pol.policyname ILIKE '%orcamentos%' THEN
            EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
        END IF;
    END LOOP;
END $$;

-- Create storage policies
-- Insert
CREATE POLICY "orcamentos_storage_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'orcamentos');

-- Update
CREATE POLICY "orcamentos_storage_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'orcamentos');

-- Delete
CREATE POLICY "orcamentos_storage_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'orcamentos');

-- Select (Public read access for images)
CREATE POLICY "orcamentos_storage_select_policy"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'orcamentos');
