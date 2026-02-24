-- Add 'estado' column to 'obras' table
ALTER TABLE public.obras ADD COLUMN IF NOT EXISTS estado TEXT;

-- Add 'valor' and 'descricao' columns to 'documentos_obras' table to support detailed contract info
ALTER TABLE public.documentos_obras ADD COLUMN IF NOT EXISTS valor NUMERIC(15, 2);
ALTER TABLE public.documentos_obras ADD COLUMN IF NOT EXISTS descricao TEXT;
