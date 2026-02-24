import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { toast } from '@/components/ui/use-toast'
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
import { Plus, Search, Home, Loader2, Filter, Eye, XCircle, Edit, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { cn, getAlertStatus } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { alojamentosService } from '@/services/alojamentosService'

export default function Alojamentos() {
  const { accommodations, projects, fetchExpiringDocuments, deleteAccommodation } = useAppStore()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  // Trigger fetch of docs when entering to ensure alerts are up to date
  useEffect(() => {
    fetchExpiringDocuments()
  }, [fetchExpiringDocuments])

  // KPIs
  const totalAccommodations = accommodations.length
  const activeAccommodations = accommodations.filter(
    (a) => a.status === 'active',
  ).length
  const expiringContracts = accommodations.filter((a) => {
    const status = getAlertStatus(new Date(a.contractExpiry))
    return status.severity === 'expired' || status.severity === 'urgent'
  }).length

  // Filter Logic
  const filteredAccommodations = accommodations.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.address.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || a.status === statusFilter

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
      case 'active':
        return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80 border-emerald-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'inactive':
        return 'Inativo'
      default:
        return status
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este alojamento?')) {
      try {
        await deleteAccommodation(id)
        toast({
          title: 'Sucesso',
          description: 'Alojamento excluído com sucesso.',
        })
      } catch (error: any) {
        console.error('Erro ao excluir:', error)
        toast({
          title: 'Erro',
          description: `Falha ao excluir alojamento: ${error.message || 'Erro desconhecido'}`,
          variant: 'destructive',
        })
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alojamentos</h1>
          <p className="text-muted-foreground">
            Gestão de moradias e contratos
          </p>
        </div>
        <Button
          onClick={() => navigate('/alojamentos/novo')}
          className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Alojamento
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Alojamentos
            </CardTitle>
            <div className="bg-blue-50 p-2 rounded-full">
              <Home className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAccommodations}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativos
            </CardTitle>
            <div className="bg-green-50 p-2 rounded-full">
              <Home className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeAccommodations}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contratos Críticos
            </CardTitle>
            <div className="bg-red-50 p-2 rounded-full">
              <Home className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {expiringContracts}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-muted/20 p-4 rounded-lg border items-start md:items-center">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou endereço..."
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
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
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
              <TableHead className="w-[30%] text-xs font-bold uppercase tracking-wider text-muted-foreground pl-6">
                Nome
              </TableHead>
              <TableHead className="w-[30%] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Endereço
              </TableHead>
              <TableHead className="w-[20%] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Vencimento do Contrato
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
            {accommodations.length === 0 && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Home className="h-10 w-10 text-muted-foreground/30" />
                    <p>Nenhum alojamento encontrado.</p>
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
            {filteredAccommodations.map((acc) => {
              const contractStatus = getAlertStatus(
                new Date(acc.contractExpiry),
              )
              return (
                <TableRow
                  key={acc.id}
                  onClick={() => navigate(`/alojamentos/${acc.id}`, { state: { readOnly: true } })}
                  className="cursor-pointer hover:bg-muted/30 transition-colors group"
                >
                  <TableCell className="pl-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground text-base">
                        {acc.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {projects.find((p) => p.id === acc.projectId)?.name ||
                          'Sem Obra'}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 text-muted-foreground">
                    {acc.address}
                  </TableCell>

                  <TableCell className="py-4">
                    <div className="flex flex-col items-start gap-1">
                      <span>
                        {format(new Date(acc.contractExpiry), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-center py-4">
                    <Badge
                      variant="outline"
                      className={cn(
                        'px-3 py-1 text-xs font-medium border shadow-sm',
                        getStatusBadgeStyles(acc.status),
                      )}
                    >
                      {getStatusLabel(acc.status)}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right pr-6 py-4">
                    <div className="flex justify-end items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/alojamentos/${acc.id}`, { state: { readOnly: true } })
                        }}
                        className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                        title="Visualizar Detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/alojamentos/${acc.id}`, { state: { readOnly: false } })
                        }}
                        className="text-muted-foreground hover:text-orange-600 hover:bg-orange-50"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(acc.id)
                        }}
                        className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                        title="Excluir"
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
    </div >
  )
}
