ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS rua text;
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS bairro text;
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS estado varchar(2);
