-- Migration to definitively fix RLS policies for Orcamentos and Attachments v7
-- Ensures full access for authenticated users to resolve "new row violates row-level security policy" errors.

-- 1. Enable RLS on tables (Idempotent)
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anexos_orcamentos ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to ensure clean state and avoid conflicts
-- We use dynamic SQL to iterate and drop policies to catch any legacy policy names
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
-- Allow ALL operations (INSERT, SELECT, UPDATE, DELETE) for authenticated users on 'orcamentos'
CREATE POLICY "policy_orcamentos_all_v7"
ON public.orcamentos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow ALL operations for authenticated users on 'anexos_orcamentos'
CREATE POLICY "policy_anexos_orcamentos_all_v7"
ON public.anexos_orcamentos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Grant necessary permissions
GRANT ALL ON TABLE public.orcamentos TO authenticated;
GRANT ALL ON TABLE public.anexos_orcamentos TO authenticated;

-- Ensure sequence permissions if any (usually UUIDs are used, but for safety)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 5. Fix Storage Permissions for 'orcamentos' bucket
-- Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('orcamentos', 'orcamentos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing storage policies for this bucket to avoid conflicts
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        -- Drop policies specifically targeting orcamentos bucket
        IF pol.policyname ILIKE '%orcamentos%' THEN
            EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
        END IF;
    END LOOP;
END $$;

-- Create storage policies
-- Authenticated users can INSERT files
CREATE POLICY "orcamentos_storage_insert_v7"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'orcamentos');

-- Authenticated users can UPDATE files
CREATE POLICY "orcamentos_storage_update_v7"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'orcamentos');

-- Authenticated users can DELETE files
CREATE POLICY "orcamentos_storage_delete_v7"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'orcamentos');

-- PUBLIC can SELECT files (Read-only access for anyone with the URL)
CREATE POLICY "orcamentos_storage_select_public_v7"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'orcamentos');
