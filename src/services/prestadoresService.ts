import { supabase } from '@/lib/supabase/client'
import { ServiceProvider } from '@/types'

export const prestadoresService = {
    async getAll(): Promise<ServiceProvider[]> {
        const { data, error } = await supabase
            .from('prestadores_servico' as any)
            .select('*')
            .order('nome', { ascending: true })

        if (error) throw error

        return (data || []).map((p: any) => ({
            ...p,
            created_at: p.created_at ? new Date(p.created_at) : undefined
        }))
    },

    async getById(id: string): Promise<ServiceProvider | null> {
        const { data, error } = await supabase
            .from('prestadores_servico' as any)
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        if (!data) return null

        const prestadorData = data as any
        return {
            ...prestadorData,
            created_at: prestadorData.created_at ? new Date(prestadorData.created_at) : undefined
        }
    },

    async create(prestador: Omit<ServiceProvider, 'id' | 'created_at'>): Promise<ServiceProvider> {
        const { data, error } = await supabase
            .from('prestadores_servico' as any)
            .insert({
                nome: prestador.nome,
                telefone_1: prestador.telefone_1,
                telefone_2: prestador.telefone_2,
                rua: prestador.rua,
                numero: prestador.numero,
                cidade: prestador.cidade,
                estado: prestador.estado,
                funcao: prestador.funcao,
            })
            .select()
            .single()

        if (error) throw error

        const prestadorData = data as any
        return {
            ...prestadorData,
            created_at: prestadorData.created_at ? new Date(prestadorData.created_at) : undefined
        }
    },

    async update(id: string, prestador: Partial<ServiceProvider>): Promise<void> {
        const updates: any = {}
        if (prestador.nome !== undefined) updates.nome = prestador.nome
        if (prestador.telefone_1 !== undefined) updates.telefone_1 = prestador.telefone_1
        if (prestador.telefone_2 !== undefined) updates.telefone_2 = prestador.telefone_2
        if (prestador.rua !== undefined) updates.rua = prestador.rua
        if (prestador.numero !== undefined) updates.numero = prestador.numero
        if (prestador.cidade !== undefined) updates.cidade = prestador.cidade
        if (prestador.estado !== undefined) updates.estado = prestador.estado
        if (prestador.funcao !== undefined) updates.funcao = prestador.funcao

        const { error } = await supabase
            .from('prestadores_servico' as any)
            .update(updates)
            .eq('id', id)

        if (error) throw error
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('prestadores_servico' as any)
            .delete()
            .eq('id', id)

        if (error) throw error
    }
}
