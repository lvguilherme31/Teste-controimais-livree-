-- Relax constraints on orcamentos table to allow partial saves
ALTER TABLE public.orcamentos ALTER COLUMN cliente DROP NOT NULL;
ALTER TABLE public.orcamentos ALTER COLUMN local_obra DROP NOT NULL;
ALTER TABLE public.orcamentos ALTER COLUMN valor_total DROP NOT NULL;
ALTER TABLE public.orcamentos ALTER COLUMN status DROP NOT NULL;
ALTER TABLE public.orcamentos ALTER COLUMN data_criacao DROP NOT NULL;

-- Ensure RLS Policies are permissive for authenticated users
-- Drop existing policies first to avoid duplicates/conflicts
DROP POLICY IF EXISTS "authenticated_manage_orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "authenticated_manage_anexos_orcamentos" ON public.anexos_orcamentos;

-- Re-create policies
CREATE POLICY "authenticated_manage_orcamentos"
ON public.orcamentos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_manage_anexos_orcamentos"
ON public.anexos_orcamentos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
