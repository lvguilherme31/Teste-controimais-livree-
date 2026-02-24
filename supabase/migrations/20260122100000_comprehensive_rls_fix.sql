-- Migration to standardise and fix RLS policies for all tables
-- This ensures authenticated users have full CRUD access, resolving permission errors (42501)

-- 1. Helper function to reset policies for a table
CREATE OR REPLACE PROCEDURE public.reset_table_policies(table_name text)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

    -- Drop common existing policies to ensure clean slate
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users full access" ON public.%I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can select %s" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can insert %s" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can update %s" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can delete %s" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Enable full access for authenticated users on %s" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all users" ON public.%I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.%I', table_name);
    
    -- Create the permissive policy for authenticated users
    EXECUTE format('CREATE POLICY "Authenticated users full access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', table_name);
END;
$$;

-- 2. Execute reset for all tables
CALL public.reset_table_policies('obras');
CALL public.reset_table_policies('colaboradores');
CALL public.reset_table_policies('contas_a_pagar');
CALL public.reset_table_policies('alojamentos');
CALL public.reset_table_policies('veiculos');
CALL public.reset_table_policies('orcamentos');
CALL public.reset_table_policies('notas_fiscais');
CALL public.reset_table_policies('categorias_conta_pagar');
CALL public.reset_table_policies('documentos_admissao');
CALL public.reset_table_policies('documentos_alojamentos');
CALL public.reset_table_policies('documentos_obras');
CALL public.reset_table_policies('documentos_veiculos');
CALL public.reset_table_policies('anexos_notas_fiscais');
CALL public.reset_table_policies('anexos_orcamentos');
CALL public.reset_table_policies('historico_alteracoes');
CALL public.reset_table_policies('usuarios');
CALL public.reset_table_policies('niveis_acesso');

-- 3. Cleanup
DROP PROCEDURE public.reset_table_policies;
