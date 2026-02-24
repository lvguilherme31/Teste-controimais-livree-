-- Fix RLS policies for Orcamentos feature (Storage and Tables) to allow attachments

-- 1. Ensure 'orcamentos' bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('orcamentos', 'orcamentos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Clean up existing storage policies for 'orcamentos' to avoid conflicts
-- We use a DO block to drop policies if they exist, covering various naming conventions used previously
DO $$
BEGIN
    -- List of potential policy names to drop
    DECLARE
        policy_name text;
    BEGIN
        FOREACH policy_name IN ARRAY ARRAY[
            'Orcamentos Insert', 'Orcamentos Select', 'Orcamentos Update', 'Orcamentos Delete',
            'storage_orcamentos_select', 'storage_orcamentos_insert', 'storage_orcamentos_update', 'storage_orcamentos_delete',
            'policy_storage_orcamentos_insert', 'policy_storage_orcamentos_select', 'policy_storage_orcamentos_update', 'policy_storage_orcamentos_delete',
            'policy_storage_orcamentos_insert_final', 'policy_storage_orcamentos_select_final', 'policy_storage_orcamentos_update_final', 'policy_storage_orcamentos_delete_final',
            'Authenticated users can upload files orcamentos', 'Authenticated users can view files orcamentos',
            'Authenticated users can update files orcamentos', 'Authenticated users can delete files orcamentos',
            'Public Access Orcamentos Select', 'Authenticated Orcamentos Insert', 'Authenticated Orcamentos Update', 'Authenticated Orcamentos Delete'
        ] LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_name);
        END LOOP;
    END;
END $$;

-- 3. Create definitive storage policies
-- Allow authenticated users to upload (INSERT)
CREATE POLICY "orcamentos_storage_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'orcamentos');

-- Allow public access for SELECT (viewing images/pdfs)
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

-- 4. Enable RLS on tables
ALTER TABLE public.anexos_orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

-- 5. Clean up existing table policies
DO $$
BEGIN
    DECLARE
        policy_name text;
    BEGIN
        -- For anexos_orcamentos
        FOREACH policy_name IN ARRAY ARRAY[
            'Anexos Orcamentos Insert', 'Anexos Orcamentos Select', 'Anexos Orcamentos Update', 'Anexos Orcamentos Delete',
            'anexos_orcamentos_select', 'anexos_orcamentos_insert', 'anexos_orcamentos_update', 'anexos_orcamentos_delete',
            'policy_anexos_orcamentos_select', 'policy_anexos_orcamentos_insert', 'policy_anexos_orcamentos_update', 'policy_anexos_orcamentos_delete',
            'policy_anexos_orcamentos_all_final',
            'Authenticated users can select anexos_orcamentos', 'Authenticated users can insert anexos_orcamentos',
            'Authenticated users can update anexos_orcamentos', 'Authenticated users can delete anexos_orcamentos'
        ] LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.anexos_orcamentos', policy_name);
        END LOOP;

        -- For orcamentos
        FOREACH policy_name IN ARRAY ARRAY[
            'Orcamentos Table Insert', 'Orcamentos Table Select', 'Orcamentos Table Update', 'Orcamentos Table Delete',
            'orcamentos_select', 'orcamentos_insert', 'orcamentos_update', 'orcamentos_delete',
            'policy_orcamentos_select', 'policy_orcamentos_insert', 'policy_orcamentos_update', 'policy_orcamentos_delete',
            'Authenticated users can select orcamentos', 'Authenticated users can insert orcamentos',
            'Authenticated users can update orcamentos', 'Authenticated users can delete orcamentos'
        ] LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.orcamentos', policy_name);
        END LOOP;
    END;
END $$;

-- 6. Create definitive table policies for anexos_orcamentos
CREATE POLICY "anexos_orcamentos_select_policy"
ON public.anexos_orcamentos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "anexos_orcamentos_insert_policy"
ON public.anexos_orcamentos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "anexos_orcamentos_update_policy"
ON public.anexos_orcamentos FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "anexos_orcamentos_delete_policy"
ON public.anexos_orcamentos FOR DELETE
TO authenticated
USING (true);

-- 7. Create definitive table policies for orcamentos
CREATE POLICY "orcamentos_select_policy"
ON public.orcamentos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "orcamentos_insert_policy"
ON public.orcamentos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "orcamentos_update_policy"
ON public.orcamentos FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "orcamentos_delete_policy"
ON public.orcamentos FOR DELETE
TO authenticated
USING (true);
