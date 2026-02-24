-- Create bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('orcamentos', 'orcamentos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies
-- We'll use DO block to safely create policies if they don't exist
DO $$
BEGIN
    -- Select
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Public Access Orcamentos Select'
    ) THEN
        CREATE POLICY "Public Access Orcamentos Select"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'orcamentos' );
    END IF;

    -- Insert
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated Orcamentos Insert'
    ) THEN
        CREATE POLICY "Authenticated Orcamentos Insert"
        ON storage.objects FOR INSERT
        WITH CHECK ( bucket_id = 'orcamentos' AND auth.role() = 'authenticated' );
    END IF;

    -- Update
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated Orcamentos Update'
    ) THEN
        CREATE POLICY "Authenticated Orcamentos Update"
        ON storage.objects FOR UPDATE
        USING ( bucket_id = 'orcamentos' AND auth.role() = 'authenticated' );
    END IF;

    -- Delete
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated Orcamentos Delete'
    ) THEN
        CREATE POLICY "Authenticated Orcamentos Delete"
        ON storage.objects FOR DELETE
        USING ( bucket_id = 'orcamentos' AND auth.role() = 'authenticated' );
    END IF;
END
$$;
