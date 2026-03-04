import { useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { EmployeePayment, Employee, Payslip } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import {
    Plus,
    Search,
    Trash2,
    FileText,
    Eye,
    Check,
    Pencil,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DatePicker } from '@/components/ui/date-picker'
import { PagamentoFormDialog } from '@/components/PagamentoFormDialog'
import { Checkbox } from '@/components/ui/checkbox'

export default function PagamentoFuncionarios() {
    const {
        employees,
        projects,
        employeePayments,
        addEmployeePayment,
        updateEmployeePayment,
        deleteEmployeePayment,
        updateEmployee,
    } = useAppStore()
    const { toast } = useToast()

    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])

    // Modals
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [selectedPayment, setSelectedPayment] = useState<Partial<EmployeePayment> & { employee?: Employee } | null>(null)
    const [isPayslipOpen, setIsPayslipOpen] = useState(false)
    const [payslips, setPayslips] = useState<Payslip[]>([])
    const [uploading, setUploading] = useState(false)

    // filter active employees
    const activeEmployees = employees.filter(e => e.status === 'ativo')

    // Mapeia todos os funcionários ativos garantindo APENAS 1 linha por funcionário por mês.
    const filteredPayments = activeEmployees.map(emp => {
        // Encontra o pagamento referente a ESTE funcionário e ESTE mês selecionado
        const payment = employeePayments.find(p => p.colaboradorId === emp.id && p.mesReferencia === selectedMonth)
        return {
            employee: emp,
            payment: payment
        }
    }).filter(item => {
        const matchesSearch = item.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.employee.cpf?.includes(searchTerm)

        let matchesStatus = true
        if (filterStatus !== 'all') {
            if (filterStatus === 'pendente') {
                matchesStatus = !item.payment || item.payment.status === 'pendente'
            } else {
                matchesStatus = item.payment?.status === filterStatus
            }
        }
        return matchesSearch && matchesStatus
    })

    const toggleAll = () => {
        if (selectedEmployeeIds.length === filteredPayments.length && filteredPayments.length > 0) {
            setSelectedEmployeeIds([])
        } else {
            setSelectedEmployeeIds(filteredPayments.map(item => item.employee.id))
        }
    }

    const toggleSelection = (id: string) => {
        setSelectedEmployeeIds(prev =>
            prev.includes(id) ? prev.filter(empId => empId !== id) : [...prev, id]
        )
    }

    const totalSelectedValue = filteredPayments
        .filter(item => selectedEmployeeIds.includes(item.employee.id))
        .reduce((sum, item) => {
            const val = item.payment?.valorAPagar || (item.employee.tipoRemuneracao === 'production' ? ((item.employee.salary || 0) + (item.employee.producaoValorTotal || 0)) : (item.employee.salary || 0))
            return sum + val
        }, 0)

    const handleCreatePayment = () => {
        setSelectedPayment({
            mesReferencia: format(new Date(), 'yyyy-MM'),
            valorAPagar: 0,
            status: 'pendente',
        })
        setIsEditOpen(true)
    }

    const handleEditPayment = (emp: Employee, payment?: EmployeePayment) => {
        setSelectedPayment({
            ...(payment || {
                colaboradorId: emp.id,
                mesReferencia: format(new Date(), 'yyyy-MM'),
                valorAPagar: emp.tipoRemuneracao === 'production' ? ((emp.salary || 0) + (emp.producaoValorTotal || 0)) : (emp.salary || 0),
                status: 'pendente',
            }),
            employee: emp
        })
        setIsEditOpen(true)
    }

    const handleSavePayment = async (data: any) => {
        if (!selectedPayment) return
        try {
            const { file, tipoRemuneracao, producaoData, producaoObraId, producaoValorTotal, salary, ...paymentData } = data

            // Sync employee configuration edits from this modal back to the Employee table
            if (paymentData.colaboradorId) {
                const isProduction = tipoRemuneracao === 'production'
                let salaryUpdate = {}
                if (isProduction) {
                    salaryUpdate = {
                        tipoRemuneracao: 'production',
                        producaoData: producaoData,
                        producaoObraId: (!producaoObraId || producaoObraId === 'none') ? null : producaoObraId,
                        producaoValorTotal: producaoValorTotal,
                        salary: salary
                    }
                } else {
                    salaryUpdate = {
                        tipoRemuneracao: 'fixed',
                        salary: paymentData.valorAPagar
                    }
                }
                await updateEmployee(paymentData.colaboradorId, salaryUpdate)
            }

            if (paymentData.id) {
                await updateEmployeePayment(paymentData.id, paymentData)
            } else {
                await addEmployeePayment(paymentData as any)
            }

            // Handle file upload if present
            if (file && paymentData.colaboradorId) {
                await pagamentosService.uploadPayslip(paymentData.colaboradorId, paymentData.mesReferencia, file)
            }

            toast({ title: 'Sucesso', description: 'Pagamento salvo com sucesso.' })
            setIsEditOpen(false)
        } catch (error) {
            console.error(error)
            toast({ title: 'Erro', description: 'Falha ao salvar pagamento.', variant: 'destructive' })
        }
    }

    const handleDeletePayment = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este registro de pagamento?')) return
        try {
            await deleteEmployeePayment(id)
            toast({ title: 'Sucesso', description: 'Registro excluído.' })
        } catch (error) {
            toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' })
        }
    }

    const handleQuickPay = async (id: string) => {
        try {
            await updateEmployeePayment(id, {
                status: 'pago',
                dataPagamento: new Date()
            })
            toast({ title: 'Sucesso', description: 'Pagamento marcado como pago.' })

            // Auto-Generate Next Month
            const payment = employeePayments.find(p => p.id === id)
            if (payment) {
                const currentMonthDate = new Date(`${payment.mesReferencia}-01T00:00:00`)
                currentMonthDate.setMonth(currentMonthDate.getMonth() + 1)
                const nextMonthStr = format(currentMonthDate, 'yyyy-MM')

                const emp = employees.find(e => e.id === payment.colaboradorId)
                if (emp && emp.status === 'ativo') {
                    // Check if already exists
                    const exists = employeePayments.some(p => p.colaboradorId === emp.id && p.mesReferencia === nextMonthStr)
                    if (!exists) {
                        try {
                            await addEmployeePayment({
                                colaboradorId: emp.id,
                                mesReferencia: nextMonthStr,
                                valorAPagar: emp.tipoRemuneracao === 'production' ? ((emp.salary || 0) + (emp.producaoValorTotal || 0)) : (emp.salary || 0),
                                status: 'pendente',
                                observacoes: 'Gerado automaticamente'
                            } as any)
                        } catch (e) {
                            console.error("Failed to generate next month payment", e)
                        }
                    }
                }
            }

        } catch (error) {
            toast({ title: 'Erro', description: 'Falha ao atualizar status.', variant: 'destructive' })
        }
    }

    const handleOpenPayslips = async (empId: string, mes?: string) => {
        try {
            const data = await pagamentosService.getPayslips(empId)
            setPayslips(data)
            setSelectedPayment({ colaboradorId: empId, mesReferencia: mes } as any)
            setIsPayslipOpen(true)
        } catch (error) {
            toast({ title: 'Erro', description: 'Falha ao carregar holerites.', variant: 'destructive' })
        }
    }

    const handleUploadPayslip = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !selectedPayment?.colaboradorId) return

        const mesToUpload = selectedPayment.mesReferencia || format(new Date(), 'yyyy-MM')

        setUploading(true)
        try {
            await pagamentosService.uploadPayslip(selectedPayment.colaboradorId, mesToUpload, file)
            toast({ title: 'Sucesso', description: 'Holerite enviado.' })
            const data = await pagamentosService.getPayslips(selectedPayment.colaboradorId)
            setPayslips(data)
        } catch (error) {
            toast({ title: 'Erro', description: 'Falha no upload.', variant: 'destructive' })
        } finally {
            setUploading(false)
        }
    }

    const handleDeletePayslip = async (payslip: Payslip) => {
        if (!confirm('Excluir este holerite?')) return
        try {
            await pagamentosService.deletePayslip(payslip.id, payslip.urlArquivo)
            setPayslips(payslips.filter(p => p.id !== payslip.id))
            toast({ title: 'Sucesso', description: 'Holerite excluído.' })
        } catch (error) {
            toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' })
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pagamento de Funcionários</h1>
                    <p className="text-slate-500 text-sm">Gerencie pagamentos e holerites dos colaboradores ativos.</p>
                </div>
                <Button onClick={handleCreatePayment} className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="mr-2 h-4 w-4" /> Novo Lançamento
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por nome ou CPF..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Month Filter */}
                <div className="flex items-center gap-2">
                    <Label className="text-slate-500 text-sm whitespace-nowrap">Mês Ref.</Label>
                    <Input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-[180px]"
                    />
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos Pagamentos</SelectItem>
                        <SelectItem value="pendente">Pendentes</SelectItem>
                        <SelectItem value="pago">Pagos</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={filteredPayments.length > 0 && selectedEmployeeIds.length === filteredPayments.length}
                                    onCheckedChange={toggleAll}
                                    aria-label="Selecionar todos"
                                />
                            </TableHead>
                            <TableHead>Colaborador</TableHead>
                            <TableHead>Obra</TableHead>
                            <TableHead>Remuneração</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Mês Ref.</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPayments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                                    Nenhum pagamento registrado para os filtros selecionados.
                                </TableCell>
                            </TableRow>
                        ) : filteredPayments.map((item) => (
                            <TableRow key={item.employee.id}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedEmployeeIds.includes(item.employee.id)}
                                        onCheckedChange={() => toggleSelection(item.employee.id)}
                                        aria-label={`Selecionar ${item.employee.name}`}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <p className="font-medium text-slate-900">{item.employee.name}</p>
                                        <p className="text-xs text-slate-500">CPF: {item.employee.cpf || 'N/A'}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {projects.find(p => p.id === item.employee.producaoObraId)?.name || 'Sem Obra'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {item.employee.tipoRemuneracao === 'production' ? 'Produção' : 'Piso / Fixo'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-semibold text-slate-700">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                        item.payment?.valorAPagar ||
                                        (item.employee.tipoRemuneracao === 'production' ? ((item.employee.salary || 0) + (item.employee.producaoValorTotal || 0)) : (item.employee.salary || 0))
                                    )}
                                </TableCell>
                                <TableCell>
                                    {item.payment ? (
                                        <Badge className={item.payment.status === 'pago' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-amber-100 text-amber-700 hover:bg-amber-100'}>
                                            {item.payment.status.toUpperCase()}
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary">NÃO LANÇADO</Badge>
                                    )}
                                </TableCell>
                                <TableCell>{item.payment?.mesReferencia || selectedMonth}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2 text-[#000000]">
                                        {item.payment && item.payment.status === 'pendente' && (
                                            <Button variant="ghost" size="icon" onClick={() => handleQuickPay(item.payment!.id)} title="Marcar como Pago">
                                                <Check className="h-4 w-4 text-green-600" />
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" onClick={() => handleEditPayment(item.employee, item.payment)}>
                                            <Pencil className="h-4 w-4 text-blue-600" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenPayslips(item.employee.id)}>
                                            <FileText className="h-4 w-4 text-slate-600" />
                                        </Button>
                                        {item.payment && (
                                            <Button variant="ghost" size="icon" onClick={() => handleDeletePayment(item.payment!.id)}>
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={4} className="font-bold text-right">
                                Total Selecionado ({selectedEmployeeIds.length} {(selectedEmployeeIds.length === 1) ? 'colaborador' : 'colaboradores'}):
                            </TableCell>
                            <TableCell colSpan={4} className="font-black text-lg text-emerald-700">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSelectedValue)}
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>

            {/* Advanced Payment Modal */}
            <PagamentoFormDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                onSave={handleSavePayment}
                employees={employees}
                projects={projects}
                initialData={selectedPayment}
            />

            {/* Payslips Management Modal */}
            <Dialog open={isPayslipOpen} onOpenChange={setIsPayslipOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Gerenciar Holerites</DialogTitle>
                    </DialogHeader>
                    {selectedPayment?.colaboradorId && (
                        <div className="space-y-6 py-4">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <p className="text-sm font-bold text-slate-900">{employees.find(e => e.id === selectedPayment.colaboradorId)?.name}</p>
                                <p className="text-xs text-slate-500">Mês de Referência: <span className="font-semibold text-orange-600">{selectedPayment.mesReferencia || 'Não especificado'}</span></p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="font-bold">Arquivos Anexados</Label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            className="hidden"
                                            id="payslip-upload"
                                            onChange={handleUploadPayslip}
                                            disabled={uploading}
                                            accept="image/*,application/pdf"
                                        />
                                        <Label htmlFor="payslip-upload" className="cursor-pointer">
                                            <div className="flex items-center gap-2 bg-orange-600 text-white px-3 py-2 rounded-md font-medium text-sm hover:bg-orange-700 transition-colors shadow-sm">
                                                <Plus className="h-4 w-4" />
                                                Anexar Holerite
                                            </div>
                                        </Label>
                                    </div>
                                </div>

                                {uploading && (
                                    <div className="flex items-center justify-center py-2 gap-2 text-blue-600 animate-pulse">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                        <p className="text-xs font-bold uppercase tracking-wider">Enviando documento...</p>
                                    </div>
                                )}

                                <div className="border rounded-xl divide-y bg-white overflow-hidden shadow-sm">
                                    {payslips.filter(p => !selectedPayment.mesReferencia || p.mesReferencia === selectedPayment.mesReferencia).length === 0 ? (
                                        <div className="p-8 text-center space-y-2">
                                            <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                                                <FileText className="h-6 w-6 text-slate-300" />
                                            </div>
                                            <p className="text-slate-500 text-sm">Nenhum holerite encontrado para este mês.</p>
                                        </div>
                                    ) : (
                                        payslips
                                            .filter(p => !selectedPayment.mesReferencia || p.mesReferencia === selectedPayment.mesReferencia)
                                            .map(p => (
                                                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2.5 bg-red-50 rounded-lg text-red-600 border border-red-100">
                                                            <FileText className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900 truncate max-w-[200px]">{p.nomeArquivo}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Referência: {p.mesReferencia}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-slate-100" asChild>
                                                            <a href={p.urlArquivo} target="_blank" rel="noreferrer">
                                                                <Eye className="h-4 w-4 text-slate-600" />
                                                            </a>
                                                        </Button>
                                                        <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-red-50 border-red-100 group" onClick={() => handleDeletePayslip(p)}>
                                                            <Trash2 className="h-4 w-4 text-red-600 group-hover:scale-110 transition-transform" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                    )}
                                </div>

                                {payslips.filter(p => selectedPayment.mesReferencia && p.mesReferencia !== selectedPayment.mesReferencia).length > 0 && (
                                    <div className="pt-4 mt-4 border-t border-dashed">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Outros Meses</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Array.from(new Set(payslips.filter(p => p.mesReferencia !== selectedPayment.mesReferencia).map(p => p.mesReferencia))).map(mes => (
                                                <div key={mes} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 text-[11px]">
                                                    <span className="font-medium">{mes}</span>
                                                    <Button variant="ghost" size="sm" className="h-6 p-1 text-slate-500 hover:text-orange-600" onClick={() => setSelectedPayment({ ...selectedPayment, mesReferencia: mes })}>
                                                        Ver
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter className="bg-slate-50/50 -mx-6 px-6 -mb-6 pb-6 pt-4 rounded-b-lg border-t">
                        <Button className="w-full bg-slate-900 hover:bg-slate-800" onClick={() => setIsPayslipOpen(false)}>Fechar Gerenciador</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function EditIcon({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22h6" /><path d="M18.5 4.9L21 7.4l-12 12L6.5 16.9l12-12z" /><path d="M15 6.5l2.5 2.5" /></svg>
}
