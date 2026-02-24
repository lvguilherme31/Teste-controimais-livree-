export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alojamentos: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          configuracao_contas: Json | null
          created_at: string
          data_entrada: string | null
          endereco: string | null
          estado: string | null
          id: string
          logradouro: string | null
          nome: string
          numero: string | null
          obra_id: string | null
          status: string | null
          updated_at: string
          vencimento_contrato: string | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          configuracao_contas?: Json | null
          created_at?: string
          data_entrada?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          logradouro?: string | null
          nome: string
          numero?: string | null
          obra_id?: string | null
          status?: string | null
          updated_at?: string
          vencimento_contrato?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          configuracao_contas?: Json | null
          created_at?: string
          data_entrada?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          logradouro?: string | null
          nome?: string
          numero?: string | null
          obra_id?: string | null
          status?: string | null
          updated_at?: string
          vencimento_contrato?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alojamentos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      aluguel_equipamentos: {
        Row: {
          created_at: string
          data_vencimento: string
          empresa_cidade: string | null
          empresa_cnpj: string | null
          empresa_endereco: string | null
          empresa_estado: string | null
          empresa_nome: string | null
          empresa_numero: string | null
          empresa_rua: string | null
          empresa_telefone: string | null
          id: string
          nome: string
          obra_id: string | null
          valor: number
        }
        Insert: {
          created_at?: string
          data_vencimento: string
          empresa_cidade?: string | null
          empresa_cnpj?: string | null
          empresa_endereco?: string | null
          empresa_estado?: string | null
          empresa_nome?: string | null
          empresa_numero?: string | null
          empresa_rua?: string | null
          empresa_telefone?: string | null
          id?: string
          nome: string
          obra_id?: string | null
          valor: number
        }
        Update: {
          created_at?: string
          data_vencimento?: string
          empresa_cidade?: string | null
          empresa_cnpj?: string | null
          empresa_endereco?: string | null
          empresa_estado?: string | null
          empresa_nome?: string | null
          empresa_numero?: string | null
          empresa_rua?: string | null
          empresa_telefone?: string | null
          id?: string
          nome?: string
          obra_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "aluguel_equipamentos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      anexos_notas_fiscais: {
        Row: {
          data_upload: string
          id: string
          nome_arquivo: string
          nota_fiscal_id: string
          url_arquivo: string
        }
        Insert: {
          data_upload?: string
          id?: string
          nome_arquivo: string
          nota_fiscal_id: string
          url_arquivo: string
        }
        Update: {
          data_upload?: string
          id?: string
          nome_arquivo?: string
          nota_fiscal_id?: string
          url_arquivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "anexos_notas_fiscais_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
        ]
      }
      anexos_orcamentos: {
        Row: {
          data_upload: string
          id: string
          nome_arquivo: string
          orcamento_id: string
          url_arquivo: string
        }
        Insert: {
          data_upload?: string
          id?: string
          nome_arquivo: string
          orcamento_id: string
          url_arquivo: string
        }
        Update: {
          data_upload?: string
          id?: string
          nome_arquivo?: string
          orcamento_id?: string
          url_arquivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "anexos_orcamentos_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_conta_pagar: {
        Row: {
          id: string
          nome: string
        }
        Insert: {
          id?: string
          nome: string
        }
        Update: {
          id?: string
          nome?: string
        }
        Relationships: []
      }
      colaboradores: {
        Row: {
          bairro: string | null
          cargo: string | null
          carteira_digital_login: string | null
          carteira_digital_senha: string | null
          cidade: string | null
          contato_emergencia_nome: string | null
          contato_emergencia_telefone: string | null
          cpf: string | null
          created_at: string
          dados_bancarios: Json | null
          data_admissao: string | null
          data_desligamento: string | null
          email: string | null
          endereco: string | null
          foto_url: string | null
          historico_colaborador: string | null
          id: string
          logradouro: string | null
          nome: string
          numero: string | null
          observacoes_periodo: string | null
          producao_data: string | null
          producao_obra_id: string | null
          producao_quantidade: number | null
          producao_valor_total: number | null
          producao_valor_unitario: number | null
          rg: string | null
          salario: number | null
          status: Database["public"]["Enums"]["status_colaborador"] | null
          telefone: string | null
          tipo_remuneracao: string | null
          uf: string | null
          updated_at: string
          vencimento_periodo: string | null
        }
        Insert: {
          bairro?: string | null
          cargo?: string | null
          carteira_digital_login?: string | null
          carteira_digital_senha?: string | null
          cidade?: string | null
          contato_emergencia_nome?: string | null
          contato_emergencia_telefone?: string | null
          cpf?: string | null
          created_at?: string
          dados_bancarios?: Json | null
          data_admissao?: string | null
          data_desligamento?: string | null
          email?: string | null
          endereco?: string | null
          foto_url?: string | null
          historico_colaborador?: string | null
          id?: string
          logradouro?: string | null
          nome: string
          numero?: string | null
          observacoes_periodo?: string | null
          producao_data?: string | null
          producao_obra_id?: string | null
          producao_quantidade?: number | null
          producao_valor_total?: number | null
          producao_valor_unitario?: number | null
          rg?: string | null
          salario?: number | null
          status?: Database["public"]["Enums"]["status_colaborador"] | null
          telefone?: string | null
          tipo_remuneracao?: string | null
          uf?: string | null
          updated_at?: string
          vencimento_periodo?: string | null
        }
        Update: {
          bairro?: string | null
          cargo?: string | null
          carteira_digital_login?: string | null
          carteira_digital_senha?: string | null
          cidade?: string | null
          contato_emergencia_nome?: string | null
          contato_emergencia_telefone?: string | null
          cpf?: string | null
          created_at?: string
          dados_bancarios?: Json | null
          data_admissao?: string | null
          data_desligamento?: string | null
          email?: string | null
          endereco?: string | null
          foto_url?: string | null
          historico_colaborador?: string | null
          id?: string
          logradouro?: string | null
          nome?: string
          numero?: string | null
          observacoes_periodo?: string | null
          producao_data?: string | null
          producao_obra_id?: string | null
          producao_quantidade?: number | null
          producao_valor_total?: number | null
          producao_valor_unitario?: number | null
          rg?: string | null
          salario?: number | null
          status?: Database["public"]["Enums"]["status_colaborador"] | null
          telefone?: string | null
          tipo_remuneracao?: string | null
          uf?: string | null
          updated_at?: string
          vencimento_periodo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_producao_obra_id_fkey"
            columns: ["producao_obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_a_pagar: {
        Row: {
          alojamento_id: string | null
          aluguel_id: string | null
          categoria_id: string | null
          colaborador_id: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          id: string
          obra_id: string | null
          origem: string | null
          status: Database["public"]["Enums"]["status_conta_pagar"] | null
          updated_at: string
          url_boleto: string | null
          valor: number
          veiculo_id: string | null
        }
        Insert: {
          alojamento_id?: string | null
          aluguel_id?: string | null
          categoria_id?: string | null
          colaborador_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          id?: string
          obra_id?: string | null
          origem?: string | null
          status?: Database["public"]["Enums"]["status_conta_pagar"] | null
          updated_at?: string
          url_boleto?: string | null
          valor: number
          veiculo_id?: string | null
        }
        Update: {
          alojamento_id?: string | null
          aluguel_id?: string | null
          categoria_id?: string | null
          colaborador_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          id?: string
          obra_id?: string | null
          origem?: string | null
          status?: Database["public"]["Enums"]["status_conta_pagar"] | null
          updated_at?: string
          url_boleto?: string | null
          valor?: number
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_a_pagar_alojamento_id_fkey"
            columns: ["alojamento_id"]
            isOneToOne: false
            referencedRelation: "alojamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_a_pagar_aluguel_id_fkey"
            columns: ["aluguel_id"]
            isOneToOne: false
            referencedRelation: "aluguel_equipamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_a_pagar_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_conta_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_a_pagar_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_a_pagar_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_a_pagar_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_admissao: {
        Row: {
          colaborador_id: string
          data_upload: string
          data_validade: string | null
          descricao: string | null
          id: string
          nome_arquivo: string
          tipo: Database["public"]["Enums"]["tipo_documento_admissao"]
          url_arquivo: string
        }
        Insert: {
          colaborador_id: string
          data_upload?: string
          data_validade?: string | null
          descricao?: string | null
          id?: string
          nome_arquivo: string
          tipo: Database["public"]["Enums"]["tipo_documento_admissao"]
          url_arquivo: string
        }
        Update: {
          colaborador_id?: string
          data_upload?: string
          data_validade?: string | null
          descricao?: string | null
          id?: string
          nome_arquivo?: string
          tipo?: Database["public"]["Enums"]["tipo_documento_admissao"]
          url_arquivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_admissao_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_alojamentos: {
        Row: {
          alojamento_id: string
          data_upload: string
          data_validade: string | null
          id: string
          nome_arquivo: string
          tipo: Database["public"]["Enums"]["tipo_documento_alojamento"]
          url_arquivo: string
        }
        Insert: {
          alojamento_id: string
          data_upload?: string
          data_validade?: string | null
          id?: string
          nome_arquivo: string
          tipo: Database["public"]["Enums"]["tipo_documento_alojamento"]
          url_arquivo: string
        }
        Update: {
          alojamento_id?: string
          data_upload?: string
          data_validade?: string | null
          id?: string
          nome_arquivo?: string
          tipo?: Database["public"]["Enums"]["tipo_documento_alojamento"]
          url_arquivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_alojamentos_alojamento_id_fkey"
            columns: ["alojamento_id"]
            isOneToOne: false
            referencedRelation: "alojamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_obras: {
        Row: {
          data_upload: string
          data_validade: string | null
          descricao: string | null
          id: string
          nome_arquivo: string | null
          obra_id: string
          tipo: Database["public"]["Enums"]["tipo_documento_obra"]
          url_arquivo: string | null
          valor: number | null
        }
        Insert: {
          data_upload?: string
          data_validade?: string | null
          descricao?: string | null
          id?: string
          nome_arquivo?: string | null
          obra_id: string
          tipo: Database["public"]["Enums"]["tipo_documento_obra"]
          url_arquivo?: string | null
          valor?: number | null
        }
        Update: {
          data_upload?: string
          data_validade?: string | null
          descricao?: string | null
          id?: string
          nome_arquivo?: string | null
          obra_id?: string
          tipo?: Database["public"]["Enums"]["tipo_documento_obra"]
          url_arquivo?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_obras_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_veiculos: {
        Row: {
          data_upload: string
          data_validade: string | null
          id: string
          nome_arquivo: string
          tipo: Database["public"]["Enums"]["tipo_documento_veiculo"]
          url_arquivo: string
          veiculo_id: string
        }
        Insert: {
          data_upload?: string
          data_validade?: string | null
          id?: string
          nome_arquivo: string
          tipo: Database["public"]["Enums"]["tipo_documento_veiculo"]
          url_arquivo: string
          veiculo_id: string
        }
        Update: {
          data_upload?: string
          id?: string
          nome_arquivo?: string
          tipo?: Database["public"]["Enums"]["tipo_documento_veiculo"]
          url_arquivo?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_veiculos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      ferramentas: {
        Row: {
          codigo: string
          created_at: string | null
          id: string
          nome: string
          obra_id: string | null
          responsavel_cargo: string | null
          responsavel_nome: string | null
          responsavel_telefone: string | null
          updated_at: string | null
        }
        Insert: {
          codigo: string
          created_at?: string | null
          id?: string
          nome: string
          obra_id?: string | null
          responsavel_cargo?: string | null
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          codigo?: string
          created_at?: string | null
          id?: string
          nome?: string
          obra_id?: string | null
          responsavel_cargo?: string | null
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ferramentas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_alteracoes: {
        Row: {
          campo_alterado: string
          created_at: string
          id: string
          obra_id: string
          usuario_id: string | null
          valor_antigo: string | null
          valor_novo: string | null
        }
        Insert: {
          campo_alterado: string
          created_at?: string
          id?: string
          obra_id: string
          usuario_id?: string | null
          valor_antigo?: string | null
          valor_novo?: string | null
        }
        Update: {
          campo_alterado?: string
          created_at?: string
          id?: string
          obra_id?: string
          usuario_id?: string | null
          valor_antigo?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_alteracoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      holerites: {
        Row: {
          colaborador_id: string | null
          created_at: string | null
          id: string
          mes_referencia: string
          nome_arquivo: string
          url_arquivo: string
        }
        Insert: {
          colaborador_id?: string | null
          created_at?: string | null
          id?: string
          mes_referencia: string
          nome_arquivo: string
          url_arquivo: string
        }
        Update: {
          colaborador_id?: string | null
          created_at?: string | null
          id?: string
          mes_referencia?: string
          nome_arquivo?: string
          url_arquivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "holerites_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      niveis_acesso: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      notas_fiscais: {
        Row: {
          cliente_fornecedor: string | null
          cnpj_cpf: string | null
          created_at: string
          data_emissao: string | null
          data_vencimento: string | null
          emitente_cnpj: string | null
          emitente_nome: string | null
          id: string
          itens: Json | null
          numero: string
          status: Database["public"]["Enums"]["status_nota_fiscal"] | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          cliente_fornecedor?: string | null
          cnpj_cpf?: string | null
          created_at?: string
          data_emissao?: string | null
          data_vencimento?: string | null
          emitente_cnpj?: string | null
          emitente_nome?: string | null
          id?: string
          itens?: Json | null
          numero: string
          status?: Database["public"]["Enums"]["status_nota_fiscal"] | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          cliente_fornecedor?: string | null
          cnpj_cpf?: string | null
          created_at?: string
          data_emissao?: string | null
          data_vencimento?: string | null
          emitente_cnpj?: string | null
          emitente_nome?: string | null
          id?: string
          itens?: Json | null
          numero?: string
          status?: Database["public"]["Enums"]["status_nota_fiscal"] | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: []
      }
      obras: {
        Row: {
          cidade: string | null
          cliente: string | null
          cnpj: string | null
          created_at: string
          data_inicio: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          previsao_termino: string | null
          status: Database["public"]["Enums"]["status_obra"] | null
          updated_at: string
          valor_contrato: number | null
        }
        Insert: {
          cidade?: string | null
          cliente?: string | null
          cnpj?: string | null
          created_at?: string
          data_inicio?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          previsao_termino?: string | null
          status?: Database["public"]["Enums"]["status_obra"] | null
          updated_at?: string
          valor_contrato?: number | null
        }
        Update: {
          cidade?: string | null
          cliente?: string | null
          cnpj?: string | null
          created_at?: string
          data_inicio?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          previsao_termino?: string | null
          status?: Database["public"]["Enums"]["status_obra"] | null
          updated_at?: string
          valor_contrato?: number | null
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          bairro: string | null
          cidade: string | null
          cliente: string | null
          cnpj: string | null
          codigo_visual: string | null
          created_at: string
          data_criacao: string | null
          descricao: string | null
          estado: string | null
          id: string
          local_obra: string | null
          obra_id: string | null
          rua: string | null
          status: Database["public"]["Enums"]["status_orcamento"] | null
          updated_at: string
          valor_total: number | null
        }
        Insert: {
          bairro?: string | null
          cidade?: string | null
          cliente?: string | null
          cnpj?: string | null
          codigo_visual?: string | null
          created_at?: string
          data_criacao?: string | null
          descricao?: string | null
          estado?: string | null
          id?: string
          local_obra?: string | null
          obra_id?: string | null
          rua?: string | null
          status?: Database["public"]["Enums"]["status_orcamento"] | null
          updated_at?: string
          valor_total?: number | null
        }
        Update: {
          bairro?: string | null
          cidade?: string | null
          cliente?: string | null
          cnpj?: string | null
          codigo_visual?: string | null
          created_at?: string
          data_criacao?: string | null
          descricao?: string | null
          estado?: string | null
          id?: string
          local_obra?: string | null
          obra_id?: string | null
          rua?: string | null
          status?: Database["public"]["Enums"]["status_orcamento"] | null
          updated_at?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos_colaboradores: {
        Row: {
          colaborador_id: string | null
          created_at: string | null
          data_pagamento: string | null
          id: string
          mes_referencia: string
          observacoes: string | null
          status: string
          updated_at: string | null
          valor_a_pagar: number
        }
        Insert: {
          colaborador_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          id?: string
          mes_referencia: string
          observacoes?: string | null
          status?: string
          updated_at?: string | null
          valor_a_pagar?: number
        }
        Update: {
          colaborador_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          id?: string
          mes_referencia?: string
          observacoes?: string | null
          status?: string
          updated_at?: string | null
          valor_a_pagar?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_colaboradores_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      prestadores_servico: {
        Row: {
          cidade: string | null
          created_at: string | null
          endereco: string | null
          estado: string | null
          funcao: string
          id: string
          nome: string
          numero: string | null
          rua: string | null
          telefone_1: string
          telefone_2: string | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string | null
          endereco?: string | null
          estado?: string | null
          funcao: string
          id?: string
          nome: string
          numero?: string | null
          rua?: string | null
          telefone_1: string
          telefone_2?: string | null
        }
        Update: {
          cidade?: string | null
          created_at?: string | null
          endereco?: string | null
          estado?: string | null
          funcao?: string
          id?: string
          nome?: string
          numero?: string | null
          rua?: string | null
          telefone_1?: string
          telefone_2?: string | null
        }
        Relationships: []
      }
      user_invites: {
        Row: {
          created_at: string | null
          email: string
          name: string
          permissions: Json
          role: string
        }
        Insert: {
          created_at?: string | null
          email: string
          name: string
          permissions?: Json
          role: string
        }
        Update: {
          created_at?: string | null
          email?: string
          name?: string
          permissions?: Json
          role?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          admin_id: string | null
          cnpj: string | null
          created_at: string
          email: string
          id: string
          nivel_acesso_id: string | null
          nome: string
          password_hash: string | null
          permissions: Json | null
          permissoes: Json | null
          role: string | null
          status: Database["public"]["Enums"]["status_usuario"] | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          cnpj?: string | null
          created_at?: string
          email: string
          id: string
          nivel_acesso_id?: string | null
          nome: string
          password_hash?: string | null
          permissions?: Json | null
          permissoes?: Json | null
          role?: string | null
          status?: Database["public"]["Enums"]["status_usuario"] | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string
          id?: string
          nivel_acesso_id?: string | null
          nome?: string
          password_hash?: string | null
          permissions?: Json | null
          permissoes?: Json | null
          role?: string | null
          status?: Database["public"]["Enums"]["status_usuario"] | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_nivel_acesso_id_fkey"
            columns: ["nivel_acesso_id"]
            isOneToOne: false
            referencedRelation: "niveis_acesso"
            referencedColumns: ["id"]
          },
        ]
      }
      veiculos: {
        Row: {
          bateria_amperagem: string | null
          bateria_data_troca: string | null
          bateria_serie: string | null
          created_at: string
          id: string
          marca: string | null
          modelo: string | null
          obra_id: string | null
          placa: string
          pneu_data_troca: string | null
          pneu_estado: string | null
          status: Database["public"]["Enums"]["status_veiculo"] | null
          updated_at: string
        }
        Insert: {
          bateria_amperagem?: string | null
          bateria_data_troca?: string | null
          bateria_serie?: string | null
          created_at?: string
          id?: string
          marca?: string | null
          modelo?: string | null
          obra_id?: string | null
          placa: string
          pneu_data_troca?: string | null
          pneu_estado?: string | null
          status?: Database["public"]["Enums"]["status_veiculo"] | null
          updated_at?: string
        }
        Update: {
          bateria_amperagem?: string | null
          bateria_data_troca?: string | null
          bateria_serie?: string | null
          created_at?: string
          id?: string
          marca?: string | null
          modelo?: string | null
          obra_id?: string | null
          placa?: string
          pneu_data_troca?: string | null
          pneu_estado?: string | null
          status?: Database["public"]["Enums"]["status_veiculo"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_invite: { Args: { check_email: string }; Returns: Json }
    }
    Enums: {
      status_colaborador: "ativo" | "ferias" | "afastado" | "desligado"
      status_conta_pagar: "pendente" | "pago" | "vencido" | "cancelado"
      status_nota_fiscal: "pendente" | "pago" | "cancelado" | "vencido"
      status_obra: "ativa" | "inativa" | "concluida"
      status_orcamento:
      | "rascunho"
      | "enviado"
      | "aprovado"
      | "rejeitado"
      | "pendente"
      status_usuario: "ativo" | "inativo" | "suspenso"
      status_veiculo: "ativo" | "manutencao" | "inativo"
      tipo_documento_admissao:
      | "aso"
      | "epi"
      | "nr6"
      | "nr10"
      | "nr12"
      | "nr17"
      | "nr18"
      | "nr35"
      | "os"
      | "contrato"
      | "rg"
      | "cpf"
      | "outros"
      | "folha_registro"
      tipo_documento_alojamento:
      | "contrato_locacao"
      | "laudo_vistoria"
      | "conta_luz"
      | "conta_agua"
      | "outros"
      | "laudo_vistoria_inicio"
      | "laudo_vistoria_fim"
      tipo_documento_obra:
      | "contrato"
      | "pgr"
      | "pcmso"
      | "art"
      | "seguro"
      | "cno"
      | "cnpj"
      | "outros"
      | "alvara"
      | "licenca_ambiental"
      tipo_documento_veiculo: "crlv" | "seguro" | "manutencao" | "outros"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      status_colaborador: ["ativo", "ferias", "afastado", "desligado"],
      status_conta_pagar: ["pendente", "pago", "vencido", "cancelado"],
      status_nota_fiscal: ["pendente", "pago", "cancelado", "vencido"],
      status_obra: ["ativa", "inativa", "concluida"],
      status_orcamento: [
        "rascunho",
        "enviado",
        "aprovado",
        "rejeitado",
        "pendente",
      ],
      status_usuario: ["ativo", "inativo", "suspenso"],
      status_veiculo: ["ativo", "manutencao", "inativo"],
      tipo_documento_admissao: [
        "aso",
        "epi",
        "nr6",
        "nr10",
        "nr12",
        "nr17",
        "nr18",
        "nr35",
        "os",
        "contrato",
        "rg",
        "cpf",
        "outros",
        "folha_registro",
      ],
      tipo_documento_alojamento: [
        "contrato_locacao",
        "laudo_vistoria",
        "conta_luz",
        "conta_agua",
        "outros",
        "laudo_vistoria_inicio",
        "laudo_vistoria_fim",
      ],
      tipo_documento_obra: [
        "contrato",
        "pgr",
        "pcmso",
        "art",
        "seguro",
        "cno",
        "cnpj",
        "outros",
        "alvara",
        "licenca_ambiental",
      ],
      tipo_documento_veiculo: ["crlv", "seguro", "manutencao", "outros"],
    },
  },
} as const
