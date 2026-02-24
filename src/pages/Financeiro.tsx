import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Bill } from '@/types'
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
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import {
  Plus,
  Search,
  CheckCircle,
  Eye,
  Trash2,
  Home,
  Filter,
  Edit,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getAlertStatus } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'

export default function Financeiro() {
  const { bills, addBill, updateBill, deleteBill, projects, fetchBills } = useAppStore()
  const { toast } = useToast()

  // Categories state
  const [categories, setCategories] = useState<string[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: '',
    to: '',
  })

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [payModal, setPayModal] = useState<{
    open: boolean
    id: string | null
  }>({ open: false, id: null })
  const [editModal, setEditModal] = useState<{
    open: boolean
    bill: Bill | null
  }>({ open: false, bill: null })
  const [payDate, setPayDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  // Form State
  const [newBill, setNewBill] = useState<Partial<Bill>>({
    description: '',
    amount: 0,
    status: 'pending',
    origin: 'manual',
    category: 'Geral',
  })

  const filteredBills = bills
    .filter((bill) => {
      const matchesStatus =
        filterStatus === 'all' || bill.status === filterStatus
      const matchesSearch = bill.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

      let matchesDate = true
      if (dateRange.from && dateRange.to) {
        matchesDate = isWithinInterval(new Date(bill.dueDate), {
          start: startOfDay(new Date(dateRange.from)),
          end: endOfDay(new Date(dateRange.to)),
        })
      }

      return matchesStatus && matchesSearch && matchesDate
    })
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    )

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias_conta_pagar')
        .select('nome')
        .order('nome')

      if (error) throw error

      const categoryNames = data?.map((cat) => cat.nome) || []
      setCategories(categoryNames)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast({
        title: 'Erro',
        description: 'Falha ao carregar categorias.',
        variant: 'destructive',
      })
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite um nome para a categoria.',
        variant: 'destructive',
      })
      return
    }

    try {
      const { error } = await supabase
        .from('categorias_conta_pagar')
        .insert({ nome: newCategoryName.trim() })

      if (error) throw error

      toast({ title: 'Sucesso', description: 'Categoria criada com sucesso.' })
      setNewCategoryName('')
      setIsAddingCategory(false)
      await fetchCategories()
    } catch (error: any) {
      console.error('Error creating category:', error)
      toast({
        title: 'Erro',
        description: `Falha ao criar categoria: ${error.message}`,
        variant: 'destructive',
      })
    }
  }

  const handleDeleteCategory = async (categoryName: string) => {
    // Check if any bills use this category
    const billsUsingCategory = bills.filter((bill) => bill.category === categoryName)

    if (billsUsingCategory.length > 0) {
      toast({
        title: 'Não é possível excluir',
        description: `Existem ${billsUsingCategory.length} conta(s) usando esta categoria.`,
        variant: 'destructive',
      })
      return
    }

    // Confirm deletion
    if (!confirm(`Tem certeza que deseja excluir a categoria "${categoryName}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('categorias_conta_pagar')
        .delete()
        .eq('nome', categoryName)

      if (error) throw error

      toast({ title: 'Sucesso', description: 'Categoria excluída com sucesso.' })
      await fetchCategories()
    } catch (error: any) {
      console.error('Error deleting category:', error)
      toast({
        title: 'Erro',
        description: `Falha ao excluir categoria: ${error.message}`,
        variant: 'destructive',
      })
    }
  }

  const handleSave = () => {
    if (!newBill.description || !newBill.amount || !newBill.dueDate) return

    addBill({
      ...newBill,
      id: crypto.randomUUID(),
      status: 'pending',
      origin: 'manual',
    } as Bill)

    setIsAddOpen(false)
    setNewBill({
      description: '',
      amount: 0,
      origin: 'manual',
      category: 'Geral',
    })
    toast({ title: 'Sucesso', description: 'Boleto adicionado com sucesso.' })
  }

  const handleConfirmPay = async () => {
    if (!payModal.id) return

    if (!payDate) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione a data do pagamento.',
        variant: 'destructive',
      })
      return
    }

    try {
      console.log('Confirming payment for bill:', payModal.id)
      console.log('Payment date:', payDate)

      await updateBill(payModal.id, {
        status: 'paid',
        paidDate: new Date(payDate),
      })

      await fetchBills() // Refresh bills to show updated status
      toast({ title: 'Pago', description: 'Pagamento registrado com sucesso.' })
      setPayModal({ open: false, id: null })
      setPayDate(format(new Date(), 'yyyy-MM-dd'))
    } catch (error: any) {
      console.error('Error confirming payment:', error)
      toast({
        title: 'Erro',
        description: `Falha ao registrar pagamento: ${error.message}`,
        variant: 'destructive',
      })
    }
  }

  const handleEditSave = async () => {
    if (!editModal.bill) return

    // Validate required fields
    if (!editModal.bill.description || !editModal.bill.amount || !editModal.bill.dueDate) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    try {
      console.log('Saving edited bill:', editModal.bill)

      await updateBill(editModal.bill.id, editModal.bill)
      await fetchBills() // Refresh bills to show updated data

      toast({ title: 'Sucesso', description: 'Conta atualizada com sucesso.' })
      setEditModal({ open: false, bill: null })
    } catch (error: any) {
      console.error('Error saving edited bill:', error)
      toast({
        title: 'Erro',
        description: `Falha ao atualizar conta: ${error.message}`,
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteBill(id)
      toast({ title: 'Removido', description: 'Boleto removido.' })
    } catch (error: any) {
      console.error('Error deleting bill:', error)
      toast({
        title: 'Erro',
        description: `Falha ao excluir boleto: ${error.message}`,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas a Pagar</h1>
          <p className="text-muted-foreground">Gestão financeira e boletos</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Lançamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={newBill.description}
                  onChange={(e) =>
                    setNewBill({ ...newBill, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <MoneyInput
                    value={newBill.amount || 0}
                    onChange={(val) =>
                      setNewBill({ ...newBill, amount: val })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vencimento</Label>
                  <Input
                    type="date"
                    onChange={(e) =>
                      setNewBill({
                        ...newBill,
                        dueDate: new Date(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={newBill.category}
                  onValueChange={(v) => setNewBill({ ...newBill, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <div key={cat} className="flex items-center justify-between group">
                        <SelectItem value={cat} className="flex-1">
                          {cat}
                        </SelectItem>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 mr-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCategory(cat)
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <div className="border-t mt-2 pt-2 px-2">
                      {!isAddingCategory ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => setIsAddingCategory(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Nova Categoria
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Nome da categoria"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCreateCategory()
                              if (e.key === 'Escape') {
                                setIsAddingCategory(false)
                                setNewCategoryName('')
                              }
                            }}
                            autoFocus
                          />
                          <Button size="sm" onClick={handleCreateCategory}>
                            OK
                          </Button>
                        </div>
                      )}
                    </div>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Obra (Opcional)</Label>
                <Select
                  onValueChange={(v) =>
                    setNewBill({ ...newBill, projectId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Arquivo (Boleto/Fatura)</Label>
                <Input type="file" />
              </div>
              <Button onClick={handleSave} className="w-full">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-muted/20 p-4 rounded-lg border">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição..."
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            className="w-40 bg-background"
            value={dateRange.from}
            onChange={(e) =>
              setDateRange({ ...dateRange, from: e.target.value })
            }
          />
          <span className="text-muted-foreground">até</span>
          <Input
            type="date"
            className="w-40 bg-background"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="paid">Pagos</SelectItem>
            <SelectItem value="overdue">Vencidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md bg-white dark:bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBills.map((bill) => {
              const statusAlert = getAlertStatus(new Date(bill.dueDate))
              return (
                <TableRow key={bill.id} className="group">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{bill.description}</span>
                      <div className="flex items-center gap-2 mt-1">
                        {bill.origin === 'alojamento' && (
                          <>
                            <Badge
                              variant="secondary"
                              className="text-[10px] gap-1 px-1 py-0 h-5"
                            >
                              <Home className="h-3 w-3" /> Auto
                            </Badge>
                            {bill.accommodationName && (
                              <span className="text-xs text-muted-foreground">
                                {bill.accommodationName}
                              </span>
                            )}
                          </>
                        )}
                        {bill.projectId && (
                          <span className="text-xs text-muted-foreground">
                            {
                              projects.find((p) => p.id === bill.projectId)
                                ?.name
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{bill.category || 'Geral'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>
                        {format(new Date(bill.dueDate), 'dd/MM/yyyy')}
                      </span>
                      {bill.status !== 'paid' &&
                        statusAlert.severity !== 'ok' && (
                          <span
                            className={`text-[10px] font-bold ${statusAlert.color}`}
                          >
                            {statusAlert.label}
                          </span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">
                    R${' '}
                    {bill.amount.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        bill.status === 'paid'
                          ? 'default'
                          : bill.status === 'overdue'
                            ? 'destructive'
                            : 'outline'
                      }
                      className={
                        bill.status === 'paid'
                          ? 'bg-success hover:bg-success/80'
                          : ''
                      }
                    >
                      {bill.status === 'paid'
                        ? 'Pago'
                        : bill.status === 'overdue'
                          ? 'Vencido'
                          : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditModal({ open: true, bill })}
                        title="Editar"
                        className="hover:text-primary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {bill.status !== 'paid' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setPayModal({ open: true, id: bill.id })
                          }
                          title="Marcar como Pago"
                          className="hover:text-success"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(bill.id)}
                        title="Excluir"
                        className="hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={payModal.open}
        onOpenChange={(o) => setPayModal({ ...payModal, open: o })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Data do Pagamento</Label>
              <Input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayModal({ open: false, id: null })}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmPay}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bill Dialog */}
      <Dialog
        open={editModal.open}
        onOpenChange={(o) => setEditModal({ ...editModal, open: o })}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Conta</DialogTitle>
          </DialogHeader>
          {editModal.bill && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={editModal.bill.description}
                  onChange={(e) =>
                    setEditModal({
                      ...editModal,
                      bill: { ...editModal.bill!, description: e.target.value },
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <MoneyInput
                    value={editModal.bill.amount}
                    onChange={(val) =>
                      setEditModal({
                        ...editModal,
                        bill: {
                          ...editModal.bill!,
                          amount: val,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vencimento</Label>
                  <Input
                    type="date"
                    value={format(new Date(editModal.bill.dueDate), 'yyyy-MM-dd')}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        bill: {
                          ...editModal.bill!,
                          dueDate: new Date(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={editModal.bill.category}
                  onValueChange={(v) =>
                    setEditModal({
                      ...editModal,
                      bill: { ...editModal.bill!, category: v },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <div key={cat} className="flex items-center justify-between group">
                        <SelectItem value={cat} className="flex-1">
                          {cat}
                        </SelectItem>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 mr-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCategory(cat)
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <div className="border-t mt-2 pt-2 px-2">
                      {!isAddingCategory ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => setIsAddingCategory(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Nova Categoria
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Nome da categoria"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCreateCategory()
                              if (e.key === 'Escape') {
                                setIsAddingCategory(false)
                                setNewCategoryName('')
                              }
                            }}
                            autoFocus
                          />
                          <Button size="sm" onClick={handleCreateCategory}>
                            OK
                          </Button>
                        </div>
                      )}
                    </div>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editModal.bill.status}
                  onValueChange={(v) =>
                    setEditModal({
                      ...editModal,
                      bill: { ...editModal.bill!, status: v as any },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="overdue">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {
                editModal.bill.status === 'paid' && (
                  <>
                    <div className="space-y-2">
                      <Label>Data de Pagamento</Label>
                      <Input
                        type="date"
                        value={
                          editModal.bill.paidDate
                            ? format(new Date(editModal.bill.paidDate), 'yyyy-MM-dd')
                            : ''
                        }
                        onChange={(e) =>
                          setEditModal({
                            ...editModal,
                            bill: {
                              ...editModal.bill!,
                              paidDate: new Date(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                  </>
                )
              }
            </div >
          )
          }
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditModal({ open: false, bill: null })}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent >
      </Dialog >
    </div >
  )
}
