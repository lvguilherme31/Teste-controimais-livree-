import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Employee, Project, EmployeePayment } from '@/types'
import { format } from 'date-fns'

interface PagamentoFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (payment: any) => Promise<void>
    employees: Employee[]
    projects: Project[]
    initialData?: Partial<EmployeePayment> & { employee?: Employee } | null
}

export function PagamentoFormDialog({
    open,
    onOpenChange,
    onSave,
    employees,
    projects,
    initialData
}: PagamentoFormDialogProps) {
    const [data, setData] = useState<any>({
        colaboradorId: '',
        mesReferencia: format(new Date(), 'yyyy-MM'),
        valorAPagar: 0,
        status: 'pendente',
        observacoes: '',
        tipoRemuneracao: 'fixed',
        producaoData: undefined,
        producaoObraId: '',
        producaoValorTotal: 0,
    })
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [file, setFile] = useState<File | null>(null)

    useEffect(() => {
        if (initialData) {
            const emp = initialData.colaboradorId ? employees.find(e => e.id === initialData.colaboradorId) : null
            setSelectedEmployee(emp || null)

            setData({
                colaboradorId: initialData.colaboradorId || '',
                mesReferencia: initialData.mesReferencia || format(new Date(), 'yyyy-MM'),
                valorAPagar: initialData.valorAPagar || 0,
                status: initialData.status || 'pendente',
                observacoes: initialData.observacoes || '',
                tipoRemuneracao: emp?.tipoRemuneracao || 'fixed',
                producaoObraId: emp?.producaoObraId || '',
                producaoValorTotal: emp?.producaoValorTotal || 0,
                producaoData: emp?.producaoData ? new Date(emp.producaoData) : undefined,
                id: initialData.id
            })
        } else {
            setData({
                colaboradorId: '',
                mesReferencia: format(new Date(), 'yyyy-MM'),
                valorAPagar: 0,
                status: 'pendente',
                observacoes: '',
                tipoRemuneracao: 'fixed',
            })
            setSelectedEmployee(null)
        }
        setFile(null)
    }, [initialData, employees, open])

    const handleEmployeeChange = (id: string) => {
        const emp = employees.find(e => e.id === id)
        setSelectedEmployee(emp || null)
        if (emp) {
            setData({
                ...data,
                colaboradorId: id,
                tipoRemuneracao: emp.tipoRemuneracao || 'fixed',
                valorAPagar: emp.tipoRemuneracao === 'production' ? (emp.producaoValorTotal || 0) : (emp.salary || 0),
                producaoObraId: emp.producaoObraId || '',
                producaoValorTotal: emp.producaoValorTotal || 0,
                producaoData: emp.producaoData ? new Date(emp.producaoData) : undefined
            })
        }
    }

    const handleSave = () => {
        if (!data.colaboradorId || !data.mesReferencia) return
        onSave({ ...data, file })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{data.id ? 'Editar Lançamento' : 'Novo Lançamento de Pagamento'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-8 py-4">
                    {/* Seção: Dados do Funcionário */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-tight">Dados do Funcionário</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nome Completo</Label>
                                <Select value={data.colaboradorId} onValueChange={handleEmployeeChange} disabled={!!data.id}>
                                    <SelectTrigger className="bg-white border-slate-200">
                                        <SelectValue placeholder="Selecione um funcionário" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.filter(e => e.status === 'ativo').map(e => (
                                            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>CPF</Label>
                                <Input value={selectedEmployee?.cpf || ''} readOnly className="bg-slate-50 border-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <Label>RG</Label>
                                <Input value={selectedEmployee?.rg || ''} readOnly className="bg-slate-50 border-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <Label>Função</Label>
                                <Input value={selectedEmployee?.role || ''} readOnly className="bg-slate-50 border-slate-200" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Obra Vinculada (No Cadastro)</Label>
                                <Input value={projects.find(p => p.id === selectedEmployee?.producaoObraId)?.name || 'Sem Obra'} readOnly className="bg-slate-50 border-slate-200" />
                            </div>
                        </div>
                    </div>

                    {/* Seção: Regras de Remuneração (Mirror) */}
                    <div className="space-y-6 pt-4 border-t">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-tight">Regras de Remuneração</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">Tipo de Remuneração</Label>
                                <Select value={data.tipoRemuneracao} onValueChange={(val: any) => setData({ ...data, tipoRemuneracao: val })}>
                                    <SelectTrigger className="w-full bg-white border-slate-200 shadow-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fixed">Piso / Salário Fixo</SelectItem>
                                        <SelectItem value="production">Produção / Tarefa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {data.tipoRemuneracao === 'fixed' ? (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                    <Label className="text-slate-600 font-medium">Salário / Piso (R$)</Label>
                                    <MoneyInput value={data.valorAPagar} onChange={(val) => setData({ ...data, valorAPagar: val })} />
                                </div>
                            ) : (
                                <div className="space-y-4 p-5 border rounded-xl bg-blue-50 border-blue-100 animate-in slide-in-from-top-2 duration-200">
                                    <h4 className="text-xs font-bold text-blue-800 uppercase">Controle de Produção</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2 text-blue-700">
                                            <Label className="text-xs font-bold">Data Ref.</Label>
                                            <DatePicker date={data.producaoData} setDate={(d) => setData({ ...data, producaoData: d })} />
                                        </div>
                                        <div className="space-y-2 text-blue-700">
                                            <Label className="text-xs font-bold">Obra</Label>
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
                                        <div className="space-y-2 md:col-span-2 text-blue-700">
                                            <Label className="text-xs font-bold">Valor Total Produzido (R$)</Label>
                                            <MoneyInput value={data.valorAPagar} onChange={(v) => setData({ ...data, valorAPagar: v, producaoValorTotal: v })} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Seção: Detalhes do Pagamento */}
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-tight">Detalhes do Lançamento</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Mês de Referência</Label>
                                <Input type="month" value={data.mesReferencia} onChange={(e) => setData({ ...data, mesReferencia: e.target.value })} className="bg-white border-slate-200 shadow-sm" />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={data.status} onValueChange={(val: any) => setData({ ...data, status: val })}>
                                    <SelectTrigger className="bg-white border-slate-200 shadow-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pendente">Pendente</SelectItem>
                                        <SelectItem value="pago">Pago</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Holerite / Comprovante (PDF/Imagem)</Label>
                            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} accept="image/*,application/pdf" className="bg-white border-slate-200 shadow-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label>Observações</Label>
                            <Input value={data.observacoes} onChange={(e) => setData({ ...data, observacoes: e.target.value })} placeholder="Ex: Pagamento referente a diárias extras" className="bg-white border-slate-200 shadow-sm" />
                        </div>
                    </div>

                    {/* Banking Info Section */}
                    {selectedEmployee && (
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-tight">Dados Bancários para Pagamento</h3>
                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm text-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-slate-500 font-medium">Banco</p>
                                    <p className="font-semibold text-slate-900">{selectedEmployee.bankDetails?.bank || 'Não informado'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-500 font-medium">Agência</p>
                                    <p className="font-semibold text-slate-900">{selectedEmployee.bankDetails?.agency || 'Não informado'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-500 font-medium">Conta Corrente</p>
                                    <p className="font-semibold text-slate-900">{selectedEmployee.bankDetails?.account || 'Não informado'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-500 font-medium">Chave PIX</p>
                                    <p className="font-semibold text-slate-900">{selectedEmployee.bankDetails?.pix || 'Não informado'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t pt-6 bg-slate-50/50 -mx-6 px-6 -mb-6 pb-6 rounded-b-lg">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 text-white font-bold">
                        {data.id ? 'Salvar Alterações' : 'Finalizar Lançamento'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
