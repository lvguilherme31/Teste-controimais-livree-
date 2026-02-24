-- Migration to temporarily remove RLS restrictions and open storage permissions for development
-- Implements "allow all" policies for public (anon + authenticated) roles on all app tables and crm-docs bucket.

BEGIN;

-- 1. Disable RLS Restrictions on Tables (by adding permissive policies)
DO $$
DECLARE
    tbl text;
    -- List of all tables to be opened for development access
    tables text[] := ARRAY[
        'alojamentos',
        'anexos_notas_fiscais',
        'anexos_orcamentos',
        'categorias_conta_pagar',
        'colaboradores',
        'contas_a_pagar',
        'documentos_admissao',
        'documentos_alojamentos',
        'documentos_obras',
        'documentos_veiculos',
        'historico_alteracoes',
        'niveis_acesso',
        'notas_fiscais',
        'obras',
        'orcamentos',
        'usuarios',
        'veiculos'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        -- Ensure RLS is enabled to ensure policies are checked (and our new policy is applied)
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

        -- Drop the permissive policy if it exists to avoid conflicts on re-run
        EXECUTE format('DROP POLICY IF EXISTS "dev_public_allow_all" ON public.%I', tbl);

        -- Create a blanket policy allowing ALL actions for public (anon + authenticated)
        -- This effectively removes restrictions while keeping RLS enabled
        EXECUTE format('CREATE POLICY "dev_public_allow_all" ON public.%I FOR ALL TO public USING (true) WITH CHECK (true)', tbl);
    END LOOP;
END $$;

-- 2. Open Storage Permissions for 'crm-docs'
-- Ensure the bucket is public
UPDATE storage.buckets SET public = true WHERE id = 'crm-docs';

-- Drop previous policies to ensure clean slate for crm-docs and avoid "policy already exists" or conflicting restrictive logic
DROP POLICY IF EXISTS "policy_storage_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "policy_storage_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "policy_storage_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "policy_storage_authenticated_select" ON storage.objects;
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

-- Create permissive policies for public on 'crm-docs' bucket
-- These policies allow SELECT, INSERT, UPDATE, DELETE for anyone (anon + authenticated)
CREATE POLICY "dev_public_storage_insert" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'crm-docs');
CREATE POLICY "dev_public_storage_update" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'crm-docs');
CREATE POLICY "dev_public_storage_delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'crm-docs');
CREATE POLICY "dev_public_storage_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'crm-docs');

COMMIT;
