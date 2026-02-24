-- Rename existing type
ALTER TYPE public.status_obra RENAME TO status_obra_old;

-- Create new type
CREATE TYPE public.status_obra AS ENUM ('ativa', 'inativa', 'concluida');

-- Drop default value to avoid cast error during type conversion
ALTER TABLE public.obras ALTER COLUMN status DROP DEFAULT;

-- Update column to use new type with casting/mapping
ALTER TABLE public.obras 
  ALTER COLUMN status TYPE public.status_obra 
  USING CASE
    WHEN status::text = 'em_andamento' THEN 'ativa'::public.status_obra
    WHEN status::text = 'paralisada' THEN 'inativa'::public.status_obra
    WHEN status::text = 'concluida' THEN 'concluida'::public.status_obra
    ELSE 'ativa'::public.status_obra
  END;

-- Set new default value
ALTER TABLE public.obras ALTER COLUMN status SET DEFAULT 'ativa'::public.status_obra;

-- Drop old type
DROP TYPE public.status_obra_old;
