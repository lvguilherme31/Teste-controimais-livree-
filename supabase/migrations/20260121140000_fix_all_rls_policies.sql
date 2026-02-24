-- Migration to fix RLS policies for all tables
-- Enables RLS and sets permissive policies for authenticated users to allow CRUD operations

-- 1. Ensure all tables have RLS enabled
ALTER TABLE IF EXISTS public.niveis_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documentos_obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documentos_admissao ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documentos_veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alojamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documentos_alojamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categorias_conta_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contas_a_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notas_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.anexos_notas_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.anexos_orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.historico_alteracoes ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to remove conflicts and re-create comprehensive ones
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'niveis_acesso', 
        'usuarios', 
        'obras', 
        'documentos_obras', 
        'colaboradores', 
        'documentos_admissao', 
        'veiculos', 
        'documentos_veiculos',
        'alojamentos', 
        'documentos_alojamentos', 
        'categorias_conta_pagar', 
        'contas_a_pagar',
        'notas_fiscais', 
        'anexos_notas_fiscais', 
        'orcamentos', 
        'anexos_orcamentos',
        'historico_alteracoes'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        -- Drop known previous policies to ensure clean slate
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated users full access" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can select %s" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can insert %s" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can update %s" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can delete %s" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable full access for authenticated users on %s" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all users" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.%I', t);
        
        -- Create a single, comprehensive policy allowing all operations (CRUD) for authenticated users
        EXECUTE format('CREATE POLICY "Authenticated users full access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;
