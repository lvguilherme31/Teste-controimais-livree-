import { supabase } from '@/lib/supabase/client'
import { Invoice } from '@/types'

const mapStatusToDb = (status: string) => {
  switch (status) {
    case 'paid':
      return 'pago'
    case 'pending':
      return 'pendente'
    case 'overdue':
      return 'vencido'
    case 'cancelled':
      return 'cancelado'
    default:
      return 'pendente'
  }
}

const mapStatusFromDb = (status: string) => {
  switch (status) {
    case 'pago':
      return 'paid'
    case 'pendente':
      return 'pending'
    case 'vencido':
      return 'overdue'
    case 'cancelado':
      return 'cancelled'
    default:
      return 'pending'
  }
}

export const notasService = {
  async getAll(): Promise<Invoice[]> {
    // We strictly avoid fetching from anexos_notas_fiscais as per user story
    const { data, error } = await supabase
      .from('notas_fiscais')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!data) return []

    return (data as any[]).map((nf) => ({
      id: nf.id,
      number: nf.numero,
      issueDate: nf.data_emissao ? new Date(nf.data_emissao) : new Date(),
      client: nf.cliente_fornecedor || '',
      cnpj: nf.cnpj_cpf || '',
      value: Number(nf.valor || 0),
      dueDate: nf.data_vencimento ? new Date(nf.data_vencimento) : new Date(),
      status: mapStatusFromDb(nf.status as string) as any,
      attachmentUrl: undefined,
      attachmentName: undefined,
      items: Array.isArray(nf.itens) ? (nf.itens as string[]) : [],
      emitterName: nf.emitente_nome || null,
      emitterCnpj: nf.emitente_cnpj || null,
    }))
  },

  async getNextNumber(): Promise<string> {
    const currentYear = new Date().getFullYear().toString()
    const { data, error } = await supabase
      .from('notas_fiscais')
      .select('numero')
      .ilike('numero', `${currentYear}%`)
      .order('numero', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching next number:', error)
      return `${currentYear}0001`
    }

    if (data && data.numero) {
      const lastNumber = parseInt(data.numero)
      if (!isNaN(lastNumber)) {
        return (lastNumber + 1).toString()
      }
    }
    return `${currentYear}0001`
  },

  async create(invoice: Omit<Invoice, 'id'>): Promise<Invoice> {
    const { data: nf, error } = await supabase
      .from('notas_fiscais')
      .insert({
        numero: invoice.number,
        data_emissao: invoice.issueDate.toISOString(),
        cliente_fornecedor: invoice.client,
        cnpj_cpf: invoice.cnpj,
        valor: invoice.value,
        data_vencimento: invoice.dueDate.toISOString(),
        status: mapStatusToDb(invoice.status) as any,
        itens: invoice.items,
        emitente_nome: invoice.emitterName,
        emitente_cnpj: invoice.emitterCnpj,
      })
      .select()
      .single()

    if (error) throw error

    return {
      ...invoice,
      id: nf.id,
    }
  },

  async update(id: string, invoice: Partial<Invoice>): Promise<void> {
    const updates: any = {}
    if (invoice.number) updates.numero = invoice.number
    if (invoice.issueDate)
      updates.data_emissao = invoice.issueDate.toISOString()
    if (invoice.client) updates.cliente_fornecedor = invoice.client
    if (invoice.cnpj) updates.cnpj_cpf = invoice.cnpj
    if (invoice.value !== undefined) updates.valor = invoice.value
    if (invoice.dueDate) updates.data_vencimento = invoice.dueDate.toISOString()
    if (invoice.status) updates.status = mapStatusToDb(invoice.status)
    if (invoice.items) updates.itens = invoice.items
    if (invoice.emitterName !== undefined) updates.emitente_nome = invoice.emitterName
    if (invoice.emitterCnpj !== undefined) updates.emitente_cnpj = invoice.emitterCnpj

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('notas_fiscais')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    }
  },

  async delete(id: string): Promise<void> {
    // Delete attachments first if any exist (legacy cleanup)
    const { data: attachments } = await supabase
      .from('anexos_notas_fiscais')
      .select('url_arquivo')
      .eq('nota_fiscal_id', id)

    if (attachments && attachments.length > 0) {
      // Best effort cleanup
      try {
        const bucketName = 'notas_fiscais'
        for (const att of attachments) {
          if (att.url_arquivo) {
            const url = new URL(att.url_arquivo)
            const path = url.pathname.split(`${bucketName}/`)[1]
            if (path) {
              await supabase.storage
                .from(bucketName)
                .remove([decodeURIComponent(path)])
            }
          }
        }
      } catch (e) {
        console.error('Error cleaning up legacy attachments', e)
      }

      await supabase
        .from('anexos_notas_fiscais')
        .delete()
        .eq('nota_fiscal_id', id)
    }

    const { error } = await supabase.from('notas_fiscais').delete().eq('id', id)
    if (error) throw error
  },

  async generateAndDownloadDocument(invoice: Invoice): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'generate-invoice-pdf',
        {
          body: { id: invoice.id },
        },
      )

      if (error) throw error

      if (!data) throw new Error('No data received from PDF generation service')

      // Create a Blob from the PDF data
      // invoke() returns the parsed body. If response type is application/pdf, it might be returned as Blob or ArrayBuffer depending on client version/config
      // To be safe, we can cast it if needed, but usually Supabase client handles it if we expect blob.
      // However, supabase functions invoke returns `any`.
      // If the response was application/pdf, `data` should be a Blob.

      let blob: Blob
      if (data instanceof Blob) {
        blob = data
      } else {
        // Fallback if it comes as ArrayBuffer or text (rare with correct headers)
        blob = new Blob([data], { type: 'application/pdf' })
      }

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `nota-fiscal-${invoice.number}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Error downloading PDF:', error)
      throw new Error(
        error.message || 'Falha ao gerar o PDF. Tente novamente mais tarde.',
      )
    }
  },
}
