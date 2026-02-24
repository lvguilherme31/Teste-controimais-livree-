import { supabase } from '@/lib/supabase/client'
import { Budget, BudgetAttachment } from '@/types'

const BUCKET_NAME = 'orcamentos'

// Helper to map DB status to App status
const mapStatusFromDb = (status: string | null) => {
  if (!status) return null // Handle null status
  if (status === 'rascunho') return 'draft'
  if (status === 'enviado') return 'sent'
  if (status === 'aprovado') return 'approved'
  if (status === 'rejeitado') return 'rejected'
  if (status === 'pendente') return 'pendente'
  return 'pendente'
}

const mapStatusToDb = (status?: string | null) => {
  if (!status) return null // Handle null status
  if (status === 'draft') return 'rascunho'
  if (status === 'sent') return 'enviado'
  if (status === 'approved') return 'aprovado'
  if (status === 'rejected') return 'rejeitado'
  if (status === 'pendente') return 'pendente'
  return 'pendente'
}

// Helper to upload file using ArrayBuffer to avoid FormData cloning issues
const uploadToStorage = async (fileName: string, file: File) => {
  try {
    const fileBuffer = await file.arrayBuffer()
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })
    return { data, error }
  } catch (error: any) {
    return { data: null, error }
  }
}

export const orcamentosService = {
  async getAll(): Promise<Budget[]> {
    const { data: budgets, error } = await supabase
      .from('orcamentos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!budgets) return []

    // Fetch attachments
    const { data: attachments, error: attError } = await supabase
      .from('anexos_orcamentos')
      .select('*')
      .in(
        'orcamento_id',
        budgets.map((b) => b.id),
      )

    if (attError) throw attError

    return budgets.map((b: any) => {
      const budgetAttachments = attachments
        ?.filter((a) => a.orcamento_id === b.id)
        .map((a) => ({
          id: a.id,
          name: a.nome_arquivo,
          url: a.url_arquivo,
          date: new Date(a.data_upload),
        }))

      return {
        id: b.id,
        visualId: b.codigo_visual || b.id, // Fallback to UUID if no visual code
        client: b.cliente || '',
        location: b.local_obra || '',
        projectId: b.obra_id || undefined,
        description: b.descricao || '',
        // Use data_criacao if available, otherwise fallback to created_at
        date: b.data_criacao
          ? new Date(b.data_criacao)
          : new Date(b.created_at),
        totalValue: b.valor_total || 0,
        status: mapStatusFromDb(b.status) as any,
        attachments: budgetAttachments || [],
        cnpj: b.cnpj || '',
        street: b.rua || '',
        neighborhood: b.bairro || '',
        city: b.cidade || '',
        state: b.estado || '',
      }
    })
  },

  async getNextNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const { data, error } = await supabase
      .from('orcamentos')
      .select('codigo_visual')
      .ilike('codigo_visual', `ORC-${year}-%`)
      .order('codigo_visual', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching next budget number:', error)
      return `ORC-${year}-001`
    }

    if (data && data.codigo_visual) {
      const parts = data.codigo_visual.split('-')
      if (parts.length === 3) {
        const lastNum = parseInt(parts[2])
        if (!isNaN(lastNum)) {
          return `ORC-${year}-${String(lastNum + 1).padStart(3, '0')}`
        }
      }
    }
    return `ORC-${year}-001`
  },

  async create(budget: Omit<Budget, 'id'>, files: File[]): Promise<Budget> {
    // Construct location string fallback if needed
    const addressParts = [
      budget.street,
      budget.neighborhood,
      budget.city,
      budget.state,
    ].filter(Boolean)
    const fallbackLocation =
      addressParts.length > 0 ? addressParts.join(', ') : budget.location

    const { data: newBudget, error } = await supabase
      .from('orcamentos')
      .insert({
        codigo_visual: budget.visualId,
        cliente: budget.client ?? null,
        local_obra: fallbackLocation ?? null,
        obra_id: budget.projectId ?? null,
        descricao: budget.description ?? null,
        data_criacao: budget.date ? budget.date.toISOString() : null,
        valor_total: budget.totalValue ?? null,
        status: mapStatusToDb(budget.status) as any,
        cnpj: budget.cnpj ?? null,
        rua: budget.street ?? null,
        bairro: budget.neighborhood ?? null,
        cidade: budget.city ?? null,
        estado: budget.state ?? null,
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating budget:', error)
      throw error
    }

    // Handle File Uploads
    const attachments: BudgetAttachment[] = []
    if (files.length > 0) {
      for (const file of files) {
        try {
          const att = await this.uploadAttachment(newBudget.id, file)
          attachments.push(att)
        } catch (e) {
          console.error(
            `Failed to upload attachment ${file.name} for budget ${newBudget.id}`,
            e,
          )
        }
      }
    }

    return {
      ...budget,
      id: newBudget.id,
      visualId: newBudget.codigo_visual || '',
      attachments,
    }
  },

  async update(
    id: string,
    budget: Partial<Budget>,
    newFiles: File[],
  ): Promise<void> {
    const updates: any = {}
    if (budget.client !== undefined) updates.cliente = budget.client
    if (budget.location !== undefined) updates.local_obra = budget.location
    if (budget.projectId !== undefined) updates.obra_id = budget.projectId
    if (budget.description !== undefined) updates.descricao = budget.description
    if (budget.date !== undefined)
      updates.data_criacao = budget.date ? budget.date.toISOString() : null
    if (budget.totalValue !== undefined) updates.valor_total = budget.totalValue
    if (budget.status !== undefined)
      updates.status = mapStatusToDb(budget.status)
    if (budget.cnpj !== undefined) updates.cnpj = budget.cnpj

    if (budget.street !== undefined) updates.rua = budget.street
    if (budget.neighborhood !== undefined) updates.bairro = budget.neighborhood
    if (budget.city !== undefined) updates.cidade = budget.city
    if (budget.state !== undefined) updates.estado = budget.state

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('orcamentos')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    }

    // Upload new files
    if (newFiles.length > 0) {
      for (const file of newFiles) {
        try {
          await this.uploadAttachment(id, file)
        } catch (e) {
          console.error(`Failed to upload attachment ${file.name}`, e)
        }
      }
    }
  },

  async delete(id: string): Promise<void> {
    // Delete attachments first
    const { data: attachments } = await supabase
      .from('anexos_orcamentos')
      .select('id')
      .eq('orcamento_id', id)

    if (attachments) {
      for (const att of attachments) {
        await this.deleteAttachment(att.id)
      }
    }

    const { error } = await supabase.from('orcamentos').delete().eq('id', id)
    if (error) throw error
  },

  async uploadAttachment(
    budgetId: string,
    file: File,
  ): Promise<BudgetAttachment> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${budgetId}/${crypto.randomUUID()}.${fileExt}`

    const { error: uploadError } = await uploadToStorage(fileName, file)

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

    const { data: publicUrl } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    const { data: attachment, error: dbError } = await supabase
      .from('anexos_orcamentos')
      .insert({
        orcamento_id: budgetId,
        nome_arquivo: file.name,
        url_arquivo: publicUrl.publicUrl,
        data_upload: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) throw new Error(`Database insert failed: ${dbError.message}`)

    return {
      id: attachment.id,
      name: attachment.nome_arquivo,
      url: attachment.url_arquivo,
      date: new Date(attachment.data_upload),
    }
  },

  async deleteAttachment(attachmentId: string): Promise<void> {
    const { data: att, error: fetchError } = await supabase
      .from('anexos_orcamentos')
      .select('url_arquivo')
      .eq('id', attachmentId)
      .single()

    if (fetchError) throw fetchError

    if (att?.url_arquivo) {
      try {
        const url = new URL(att.url_arquivo)
        const path = url.pathname.split(`${BUCKET_NAME}/`)[1]
        if (path) {
          await supabase.storage
            .from(BUCKET_NAME)
            .remove([decodeURIComponent(path)])
        }
      } catch (e) {
        console.error('Error parsing URL for deletion', e)
      }
    }

    const { error } = await supabase
      .from('anexos_orcamentos')
      .delete()
      .eq('id', attachmentId)

    if (error) throw error
  },
}
