CREATE TABLE IF NOT EXISTS public.historico_alteracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id),
    campo_alterado TEXT NOT NULL,
    valor_antigo TEXT,
    valor_novo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_historico_alteracoes_obra_id ON public.historico_alteracoes(obra_id);
CREATE INDEX IF NOT EXISTS idx_historico_alteracoes_created_at ON public.historico_alteracoes(created_at);

-- RLS Policies
ALTER TABLE public.historico_alteracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view history of projects"
    ON public.historico_alteracoes FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert history"
    ON public.historico_alteracoes FOR INSERT
    WITH CHECK (auth.uid() = usuario_id);
