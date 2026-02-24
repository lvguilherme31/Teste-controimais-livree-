import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Plus,
  Search,
  Loader2,
  Users,
  UserCheck,
  UserX,
  Filter,
  XCircle,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { ColaboradorFormDialog } from '@/components/ColaboradorFormDialog'
import { Employee } from '@/types'

export default function Colaboradores() {
  const { employees, fetchExpiringDocuments, deleteEmployee, fetchEmployees } =
    useAppStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | undefined>(
    undefined,
  )

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Trigger fetch of docs when entering to ensure alerts are up to date
  useEffect(() => {
    fetchExpiringDocuments()
    // Fetch employees to ensure fresh data (address mapping updates etc)
    const loadData = async () => {
      setIsLoading(true)
      await fetchEmployees()
      setIsLoading(false)
    }
    loadData()
  }, [fetchExpiringDocuments, fetchEmployees])

  // KPIs
  const totalEmployees = employees.length
  const activeEmployees = employees.filter((e) => e.status === 'ativo').length
  const awayEmployees = employees.filter(
    (e) => e.status === 'ferias' || e.status === 'afastado',
  ).length

  // Filter Logic
  const filteredEmployees = employees.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.cpf.includes(searchTerm) ||
      e.phone.includes(searchTerm)

    const matchesStatus = statusFilter === 'all' || e.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
  }

  const hasActiveFilters = searchTerm || statusFilter !== 'all'

  // Helper for status badge styling
  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80 border-emerald-200'
      case 'ferias':
        return 'bg-amber-100 text-amber-700 hover:bg-amber-100/80 border-amber-200'
      case 'afastado':
        return 'bg-slate-100 text-slate-700 hover:bg-slate-100/80 border-slate-200'
      case 'desligado':
        return 'bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'Ativo'
      case 'ferias':
        return 'Férias'
      case 'afastado':
        return 'Afastado'
      case 'desligado':
        return 'Desligado'
      default:
        return status
    }
  }

  const handleCreate = () => {
    setEmployeeToEdit(undefined)
    setIsFormOpen(true)
  }

  const handleEdit = (e: React.MouseEvent, employee: Employee) => {
    e.stopPropagation()
    setEmployeeToEdit(employee)
    setIsFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteEmployee(deleteId)
      toast({
        title: 'Colaborador Removido',
        description: 'O colaborador foi excluído com sucesso.',
      })
      setIsDeleteOpen(false)
      setDeleteId(null)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível remover o colaborador.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Colaboradores</h1>
          <p className="text-muted-foreground">
            Gestão de equipe e documentação
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Colaborador
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Colaboradores
            </CardTitle>
            <div className="bg-blue-50 p-2 rounded-full">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativos
            </CardTitle>
            <div className="bg-green-50 p-2 rounded-full">
              <UserCheck className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeEmployees}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Férias / Afastados
            </CardTitle>
            <div className="bg-amber-50 p-2 rounded-full">
              <UserX className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {awayEmployees}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-muted/20 p-4 rounded-lg border items-start md:items-center">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, cargo ou CPF..."
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px] bg-background">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="ferias">Férias</SelectItem>
            <SelectItem value="afastado">Afastado</SelectItem>
            <SelectItem value="desligado">Desligado</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        )}
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[35%] text-xs font-bold uppercase tracking-wider text-muted-foreground pl-6">
                Colaborador
              </TableHead>
              <TableHead className="w-[20%] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Cargo
              </TableHead>
              <TableHead className="w-[20%] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Telefone
              </TableHead>
              <TableHead className="w-[15%] text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">
                Status
              </TableHead>
              <TableHead className="w-[10%] text-xs font-bold uppercase tracking-wider text-muted-foreground text-right pr-6">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-10 w-10 text-muted-foreground/30" />
                    <p>Nenhum colaborador encontrado.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            )}
            {filteredEmployees.map((employee) => {
              return (
                <TableRow
                  key={employee.id}
                  onClick={() => navigate(`/colaboradores/${employee.id}`)}
                  className="cursor-pointer hover:bg-muted/30 transition-colors group"
                >
                  <TableCell className="pl-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground text-base">
                        {employee.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {employee.email}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 font-medium text-foreground/80">
                    {employee.role}
                  </TableCell>

                  <TableCell className="py-4 text-muted-foreground">
                    {employee.phone || '-'}
                  </TableCell>

                  <TableCell className="text-center py-4">
                    <Badge
                      variant="outline"
                      className={cn(
                        'px-3 py-1 text-xs font-medium border shadow-sm',
                        getStatusBadgeStyles(employee.status),
                      )}
                    >
                      {getStatusLabel(employee.status)}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right pr-6 py-4">
                    <div className="flex justify-end items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/colaboradores/${employee.id}`)
                        }}
                        className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                        title="Visualizar Perfil"
                        aria-label="Visualizar colaborador"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleEdit(e, employee)}
                        className="text-muted-foreground hover:text-orange-600 hover:bg-orange-50"
                        title="Editar Colaborador"
                        aria-label="Editar colaborador"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteId(employee.id)
                          setIsDeleteOpen(true)
                        }}
                        className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                        title="Excluir Colaborador"
                        aria-label="Excluir colaborador"
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

      <ColaboradorFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        employeeToEdit={employeeToEdit}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o
              colaborador e seus documentos do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
