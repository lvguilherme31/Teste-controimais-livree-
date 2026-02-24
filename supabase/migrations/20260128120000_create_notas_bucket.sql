-- Create bucket for notas fiscais if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('notas_fiscais', 'notas_fiscais', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policies for notas_fiscais bucket
CREATE POLICY "Authenticated users can upload files notas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'notas_fiscais');

CREATE POLICY "Authenticated users can view files notas"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'notas_fiscais');

CREATE POLICY "Authenticated users can update files notas"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'notas_fiscais');

CREATE POLICY "Authenticated users can delete files notas"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'notas_fiscais');
