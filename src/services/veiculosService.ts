import { supabase } from '@/lib/supabase/client'
import { Vehicle, VehicleDocument } from '@/types'
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

// Helper to upload file using ArrayBuffer to avoid FormData cloning issues
const uploadToStorage = async (fileName: string, file: File) => {
  const fileBuffer = await file.arrayBuffer()
  return supabase.storage.from(BUCKET_NAME).upload(fileName, fileBuffer, {
    contentType: file.type,
    upsert: false,
  })
}

export const veiculosService = {
  async getAll(): Promise<Vehicle[]> {
    const { data, error } = (await supabase
      .from('veiculos')
      .select('*')
      .order('created_at', { ascending: false })) as any

    if (error) {
      console.error('Error fetching vehicles:', error)
      throw error
    }

    if (!data) return []

    // Fetch documents
    const { data: docs, error: docsError } = await supabase
      .from('documentos_veiculos')
      .select('*')
      .in(
        'veiculo_id',
        data.map((v) => v.id),
      )

    if (docsError) throw docsError

    return data.map((v) => {
      const vDocs = docs?.filter((d) => d.veiculo_id === v.id) || []
      const documents: Record<string, VehicleDocument> = {}

      vDocs.forEach((d) => {
        let key = d.tipo
        if (documents[key]) {
          key = `${d.tipo}_${d.id}`
        }

        documents[key] = {
          id: d.id,
          name: d.nome_arquivo,
          url: d.url_arquivo,
          uploadDate: new Date(d.data_upload),
          expiry: d.data_validade ? new Date(d.data_validade) : undefined,
          type: d.tipo,
        }
      })

      const crlv = vDocs?.find((d) => d.tipo === 'crlv')

      return {
        id: v.id,
        brand: v.marca || '',
        model: v.modelo || '',
        plate: v.placa,
        projectId: v.obra_id || undefined,
        status: (v.status as any) || 'ativo',
        documentUrl: crlv?.url_arquivo,
        documentExpiry: crlv?.data_validade
          ? new Date(crlv.data_validade)
          : undefined,
        documents,
        pneuEstado: v.pneu_estado,
        pneuDataTroca: v.pneu_data_troca ? new Date(v.pneu_data_troca) : undefined,
        bateriaSerie: v.bateria_serie,
        bateriaAmperagem: v.bateria_amperagem,
        bateriaDataTroca: v.bateria_data_troca ? new Date(v.bateria_data_troca) : undefined,
      }
    })
  },

  async getById(id: string): Promise<Vehicle | null> {
    const { data: v, error } = (await supabase
      .from('veiculos')
      .select('*')
      .eq('id', id)
      .single()) as any

    if (error) throw error
    if (!v) return null

    const { data: docs, error: docsError } = await supabase
      .from('documentos_veiculos')
      .select('*')
      .eq('veiculo_id', id)

    if (docsError) throw docsError

    const documents: Record<string, VehicleDocument> = {}

    docs?.forEach((d) => {
      let key = d.tipo
      if (documents[key]) {
        key = `${d.tipo}_${d.id}`
      }

      documents[key] = {
        id: d.id,
        name: d.nome_arquivo,
        url: d.url_arquivo,
        uploadDate: new Date(d.data_upload),
        expiry: d.data_validade ? new Date(d.data_validade) : undefined,
        type: d.tipo,
      }
    })

    const crlv = docs?.find((d) => d.tipo === 'crlv')

    return {
      id: v.id,
      brand: v.marca || '',
      model: v.modelo || '',
      plate: v.placa,
      projectId: v.obra_id || undefined,
      status: (v.status as any) || 'ativo',
      documentUrl: crlv?.url_arquivo,
      documentExpiry: crlv?.data_validade
        ? new Date(crlv.data_validade)
        : undefined,
      documents,
      pneuEstado: v.pneu_estado,
      pneuDataTroca: v.pneu_data_troca ? new Date(v.pneu_data_troca) : undefined,
      bateriaSerie: v.bateria_serie,
      bateriaAmperagem: v.bateria_amperagem,
      bateriaDataTroca: v.bateria_data_troca ? new Date(v.bateria_data_troca) : undefined,
    }
  },

  async create(vehicle: Vehicle): Promise<Vehicle> {
    const { data, error } = (await supabase
      .from('veiculos')
      .insert({
        marca: vehicle.brand,
        modelo: vehicle.model,
        placa: vehicle.plate,
        obra_id: vehicle.projectId || null,
        status: vehicle.status || 'ativo',
        pneu_estado: vehicle.pneuEstado,
        pneu_data_troca: safeIsoString(vehicle.pneuDataTroca),
        bateria_serie: vehicle.bateriaSerie,
        bateria_amperagem: vehicle.bateriaAmperagem,
        bateria_data_troca: safeIsoString(vehicle.bateriaDataTroca),
      })
      .select()
      .single()) as any

    if (error) throw error

    return {
      id: data.id,
      brand: data.marca || '',
      model: data.modelo || '',
      plate: data.placa,
      projectId: data.obra_id || undefined,
      status: (data.status as any) || 'ativo',
      documents: {},
      pneuEstado: data.pneu_estado,
      pneuDataTroca: data.pneu_data_troca ? new Date(data.pneu_data_troca) : undefined,
      bateriaSerie: data.bateria_serie,
      bateriaAmperagem: data.bateria_amperagem,
      bateriaDataTroca: data.bateria_data_troca ? new Date(data.bateria_data_troca) : undefined,
    }
  },

  async update(id: string, vehicle: Partial<Vehicle>): Promise<void> {
    const updates: any = {
      marca: vehicle.brand,
      modelo: vehicle.model,
      placa: vehicle.plate,
      obra_id: vehicle.projectId,
      status: vehicle.status,
      pneu_estado: vehicle.pneuEstado,
      pneu_data_troca: vehicle.pneuDataTroca !== undefined ? safeIsoString(vehicle.pneuDataTroca) : undefined,
      bateria_serie: vehicle.bateriaSerie,
      bateria_amperagem: vehicle.bateriaAmperagem,
      bateria_data_troca: vehicle.bateriaDataTroca !== undefined ? safeIsoString(vehicle.bateriaDataTroca) : undefined,
    }

    const { error } = await supabase
      .from('veiculos')
      .update(updates)
      .eq('id', id)
    if (error) throw error
  },

  async upsertDocument(
    vehicleId: string,
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
        const fileName = `${vehicleId}/${safeType}/${crypto.randomUUID()}.${fileExt}`

        const { error: uploadError } = await uploadToStorage(fileName, file)

        if (uploadError)
          throw new Error(`Upload falhou: ${uploadError.message}`)

        const { data: publicUrl } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(fileName)

        updates.nome_arquivo = file.name
        updates.url_arquivo = publicUrl.publicUrl
        updates.data_upload = new Date().toISOString()
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('documentos_veiculos')
          .update(updates)
          .eq('id', existingDocId)

        if (error) throw new Error(`Erro ao atualizar: ${error.message}`)
      }
    } else {
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${vehicleId}/${safeType}/${crypto.randomUUID()}.${fileExt}`

      const { error: uploadError } = await uploadToStorage(fileName, file)

      if (uploadError) throw new Error(`Upload falhou: ${uploadError.message}`)

      const { data: publicUrl } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName)

      const { error } = await supabase.from('documentos_veiculos').insert({
        veiculo_id: vehicleId,
        // @ts-expect-error
        tipo: safeType,
        nome_arquivo: file.name,
        url_arquivo: publicUrl.publicUrl,
        data_validade: expiry ? safeIsoString(expiry) : null,
      })

      if (error) throw new Error(`Erro ao salvar: ${error.message}`)
    }
  },

  async delete(id: string): Promise<void> {
    await supabase.from('documentos_veiculos').delete().eq('veiculo_id', id)
    const { error } = await supabase.from('veiculos').delete().eq('id', id)
    if (error) throw error
  },

  async getExpiringDocs(): Promise<any[]> {
    const today = new Date()
    const in30Days = addDays(today, 30)

    const { data, error } = await supabase
      .from('documentos_veiculos')
      .select(
        `
        id,
        tipo,
        nome_arquivo,
        data_validade,
        veiculo_id,
        veiculo:veiculos(id, placa, modelo)
      `,
      )
      .not('data_validade', 'is', null)
      .order('data_validade', { ascending: true })

    if (error) throw error
    return data || []
  },
}
