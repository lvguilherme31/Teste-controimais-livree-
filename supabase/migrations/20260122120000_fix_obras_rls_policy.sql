-- Migration to fix RLS policies for Obras creation flow
-- Ensures authenticated users have full access to works, documents and history

-- 1. Obras Table
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;

-- Drop restrictive policies if they exist to ensure clean slate
DROP POLICY IF EXISTS "Authenticated users full access" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can insert obras" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can select obras" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can update obras" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can delete obras" ON public.obras;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.obras;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.obras;

-- Create permissive policy for authenticated users
CREATE POLICY "Authenticated users full access"
ON public.obras
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 2. Documentos Obras Table
ALTER TABLE public.documentos_obras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users full access" ON public.documentos_obras;

CREATE POLICY "Authenticated users full access"
ON public.documentos_obras
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Historico Alteracoes Table
ALTER TABLE public.historico_alteracoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users full access" ON public.historico_alteracoes;

CREATE POLICY "Authenticated users full access"
ON public.historico_alteracoes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
