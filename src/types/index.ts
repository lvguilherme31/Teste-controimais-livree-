export type Role = 'super_admin' | 'admin' | 'sub_user'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  companyName?: string
  cnpj?: string
  phone?: string
  permissions: {
    dashboard: boolean
    obras: boolean
    colaboradores: boolean
    alojamento: boolean
    veiculos: boolean
    fichario_funcoes: boolean
    ferramentas: boolean
    financeiro: boolean // Acesso geral financeiro
    contas_pagar: boolean
    pagamento_colaboradores: boolean
    notas_fiscais: boolean
    aluguel_equipamentos: boolean
    orcamentos: boolean
    configuracoes: boolean
  }
}

export interface UserInvite {
  email: string
  name: string
  role: Role
  permissions: User['permissions']
  created_at?: string
}

export interface ServiceProvider {
  id: string
  nome: string
  telefone_1: string
  telefone_2?: string
  endereco?: string
  rua?: string
  numero?: string
  cidade?: string
  estado?: string
  funcao: string
  created_at?: Date
}

export type BillStatus = 'pending' | 'paid' | 'overdue'

export interface Bill {
  id: string
  description: string
  amount: number
  dueDate: Date
  barcode?: string
  status: BillStatus
  attachmentUrl?: string
  paidDate?: Date
  origin?: 'manual' | 'alojamento' | 'insumo' | 'manutencao' | 'aluguel'
  category?: string
  projectId?: string
  accommodationId?: string
  accommodationName?: string
  paymentMethod?: string
  aluguel_id?: string
}

export type EmployeeStatus = 'ativo' | 'ferias' | 'afastado' | 'desligado'

export interface EmployeeDocument {
  id?: string
  name: string
  url: string
  expiry?: Date
  uploadDate?: Date
  type?: string
  description?: string
}

export interface Employee {
  id: string
  name: string
  cpf: string
  rg: string
  phone: string
  email: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  emergencyContact: {
    name: string
    phone: string
  }
  role: string
  salary: number
  admissionDate: Date
  dismissalDate?: Date
  vacationDueDate?: Date
  status: EmployeeStatus
  documents: Record<string, EmployeeDocument | undefined>
  bankDetails: {
    bank: string
    agency: string
    account: string
    pix?: string
  }
  carteira_digital_login?: string
  carteira_digital_senha?: string
  photoUrl?: string
  observacoes_periodo?: string
  historico_colaborador?: string
  tipoRemuneracao?: 'fixed' | 'production'
  producaoData?: Date
  producaoObraId?: string | null
  producaoQuantidade?: number | null
  producaoValorUnitario?: number | null
  producaoValorTotal?: number | null
}

export type ProjectStatus = 'ativa' | 'concluida' | 'inativa'

export interface ProjectDocument {
  id?: string
  name: string
  url?: string
  expiry?: Date
  uploadDate?: Date
  type?: string
  value?: number
  description?: string
}

export interface ProjectContract {
  id: string
  name: string
  description?: string
  value?: number
  url?: string
  date: Date // Upload date
  expiry?: Date
}

export interface Project {
  id: string
  name: string
  cnpj?: string
  address: string
  city: string
  state?: string
  client: string
  contractValue: number
  startDate?: Date
  predictedEndDate?: Date
  status: ProjectStatus
  documents: {
    [key: string]: ProjectDocument | undefined
  }
  contracts: ProjectContract[]
}

export interface ProjectHistory {
  id: string
  obraId: string
  userId: string
  field: string
  oldValue: string
  newValue: string
  createdAt: Date
  userName?: string
}

export interface AccommodationDocument {
  id?: string
  name: string
  url: string
  expiry?: Date
  uploadDate?: Date
  type?: string
}

export interface UtilityExpense {
  id: string
  type: string
  value: number
  dueDay?: number
  documentUrl?: string
  documentName?: string
  _tempDate?: Date
}

export interface Accommodation {
  id: string
  projectId: string
  name: string
  address: string
  entryDate: Date
  contractExpiry: Date
  contractUrl?: string
  inspectionUrl?: string
  status: 'active' | 'inactive'
  utilities: UtilityExpense[]
  documents: Record<string, AccommodationDocument | undefined>
  // New address fields
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
}

export interface VehicleDocument {
  id?: string
  name: string
  url: string
  expiry?: Date
  uploadDate?: Date
  type?: string
}

export interface Vehicle {
  id: string
  brand: string
  model: string
  plate: string
  documentUrl?: string
  documentExpiry?: Date
  projectId?: string
  status?: 'ativo' | 'manutencao' | 'inativo'
  documents: Record<string, VehicleDocument | undefined>
  pneuEstado?: 'novo' | 'meia-vida' | 'ruim'
  pneuDataTroca?: Date
  bateriaSerie?: string
  bateriaAmperagem?: string
  bateriaDataTroca?: Date
}

export interface Invoice {
  id: string
  number: string
  issueDate: Date
  client: string
  cnpj: string
  value: number
  dueDate: Date
  status: 'paid' | 'pending' | 'overdue' | 'cancelled'
  attachmentUrl?: string
  attachmentName?: string
  items: string[]
  emitterName?: string
  emitterCnpj?: string
}

export interface BudgetAttachment {
  id?: string
  name: string
  url: string
  date: Date
}

export interface Budget {
  id: string
  client?: string | null
  location?: string | null
  projectId?: string | null
  description?: string | null
  date?: Date | null
  totalValue?: number | null
  status?: 'draft' | 'sent' | 'approved' | 'rejected' | 'pendente' | null
  attachments: BudgetAttachment[]
  cnpj?: string | null
  visualId?: string | null
  street?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
}

export interface Tool {
  id: string
  nome: string
  codigo: string
  obraId?: string | null
  responsavelNome?: string | null
  responsavelCargo?: string | null
  responsavelTelefone?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface AluguelEquipamento {
  id: string
  nome: string
  valor: number
  obraId?: string | null
  dataVencimento: Date
  empresaNome?: string | null
  empresaCnpj?: string | null
  empresaEndereco?: string | null
  empresaRua?: string | null
  empresaNumero?: string | null
  empresaCidade?: string | null
  empresaEstado?: string | null
  empresaTelefone?: string | null
  createdAt?: string
}

export interface EmployeePayment {
  id: string
  colaboradorId: string
  mesReferencia: string // YYYY-MM
  valorAPagar: number
  status: 'pendente' | 'pago'
  dataPagamento?: Date
  observacoes?: string
  createdAt?: string
  updatedAt?: string
}

export interface Payslip {
  id: string
  colaboradorId: string
  mesReferencia: string
  urlArquivo: string
  nomeArquivo: string
  createdAt?: string
}
