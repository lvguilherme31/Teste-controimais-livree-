-- Migration to initialize the database schema for CRM Engenharia Civil

-- 1. Create Enum Types
CREATE TYPE status_usuario AS ENUM ('ativo', 'inativo', 'suspenso');
CREATE TYPE status_obra AS ENUM ('em_andamento', 'concluida', 'paralisada');
CREATE TYPE tipo_documento_obra AS ENUM ('contrato', 'pgr', 'pcmso', 'art', 'seguro', 'cno', 'cnpj', 'outros');
CREATE TYPE status_colaborador AS ENUM ('ativo', 'ferias', 'afastado', 'desligado');
CREATE TYPE tipo_documento_admissao AS ENUM ('aso', 'epi', 'nr6', 'nr10', 'nr12', 'nr17', 'nr18', 'nr35', 'os', 'contrato', 'rg', 'cpf', 'outros');
CREATE TYPE status_veiculo AS ENUM ('ativo', 'manutencao', 'inativo');
CREATE TYPE tipo_documento_veiculo AS ENUM ('crlv', 'seguro', 'manutencao', 'outros');
CREATE TYPE tipo_documento_alojamento AS ENUM ('contrato_locacao', 'laudo_vistoria', 'conta_luz', 'conta_agua', 'outros');
CREATE TYPE status_conta_pagar AS ENUM ('pendente', 'pago', 'vencido', 'cancelado');
CREATE TYPE status_nota_fiscal AS ENUM ('pendente', 'pago', 'cancelado', 'vencido');
CREATE TYPE status_orcamento AS ENUM ('rascunho', 'enviado', 'aprovado', 'rejeitado');

-- 2. Create Access Levels Table
CREATE TABLE public.niveis_acesso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.niveis_acesso IS 'Tabela que define os níveis de acesso e permissões dos usuários.';
COMMENT ON COLUMN public.niveis_acesso.nome IS 'Nome do nível de acesso (ex: Admin, Subusuário).';

-- Seed Access Levels
INSERT INTO public.niveis_acesso (nome, descricao) VALUES 
('Super Admin', 'Acesso total ao sistema e configurações globais.'),
('Admin', 'Acesso administrativo e gerencial.'),
('Subusuário', 'Acesso operacional limitado a certas funcionalidades.');

-- 3. Create Users Table (Profiles linked to Auth)
CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT, -- Mantido para compatibilidade, mas auth.users gerencia a senha real
    telefone TEXT,
    cnpj TEXT,
    status status_usuario DEFAULT 'ativo'::status_usuario,
    nivel_acesso_id UUID REFERENCES public.niveis_acesso(id),
    admin_id UUID REFERENCES public.usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.usuarios IS 'Tabela de perfis de usuários, vinculada à autenticação do Supabase.';
COMMENT ON COLUMN public.usuarios.id IS 'Chave primária vinculada ao auth.users.';
COMMENT ON COLUMN public.usuarios.admin_id IS 'Referência ao usuário administrador responsável (para subusuários).';
COMMENT ON COLUMN public.usuarios.password_hash IS 'Campo legado ou para hash manual, autenticação principal via Supabase Auth.';

-- 4. Create Obras Table
CREATE TABLE public.obras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    endereco TEXT,
    cidade TEXT,
    cliente TEXT,
    valor_contrato NUMERIC(15, 2),
    data_inicio DATE,
    previsao_termino DATE,
    status status_obra DEFAULT 'em_andamento'::status_obra,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.obras IS 'Cadastro de obras e projetos de engenharia.';

CREATE TABLE public.documentos_obras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
    tipo tipo_documento_obra NOT NULL,
    nome_arquivo TEXT NOT NULL,
    url_arquivo TEXT NOT NULL,
    data_upload TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.documentos_obras IS 'Armazenamento de URLs e metadados de documentos de obras.';

-- 5. Create Colaboradores Table
CREATE TABLE public.colaboradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cpf TEXT UNIQUE,
    rg TEXT,
    telefone TEXT,
    email TEXT,
    endereco TEXT,
    contato_emergencia_nome TEXT,
    contato_emergencia_telefone TEXT,
    cargo TEXT,
    salario NUMERIC(10, 2),
    data_admissao DATE,
    data_desligamento DATE,
    status status_colaborador DEFAULT 'ativo'::status_colaborador,
    dados_bancarios JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.colaboradores IS 'Registro de funcionários e informações de RH.';

CREATE TABLE public.documentos_admissao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
    tipo tipo_documento_admissao NOT NULL,
    nome_arquivo TEXT NOT NULL,
    url_arquivo TEXT NOT NULL,
    data_validade DATE,
    data_upload TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.documentos_admissao IS 'Documentos relacionados à admissão e segurança do trabalho (ASO, NRs).';

-- 6. Create Veiculos Table
CREATE TABLE public.veiculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placa TEXT UNIQUE NOT NULL,
    marca TEXT,
    modelo TEXT,
    obra_id UUID REFERENCES public.obras(id) ON DELETE SET NULL,
    status status_veiculo DEFAULT 'ativo'::status_veiculo,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.veiculos IS 'Gestão da frota de veículos da empresa.';
COMMENT ON COLUMN public.veiculos.obra_id IS 'Obra onde o veículo está alocado atualmente.';

CREATE TABLE public.documentos_veiculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    veiculo_id UUID NOT NULL REFERENCES public.veiculos(id) ON DELETE CASCADE,
    tipo tipo_documento_veiculo NOT NULL,
    nome_arquivo TEXT NOT NULL,
    url_arquivo TEXT NOT NULL,
    data_validade DATE,
    data_upload TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create Alojamentos Table
CREATE TABLE public.alojamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID REFERENCES public.obras(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    endereco TEXT,
    data_entrada DATE,
    vencimento_contrato DATE,
    status TEXT DEFAULT 'ativo',
    configuracao_contas JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.alojamentos IS 'Controle de alojamentos para colaboradores deslocados.';

CREATE TABLE public.documentos_alojamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alojamento_id UUID NOT NULL REFERENCES public.alojamentos(id) ON DELETE CASCADE,
    tipo tipo_documento_alojamento NOT NULL,
    nome_arquivo TEXT NOT NULL,
    url_arquivo TEXT NOT NULL,
    data_upload TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Financial Tables
CREATE TABLE public.categorias_conta_pagar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL UNIQUE
);

INSERT INTO public.categorias_conta_pagar (nome) VALUES 
('Materiais'), ('Mão de Obra'), ('Hospedagem'), ('Veículos'), ('Impostos'), ('Geral');

CREATE TABLE public.contas_a_pagar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao TEXT NOT NULL,
    valor NUMERIC(15, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status status_conta_pagar DEFAULT 'pendente'::status_conta_pagar,
    categoria_id UUID REFERENCES public.categorias_conta_pagar(id),
    obra_id UUID REFERENCES public.obras(id),
    alojamento_id UUID REFERENCES public.alojamentos(id),
    colaborador_id UUID REFERENCES public.colaboradores(id),
    veiculo_id UUID REFERENCES public.veiculos(id),
    origem TEXT DEFAULT 'manual',
    url_boleto TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.contas_a_pagar IS 'Contas a pagar e despesas, vinculadas a centros de custo (obras, veículos, etc).';

CREATE TABLE public.notas_fiscais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT NOT NULL,
    data_emissao DATE,
    cliente_fornecedor TEXT,
    cnpj_cpf TEXT,
    valor NUMERIC(15, 2),
    data_vencimento DATE,
    status status_nota_fiscal DEFAULT 'pendente'::status_nota_fiscal,
    itens JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.notas_fiscais IS 'Registro de notas fiscais emitidas ou recebidas.';

CREATE TABLE public.anexos_notas_fiscais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nota_fiscal_id UUID NOT NULL REFERENCES public.notas_fiscais(id) ON DELETE CASCADE,
    nome_arquivo TEXT NOT NULL,
    url_arquivo TEXT NOT NULL,
    data_upload TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.orcamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_visual TEXT,
    cliente TEXT,
    local_obra TEXT,
    obra_id UUID REFERENCES public.obras(id),
    descricao TEXT,
    data_criacao DATE DEFAULT CURRENT_DATE,
    valor_total NUMERIC(15, 2),
    status status_orcamento DEFAULT 'rascunho'::status_orcamento,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.orcamentos IS 'Módulo de orçamentos e propostas comerciais.';

CREATE TABLE public.anexos_orcamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
    nome_arquivo TEXT NOT NULL,
    url_arquivo TEXT NOT NULL,
    data_upload TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Enable RLS and Create Policies
ALTER TABLE public.niveis_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_admissao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alojamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_alojamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_conta_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_a_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anexos_notas_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anexos_orcamentos ENABLE ROW LEVEL SECURITY;

-- Basic Policies for Authenticated Users (Read/Write)
CREATE POLICY "Authenticated users full access" ON public.niveis_acesso FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.usuarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.obras FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.documentos_obras FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.colaboradores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.documentos_admissao FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.veiculos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.documentos_veiculos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.alojamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.documentos_alojamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.categorias_conta_pagar FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.contas_a_pagar FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.notas_fiscais FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.anexos_notas_fiscais FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.orcamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON public.anexos_orcamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 10. Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_modtime BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_obras_modtime BEFORE UPDATE ON public.obras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_colaboradores_modtime BEFORE UPDATE ON public.colaboradores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_veiculos_modtime BEFORE UPDATE ON public.veiculos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_alojamentos_modtime BEFORE UPDATE ON public.alojamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contas_a_pagar_modtime BEFORE UPDATE ON public.contas_a_pagar FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notas_fiscais_modtime BEFORE UPDATE ON public.notas_fiscais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orcamentos_modtime BEFORE UPDATE ON public.orcamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
