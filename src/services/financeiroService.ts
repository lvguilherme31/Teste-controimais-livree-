

import { supabase } from '@/lib/supabase/client'
import { Bill } from '@/types'

// Map English status (used in app) to Portuguese (used in DB)
const statusToDb = (status: string): string => {
    const map: Record<string, string> = {
        'pending': 'pendente',
        'paid': 'pago',
        'overdue': 'vencido',
        'cancelled': 'cancelado'
    }
    return map[status] || status
}

// Map Portuguese status (from DB) to English (used in app)
const statusFromDb = (status: string): string => {
    const map: Record<string, string> = {
        'pendente': 'pending',
        'pago': 'paid',
        'vencido': 'overdue',
        'cancelado': 'cancelled'
    }
    return map[status] || status
}

export const financeiroService = {
    async getAll(): Promise<Bill[]> {
        const { data, error } = await supabase
            .from('contas_a_pagar')
            .select(`
        *,
        alojamento:alojamentos(nome),
        obra:obras(nome),
        categoria:categorias_conta_pagar(nome)
      `)
            .order('data_vencimento', { ascending: true })

        if (error) {
            console.error('Error fetching bills:', error)
            throw error
        }

        return (data || []).map((item: any) => ({
            id: item.id,
            description: item.descricao,
            amount: Number(item.valor),
            dueDate: new Date(item.data_vencimento),
            status: (statusFromDb(item.status) || 'pending') as any,
            barcode: item.codigo_barras,
            attachmentUrl: item.url_boleto,
            paidDate: item.data_pagamento ? new Date(item.data_pagamento) : undefined,
            origin: item.alojamento_id ? 'alojamento' : 'manual', // Simple logic for now
            category: item.categoria?.nome || item.categoria_nome || 'Geral', // Handle relation or fallback
            projectId: item.obra_id,
            accommodationId: item.alojamento_id,
            accommodationName: item.alojamento?.nome,
            paymentMethod: item.forma_pagamento,
        }))
    },

    async create(bill: Bill): Promise<Bill> {
        // Look up category ID if category name is provided
        let categoria_id = null
        if (bill.category) {
            const { data: categoryData } = await supabase
                .from('categorias_conta_pagar')
                .select('id')
                .eq('nome', bill.category)
                .single()

            categoria_id = categoryData?.id || null
        }

        const { data, error } = await supabase
            .from('contas_a_pagar')
            .insert({
                descricao: bill.description,
                valor: bill.amount,
                data_vencimento: bill.dueDate.toISOString().split('T')[0],
                status: statusToDb(bill.status) as any,
                codigo_barras: bill.barcode,
                url_boleto: bill.attachmentUrl,
                data_pagamento: bill.paidDate?.toISOString().split('T')[0],
                alojamento_id: bill.accommodationId,
                obra_id: bill.projectId,
                categoria_id: categoria_id,
                forma_pagamento: bill.paymentMethod,
                aluguel_id: (bill as any).aluguel_id
            })
            .select()
            .single()

        if (error) throw error

        return {
            ...bill,
            id: data.id,
        }
    },

    async update(id: string, updates: Partial<Bill>): Promise<void> {
        console.log('financeiroService.update called with:', { id, updates })

        const dbUpdates: any = {}
        if (updates.description !== undefined) dbUpdates.descricao = updates.description
        if (updates.amount !== undefined) dbUpdates.valor = updates.amount
        if (updates.dueDate !== undefined) dbUpdates.data_vencimento = updates.dueDate.toISOString().split('T')[0]
        if (updates.status !== undefined) {
            const mappedStatus = statusToDb(updates.status)
            console.log('Status mapping:', updates.status, '->', mappedStatus)
            dbUpdates.status = mappedStatus
        }
        if (updates.barcode !== undefined) dbUpdates.codigo_barras = updates.barcode
        if (updates.attachmentUrl !== undefined) dbUpdates.url_boleto = updates.attachmentUrl
        if (updates.paidDate !== undefined) dbUpdates.data_pagamento = updates.paidDate.toISOString().split('T')[0]
        if ((updates as any).aluguel_id !== undefined) dbUpdates.aluguel_id = (updates as any).aluguel_id

        // Map category name to categoria_id
        if (updates.category !== undefined) {
            const { data: categoryData } = await supabase
                .from('categorias_conta_pagar')
                .select('id')
                .eq('nome', updates.category)
                .single()

            if (categoryData) {
                dbUpdates.categoria_id = categoryData.id
            }
        }

        // Logic to clear paid date if status changes back to pending
        if (updates.status === 'pending') {
            dbUpdates.data_pagamento = null
        }

        console.log('Sending to database:', dbUpdates)

        const { error } = await supabase
            .from('contas_a_pagar')
            .update(dbUpdates)
            .eq('id', id)

        if (error) {
            console.error('Database update error:', error)
            throw error
        }

        console.log('Update successful')
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('contas_a_pagar')
            .delete()
            .eq('id', id)

        if (error) throw error
    }
}
