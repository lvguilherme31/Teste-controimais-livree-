import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Project } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Search,
  Building2,
  MapPin,
  Loader2,
  HardHat,
  CheckCircle2,
  Eye,
  Trash2,
  Edit,
  Filter,
  XCircle,
  CalendarDays,
} from 'lucide-react'
import {
  format,
  isWithinInterval,
  startOfDay,
  endOfDay,
  isValid,
} from 'date-fns'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
import { ObraFormDialog } from '@/components/ObraFormDialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

export default function Obras() {
  const { projects, loadingProjects, deleteProject } = useAppStore()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [projectToEdit, setProjectToEdit] = useState<Project | undefined>(
    undefined,
  )
  const [searchTerm, setSearchTerm] = useState('')

  // Advanced Filters State
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({ from: undefined, to: undefined })

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Get unique cities for filter
  const cities = useMemo(() => {
    const uniqueCities = new Set(
      projects.map((p) => p.city).filter((c) => c && c.trim() !== ''),
    )
    return Array.from(uniqueCities).sort()
  }, [projects])

  // Filter Projects
  const filteredProjects = projects.filter((p) => {
    // Text Search
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.client || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.city || '').toLowerCase().includes(searchTerm.toLowerCase())

    // Status Filter
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter

    // City Filter
    const matchesCity = cityFilter === 'all' || p.city === cityFilter

    // Date Range Filter (Previsão de Término)
    let matchesDate = true
    if (dateRange.from) {
      const pDate = p.predictedEndDate ? new Date(p.predictedEndDate) : null
      const isDateValid = pDate && isValid(pDate)

      if (!isDateValid) {
        // If filtering by date but project has no valid date, exclude it
        matchesDate = false
      } else if (dateRange.to) {
        matchesDate = isWithinInterval(pDate!, {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to),
        })
      } else {
        matchesDate = pDate! >= startOfDay(dateRange.from!)
      }
    }

    return matchesSearch && matchesStatus && matchesDate && matchesCity
  })

  // Dashboard calculations
  const totalObras = projects.length
  const obrasAtivas = projects.filter((p) => p.status === 'ativa').length
  const obrasConcluidas = projects.filter(
    (p) => p.status === 'concluida',
  ).length

  const handleCreate = () => {
    setProjectToEdit(undefined)
    setIsFormOpen(true)
  }

  const handleEdit = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation()
    setProjectToEdit(project)
    setIsFormOpen(true)
  }

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeleteId(id)
    setIsDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteProject(deleteId)
      toast({
        title: 'Obra Removida',
        description: 'O projeto foi excluído com sucesso.',
      })
      setIsDeleteOpen(false)
      setDeleteId(null)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível remover a obra. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setCityFilter('all')
    setDateRange({ from: undefined, to: undefined })
  }

  const hasActiveFilters =
    searchTerm ||
    statusFilter !== 'all' ||
    cityFilter !== 'all' ||
    dateRange.from

  // Helper for status badge styling
  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'ativa':
        return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80 border-emerald-200'
      case 'concluida':
        return 'bg-slate-100 text-slate-700 hover:bg-slate-100/80 border-slate-200'
      case 'inativa':
        return 'bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativa':
        return 'Ativa'
      case 'concluida':
        return 'Concluída'
      case 'inativa':
        return 'Inativa'
      default:
        return status
    }
  }

  const formatProjectDate = (date: Date | string | undefined | null) => {
    if (!date) return 'Não informado'
    const d = new Date(date)
    return isValid(d) ? format(d, 'dd/MM/yyyy') : 'Data inválida'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Obras e Projetos
          </h1>
          <p className="text-muted-foreground">
            Gerenciamento de canteiros e documentação
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Obra
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Obras
            </CardTitle>
            <div className="bg-blue-50 p-2 rounded-full">
              <HardHat className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalObras}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Obras Ativas
            </CardTitle>
            <div className="bg-green-50 p-2 rounded-full">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {obrasAtivas}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-l-4 border-l-slate-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Obras Concluídas
            </CardTitle>
            <div className="bg-slate-50 p-2 rounded-full">
              <CheckCircle2 className="h-4 w-4 text-slate-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">
              {obrasConcluidas}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-muted/20 p-4 rounded-lg border items-start md:items-center">
        <div className="relative flex-1 w-full md:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, cliente..."
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
            <SelectItem value="ativa">Ativa</SelectItem>
            <SelectItem value="concluida">Concluída</SelectItem>
            <SelectItem value="inativa">Inativa</SelectItem>
          </SelectContent>
        </Select>

        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-full md:w-[180px] bg-background">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Cidade" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Cidades</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full md:w-[240px] justify-start text-left font-normal bg-background',
                !dateRange.from && 'text-muted-foreground',
              )}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'dd/MM/yy')} -{' '}
                    {format(dateRange.to, 'dd/MM/yy')}
                  </>
                ) : (
                  format(dateRange.from, 'dd/MM/yyyy')
                )
              ) : (
                <span>Previsão de Término</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange as any}
              onSelect={(range: any) =>
                setDateRange(range || { from: undefined, to: undefined })
              }
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

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
              <TableHead className="w-[40%] text-xs font-bold uppercase tracking-wider text-muted-foreground pl-6">
                Obra / Cliente
              </TableHead>
              <TableHead className="w-[20%] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Localização
              </TableHead>
              <TableHead className="w-[20%] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Período
              </TableHead>
              <TableHead className="w-[10%] text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">
                Status
              </TableHead>
              <TableHead className="w-[10%] text-xs font-bold uppercase tracking-wider text-muted-foreground text-right pr-6">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingProjects && projects.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Carregando obras...</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!loadingProjects && filteredProjects.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="h-10 w-10 text-muted-foreground/30" />
                    <p>Nenhuma obra encontrada.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {filteredProjects.map((project) => (
              <TableRow
                key={project.id}
                className="group cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => navigate(`/obras/${project.id}`)}
              >
                <TableCell className="pl-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-foreground text-base">
                        {project.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {project.client}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="text-sm">
                      {project.city}
                      {project.state ? ` - ${project.state}` : ''}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="py-4">
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-foreground">
                        Início:
                      </span>{' '}
                      {formatProjectDate(project.startDate)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-foreground">Fim:</span>{' '}
                      {formatProjectDate(project.predictedEndDate)}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-center py-4">
                  <Badge
                    variant="outline"
                    className={cn(
                      'px-3 py-1 text-xs font-medium border shadow-sm',
                      getStatusBadgeStyles(project.status),
                    )}
                  >
                    {getStatusLabel(project.status)}
                  </Badge>
                </TableCell>

                <TableCell className="text-right pr-6 py-4">
                  <div className="flex justify-end items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/obras/${project.id}`)
                      }}
                      className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                      title="Visualizar Detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleEdit(e, project)}
                      className="text-muted-foreground hover:text-orange-600 hover:bg-orange-50"
                      title="Editar Obra"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteClick(e, project.id)}
                      className="text-muted-foreground hover:text-destructive hover:bg-red-50"
                      title="Excluir Obra"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ObraFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        projectToEdit={projectToEdit}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a
              obra e removerá os dados associados de nossos servidores.
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
