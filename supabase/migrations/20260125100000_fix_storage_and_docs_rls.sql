-- Fix RLS for document tables and Storage to resolve "new row violates row-level security policy"
-- This migration ensures authenticated users have full access to document tables and the storage bucket

BEGIN;

-- 1. Ensure crm-docs bucket exists and is public (required for getPublicUrl usage in frontend)
INSERT INTO storage.buckets (id, name, public)
VALUES ('crm-docs', 'crm-docs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Clean up and recreate Storage Policies for crm-docs
-- We drop existing policies to ensure no conflicts or restrictive legacy policies remain

DROP POLICY IF EXISTS "Authenticated users can upload files 170000" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view files 170000" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files 170000" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files 170000" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 15787" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated selects" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "policy_storage_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "policy_storage_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "policy_storage_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "policy_storage_authenticated_select" ON storage.objects;

-- Create comprehensive policies for authenticated users on crm-docs bucket
CREATE POLICY "policy_storage_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'crm-docs');

CREATE POLICY "policy_storage_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'crm-docs');

CREATE POLICY "policy_storage_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'crm-docs');

CREATE POLICY "policy_storage_authenticated_select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'crm-docs');

-- 3. Fix RLS for Document Tables
-- We use a DO block to iterate over tables and reset policies to ensure consistency
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'documentos_obras',
        'documentos_admissao',
        'documentos_alojamentos',
        'documentos_veiculos',
        'anexos_notas_fiscais',
        'anexos_orcamentos'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        -- Enable RLS (idempotent, ensures security is active)
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
        
        -- Drop potentially conflicting or restrictive policies from previous migrations
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated users full access" ON public.%I', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Public full access" ON public.%I', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "policy_%I_authenticated_full_access" ON public.%I', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can upload files" ON public.%I', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "policy_%I_auth_full_access_v2" ON public.%I', tbl, tbl);

        -- Create a clean, permissive policy for authenticated users
        -- This allows INSERT, UPDATE, DELETE, SELECT for any authenticated user
        EXECUTE format('CREATE POLICY "policy_%I_auth_full_access_v2" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', tbl, tbl);
    END LOOP;
END $$;

COMMIT;
