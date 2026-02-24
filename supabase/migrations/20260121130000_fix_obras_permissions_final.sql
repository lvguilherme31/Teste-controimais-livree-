-- Force enable RLS on critical tables to ensure security
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_alteracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_obras ENABLE ROW LEVEL SECURITY;

-- 1. Reset Policies for 'obras' table
-- We drop all known policies to avoid conflicts and ensure the new permissive policy works
DROP POLICY IF EXISTS "Authenticated users full access" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can select obras" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can insert obras" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can update obras" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can delete obras" ON public.obras;
DROP POLICY IF EXISTS "Enable full access for authenticated users on obras" ON public.obras;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.obras;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.obras;

-- Create a single, comprehensive policy allowing all operations (CRUD) for authenticated users
CREATE POLICY "Authenticated users full access"
ON public.obras
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 2. Reset Policies for 'historico_alteracoes' table
-- This is required because creating a project also inserts into this table
DROP POLICY IF EXISTS "Authenticated users full access" ON public.historico_alteracoes;
DROP POLICY IF EXISTS "Enable full access for authenticated users on historico_alteracoes" ON public.historico_alteracoes;

CREATE POLICY "Authenticated users full access"
ON public.historico_alteracoes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Reset Policies for 'documentos_obras' table
-- This is required because creating a project also inserts documents
DROP POLICY IF EXISTS "Authenticated users full access" ON public.documentos_obras;
DROP POLICY IF EXISTS "Enable full access for authenticated users on documentos_obras" ON public.documentos_obras;

CREATE POLICY "Authenticated users full access"
ON public.documentos_obras
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

