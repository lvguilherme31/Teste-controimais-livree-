-- Migration to update document types enum for Obras

-- We need to add 'alvara' and 'licenca_ambiental' to the enum
-- Postgres doesn't support IF NOT EXISTS for enum values in all versions easily, 
-- but we can use an anonymous block or just attempt to add them.
-- Since this is a migration file, we assume it runs once.

ALTER TYPE public.tipo_documento_obra ADD VALUE IF NOT EXISTS 'alvara';
ALTER TYPE public.tipo_documento_obra ADD VALUE IF NOT EXISTS 'licenca_ambiental';
