-- Fix RLS policies for Obras and related tables to ensure creation flow works
-- This migration drops existing restrictive policies and applies a permissive one for authenticated users

BEGIN;

-- 1. Obras Table
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;

-- Drop all potentially existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Authenticated users full access" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can insert obras" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can select obras" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can update obras" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can delete obras" ON public.obras;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.obras;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.obras;
DROP POLICY IF EXISTS "policy_obras_authenticated_full_access" ON public.obras;

-- Create a single, permissive policy for authenticated users
CREATE POLICY "policy_obras_authenticated_full_access"
ON public.obras
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 2. Documentos Obras Table
ALTER TABLE public.documentos_obras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users full access" ON public.documentos_obras;
DROP POLICY IF EXISTS "Authenticated users can upload files 170000" ON public.documentos_obras;
DROP POLICY IF EXISTS "policy_documentos_obras_authenticated_full_access" ON public.documentos_obras;

CREATE POLICY "policy_documentos_obras_authenticated_full_access"
ON public.documentos_obras
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Historico Alteracoes Table
ALTER TABLE public.historico_alteracoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users full access" ON public.historico_alteracoes;
DROP POLICY IF EXISTS "Users can insert history" ON public.historico_alteracoes;
DROP POLICY IF EXISTS "Users can view history of projects" ON public.historico_alteracoes;
DROP POLICY IF EXISTS "policy_historico_alteracoes_authenticated_full_access" ON public.historico_alteracoes;

CREATE POLICY "policy_historico_alteracoes_authenticated_full_access"
ON public.historico_alteracoes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

COMMIT;
