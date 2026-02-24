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
  Truck,
  Loader2,
  Filter,
  Eye,
  XCircle,
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
import { VeiculoFormDialog } from '@/components/VeiculoFormDialog'
import { Vehicle } from '@/types'

export default function Veiculos() {
  const { vehicles, projects, fetchExpiringDocuments, deleteVehicle } =
    useAppStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  // Dialog States
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | undefined>(
    undefined,
  )

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Trigger fetch of docs when entering to ensure alerts are up to date
  useEffect(() => {
    fetchExpiringDocuments()
  }, [fetchExpiringDocuments])

  // KPIs
  const totalVehicles = vehicles.length
  const activeVehicles = vehicles.filter((v) => v.status === 'ativo').length
  const maintenanceVehicles = vehicles.filter(
    (v) => v.status === 'manutencao',
  ).length

  // Filter Logic
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || v.status === statusFilter

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
      case 'manutencao':
        return 'bg-amber-100 text-amber-700 hover:bg-amber-100/80 border-amber-200'
      case 'inativo':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'Ativo'
      case 'manutencao':
        return 'Em Manutenção'
      case 'inativo':
        return 'Inativo'
      default:
        return status
    }
  }

  const handleCreate = () => {
    setVehicleToEdit(undefined)
    setIsEditOpen(true)
  }

  const handleEdit = (e: React.MouseEvent, vehicle: Vehicle) => {
    e.stopPropagation()
    setVehicleToEdit(vehicle)
    setIsEditOpen(true)
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeleteId(id)
    setIsDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteVehicle(deleteId)
      toast({
        title: 'Veículo Removido',
        description: 'O veículo foi excluído com sucesso.',
      })
      setIsDeleteOpen(false)
      setDeleteId(null)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível remover o veículo.',
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
          <h1 className="text-3xl font-bold tracking-tight">
            Frota e Veículos
          </h1>
          <p className="text-muted-foreground">Gestão de veículos e alocação</p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Veículo
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Veículos
            </CardTitle>
            <div className="bg-blue-50 p-2 rounded-full">
              <Truck className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVehicles}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativos
            </CardTitle>
            <div className="bg-green-50 p-2 rounded-full">
              <Truck className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeVehicles}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Manutenção
            </CardTitle>
            <div className="bg-amber-50 p-2 rounded-full">
              <Truck className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {maintenanceVehicles}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-muted/20 p-4 rounded-lg border items-start md:items-center">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por placa, marca ou modelo..."
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
            <SelectItem value="manutencao">Manutenção</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
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
              <TableHead className="w-[15%] text-xs font-bold uppercase tracking-wider text-muted-foreground pl-6">
                Placa
              </TableHead>
              <TableHead className="w-[20%] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Marca / Modelo
              </TableHead>
              <TableHead className="w-[25%] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Obra Alocada
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
            {vehicles.length === 0 && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Truck className="h-10 w-10 text-muted-foreground/30" />
                    <p>Nenhum veículo encontrado.</p>
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
            {filteredVehicles.map((vehicle) => {
              const project = projects.find((p) => p.id === vehicle.projectId)
              return (
                <TableRow
                  key={vehicle.id}
                  onClick={() => navigate(`/veiculos/${vehicle.id}`)}
                  className="cursor-pointer hover:bg-muted/30 transition-colors group"
                >
                  <TableCell className="pl-6 py-4 font-mono font-medium">
                    {vehicle.plate}
                  </TableCell>

                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{vehicle.model}</span>
                      <span className="text-xs text-muted-foreground">
                        {vehicle.brand}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    {project ? (
                      <Badge variant="secondary" className="font-normal">
                        {project.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Não alocado
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-center py-4">
                    <Badge
                      variant="outline"
                      className={cn(
                        'px-3 py-1 text-xs font-medium border shadow-sm',
                        getStatusBadgeStyles(vehicle.status || 'ativo'),
                      )}
                    >
                      {getStatusLabel(vehicle.status || 'ativo')}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right pr-6 py-4">
                    <div className="flex justify-end items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/veiculos/${vehicle.id}`)
                        }}
                        className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                        title="Visualizar Detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleEdit(e, vehicle)}
                        className="text-muted-foreground hover:text-orange-600 hover:bg-orange-50"
                        title="Editar Veículo"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(e, vehicle.id)}
                        className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                        title="Excluir Veículo"
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

      <VeiculoFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        vehicleToEdit={vehicleToEdit}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o
              veículo e todos os dados associados.
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
