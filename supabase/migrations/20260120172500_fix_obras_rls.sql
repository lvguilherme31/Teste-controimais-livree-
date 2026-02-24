-- Migration to fix RLS policies for Obras and Historico Alteracoes tables
-- Addresses the issue: "new row violates row-level security policy" during project creation

-- 1. Update Policies for 'obras' table
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;

-- Drop potential conflicting or restrictive policies
DROP POLICY IF EXISTS "Authenticated users full access" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can select obras" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can insert obras" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can update obras" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can delete obras" ON public.obras;

-- Create a comprehensive policy allowing all operations for authenticated users
CREATE POLICY "Authenticated users full access"
ON public.obras
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 2. Update Policies for 'historico_alteracoes' table
-- This table is written to during project creation, so it also needs proper RLS policies
ALTER TABLE public.historico_alteracoes ENABLE ROW LEVEL SECURITY;

-- Drop potential conflicting policies
DROP POLICY IF EXISTS "Authenticated users full access" ON public.historico_alteracoes;

-- Create a comprehensive policy allowing all operations for authenticated users
CREATE POLICY "Authenticated users full access"
ON public.historico_alteracoes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
