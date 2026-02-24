import { supabase } from '@/lib/supabase/client'
import {
  Project,
  ProjectStatus,
  ProjectContract,
  ProjectHistory,
} from '@/types'
import { addDays } from 'date-fns'

const BUCKET_NAME = 'crm-docs'

const ALLOWED_DOC_TYPES = [
  'contrato',
  'pgr',
  'pcmso',
  'art',
  'seguro',
  'cno',
  'cnpj',
  'alvara',
  'licenca_ambiental',
  'outros',
]

export interface ContractUploadData {
  file?: File
  expiry?: Date
  value?: number
  description?: string
  id?: string
  name?: string
}

export interface ProjectDocumentUpload {
  type: string
  file?: File
  expiry?: Date
  description?: string
  id?: string
}

// Helper to safely convert dates to ISO string
const safeIsoString = (date?: Date | string | null): string | null => {
  if (!date) return null
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date.toISOString()
  }
  // Try to parse string
  const d = new Date(date)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

// Helper to format description for missing files
const formatDescription = (
  description: string | undefined,
  hasFile: boolean,
): string => {
  if (hasFile) return description || ''
  const desc = description || ''
  if (!desc.trim()) return 'Não possui anexo'
  if (desc.startsWith('[SEM ANEXO]')) return desc
  return `[SEM ANEXO] ${desc}`
}

// Helper to upload file using ArrayBuffer to avoid FormData cloning issues
const uploadToStorage = async (fileName: string, file: File) => {
  const fileBuffer = await file.arrayBuffer()
  return supabase.storage.from(BUCKET_NAME).upload(fileName, fileBuffer, {
    contentType: file.type,
    upsert: false,
  })
}

export const obrasService = {
  async getAll(): Promise<Project[]> {
    const { data: obras, error: obrasError } = await supabase
      .from('obras')
      .select('*')
      .order('created_at', { ascending: false })

    if (obrasError) throw obrasError
    if (!obras) return []

    // Fetch all documents for these obras
    const { data: docs, error: docsError } = await supabase
      .from('documentos_obras')
      .select('*')
      .in(
        'obra_id',
        obras.map((o) => o.id),
      )

    if (docsError) throw docsError

    return obras.map((obra) => {
      const obraDocs = docs?.filter((d) => d.obra_id === obra.id) || []
      const documents: Project['documents'] = {}
      const contracts: ProjectContract[] = []

      obraDocs.forEach((d) => {
        if (d.tipo === 'contrato') {
          contracts.push({
            id: d.id,
            name: d.nome_arquivo || 'Contrato (Sem Anexo)',
            url: d.url_arquivo || undefined,
            date: new Date(d.data_upload),
            expiry: d.data_validade ? new Date(d.data_validade) : undefined,
            value: d.valor || 0,
            description: d.descricao || undefined,
          })
        } else {
          let key = d.tipo
          // If duplicate types exist (e.g. multiple 'outros'), ensure unique key
          if (documents[key]) {
            key = `${d.tipo}_${d.id}`
          }

          documents[key] = {
            id: d.id,
            name: d.nome_arquivo || 'Sem Anexo',
            url: d.url_arquivo || undefined,
            uploadDate: new Date(d.data_upload),
            expiry: d.data_validade ? new Date(d.data_validade) : undefined,
            type: d.tipo,
            value: d.valor || undefined,
            description: d.descricao || undefined,
          }
        }
      })

      return {
        id: obra.id,
        name: obra.nome,
        cnpj: obra.cnpj || '',
        address: obra.endereco || '',
        city: obra.cidade || '',
        state: obra.estado || '',
        client: obra.cliente || '',
        contractValue: obra.valor_contrato || 0,
        startDate: obra.data_inicio ? new Date(obra.data_inicio) : undefined,
        predictedEndDate: obra.previsao_termino
          ? new Date(obra.previsao_termino)
          : undefined,
        status: (obra.status as ProjectStatus) || 'ativa',
        documents,
        contracts,
      }
    })
  },

  async getById(id: string): Promise<Project | null> {
    const { data: obra, error: obraError } = await supabase
      .from('obras')
      .select('*')
      .eq('id', id)
      .single()

    if (obraError) throw obraError
    if (!obra) return null

    const { data: docs, error: docsError } = await supabase
      .from('documentos_obras')
      .select('*')
      .eq('obra_id', id)

    if (docsError) throw docsError

    const documents: Project['documents'] = {}
    const contracts: ProjectContract[] = []

    docs?.forEach((d) => {
      if (d.tipo === 'contrato') {
        contracts.push({
          id: d.id,
          name: d.nome_arquivo || 'Contrato (Sem Anexo)',
          url: d.url_arquivo || undefined,
          date: new Date(d.data_upload),
          expiry: d.data_validade ? new Date(d.data_validade) : undefined,
          value: d.valor || 0,
          description: d.descricao || undefined,
        })
      } else {
        let key = d.tipo
        if (documents[key]) {
          key = `${d.tipo}_${d.id}`
        }

        documents[key] = {
          id: d.id,
          name: d.nome_arquivo || 'Sem Anexo',
          url: d.url_arquivo || undefined,
          uploadDate: new Date(d.data_upload),
          expiry: d.data_validade ? new Date(d.data_validade) : undefined,
          type: d.tipo,
          value: d.valor || undefined,
          description: d.descricao || undefined,
        }
      }
    })

    return {
      id: obra.id,
      name: obra.nome,
      cnpj: obra.cnpj || '',
      address: obra.endereco || '',
      city: obra.cidade || '',
      state: obra.estado || '',
      client: obra.cliente || '',
      contractValue: obra.valor_contrato || 0,
      startDate: obra.data_inicio ? new Date(obra.data_inicio) : undefined,
      predictedEndDate: obra.previsao_termino
        ? new Date(obra.previsao_termino)
        : undefined,
      status: (obra.status as ProjectStatus) || 'ativa',
      documents,
      contracts,
    }
  },

  async getExpiringDocs(): Promise<any[]> {
    const today = new Date()
    const in30Days = addDays(today, 30)

    const { data, error } = await supabase
      .from('documentos_obras')
      .select(
        `
        id,
        tipo,
        nome_arquivo,
        data_validade,
        obra_id,
        obra:obras(id, nome)
      `,
      )
      .not('data_validade', 'is', null)
      .order('data_validade', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getHistory(obraId: string): Promise<ProjectHistory[]> {
    const { data, error } = await supabase
      .from('historico_alteracoes')
      .select(
        `
        *,
        usuario:usuario_id(email)
      `,
      )
      .eq('obra_id', obraId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // @ts-expect-error - Accessing join result property
    return data.map((log) => ({
      id: log.id,
      obraId: log.obra_id,
      userId: log.usuario_id,
      field: log.campo_alterado,
      oldValue: log.valor_antigo,
      newValue: log.valor_novo,
      createdAt: new Date(log.created_at),
      // @ts-expect-error - Accessing join result property
      userName: log.usuario?.email || 'Visitante',
    }))
  },

  async deleteDocument(docId: string): Promise<void> {
    const { data: doc, error: fetchError } = await supabase
      .from('documentos_obras')
      .select('url_arquivo, obra_id')
      .eq('id', docId)
      .single()

    if (fetchError) {
      console.error('Error fetching document for deletion:', fetchError)
      throw new Error(`Erro ao buscar documento: ${fetchError.message}`)
    }

    if (doc?.url_arquivo) {
      try {
        const url = new URL(doc.url_arquivo)
        const path = url.pathname.split(`${BUCKET_NAME}/`)[1]
        if (path) {
          const { error: storageError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([decodeURIComponent(path)])

          if (storageError) {
            console.warn('Could not delete file from storage:', storageError)
          }
        }
      } catch (e) {
        console.error('Error parsing URL for deletion', e)
      }
    }

    const { error } = await supabase
      .from('documentos_obras')
      .delete()
      .eq('id', docId)

    if (error) {
      throw new Error(`Erro ao excluir documento do banco: ${error.message}`)
    }
  },

  async create(
    project: Omit<Project, 'id'>,
    files: {
      documents: ProjectDocumentUpload[]
      contracts: ContractUploadData[]
    },
  ): Promise<Project> {
    const { data: obra, error: obraError } = await supabase
      .from('obras')
      .insert({
        nome: project.name,
        cnpj: project.cnpj || null,
        endereco: project.address,
        cidade: project.city,
        estado: project.state,
        cliente: project.client || null,
        valor_contrato: project.contractValue,
        data_inicio: safeIsoString(project.startDate),
        previsao_termino: safeIsoString(project.predictedEndDate),
        status: project.status,
      })
      .select()
      .single()

    if (obraError) {
      console.error('Error creating obra:', obraError)
      throw new Error(`Erro ao criar obra: ${obraError.message}`)
    }

    const promises = []
    for (const doc of files.documents) {
      if (doc.file) {
        promises.push(
          this.uploadAndSaveDoc(
            obra.id,
            doc.type,
            doc.file,
            doc.expiry,
            undefined, // value
            doc.description,
          ),
        )
      }
    }

    for (const contract of files.contracts) {
      // Allow contract saving if file exists OR if it's implicitly valid (contracts without file allowed)
      const hasFile = !!contract.file
      const description = formatDescription(contract.description, hasFile)

      promises.push(
        this.uploadAndSaveDoc(
          obra.id,
          'contrato',
          contract.file || null,
          contract.expiry,
          contract.value,
          description,
        ),
      )
    }

    await Promise.all(promises)
    const created = await this.getById(obra.id)
    if (!created) throw new Error('Falha ao recuperar obra criada')
    return created
  },

  async update(
    id: string,
    project: Partial<Project>,
    files: {
      documents: ProjectDocumentUpload[]
      contracts: ContractUploadData[]
    },
  ): Promise<void> {
    const updatePayload: any = {
      nome: project.name,
      cnpj: project.cnpj || null,
      endereco: project.address,
      cidade: project.city,
      estado: project.state,
      cliente: project.client,
      valor_contrato: project.contractValue,
      status: project.status,
    }

    if (project.startDate !== undefined) {
      updatePayload.data_inicio = safeIsoString(project.startDate)
    }
    if (project.predictedEndDate !== undefined) {
      updatePayload.previsao_termino = safeIsoString(project.predictedEndDate)
    }

    const { error: obraError } = await supabase
      .from('obras')
      .update(updatePayload)
      .eq('id', id)

    if (obraError) {
      console.error('Error updating obra:', obraError)
      throw new Error(`Erro ao atualizar obra: ${obraError.message}`)
    }

    for (const doc of files.documents) {
      if (doc.file) {
        await this.uploadAndSaveDoc(
          id,
          doc.type,
          doc.file,
          doc.expiry,
          undefined, // value
          doc.description,
        )
      } else if (doc.id) {
        const updates: any = {}
        if (doc.expiry !== undefined)
          updates.data_validade = doc.expiry ? safeIsoString(doc.expiry) : null
        if (doc.description !== undefined) updates.descricao = doc.description

        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from('documentos_obras')
            .update(updates)
            .eq('id', doc.id)
          if (error)
            console.error(`Erro ao atualizar doc ${doc.id}: ${error.message}`)
        }
      }
    }

    for (const contract of files.contracts) {
      // Logic:
      // 1. If it's a new contract (no ID), create it (with or without file).
      // 2. If it's an existing contract (has ID):
      //    a. If file is provided, upload and update (or add new version if logic requires, but here we add new).
      //    b. If no file, just update metadata.

      if (!contract.id) {
        // New contract (with or without file)
        const hasFile = !!contract.file
        const description = formatDescription(contract.description, hasFile)

        await this.uploadAndSaveDoc(
          id,
          'contrato',
          contract.file || null,
          contract.expiry,
          contract.value,
          description,
        )
      } else {
        // Existing contract
        if (contract.file) {
          // If a file is uploaded for an existing contract row, we currently treat it as adding a new document
          // based on previous logic pattern, OR we could replace.
          // The previous code was: if (contract.file) await uploadAndSaveDoc(...)
          // This implies adding a new row (because uploadAndSaveDoc does INSERT).
          // We will maintain this behavior for safety, or we should update?
          // Given the structure, likely intended to be a new attachment or replacement.
          // Since uploadAndSaveDoc does INSERT, let's keep it consistent.
          const description = contract.description || '' // Keep original description logic for updates with file
          await this.uploadAndSaveDoc(
            id,
            'contrato',
            contract.file,
            contract.expiry,
            contract.value,
            description,
          )
        } else {
          // Metadata update only
          const updates: any = {}
          if (contract.expiry)
            updates.data_validade = contract.expiry.toISOString()
          if (contract.value !== undefined) updates.valor = contract.value
          if (contract.description !== undefined)
            updates.descricao = contract.description

          if (Object.keys(updates).length > 0) {
            await supabase
              .from('documentos_obras')
              .update(updates)
              .eq('id', contract.id)
          }
        }
      }
    }
  },

  async delete(id: string): Promise<void> {
    await Promise.all([
      supabase.from('veiculos').update({ obra_id: null }).eq('obra_id', id),
      supabase.from('alojamentos').update({ obra_id: null }).eq('obra_id', id),
      supabase.from('orcamentos').update({ obra_id: null }).eq('obra_id', id),
      supabase
        .from('contas_a_pagar')
        .update({ obra_id: null })
        .eq('obra_id', id),
    ])

    await supabase.from('documentos_obras').delete().eq('obra_id', id)
    await supabase.from('historico_alteracoes').delete().eq('obra_id', id)

    const { error } = await supabase.from('obras').delete().eq('id', id)
    if (error) {
      console.error('Error deleting obra:', error)
      throw new Error(`Erro ao excluir obra: ${error.message}`)
    }
  },

  async uploadAndSaveDoc(
    obraId: string,
    type: string,
    file: File | null,
    expiry?: Date,
    value?: number,
    description?: string,
  ) {
    let publicUrl = null
    let fileName = null

    if (file) {
      const fileExt = file.name.split('.').pop()
      fileName = file.name
      const storagePath = `${obraId}/${type}/${crypto.randomUUID()}.${fileExt}`

      const { error: uploadError } = await uploadToStorage(storagePath, file)

      if (uploadError) {
        console.error('Error uploading file:', uploadError)
        throw new Error(`Erro no upload: ${uploadError.message}`)
      }

      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath)

      publicUrl = data.publicUrl
    }

    let safeType = type.toLowerCase()
    if (!ALLOWED_DOC_TYPES.includes(safeType)) {
      safeType = 'outros'
    }

    const { error: dbError } = await supabase.from('documentos_obras').insert({
      obra_id: obraId,
      // @ts-expect-error - Dynamic type
      tipo: safeType,
      nome_arquivo: fileName, // Can be null now
      url_arquivo: publicUrl, // Can be null now
      data_validade: expiry ? safeIsoString(expiry) : null,
      valor: value,
      descricao: description,
    })

    if (dbError) {
      console.error('Error saving document metadata:', dbError)
      throw new Error(`Erro ao salvar documento: ${dbError.message}`)
    }
  },
}
