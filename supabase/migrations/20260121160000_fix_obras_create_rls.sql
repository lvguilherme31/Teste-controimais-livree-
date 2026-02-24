-- Migration to fix RLS policies specifically for Obras creation flow
-- This ensures authenticated users have proper permissions to insert into obras and related tables

-- 1. Obras Table - Enable RLS and set full access for authenticated users
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;

-- Drop potential existing policies to ensure clean slate
DROP POLICY IF EXISTS "Authenticated users full access" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can select obras" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can insert obras" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can update obras" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can delete obras" ON public.obras;
DROP POLICY IF EXISTS "Enable full access for authenticated users on obras" ON public.obras;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.obras;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.obras;

-- Create comprehensive policy allowing CRUD for authenticated users
CREATE POLICY "Authenticated users full access" ON public.obras
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 2. Historico Alteracoes Table - Required for logging creation event
ALTER TABLE public.historico_alteracoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users full access" ON public.historico_alteracoes;
DROP POLICY IF EXISTS "Authenticated users can insert historico_alteracoes" ON public.historico_alteracoes;
DROP POLICY IF EXISTS "Authenticated users can select historico_alteracoes" ON public.historico_alteracoes;

CREATE POLICY "Authenticated users full access" ON public.historico_alteracoes
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. Documentos Obras Table - Required for saving attachments
ALTER TABLE public.documentos_obras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users full access" ON public.documentos_obras;
DROP POLICY IF EXISTS "Authenticated users can insert documentos_obras" ON public.documentos_obras;
DROP POLICY IF EXISTS "Authenticated users can select documentos_obras" ON public.documentos_obras;

CREATE POLICY "Authenticated users full access" ON public.documentos_obras
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
