import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Employee, EmployeeStatus, EmployeeDocument, Payslip } from '@/types'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { MoneyInput } from '@/components/ui/money-input'
import { DatePicker } from '@/components/ui/date-picker'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Upload, FileCheck, Calendar, User, Camera, FileText, Plus } from 'lucide-react'
import { cn, BR_STATES } from '@/lib/utils'
import { colaboradoresService } from '@/services/colaboradoresService'
import { supabase } from '@/lib/supabase/client'
import { pagamentosService } from '@/services/pagamentosService'

interface ColaboradorFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employeeToEdit?: Employee
}

const DOC_TYPES = [
    { id: 'rg', label: 'RG (Identidade)' },
    { id: 'cpf', label: 'CPF (Cadastro de Pessoa Física)' },
    { id: 'contrato', label: 'Contrato de Trabalho' },
    { id: 'folha_registro', label: 'Folha de Registro' },
    { id: 'aso', label: 'ASO (Atestado de Saúde)' },
    { id: 'epi', label: 'Ficha de EPI' },
    { id: 'nr6', label: 'NR 06 - EPI' },
    { id: 'nr10', label: 'NR 10 - Eletricidade' },
    { id: 'nr12', label: 'NR 12 - Máquinas' },
    { id: 'nr17', label: 'NR 17 - Ergonomia' },
    { id: 'nr18', label: 'NR 18 - Construção Civil' },
    { id: 'nr35', label: 'NR 35 - Altura' },
    { id: 'os', label: 'Ordem de Serviço (OS)' },
    { id: 'outros', label: 'Outros' },
]

const INITIAL_DATA: Partial<Employee> = {
    name: '',
    email: '',
    phone: '',
    cpf: '',
    rg: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    role: '',
    salary: 0,
    status: 'ativo',
    admissionDate: new Date(),
    bankDetails: {
        bank: '',
        agency: '',
        account: '',
        pix: '',
    },
    emergencyContact: {
        name: '',
        phone: '',
    },
    tipoRemuneracao: 'fixed',
    carteira_digital_login: '',
    carteira_digital_senha: '',
    observacoes_periodo: '',
    historico_colaborador: '',
    dismissalDate: undefined,
}

export function ColaboradorFormDialog({
    open,
    onOpenChange,
    employeeToEdit,
}: ColaboradorFormDialogProps) {
    const { addEmployee, updateEmployee, fetchEmployees, fetchExpiringDocuments, projects } = useAppStore()
    const { toast } = useToast()
    const [data, setData] = useState<Partial<Employee>>(INITIAL_DATA)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [activeTab, setActiveTab] = useState('geral')
    const [docUploads, setDocUploads] = useState<Record<string, { file: File | null; expiry?: Date; description?: string; customLabel?: string }>>({})
    const [customDocIds, setCustomDocIds] = useState<string[]>([])
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)
    const [payslips, setPayslips] = useState<Payslip[]>([])
    const [isLoadingPayslips, setIsLoadingPayslips] = useState(false)

    useEffect(() => {
        if (open && activeTab === 'holerites' && employeeToEdit) {
            loadPayslips()
        }
    }, [activeTab, open, employeeToEdit])

    const loadPayslips = async () => {
        if (!employeeToEdit) return
        setIsLoadingPayslips(true)
        try {
            const data = await pagamentosService.getPayslips(employeeToEdit.id)
            setPayslips(data)
        } catch (error) {
            console.error('Error loading payslips:', error)
        } finally {
            setIsLoadingPayslips(false)
        }
    }

    useEffect(() => {
        if (employeeToEdit) {
            setData({ ...employeeToEdit })
            setPhotoPreview(employeeToEdit.photoUrl || null)
        } else {
            setData(INITIAL_DATA)
            setPhotoPreview(null)
        }
        setActiveTab('geral')
        if (employeeToEdit?.documents) {
            // Identify custom documents (those not in fixed DOC_TYPES)
            const standardIds = DOC_TYPES.map(t => t.id)
            const customIds = Object.keys(employeeToEdit.documents).filter(id => !standardIds.includes(id))
            setCustomDocIds(customIds)
        } else {
            setCustomDocIds([])
        }
        setDocUploads({})
        setPhotoFile(null)
    }, [employeeToEdit, open])

    const handleFileChange = (typeId: string, file: File | null) => {
        setDocUploads(prev => ({
            ...prev,
            [typeId]: { ...prev[typeId], file }
        }))
    }

    const handleExpiryChange = (typeId: string, expiry: Date | undefined) => {
        setDocUploads(prev => ({
            ...prev,
            [typeId]: { ...prev[typeId], expiry }
        }))
    }

    const handleDescriptionChange = (typeId: string, description: string) => {
        setDocUploads(prev => ({
            ...prev,
            [typeId]: { ...prev[typeId], description }
        }))
    }

    const handleCustomLabelChange = (typeId: string, label: string) => {
        setDocUploads(prev => ({
            ...prev,
            [typeId]: { ...prev[typeId], customLabel: label }
        }))
    }

    const addCustomDocumentRow = () => {
        const newId = `custom_${crypto.randomUUID()}`
        setCustomDocIds(prev => [...prev, newId])
    }

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setPhotoFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async () => {
        if (!data.name || !data.role) {
            toast({
                title: 'Campos obrigatórios',
                description: 'Nome e Cargo são obrigatórios.',
                variant: 'destructive',
            })
            return
        }

        setIsSubmitting(true)
        try {
            let savedEmployee: Employee
            if (employeeToEdit) {
                await updateEmployee(employeeToEdit.id, data)
                savedEmployee = { ...employeeToEdit, ...data } as Employee
            } else {
                savedEmployee = await addEmployee(data as Employee)
            }

            // Handle photo upload
            let finalPhotoUrl = data.photoUrl
            if (photoFile) {
                const fileExt = photoFile.name.split('.').pop()
                const fileName = `photos/${crypto.randomUUID()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('crm-docs')
                    .upload(fileName, photoFile)

                if (uploadError) throw new Error(`Erro ao enviar foto: ${uploadError.message}`)

                const { data: publicUrl } = supabase.storage
                    .from('crm-docs')
                    .getPublicUrl(fileName)

                finalPhotoUrl = publicUrl.publicUrl
                // Update employee with new photo URL
                await updateEmployee(savedEmployee.id, { photoUrl: finalPhotoUrl })
            }

            // Handle uploads if any and if we have an ID
            const employeeId = savedEmployee.id
            const uploadPromises = Object.entries(docUploads).map(async ([typeId, upload]) => {
                const isCustom = typeId.startsWith('custom_')

                // Only skip if nothing changed/uploaded
                if (!upload.file && !upload.expiry && upload.description === undefined && !upload.customLabel) return

                // For custom docs: always save as 'outros' enum value; user's text goes into description
                const dbType = isCustom ? 'outros' : typeId
                const dbDescription = isCustom
                    ? (upload.customLabel || upload.description || '')
                    : upload.description

                await colaboradoresService.upsertDocument(
                    employeeId,
                    dbType,
                    upload.file,
                    upload.expiry,
                    employeeToEdit?.documents?.[typeId]?.id,
                    dbDescription
                )
            })

            if (uploadPromises.length > 0) {
                await Promise.all(uploadPromises)
            }

            // Mandatory refresh to ensure UI sync
            await Promise.all([
                fetchEmployees(),
                fetchExpiringDocuments()
            ])

            toast({
                title: 'Sucesso',
                description: `Colaborador ${employeeToEdit ? 'atualizado' : 'cadastrado'} com sucesso.`,
            })
            onOpenChange(false)
        } catch (error: any) {
            console.error(error)
            let errorMessage = 'Falha ao salvar colaborador.'

            if (error.message?.includes('colaboradores_cpf_key')) {
                errorMessage = 'CPF já cadastrado.'
            } else if (error.message?.includes('colaboradores_rg_key')) {
                errorMessage = 'RG já cadastrado.'
            } else if (error.message) {
                errorMessage = error.message
            }

            toast({
                title: 'Erro',
                description: errorMessage,
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2 border-b flex flex-row items-center justify-between">
                    <DialogTitle className="text-xl">
                        {employeeToEdit ? 'Editar Perfil do Colaborador' : 'Cadastro de Novo Colaborador'}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 pl-6 flex-wrap h-auto">
                            <TabsTrigger
                                value="geral"
                                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            >
                                Dados Gerais
                            </TabsTrigger>
                            <TabsTrigger
                                value="profissional"
                                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            >
                                Profissional
                            </TabsTrigger>
                            <TabsTrigger
                                value="financeiro"
                                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            >
                                Financeiro
                            </TabsTrigger>
                            <TabsTrigger
                                value="documentos"
                                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            >
                                Documentos
                            </TabsTrigger>
                            <TabsTrigger
                                value="holerites"
                                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            >
                                Holerites
                            </TabsTrigger>
                        </TabsList>

                        <div className="p-6">

                            {/* TAB: DADOS GERAIS */}
                            <TabsContent value="geral" className="space-y-6 mt-0 animate-in fade-in-50 duration-300">
                                <div className="max-w-4xl mx-auto space-y-8">
                                    {/* Photo at the top center */}
                                    <div className="flex flex-col items-center gap-3 pt-4">
                                        <div className="relative group">
                                            <div className="w-32 h-32 rounded-full border-4 border-slate-100 shadow-sm overflow-hidden bg-slate-50 flex items-center justify-center shrink-0 hover:bg-slate-100 transition-colors">
                                                {photoPreview ? (
                                                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-16 h-16 text-slate-300" />
                                                )}
                                            </div>
                                            <Label
                                                htmlFor="photo-upload"
                                                className="absolute bottom-1 right-1 p-2 bg-orange-600 rounded-full text-white cursor-pointer shadow-lg hover:bg-orange-700 transition-colors border-2 border-white"
                                            >
                                                <Camera className="h-4 w-4" />
                                            </Label>
                                            <input
                                                type="file"
                                                id="photo-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handlePhotoChange}
                                            />
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Foto do Perfil</span>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                            <div className="md:col-span-2 space-y-2">
                                                <Label className="text-slate-600 font-semibold">Nome Completo <span className="text-red-500">*</span></Label>
                                                <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="Ex: João da Silva" className="bg-white border-slate-200" />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-slate-600 font-medium">CPF</Label>
                                                <Input value={data.cpf || ''} onChange={(e) => setData({ ...data, cpf: e.target.value })} placeholder="000.000.000-00" className="bg-white border-slate-200" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-slate-600 font-medium">RG</Label>
                                                <Input value={data.rg || ''} onChange={(e) => setData({ ...data, rg: e.target.value })} placeholder="00.000.000-0" className="bg-white border-slate-200" />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-slate-600 font-medium">Telefone</Label>
                                                <Input value={data.phone || ''} onChange={(e) => setData({ ...data, phone: e.target.value })} placeholder="(00) 00000-0000" className="bg-white border-slate-200" />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-slate-600 font-medium">E-mail</Label>
                                                <Input value={data.email || ''} onChange={(e) => setData({ ...data, email: e.target.value })} placeholder="email@exemplo.com" className="bg-white border-slate-200" />
                                            </div>
                                        </div>

                                        <div className="pt-8 border-t border-slate-100 space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-1 h-4 bg-orange-500 rounded-full" />
                                                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Endereço Residencial</h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div className="md:col-span-3 space-y-2">
                                                    <Label className="text-slate-600 font-medium">Logradouro / Rua</Label>
                                                    <Input value={data.street || ''} onChange={(e) => setData({ ...data, street: e.target.value })} className="bg-white border-slate-200" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-slate-600 font-medium">Número</Label>
                                                    <Input value={data.number || ''} onChange={(e) => setData({ ...data, number: e.target.value })} className="bg-white border-slate-200" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-slate-600 font-medium">Bairro</Label>
                                                    <Input value={data.neighborhood || ''} onChange={(e) => setData({ ...data, neighborhood: e.target.value })} className="bg-white border-slate-200" />
                                                </div>

                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="col-span-2 space-y-2">
                                                        <Label className="text-slate-600 font-medium">Cidade</Label>
                                                        <Input value={data.city || ''} onChange={(e) => setData({ ...data, city: e.target.value })} className="bg-white border-slate-200" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-slate-600 font-medium">UF</Label>
                                                        <Select value={data.state || undefined} onValueChange={(v) => setData({ ...data, state: v })}>
                                                            <SelectTrigger className="bg-white border-slate-200">
                                                                <SelectValue placeholder="UF" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {BR_STATES.map((uf) => (
                                                                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-8 border-t border-slate-100 space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-1 h-4 bg-orange-500 rounded-full" />
                                                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Contato de Emergência</h3>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-slate-600 font-medium">Nome do Contato</Label>
                                                    <Input
                                                        value={data.emergencyContact?.name || ''}
                                                        onChange={(e) => setData({
                                                            ...data,
                                                            emergencyContact: {
                                                                ...(data.emergencyContact || { name: '', phone: '' }),
                                                                name: e.target.value
                                                            }
                                                        })}
                                                        placeholder="Ex: Maria da Silva"
                                                        className="bg-white border-slate-200"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-slate-600 font-medium">Telefone do Contato</Label>
                                                    <Input
                                                        value={data.emergencyContact?.phone || ''}
                                                        onChange={(e) => setData({
                                                            ...data,
                                                            emergencyContact: {
                                                                ...(data.emergencyContact || { name: '', phone: '' }),
                                                                phone: e.target.value
                                                            }
                                                        })}
                                                        placeholder="(00) 00000-0000"
                                                        className="bg-white border-slate-200"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB: PROFISSIONAL */}
                            <TabsContent value="profissional" className="space-y-6 mt-0 animate-in fade-in-50 duration-300">
                                <div className="max-w-4xl mx-auto space-y-6">
                                    <div className="border rounded-lg p-5 bg-slate-50 border-slate-200">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-3 h-3 rounded-full",
                                                    data.status === 'ativo' ? "bg-green-500" :
                                                        data.status === 'ferias' ? "bg-blue-500" :
                                                            data.status === 'afastado' ? "bg-amber-500" : "bg-slate-400"
                                                )} />
                                                <Label className="font-semibold text-slate-700">Status do Colaborador</Label>
                                            </div>
                                            <Select value={data.status} onValueChange={(val: EmployeeStatus) => setData({ ...data, status: val })}>
                                                <SelectTrigger className="bg-white w-full sm:w-[180px] border-slate-200 shadow-sm font-medium">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ativo">Ativo</SelectItem>
                                                    <SelectItem value="ferias">Férias</SelectItem>
                                                    <SelectItem value="afastado">Afastado</SelectItem>
                                                    <SelectItem value="desligado">Desligado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-600 font-medium">Obra Atual</Label>
                                            <Select value={data.producaoObraId || "none"} onValueChange={(val) => setData({ ...data, producaoObraId: val === "none" ? null : val })}>
                                                <SelectTrigger className="bg-white border-slate-200 shadow-sm font-medium">
                                                    <SelectValue placeholder="Selecione uma obra" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Nenhuma Obra</SelectItem>
                                                    {projects.map(p => (
                                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-slate-600 font-medium">Cargo / Função</Label>
                                            <Input value={data.role} onChange={(e) => setData({ ...data, role: e.target.value })} placeholder="Ex: Pedreiro" className="bg-white border-slate-200" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-slate-600 font-medium">Data de Admissão</Label>
                                            <DatePicker date={data.admissionDate} setDate={(d) => setData({ ...data, admissionDate: d || new Date() })} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-slate-600 font-medium">Data de Demissão</Label>
                                            <DatePicker date={data.dismissalDate} setDate={(d) => setData({ ...data, dismissalDate: d })} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-slate-600 font-medium">Vencimento de Férias</Label>
                                            <DatePicker date={data.vacationDueDate} setDate={(d) => setData({ ...data, vacationDueDate: d })} />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <div className="space-y-4 p-5 rounded-xl bg-orange-50 border border-orange-100 shadow-sm group">
                                            <div className="flex items-center gap-2 text-orange-800 font-bold text-[11px] uppercase tracking-widest">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                Acesso Carteira Digital
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-orange-700 text-[10px] font-bold uppercase transition-colors group-hover:text-orange-900">Login / CPF</Label>
                                                    <Input value={data.carteira_digital_login || ''} onChange={(e) => setData({ ...data, carteira_digital_login: e.target.value })} className="bg-white border-orange-200/50 focus-visible:ring-orange-500" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-orange-700 text-[10px] font-bold uppercase transition-colors group-hover:text-orange-900">Senha</Label>
                                                    <Input value={data.carteira_digital_senha || ''} onChange={(e) => setData({ ...data, carteira_digital_senha: e.target.value })} type="password" className="bg-white border-orange-200/50 focus-visible:ring-orange-500" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-6 border-t border-slate-100">
                                        <div className="space-y-2">
                                            <Label className="text-slate-600 font-medium">Observações de Períodos Trabalhados</Label>
                                            <Textarea value={data.observacoes_periodo || ''} onChange={(e) => setData({ ...data, observacoes_periodo: e.target.value })} placeholder="Descreva períodos de afastamento ou observações contratuais" className="min-h-[100px] bg-white border-slate-200 focus-visible:ring-orange-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-600 font-medium">Histórico do Colaborador</Label>
                                            <Textarea value={data.historico_colaborador || ''} onChange={(e) => setData({ ...data, historico_colaborador: e.target.value })} placeholder="Histórico interno, promoções ou advertências" className="min-h-[100px] bg-white border-slate-200 focus-visible:ring-orange-500" />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB: FINANCEIRO */}
                            <TabsContent value="financeiro" className="space-y-8 animate-in fade-in-50 duration-300">
                                <div className="max-w-4xl mx-auto space-y-8">
                                    <div className="space-y-8">
                                        {/* Remuneration Section */}
                                        <div className="space-y-6">
                                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-tight">Regras de Remuneração</h3>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-slate-600 font-medium">Tipo de Remuneração</Label>
                                                    <Select value={data.tipoRemuneracao || 'fixed'} onValueChange={(val: 'fixed' | 'production') => setData({ ...data, tipoRemuneracao: val })}>
                                                        <SelectTrigger className="w-full bg-white border-slate-200 shadow-sm">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="fixed">Piso / Salário Fixo</SelectItem>
                                                            <SelectItem value="production">Produção / Tarefa</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {data.tipoRemuneracao === 'fixed' || !data.tipoRemuneracao ? (
                                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                                        <Label className="text-slate-600 font-medium">Salário / Piso (R$)</Label>
                                                        <MoneyInput value={data.salary || 0} onChange={(val) => setData({ ...data, salary: val })} />
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4 p-5 border rounded-xl bg-blue-50 border-blue-100 animate-in slide-in-from-top-2 duration-200">
                                                        <h4 className="text-xs font-bold text-blue-800 uppercase">Controle de Produção</h4>
                                                        <div className="space-y-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-blue-700 text-xs font-bold">Data Ref.</Label>
                                                                <DatePicker date={data.producaoData} setDate={(d) => setData({ ...data, producaoData: d })} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-blue-700 text-xs font-bold">Obra</Label>
                                                                <Select value={data.producaoObraId || 'none'} onValueChange={(v) => setData({ ...data, producaoObraId: v === 'none' ? null : v })}>
                                                                    <SelectTrigger className="bg-white border-blue-200 shadow-sm">
                                                                        <SelectValue placeholder="Obra" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="none">Selecione...</SelectItem>
                                                                        {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-blue-700 text-xs font-bold">Valor Total Produzido (R$)</Label>
                                                                <MoneyInput value={data.producaoValorTotal || 0} onChange={(v) => setData({ ...data, producaoValorTotal: v })} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Banking Section */}
                                        <div className="space-y-6">
                                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-tight">Dados Bancários para Pagamento</h3>
                                            <div className="space-y-4 p-5 border rounded-xl bg-slate-50 border-slate-200 shadow-sm">
                                                <div className="space-y-2">
                                                    <Label className="text-slate-600 font-medium">Banco</Label>
                                                    <Input value={data.bankDetails?.bank} onChange={(e) => setData({ ...data, bankDetails: { ...data.bankDetails!, bank: e.target.value } })} placeholder="Ex: Bradesco, Itaú..." className="bg-white border-slate-200" />
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-slate-600 font-medium">Agência</Label>
                                                        <Input value={data.bankDetails?.agency} onChange={(e) => setData({ ...data, bankDetails: { ...data.bankDetails!, agency: e.target.value } })} className="bg-white border-slate-200" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-slate-600 font-medium">Conta Corrente</Label>
                                                        <Input value={data.bankDetails?.account} onChange={(e) => setData({ ...data, bankDetails: { ...data.bankDetails!, account: e.target.value } })} className="bg-white border-slate-200" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-slate-600 font-medium">Chave PIX (Opcional)</Label>
                                                    <Input value={data.bankDetails?.pix} onChange={(e) => setData({ ...data, bankDetails: { ...data.bankDetails!, pix: e.target.value } })} placeholder="E-mail, CPF, Telefone ou Aleatória" className="bg-white border-slate-200" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="documentos" className="mt-0 animate-in fade-in-50 duration-300 px-1">
                                {/* existing documentos content */}
                                <div className="max-w-4xl mx-auto space-y-4 pt-4">
                                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-4 space-y-3">
                                        <p className="text-sm text-amber-800 font-medium">
                                            Adicione os documentos obrigatórios. Para documentos já existentes, o sistema manterá o arquivo anterior a menos que um novo seja enviado.
                                        </p>
                                        <div className="flex flex-wrap gap-4 pt-2 border-t border-amber-200/50">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-900/70">
                                                <div className="w-2 h-2 rounded-full bg-red-500" /> Vencido
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-900/70">
                                                <div className="w-2 h-2 rounded-full bg-amber-500" /> Vencendo (30 dias)
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-900/70">
                                                <div className="w-2 h-2 rounded-full bg-green-500" /> Regular
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 pb-4">
                                        {DOC_TYPES.map((type) => {
                                            const existingDoc = employeeToEdit?.documents?.[type.id]
                                            const isUploaded = !!docUploads[type.id]?.file || !!existingDoc

                                            return (
                                                <div key={type.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg bg-white hover:bg-slate-50 transition-colors">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h4 className="font-semibold text-slate-800">{type.label}</h4>
                                                            {isUploaded && <FileCheck className="h-4 w-4 text-green-600" />}

                                                            {/* Expiry Alerts */}
                                                            {(() => {
                                                                const expiryDate = docUploads[type.id]?.expiry || (existingDoc?.expiry ? new Date(existingDoc.expiry) : undefined);
                                                                if (!expiryDate) return null;

                                                                const today = new Date();
                                                                today.setHours(0, 0, 0, 0);
                                                                const expiry = new Date(expiryDate);
                                                                expiry.setHours(0, 0, 0, 0);

                                                                const diffTime = expiry.getTime() - today.getTime();
                                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                                if (diffDays < 0) {
                                                                    return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase">Vencido</span>;
                                                                } else if (diffDays <= 30) {
                                                                    return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase">Vence em {diffDays} dias</span>;
                                                                } else {
                                                                    return <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase text-opacity-0 group-hover:text-opacity-100 transition-opacity">Regular</span>;
                                                                }
                                                            })()}
                                                        </div>
                                                        {existingDoc && (
                                                            <p className="text-xs text-blue-600 font-medium mt-1">Já cadastrado: {existingDoc.name}</p>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-slate-400" />
                                                            <div className="w-[140px]">
                                                                <DatePicker
                                                                    date={docUploads[type.id]?.expiry || (existingDoc?.expiry ? new Date(existingDoc.expiry) : undefined)}
                                                                    setDate={(d) => handleExpiryChange(type.id, d)}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 w-full min-w-[150px]">
                                                            <Input
                                                                placeholder="Descrição / Obs."
                                                                value={docUploads[type.id]?.description ?? (existingDoc?.description || '')}
                                                                onChange={(e) => handleDescriptionChange(type.id, e.target.value)}
                                                                className="h-9 text-xs"
                                                            />
                                                        </div>

                                                        <div className="relative">
                                                            <input
                                                                type="file"
                                                                id={`file-${type.id}`}
                                                                className="hidden"
                                                                onChange={(e) => handleFileChange(type.id, e.target.files?.[0] || null)}
                                                            />
                                                            <Label htmlFor={`file-${type.id}`} className="cursor-pointer">
                                                                <div className={cn(
                                                                    "flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-all shadow-sm",
                                                                    docUploads[type.id]?.file
                                                                        ? "bg-green-50 border-green-200 text-green-700"
                                                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                                                )}>
                                                                    <Upload className="h-4 w-4" />
                                                                    {docUploads[type.id]?.file ? 'Substituir' : 'Selecionar'}
                                                                </div>
                                                            </Label>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}

                                        {/* Custom Documents Section */}
                                        {customDocIds.length > 0 && (
                                            <div className="space-y-4 pt-4 border-t border-slate-100 mt-4">
                                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-tight">Documentos Adicionais</h3>
                                                {customDocIds.map((id) => {
                                                    const existingDoc = employeeToEdit?.documents?.[id]
                                                    const isUploaded = !!docUploads[id]?.file || !!existingDoc

                                                    return (
                                                        <div key={id} className="flex flex-col gap-4 p-4 border rounded-lg bg-white hover:bg-slate-50 transition-colors">
                                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                                <div className="flex-1 w-full md:max-w-[250px]">
                                                                    <Label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Nome do Documento</Label>
                                                                    <Input
                                                                        placeholder="Ex: Certificado, Treinamento..."
                                                                        value={docUploads[id]?.customLabel ?? (existingDoc?.description || '')}
                                                                        onChange={(e) => handleCustomLabelChange(id, e.target.value)}
                                                                        className="h-9 font-semibold"
                                                                    />
                                                                </div>

                                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 justify-end">
                                                                    <div className="flex flex-col gap-1">
                                                                        <Label className="text-[10px] text-slate-400 font-bold uppercase mb-1">Validade</Label>
                                                                        <div className="flex items-center gap-2">
                                                                            <Calendar className="h-4 w-4 text-slate-400" />
                                                                            <div className="w-[140px]">
                                                                                <DatePicker
                                                                                    date={docUploads[id]?.expiry || (existingDoc?.expiry ? new Date(existingDoc.expiry) : undefined)}
                                                                                    setDate={(d) => handleExpiryChange(id, d)}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex flex-col gap-1">
                                                                        <Label className="text-[10px] text-slate-400 font-bold uppercase mb-1">Arquivo</Label>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="file"
                                                                                id={`file-${id}`}
                                                                                className="hidden"
                                                                                onChange={(e) => handleFileChange(id, e.target.files?.[0] || null)}
                                                                            />
                                                                            <Label htmlFor={`file-${id}`} className="cursor-pointer">
                                                                                <div className={cn(
                                                                                    "flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-all shadow-sm h-9",
                                                                                    docUploads[id]?.file
                                                                                        ? "bg-green-50 border-green-200 text-green-700"
                                                                                        : isUploaded ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                                                                )}>
                                                                                    <Upload className="h-4 w-4" />
                                                                                    {docUploads[id]?.file ? 'Substituir' : isUploaded ? 'Alterar' : 'Selecionar'}
                                                                                </div>
                                                                            </Label>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="pt-2 border-t border-slate-50">
                                                                <Input
                                                                    placeholder="Descrição / Observação Adicional"
                                                                    value={docUploads[id]?.description ?? (existingDoc?.description || '')}
                                                                    onChange={(e) => handleDescriptionChange(id, e.target.value)}
                                                                    className="h-8 text-xs bg-slate-50/50 border-transparent focus:bg-white"
                                                                />
                                                                {existingDoc && !docUploads[id]?.file && (
                                                                    <p className="text-[10px] text-blue-500 mt-1 pl-1">Arquivo atual: {existingDoc.name}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full py-6 border-dashed border-2 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50/50 transition-all flex items-center gap-2 mt-4"
                                            onClick={addCustomDocumentRow}
                                        >
                                            <Plus className="h-4 w-4" />
                                            Criar um novo documento
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="holerites" className="mt-0 animate-in fade-in-50 duration-300 px-1">
                                <div className="max-w-4xl mx-auto space-y-4 pt-4">
                                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                                        <p className="text-sm text-blue-800 font-medium">
                                            Aqui estão listados todos os holerites e comprovantes de pagamento anexados para este colaborador.
                                        </p>
                                    </div>

                                    {isLoadingPayslips ? (
                                        <div className="flex items-center justify-center p-12">
                                            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                                        </div>
                                    ) : payslips.length === 0 ? (
                                        <div className="text-center p-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                            <p className="text-slate-500 font-medium">Nenhum holerite encontrado.</p>
                                            <p className="text-slate-400 text-sm">Os holerites aparecem aqui automaticamente quando anexados no lançamento de pagamentos.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-3 pb-4">
                                            {payslips.map((slip) => (
                                                <div key={slip.id} className="flex items-center justify-between p-4 border rounded-lg bg-white hover:shadow-sm transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2 bg-orange-100 rounded-lg">
                                                            <FileText className="h-5 w-5 text-orange-600" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800">Mês de Referência: {slip.mesReferencia}</h4>
                                                            <p className="text-xs text-slate-500">{slip.nomeArquivo}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                        asChild
                                                    >
                                                        <a href={slip.urlArquivo} target="_blank" rel="noopener noreferrer">
                                                            Visualizar
                                                        </a>
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <DialogFooter className="p-6 pt-2 border-t bg-slate-50">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-600 hover:bg-slate-100">
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700 min-w-[150px]">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            employeeToEdit ? 'Atualizar Colaborador' : 'Finalizar Cadastro'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent >
        </Dialog >
    )
}
