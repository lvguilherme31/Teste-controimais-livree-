import { supabase } from '@/lib/supabase/client'
import { AdicionalHorasExtras } from '@/types'

export const adicionalHorasExtrasService = {
    async getByMesAno(mesAno: string): Promise<AdicionalHorasExtras[]> {
        const { data, error } = await (supabase as any)
            .from('adicional_horas_extras')
            .select('*')
            .eq('mes_ano', mesAno)

        if (error) throw error
        return data || []
    },

    async upsertMany(records: Omit<AdicionalHorasExtras, 'id' | 'created_at'>[]): Promise<void> {
        if (records.length === 0) return

        // Supabase upsert works if we provide the unique constraint columns or an ID. 
        // The implementation plan defined UNIQUE(colaborador_id, mes_ano, dia).
        // So we can use upsert(records, { onConflict: 'colaborador_id, mes_ano, dia' })

        const { error } = await (supabase as any)
            .from('adicional_horas_extras')
            .upsert(records, { onConflict: 'colaborador_id, mes_ano, dia' })

        if (error) throw error
    },

    async upsert(record: Omit<AdicionalHorasExtras, 'id' | 'created_at'>): Promise<AdicionalHorasExtras> {
        // Check if record exists
        const { data: existing, error: searchError } = await (supabase as any)
            .from('adicional_horas_extras')
            .select('id')
            .eq('colaborador_id', record.colaborador_id)
            .eq('mes_ano', record.mes_ano)
            .eq('dia', record.dia)
            .single()

        if (searchError && searchError.code !== 'PGRST116') {
            throw searchError
        }

        if (existing) {
            // Update
            const { data, error } = await (supabase as any)
                .from('adicional_horas_extras')
                .update({
                    horas: record.horas,
                    observacao: record.observacao,
                })
                .eq('id', existing.id)
                .select()
                .single()

            if (error) throw error
            return data
        } else {
            // Insert
            const { data, error } = await (supabase as any)
                .from('adicional_horas_extras')
                .insert(record)
                .select()
                .single()

            if (error) throw error
            return data
        }
    },
}
