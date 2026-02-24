import { supabase } from '@/lib/supabase/client'
import { Tool } from '@/types'

export const ferramentasService = {
    async getAll(): Promise<Tool[]> {
        const { data, error } = await (supabase.from('ferramentas') as any)
            .select('*')
            .order('nome', { ascending: true })

        if (error) {
            console.error('Error fetching tools:', error)
            return []
        }

        return (data || []).map(t => ({
            id: t.id,
            nome: t.nome,
            codigo: t.codigo,
            obraId: t.obra_id,
            responsavelNome: t.responsavel_nome,
            responsavelCargo: t.responsavel_cargo,
            responsavelTelefone: t.responsavel_telefone,
            createdAt: t.created_at,
            updatedAt: t.updated_at,
        }))
    },

    async create(tool: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tool> {
        const { data, error } = await (supabase.from('ferramentas') as any)
            .insert({
                nome: tool.nome,
                codigo: tool.codigo,
                obra_id: tool.obraId,
                responsavel_nome: tool.responsavelNome,
                responsavel_cargo: tool.responsavelCargo,
                responsavel_telefone: tool.responsavelTelefone,
            })
            .select()
            .single()

        if (error) throw error

        return {
            id: data.id,
            nome: data.nome,
            codigo: data.codigo,
            obraId: data.obra_id,
            responsavelNome: data.responsavel_nome,
            responsavelCargo: data.responsavel_cargo,
            responsavelTelefone: data.responsavel_telefone,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        }
    },

    async update(id: string, tool: Partial<Tool>): Promise<void> {
        const { error } = await (supabase.from('ferramentas') as any)
            .update({
                nome: tool.nome,
                codigo: tool.codigo,
                obra_id: tool.obraId,
                responsavel_nome: tool.responsavelNome,
                responsavel_cargo: tool.responsavelCargo,
                responsavel_telefone: tool.responsavelTelefone,
            })
            .eq('id', id)

        if (error) throw error
    },

    async delete(id: string): Promise<void> {
        const { error } = await (supabase.from('ferramentas') as any)
            .delete()
            .eq('id', id)

        if (error) throw error
    }
}
