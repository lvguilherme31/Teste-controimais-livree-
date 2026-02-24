import { supabase } from '@/lib/supabase/client'
import { Employee, EmployeeStatus, EmployeeDocument } from '@/types'
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

export const colaboradoresService = {
  async getAll(): Promise<Employee[]> {
    const { data: employees, error } = await supabase
      .from('colaboradores')
      .select('*')
      .order('nome', { ascending: true })

    if (error) throw error
    if (!employees) return []

    // Fetch documents
    const { data: docs, error: docsError } = await supabase
      .from('documentos_admissao')
      .select('*')
      .in(
        'colaborador_id',
        employees.map((e) => e.id),
      )

    if (docsError) throw docsError

    return employees.map((e: any) => {
      const empDocs = docs?.filter((d) => d.colaborador_id === e.id) || []
      const documents: Record<string, EmployeeDocument> = {}

      empDocs.forEach((d) => {
        let key = d.tipo
        // Handle duplicates if necessary, though type should be unique usually
        if (documents[key]) {
          key = `${d.tipo}_${d.id}` as any
        }

        documents[key] = {
          id: d.id,
          name: d.nome_arquivo,
          url: d.url_arquivo,
          uploadDate: new Date(d.data_upload),
          expiry: d.data_validade ? new Date(d.data_validade) : undefined,
          type: d.tipo,
          description: d.descricao,
        }
      })

      // Fix for legacy vs new address fields fallback
      const street = e.logradouro !== null ? e.logradouro : e.endereco || ''

      return {
        id: e.id,
        name: e.nome,
        cpf: e.cpf || '',
        rg: e.rg || '',
        phone: e.telefone || '',
        email: e.email || '',
        street: street,
        number: e.numero || '',
        neighborhood: e.bairro || '',
        city: e.cidade || '',
        state: e.uf || '',
        emergencyContact: {
          name: e.contato_emergencia_nome || '',
          phone: e.contato_emergencia_telefone || '',
        },
        role: e.cargo || '',
        salary: e.salario || 0,
        admissionDate: e.data_admissao ? new Date(e.data_admissao) : new Date(),
        dismissalDate: e.data_desligamento ? new Date(e.data_desligamento) : undefined,
        vacationDueDate: e.vencimento_periodo ? new Date(e.vencimento_periodo) : undefined,
        status: (e.status as EmployeeStatus) || 'ativo',
        documents,
        bankDetails: (e.dados_bancarios as any) || {
          bank: '',
          agency: '',
          account: '',
          pix: '',
        },
        carteira_digital_login: e.carteira_digital_login || '',
        carteira_digital_senha: e.carteira_digital_senha || '',
        photoUrl: e.foto_url || '',
        tipoRemuneracao: e.tipo_remuneracao || 'fixed',
        producaoData: e.producao_data ? new Date(e.producao_data) : undefined,
        producaoObraId: e.producao_obra_id,
        producaoQuantidade: e.producao_quantidade,
        producaoValorUnitario: e.producao_valor_unitario,
        producaoValorTotal: e.producao_valor_total,
      }
    })
  },

  async create(employee: Employee): Promise<Employee> {
    const { data, error } = await supabase
      .from('colaboradores')
      .insert({
        nome: employee.name,
        cpf: employee.cpf?.trim() === '' ? null : employee.cpf,
        rg: employee.rg?.trim() === '' ? null : employee.rg,
        telefone: employee.phone,
        email: employee.email,
        logradouro: employee.street,
        numero: employee.number,
        bairro: employee.neighborhood,
        cidade: employee.city,
        uf: employee.state,
        endereco: `${employee.street}, ${employee.number} - ${employee.neighborhood}, ${employee.city} - ${employee.state}`,
        cargo: employee.role,
        salario: employee.salary,
        data_admissao: safeIsoString(employee.admissionDate),
        data_desligamento: safeIsoString(employee.dismissalDate),
        vencimento_periodo: safeIsoString(employee.vacationDueDate),
        status: employee.status,
        contato_emergencia_nome: employee.emergencyContact.name,
        contato_emergencia_telefone: employee.emergencyContact.phone,
        dados_bancarios: employee.bankDetails,
        carteira_digital_login: employee.carteira_digital_login,
        carteira_digital_senha: employee.carteira_digital_senha,
        foto_url: employee.photoUrl,
        tipo_remuneracao: employee.tipoRemuneracao || 'fixed',
        producao_data: safeIsoString(employee.producaoData),
        producao_obra_id: employee.producaoObraId,
        producao_quantidade: employee.producaoQuantidade,
        producao_valor_unitario: employee.producaoValorUnitario,
        producao_valor_total: employee.producaoValorTotal,
      })
      .select()
      .single()

    if (error) throw error

    return { ...employee, id: data.id }
  },

  async update(id: string, employee: Partial<Employee>): Promise<void> {
    const updates: Record<string, any> = {}

    if (employee.name !== undefined) updates.nome = employee.name
    if (employee.cpf !== undefined) updates.cpf = employee.cpf?.trim() === '' ? null : employee.cpf
    if (employee.rg !== undefined) updates.rg = employee.rg?.trim() === '' ? null : employee.rg
    if (employee.phone !== undefined) updates.telefone = employee.phone
    if (employee.email !== undefined) updates.email = employee.email
    if (employee.role !== undefined) updates.cargo = employee.role
    if (employee.salary !== undefined) updates.salario = employee.salary
    if (employee.status !== undefined) updates.status = employee.status
    if (employee.bankDetails !== undefined)
      updates.dados_bancarios = employee.bankDetails
    if (employee.carteira_digital_login !== undefined)
      updates.carteira_digital_login = employee.carteira_digital_login
    if (employee.carteira_digital_senha !== undefined)
      updates.carteira_digital_senha = employee.carteira_digital_senha
    if (employee.photoUrl !== undefined)
      updates.foto_url = employee.photoUrl
    if (employee.tipoRemuneracao !== undefined)
      updates.tipo_remuneracao = employee.tipoRemuneracao
    if (employee.producaoData !== undefined)
      updates.producao_data = safeIsoString(employee.producaoData)
    if (employee.producaoObraId !== undefined)
      updates.producao_obra_id = employee.producaoObraId
    if (employee.producaoQuantidade !== undefined)
      updates.producao_quantidade = employee.producaoQuantidade
    if (employee.producaoValorUnitario !== undefined)
      updates.producao_valor_unitario = employee.producaoValorUnitario
    if (employee.producaoValorTotal !== undefined)
      updates.producao_valor_total = employee.producaoValorTotal

    if (employee.street !== undefined) updates.logradouro = employee.street
    if (employee.number !== undefined) updates.numero = employee.number
    if (employee.neighborhood !== undefined)
      updates.bairro = employee.neighborhood
    if (employee.city !== undefined) updates.cidade = employee.city
    if (employee.state !== undefined) updates.uf = employee.state

    if (employee.admissionDate !== undefined)
      updates.data_admissao = safeIsoString(employee.admissionDate)
    if (employee.dismissalDate !== undefined)
      updates.data_desligamento = safeIsoString(employee.dismissalDate)
    if (employee.vacationDueDate !== undefined)
      updates.vencimento_periodo = safeIsoString(employee.vacationDueDate)

    if (employee.emergencyContact) {
      if (employee.emergencyContact.name !== undefined)
        updates.contato_emergencia_nome = employee.emergencyContact.name
      if (employee.emergencyContact.phone !== undefined)
        updates.contato_emergencia_telefone = employee.emergencyContact.phone
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('colaboradores')
        .update(updates)
        .eq('id', id)

      if (error) throw error
    }
  },

  async upsertDocument(
    employeeId: string,
    type: string,
    file: File | null,
    expiry: Date | undefined,
    existingDocId?: string,
    description?: string,
  ): Promise<void> {
    const safeType = type.toLowerCase()

    if (existingDocId) {
      const updates: any = {}
      if (expiry !== undefined) {
        updates.data_validade = expiry ? safeIsoString(expiry) : null
      }
      if (description !== undefined) {
        updates.descricao = description
      }

      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${employeeId}/${safeType}/${crypto.randomUUID()}.${fileExt}`

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
          .from('documentos_admissao')
          .update(updates)
          .eq('id', existingDocId)

        if (error) throw new Error(`Erro ao atualizar: ${error.message}`)
      }
    } else {
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${employeeId}/${safeType}/${crypto.randomUUID()}.${fileExt}`

      const { error: uploadError } = await uploadToStorage(fileName, file)

      if (uploadError) throw new Error(`Upload falhou: ${uploadError.message}`)

      const { data: publicUrl } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName)

      const { error } = await supabase.from('documentos_admissao').insert({
        colaborador_id: employeeId,
        tipo: safeType as any,
        nome_arquivo: file.name,
        url_arquivo: publicUrl.publicUrl,
        data_validade: expiry ? safeIsoString(expiry) : null,
        descricao: description,
      })

      if (error) throw new Error(`Erro ao salvar: ${error.message}`)
    }
  },

  async delete(id: string): Promise<void> {
    await supabase
      .from('contas_a_pagar')
      .update({ colaborador_id: null })
      .eq('colaborador_id', id)

    await supabase.from('documentos_admissao').delete().eq('colaborador_id', id)
    const { error } = await supabase.from('colaboradores').delete().eq('id', id)
    if (error) throw error
  },

  async getExpiringDocs(): Promise<any[]> {
    const { data, error } = await supabase
      .from('documentos_admissao')
      .select(`
        id,
        tipo,
        nome_arquivo,
        data_validade,
        colaborador_id,
        colaborador:colaboradores(id, nome)
      `)
      .not('data_validade', 'is', null)
      .order('data_validade', { ascending: true })

    if (error) throw error
    return data || []
  },
}
