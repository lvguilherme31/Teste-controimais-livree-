-- Migration to enable public (anonymous) access and relax constraints for prototyping

BEGIN;

-- 1. Make usuario_id nullable in historico_alteracoes to allow anonymous logging
ALTER TABLE public.historico_alteracoes ALTER COLUMN usuario_id DROP NOT NULL;

-- 2. Helper function to apply permissive policies to a table
CREATE OR REPLACE FUNCTION enable_public_access(table_name text) RETURNS void AS $$
BEGIN
    -- Enable RLS just in case
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    
    -- Drop existing policies to avoid conflicts (clean slate approach)
    EXECUTE format('DROP POLICY IF EXISTS "Public full access" ON public.%I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users full access" ON public.%I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "policy_%I_authenticated_full_access" ON public.%I', table_name, table_name, table_name);
    
    -- Create new permissive policy for ALL roles (anon and authenticated)
    EXECUTE format('CREATE POLICY "Public full access" ON public.%I FOR ALL USING (true) WITH CHECK (true)', table_name);
END;
$$ LANGUAGE plpgsql;

-- 3. Apply to all tables
SELECT enable_public_access('alojamentos');
SELECT enable_public_access('anexos_notas_fiscais');
SELECT enable_public_access('anexos_orcamentos');
SELECT enable_public_access('categorias_conta_pagar');
SELECT enable_public_access('colaboradores');
SELECT enable_public_access('contas_a_pagar');
SELECT enable_public_access('documentos_admissao');
SELECT enable_public_access('documentos_alojamentos');
SELECT enable_public_access('documentos_obras');
SELECT enable_public_access('documentos_veiculos');
SELECT enable_public_access('historico_alteracoes');
SELECT enable_public_access('niveis_acesso');
SELECT enable_public_access('notas_fiscais');
SELECT enable_public_access('obras');
SELECT enable_public_access('orcamentos');
SELECT enable_public_access('usuarios');
SELECT enable_public_access('veiculos');

-- Clean up helper function
DROP FUNCTION enable_public_access;

COMMIT;
