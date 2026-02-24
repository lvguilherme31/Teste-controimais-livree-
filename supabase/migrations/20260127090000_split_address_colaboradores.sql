ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS logradouro TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS uf VARCHAR(2);
