import { supabase } from '@/lib/supabase/client'
import { EmployeePayment, Payslip } from '@/types'

const BUCKET_NAME = 'crm-docs'

// Helper to safely convert dates to ISO string
const safeIsoDate = (date?: Date | string | null): string | null => {
    if (!date) return null
    if (date instanceof Date) {
        return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0]
    }
    const d = new Date(date)
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
}

export const pagamentosService = {
    async getAll(): Promise<EmployeePayment[]> {
        const { data, error } = await (supabase as any)
            .from('pagamentos_colaboradores')
            .select('*')
            .order('mes_referencia', { ascending: false })

        if (error) throw error
        return (data || []).map((item: any) => ({
            id: item.id,
            colaboradorId: item.colaborador_id,
            mesReferencia: item.mes_referencia,
            valorAPagar: item.valor_a_pagar,
            status: item.status,
            dataPagamento: item.data_pagamento ? new Date(item.data_pagamento) : undefined,
            observacoes: item.observacoes,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
        }))
    },

    async create(payment: Omit<EmployeePayment, 'id'>): Promise<EmployeePayment> {
        const { data, error } = await (supabase as any)
            .from('pagamentos_colaboradores')
            .insert({
                colaborador_id: payment.colaboradorId,
                mes_referencia: payment.mesReferencia,
                valor_a_pagar: payment.valorAPagar,
                status: payment.status,
                data_pagamento: safeIsoDate(payment.dataPagamento),
                observacoes: payment.observacoes,
            })
            .select()
            .single()

        if (error) throw error
        return {
            ...payment,
            id: data.id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        }
    },

    async update(id: string, payment: Partial<EmployeePayment>): Promise<void> {
        const updates: any = {}
        if (payment.mesReferencia !== undefined) updates.mes_referencia = payment.mesReferencia
        if (payment.valorAPagar !== undefined) updates.valor_a_pagar = payment.valorAPagar
        if (payment.status !== undefined) updates.status = payment.status
        if (payment.dataPagamento !== undefined) updates.data_pagamento = safeIsoDate(payment.dataPagamento)
        if (payment.observacoes !== undefined) updates.observacoes = payment.observacoes

        const { error } = await (supabase as any)
            .from('pagamentos_colaboradores')
            .update(updates)
            .eq('id', id)

        if (error) throw error
    },

    async delete(id: string): Promise<void> {
        const { error } = await (supabase as any)
            .from('pagamentos_colaboradores')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    async getPayslips(colaboradorId: string): Promise<Payslip[]> {
        const { data, error } = await (supabase as any)
            .from('holerites')
            .select('*')
            .eq('colaborador_id', colaboradorId)
            .order('mes_referencia', { ascending: false })

        if (error) throw error
        return (data || []).map((item: any) => ({
            id: item.id,
            colaboradorId: item.colaborador_id,
            mesReferencia: item.mes_referencia,
            urlArquivo: item.url_arquivo,
            nomeArquivo: item.nome_arquivo,
            createdAt: item.created_at,
        }))
    },

    async uploadPayslip(colaboradorId: string, mesReferencia: string, file: File): Promise<Payslip> {
        const fileExt = file.name.split('.').pop()
        const fileName = `holerites/${colaboradorId}/${mesReferencia}/${crypto.randomUUID()}.${fileExt}`

        const fileBuffer = await file.arrayBuffer()
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, fileBuffer, {
                contentType: file.type,
                upsert: false
            })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName)

        const { data, error } = await (supabase as any)
            .from('holerites')
            .insert({
                colaborador_id: colaboradorId,
                mes_referencia: mesReferencia,
                url_arquivo: publicUrl,
                nome_arquivo: file.name,
            })
            .select()
            .single()

        if (error) throw error

        return {
            id: data.id,
            colaboradorId: data.colaborador_id,
            mesReferencia: data.mes_referencia,
            urlArquivo: data.url_arquivo,
            nomeArquivo: data.nome_arquivo,
            createdAt: data.created_at,
        }
    },

    async deletePayslip(id: string, urlArquivo: string): Promise<void> {
        const path = urlArquivo.split(`${BUCKET_NAME}/`).pop()
        if (path) {
            await supabase.storage.from(BUCKET_NAME).remove([path])
        }

        const { error } = await (supabase as any)
            .from('holerites')
            .delete()
            .eq('id', id)

        if (error) throw error
    }
}
