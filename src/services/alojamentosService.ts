import { supabase } from '@/lib/supabase/client'
import { Accommodation, AccommodationDocument } from '@/types'
import { addDays } from 'date-fns'

const BUCKET_NAME = 'crm-docs'

// Helper to safely convert dates to ISO string
const safeIsoString = (date?: Date | string | null): string | null => {
  if (!date) return null
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date.toISOString()
  }
  const d = new Date(date)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

export const alojamentosService = {
  async getAll(): Promise<Accommodation[]> {
    const { data: alojamentos, error } = await supabase
      .from('alojamentos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching accommodations:', error)
      throw error
    }

    if (!alojamentos) return []

    // Fetch documents
    const { data: docs, error: docsError } = await supabase
      .from('documentos_alojamentos')
      .select('*')
      .in(
        'alojamento_id',
        alojamentos.map((a) => a.id),
      )

    if (docsError) throw docsError

    return alojamentos.map((a) => {
      const accDocs = docs?.filter((d) => d.alojamento_id === a.id) || []
      const documents: Record<string, AccommodationDocument> = {}

      accDocs.forEach((d: any) => {
        const key = d.tipo as string
        documents[key] = {
          id: d.id,
          name: d.nome_arquivo,
          url: d.url_arquivo,
          uploadDate: new Date(d.data_upload),
          expiry: d.data_validade ? new Date(d.data_validade) : undefined,
          type: d.tipo as any,
        }
      })

      const rawUtilities = a.configuracao_contas as any
      let utilities: any[] = []

      if (Array.isArray(rawUtilities)) {
        utilities = rawUtilities
      } else if (rawUtilities) {
        // Migration for old format
        if (rawUtilities.rent)
          utilities.push({
            id: 'rent',
            type: 'Aluguel',
            value: rawUtilities.rent.value,
            dueDay: rawUtilities.rent.dueDay,
          })
        if (rawUtilities.water)
          utilities.push({
            id: 'water',
            type: 'Água',
            value: rawUtilities.water.value,
            dueDay: rawUtilities.water.dueDay,
          })
        if (rawUtilities.power)
          utilities.push({
            id: 'power',
            type: 'Energia',
            value: rawUtilities.power.value,
            dueDay: rawUtilities.power.dueDay,
          })
      }

      return {
        id: a.id,
        projectId: a.obra_id || '',
        name: a.nome,
        address: a.endereco || '',
        entryDate: a.data_entrada ? new Date(a.data_entrada) : new Date(),
        contractExpiry: a.vencimento_contrato
          ? new Date(a.vencimento_contrato)
          : new Date(),
        status: (a.status as 'active' | 'inactive') || 'active',
        utilities,
        documents,
        // Map new address fields
        cep: (a as any).cep,
        logradouro: (a as any).logradouro,
        numero: (a as any).numero,
        complemento: (a as any).complemento,
        bairro: (a as any).bairro,
        cidade: (a as any).cidade,
        estado: (a as any).estado,
      }
    })
  },

  async getById(id: string): Promise<Accommodation | null> {
    const { data: a, error } = await supabase
      .from('alojamentos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!a) return null

    const { data: docs, error: docsError } = await supabase
      .from('documentos_alojamentos')
      .select('*')
      .eq('alojamento_id', id)

    if (docsError) throw docsError

    const documents: Record<string, AccommodationDocument> = {}

    docs?.forEach((d: any) => {
      const key = d.tipo as string
      documents[key] = {
        id: d.id,
        name: d.nome_arquivo,
        url: d.url_arquivo,
        uploadDate: new Date(d.data_upload),
        expiry: d.data_validade ? new Date(d.data_validade) : undefined,
        type: d.tipo as any,
      }
    })

    const rawUtilities = a.configuracao_contas as any
    let utilities: any[] = []

    if (Array.isArray(rawUtilities)) {
      utilities = rawUtilities
    } else if (rawUtilities) {
      // Migration for old format
      if (rawUtilities.rent)
        utilities.push({
          id: 'rent',
          type: 'Aluguel',
          value: rawUtilities.rent.value,
          dueDay: rawUtilities.rent.dueDay,
        })
      if (rawUtilities.water)
        utilities.push({
          id: 'water',
          type: 'Água',
          value: rawUtilities.water.value,
          dueDay: rawUtilities.water.dueDay,
        })
      if (rawUtilities.power)
        utilities.push({
          id: 'power',
          type: 'Energia',
          value: rawUtilities.power.value,
          dueDay: rawUtilities.power.dueDay,
        })
    }

    return {
      id: a.id,
      projectId: a.obra_id || '',
      name: a.nome,
      address: a.endereco || '',
      entryDate: a.data_entrada ? new Date(a.data_entrada) : new Date(),
      contractExpiry: a.vencimento_contrato
        ? new Date(a.vencimento_contrato)
        : new Date(),
      status: (a.status as 'active' | 'inactive') || 'active',
      utilities,
      documents,
      // Map new address fields
      cep: (a as any).cep,
      logradouro: (a as any).logradouro,
      numero: (a as any).numero,
      complemento: (a as any).complemento,
      bairro: (a as any).bairro,
      cidade: (a as any).cidade,
      estado: (a as any).estado,
    }
  },

  async create(accommodation: Accommodation): Promise<Accommodation> {
    // Format full address for legacy field
    const fullAddress = [
      accommodation.logradouro,
      accommodation.numero,
      accommodation.complemento ? ` - ${accommodation.complemento}` : '',
      accommodation.bairro ? ` - ${accommodation.bairro}` : '',
      accommodation.cidade ? ` - ${accommodation.cidade}` : '',
      accommodation.estado ? `/${accommodation.estado}` : '',
      accommodation.cep ? ` - CEP: ${accommodation.cep}` : '',
    ]
      .filter(Boolean)
      .join(', ')
      .replace(' ,', ',') // Cleanup possible hanging commas from empty fields

    const { data, error } = await supabase
      .from('alojamentos')
      .insert({
        nome: accommodation.name,
        endereco: fullAddress || accommodation.address, // Fallback to raw address if new fields are empty
        obra_id: accommodation.projectId,
        data_entrada: safeIsoString(accommodation.entryDate),
        vencimento_contrato: safeIsoString(accommodation.contractExpiry),
        status: accommodation.status,
        configuracao_contas: accommodation.utilities as any,
        // New fields
        cep: accommodation.cep,
        logradouro: accommodation.logradouro,
        numero: accommodation.numero,
        complemento: accommodation.complemento,
        bairro: accommodation.bairro,
        cidade: accommodation.cidade,
        estado: accommodation.estado,
      } as any)
      .select()
      .single()

    if (error) throw error

    return {
      ...accommodation,
      id: data.id,
      documents: {},
    }
  },

  async update(
    id: string,
    accommodation: Partial<Accommodation>,
  ): Promise<void> {
    // Format full address for legacy field if any address part is updated
    const fullAddress = [
      accommodation.logradouro,
      accommodation.numero,
      accommodation.complemento,
      accommodation.bairro,
      accommodation.cidade,
      accommodation.estado,
      accommodation.cep,
    ].some(v => v !== undefined)
      ? [
        accommodation.logradouro,
        accommodation.numero,
        accommodation.complemento ? ` - ${accommodation.complemento}` : '',
        accommodation.bairro ? ` - ${accommodation.bairro}` : '',
        accommodation.cidade ? ` - ${accommodation.cidade}` : '',
        accommodation.estado ? `/${accommodation.estado}` : '',
        accommodation.cep ? ` - CEP: ${accommodation.cep}` : '',
      ].filter(Boolean)
        .join(', ')
        .replace(' ,', ',')
      : undefined


    const updates: any = {
      nome: accommodation.name,
      obra_id: accommodation.projectId,
      status: accommodation.status,
      configuracao_contas: accommodation.utilities,
      // New fields
      cep: accommodation.cep,
      logradouro: accommodation.logradouro,
      numero: accommodation.numero,
      complemento: accommodation.complemento,
      bairro: accommodation.bairro,
      cidade: accommodation.cidade,
      estado: accommodation.estado,
    }

    if (accommodation.address) updates.endereco = accommodation.address
    if (fullAddress) updates.endereco = fullAddress

    if (accommodation.entryDate)
      updates.data_entrada = safeIsoString(accommodation.entryDate)
    if (accommodation.contractExpiry)
      updates.vencimento_contrato = safeIsoString(accommodation.contractExpiry)

    const { error } = await supabase
      .from('alojamentos')
      .update(updates)
      .eq('id', id)

    if (error) throw error
  },

  async getExpenses(alojamentoId: string) {
    const { data, error } = await supabase
      .from('contas_a_pagar')
      .select('*')
      .eq('alojamento_id', alojamentoId)
      .order('data_vencimento', { ascending: false })

    if (error) throw error
    return data
  },

  async addExpense(expense: any) {
    const { file, ...rest } = expense
    let url_boleto = rest.url_boleto

    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `expenses/${crypto.randomUUID()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file)

      if (uploadError) throw new Error(`Upload falhou: ${uploadError.message}`)

      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName)

      url_boleto = data.publicUrl
    }

    const { data, error } = await supabase
      .from('contas_a_pagar')
      .insert({ ...rest, url_boleto })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateExpense(id: string, updates: any) {
    const { file, ...rest } = updates
    let url_boleto = rest.url_boleto

    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `expenses/${crypto.randomUUID()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file)

      if (uploadError) throw new Error(`Upload falhou: ${uploadError.message}`)

      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName)

      url_boleto = data.publicUrl
    }

    const { data, error } = await supabase
      .from('contas_a_pagar')
      .update({ ...rest, url_boleto })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteExpense(id: string) {
    const { error } = await supabase
      .from('contas_a_pagar')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async upsertDocument(
    alojamentoId: string,
    type: string,
    file: File | null,
    expiry: Date | undefined,
    existingDocId?: string,
  ): Promise<void> {
    const safeType = type.toLowerCase()

    if (existingDocId) {
      const updates: any = {}
      if (expiry !== undefined) {
        updates.data_validade = expiry ? safeIsoString(expiry) : null
      }

      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${alojamentoId}/${safeType}/${crypto.randomUUID()}.${fileExt}`

        // Use arrayBuffer for more reliable upload
        const fileBuffer = await file.arrayBuffer()
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, fileBuffer, {
            contentType: file.type,
            upsert: false
          })

        if (uploadError)
          throw new Error(`Upload falhou: ${uploadError.message}`)

        const { data: publicUrl } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(fileName)

        updates.nome_arquivo = file.name
        updates.url_arquivo = publicUrl.publicUrl
        updates.data_upload = new Date().toISOString()
      }

      const { error } = await supabase
        .from('documentos_alojamentos')
        .update(updates)
        .eq('id', existingDocId)

      if (error) throw new Error(`Erro ao atualizar: ${error.message}`)
    } else {
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${alojamentoId}/${safeType}/${crypto.randomUUID()}.${fileExt}`

      const fileBuffer = await file.arrayBuffer()
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) throw new Error(`Upload falhou: ${uploadError.message}`)

      const { data: publicUrl } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName)

      const { error } = await supabase.from('documentos_alojamentos').insert({
        alojamento_id: alojamentoId,
        tipo: safeType,
        nome_arquivo: file.name,
        url_arquivo: publicUrl.publicUrl,
        data_validade: expiry ? safeIsoString(expiry) : null,
      } as any)

      if (error) throw new Error(`Erro ao salvar: ${error.message}`)
    }
  },

  async delete(id: string): Promise<void> {
    await supabase
      .from('documentos_alojamentos')
      .delete()
      .eq('alojamento_id', id)

    // Delete expenses associated with this accommodation
    await supabase.from('contas_a_pagar').delete().eq('alojamento_id', id)

    const { error } = await supabase.from('alojamentos').delete().eq('id', id)
    if (error) throw error
  },

  async getExpiringDocs(): Promise<any[]> {
    const today = new Date()
    const in30Days = addDays(today, 30)

    const { data, error } = await supabase
      .from('documentos_alojamentos')
      .select(
        `
        id,
        tipo,
        nome_arquivo,
        data_validade,
        alojamento_id,
        alojamento:alojamentos(id, nome)
      `,
      )
      .not('data_validade', 'is', null)
      .lte('data_validade', in30Days.toISOString())
      .order('data_validade', { ascending: true })

    if (error) throw error
    return data || []
  },

  async uploadUtilityDocument(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `utility-docs/${crypto.randomUUID()}.${fileExt}`
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file)

    if (uploadError) throw new Error(`Upload falhou: ${uploadError.message}`)

    const { data: publicUrl } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    return publicUrl.publicUrl
  },

  async getCategories(): Promise<{ id: string; nome: string }[]> {
    const { data, error } = await supabase
      .from('categorias_conta_pagar')
      .select('*')
      .order('nome', { ascending: true })

    if (error) throw error
    return data || []
  },

  async createCategory(nome: string): Promise<{ id: string; nome: string }> {
    const { data, error } = await supabase
      .from('categorias_conta_pagar')
      .insert({ nome })
      .select()
      .single()

    if (error) throw error
    return data
  },
}
