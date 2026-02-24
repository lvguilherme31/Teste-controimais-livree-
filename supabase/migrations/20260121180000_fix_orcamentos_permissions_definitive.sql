-- Migration to fix RLS permissions for Orcamentos and Attachments definitively
-- Handles Tables: orcamentos, anexos_orcamentos
-- Handles Storage: orcamentos bucket

-- 1. Ensure 'pendente' status exists in the enum status_orcamento
DO $$
BEGIN
    ALTER TYPE status_orcamento ADD VALUE IF NOT EXISTS 'pendente';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tables Security
-- Enable RLS
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anexos_orcamentos ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts for orcamentos
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orcamentos' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.orcamentos', pol.policyname);
    END LOOP;
END $$;

-- Drop ALL existing policies to avoid conflicts for anexos_orcamentos
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'anexos_orcamentos' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.anexos_orcamentos', pol.policyname);
    END LOOP;
END $$;

-- Create Permissive Policies for Authenticated Users (Tables)
CREATE POLICY "authenticated_full_access_orcamentos"
ON public.orcamentos FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_full_access_anexos_orcamentos"
ON public.anexos_orcamentos FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Storage Security
-- Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('orcamentos', 'orcamentos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop ALL existing storage policies for this bucket
DO $$
DECLARE
    pol record;
BEGIN
    -- Attempt to drop by common names used in previous migrations
    EXECUTE 'DROP POLICY IF EXISTS "orcamentos_storage_insert" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "orcamentos_storage_update" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "orcamentos_storage_delete" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "orcamentos_storage_select" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "policy_storage_orcamentos_insert" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "policy_storage_orcamentos_select" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "policy_storage_orcamentos_update" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "policy_storage_orcamentos_delete" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "authenticated_insert_orcamentos_bucket" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "authenticated_update_orcamentos_bucket" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "authenticated_delete_orcamentos_bucket" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "public_select_orcamentos_bucket" ON storage.objects';
    -- Generic ones from failed migrations
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can upload files orcamentos" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view files orcamentos" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update files orcamentos" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can delete files orcamentos" ON storage.objects';
END $$;

-- Create New Storage Policies
CREATE POLICY "orcamentos_bucket_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'orcamentos');

CREATE POLICY "orcamentos_bucket_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'orcamentos');

CREATE POLICY "orcamentos_bucket_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'orcamentos');

CREATE POLICY "orcamentos_bucket_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'orcamentos');
