import { supabase } from '@/lib/supabase/client'
import { AluguelEquipamento } from '@/types'

export const aluguelService = {
    async getAll(): Promise<AluguelEquipamento[]> {
        const { data, error } = await (supabase as any)
            .from('aluguel_equipamentos')
            .select('*')
            .order('data_vencimento', { ascending: true })

        if (error) {
            console.error('Error fetching rentals:', error)
            return []
        }

        return (data || []).map((item: any) => ({
            id: item.id,
            nome: item.nome,
            valor: Number(item.valor),
            obraId: item.obra_id,
            dataVencimento: new Date(item.data_vencimento),
            empresaNome: item.empresa_nome,
            empresaEndereco: item.empresa_endereco,
            empresaRua: item.empresa_rua,
            empresaNumero: item.empresa_numero,
            empresaCidade: item.empresa_cidade,
            empresaEstado: item.empresa_estado,
            empresaTelefone: item.empresa_telefone,
            empresaCnpj: item.empresa_cnpj,
            pago: item.pago ?? false,
            dataPagamento: item.data_pagamento ? new Date(item.data_pagamento) : null,
            createdAt: item.created_at,
        }))
    },

    async create(aluguel: Omit<AluguelEquipamento, 'id' | 'createdAt'>): Promise<AluguelEquipamento> {
        const { data, error } = await (supabase as any)
            .from('aluguel_equipamentos')
            .insert({
                nome: aluguel.nome,
                valor: aluguel.valor,
                obra_id: aluguel.obraId,
                data_vencimento: aluguel.dataVencimento.toISOString().split('T')[0],
                empresa_nome: aluguel.empresaNome,
                empresa_endereco: aluguel.empresaEndereco,
                empresa_rua: aluguel.empresaRua,
                empresa_numero: aluguel.empresaNumero,
                empresa_cidade: aluguel.empresaCidade,
                empresa_estado: aluguel.empresaEstado,
                empresa_telefone: aluguel.empresaTelefone,
                empresa_cnpj: aluguel.empresaCnpj,
            })
            .select()
            .single()

        if (error) throw error

        const item = data as any

        return {
            id: item.id,
            nome: item.nome,
            valor: Number(item.valor),
            obraId: item.obra_id,
            dataVencimento: new Date(item.data_vencimento),
            empresaNome: item.empresa_nome,
            empresaEndereco: item.empresa_endereco,
            empresaRua: item.empresa_rua,
            empresaNumero: item.empresa_numero,
            empresaCidade: item.empresa_cidade,
            empresaEstado: item.empresa_estado,
            empresaTelefone: item.empresa_telefone,
            empresaCnpj: item.empresa_cnpj,
            pago: item.pago ?? false,
            dataPagamento: item.data_pagamento ? new Date(item.data_pagamento) : null,
            createdAt: item.created_at,
        }
    },

    async update(id: string, updates: Partial<AluguelEquipamento>): Promise<void> {
        const dbUpdates: any = {}
        if (updates.nome !== undefined) dbUpdates.nome = updates.nome
        if (updates.valor !== undefined) dbUpdates.valor = updates.valor
        if (updates.obraId !== undefined) dbUpdates.obra_id = updates.obraId
        if (updates.dataVencimento !== undefined) {
            dbUpdates.data_vencimento = updates.dataVencimento.toISOString().split('T')[0]
        }
        if (updates.empresaNome !== undefined) dbUpdates.empresa_nome = updates.empresaNome
        if (updates.empresaEndereco !== undefined) dbUpdates.empresa_endereco = updates.empresaEndereco
        if (updates.empresaRua !== undefined) dbUpdates.empresa_rua = updates.empresaRua
        if (updates.empresaNumero !== undefined) dbUpdates.empresa_numero = updates.empresaNumero
        if (updates.empresaCidade !== undefined) dbUpdates.empresa_cidade = updates.empresaCidade
        if (updates.empresaEstado !== undefined) dbUpdates.empresa_estado = updates.empresaEstado
        if (updates.empresaTelefone !== undefined) dbUpdates.empresa_telefone = updates.empresaTelefone
        if (updates.empresaCnpj !== undefined) dbUpdates.empresa_cnpj = updates.empresaCnpj
        if (updates.pago !== undefined) dbUpdates.pago = updates.pago
        if (updates.dataPagamento !== undefined) {
            dbUpdates.data_pagamento = updates.dataPagamento ? updates.dataPagamento.toISOString().split('T')[0] : null
        }

        const { error } = await (supabase as any)
            .from('aluguel_equipamentos')
            .update(dbUpdates)
            .eq('id', id)

        if (error) throw error
    },

    async getById(id: string): Promise<AluguelEquipamento | null> {
        const { data, error } = await (supabase as any)
            .from('aluguel_equipamentos')
            .select('*')
            .eq('id', id)
            .single()

        if (error || !data) return null

        return {
            id: data.id,
            nome: data.nome,
            valor: Number(data.valor),
            obraId: data.obra_id,
            dataVencimento: new Date(data.data_vencimento),
            empresaNome: data.empresa_nome,
            empresaEndereco: data.empresa_endereco,
            empresaRua: data.empresa_rua,
            empresaNumero: data.empresa_numero,
            empresaCidade: data.empresa_cidade,
            empresaEstado: data.empresa_estado,
            empresaTelefone: data.empresa_telefone,
            empresaCnpj: data.empresa_cnpj,
            pago: data.pago ?? false,
            dataPagamento: data.data_pagamento ? new Date(data.data_pagamento) : null,
            createdAt: data.created_at,
        }
    },

    async delete(id: string): Promise<void> {
        const { error } = await (supabase as any)
            .from('aluguel_equipamentos')
            .delete()
            .eq('id', id)

        if (error) throw error
    },
}
