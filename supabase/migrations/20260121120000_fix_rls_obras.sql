ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable full access for authenticated users on obras" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users full access" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can select obras" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can insert obras" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can update obras" ON public.obras;
DROP POLICY IF EXISTS "Authenticated users can delete obras" ON public.obras;

CREATE POLICY "Authenticated users full access"
ON public.obras
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

ALTER TABLE public.historico_alteracoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable full access for authenticated users on historico_alteracoes" ON public.historico_alteracoes;
DROP POLICY IF EXISTS "Authenticated users full access" ON public.historico_alteracoes;

CREATE POLICY "Authenticated users full access"
ON public.historico_alteracoes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
