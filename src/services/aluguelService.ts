import { supabase } from '@/lib/supabase/client'
import { AluguelEquipamento } from '@/types'
import { financeiroService } from './financeiroService'

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

        // Integrate with Contas a Pagar
        try {
            await financeiroService.create({
                id: '', // Will be generated
                description: `Aluguel de Equipamento: ${aluguel.nome} (${aluguel.empresaNome || 'S/Empresa'})`,
                amount: aluguel.valor,
                dueDate: aluguel.dataVencimento,
                status: 'pending',
                origin: 'manual',
                projectId: aluguel.obraId || undefined,
                category: 'Aluguel de Equipamentos',
                aluguel_id: item.id // Pass the rental ID to link it
            } as any)
        } catch (financeError) {
            console.error('Error creating linked bill:', financeError)
        }

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

        const { error } = await (supabase as any)
            .from('aluguel_equipamentos')
            .update(dbUpdates)
            .eq('id', id)

        if (error) throw error

        // Sync with linked bill in Contas a Pagar
        try {
            // Find the linked bill
            const { data: bills } = await (supabase.from('contas_a_pagar') as any)
                .select('id')
                .eq('aluguel_id', id)

            if (bills && bills.length > 0) {
                for (const bill of bills) {
                    const billUpdates: any = {}
                    if (updates.nome !== undefined || updates.empresaNome !== undefined) {
                        // Reconstruct description if needed
                        const currentRental = await this.getById(id)
                        if (currentRental) {
                            billUpdates.description = `Aluguel de Equipamento: ${currentRental.nome} (${currentRental.empresaNome || 'S/Empresa'})`
                        }
                    }
                    if (updates.valor !== undefined) billUpdates.amount = updates.valor
                    if (updates.dataVencimento !== undefined) billUpdates.dueDate = updates.dataVencimento
                    if (updates.obraId !== undefined) billUpdates.projectId = updates.obraId

                    await financeiroService.update(bill.id, billUpdates)
                }
            }
        } catch (syncError) {
            console.error('Error syncing bill update:', syncError)
        }
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
            createdAt: data.created_at,
        }
    },

    async delete(id: string): Promise<void> {
        try {
            // 1. Get rental details for fallback cleanup of orphaned bills
            const rental = await this.getById(id)
            if (rental) {
                // 2. Explicitly delete bills linked by ID
                await (supabase.from('contas_a_pagar') as any)
                    .delete()
                    .eq('aluguel_id', id)

                // 3. Fallback: Delete bills by exact description if they weren't linked by ID
                const description = `Aluguel de Equipamento: ${rental.nome} (${rental.empresaNome || 'S/Empresa'})`
                await (supabase.from('contas_a_pagar') as any)
                    .delete()
                    .eq('descricao', description)
                    .is('aluguel_id', null)
            }
        } catch (cleanupError) {
            console.error('Error cleaning up linked bills:', cleanupError)
        }

        const { error } = await (supabase as any)
            .from('aluguel_equipamentos')
            .delete()
            .eq('id', id)

        if (error) throw error
    },
}
