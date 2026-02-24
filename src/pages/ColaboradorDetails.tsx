import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'
import { Employee } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Loader2, User, Download } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ColaboradorFormDialog } from '@/components/ColaboradorFormDialog'
import { ColaboradorGeralTab } from '@/components/colaborador/ColaboradorGeralTab'
import { ColaboradorFinanceiroTab } from '@/components/colaborador/ColaboradorFinanceiroTab'
import { ColaboradorDocumentosTab } from '@/components/colaborador/ColaboradorDocumentosTab'
import { ColaboradorHoleritesTab } from '@/components/colaborador/ColaboradorHoleritesTab'
import { cn } from '@/lib/utils'
import { colaboradoresService } from '@/services/colaboradoresService'

export default function ColaboradorDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { employees, fetchEmployees } = useAppStore()
  const { toast } = useToast()

  const employee = id ? employees.find((e) => e.id === id) : null
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(!employee)

  // Initial fetch if needed
  useEffect(() => {
    const loadData = async () => {
      if (!employee && id) {
        setIsLoading(true)
        await fetchEmployees()
        setIsLoading(false)
      } else {
        setIsLoading(false)
      }
    }
    loadData()
  }, [id, !!employee, fetchEmployees])

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Colaborador não encontrado</h2>
        <Button onClick={() => navigate('/colaboradores')}>
          Voltar para lista
        </Button>
      </div>
    )
  }

  // Status Badge Logic
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

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/colaboradores')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Profile Photo */}
          <div className="w-20 h-20 rounded-full border-2 border-white shadow-sm overflow-hidden bg-muted flex items-center justify-center shrink-0">
            {employee.photoUrl ? (
              <img
                src={employee.photoUrl}
                alt={employee.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-muted-foreground/30" />
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              {employee.name}
              <Badge
                variant="outline"
                className={cn(
                  'px-2 py-0.5 text-xs font-medium border shadow-none capitalize',
                  getStatusBadgeStyles(employee.status),
                )}
              >
                {employee.status}
              </Badge>
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 text-sm mt-1">
              <User className="h-3 w-3" /> {employee.role}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {employee.photoUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const response = await fetch(employee.photoUrl!)
                  const blob = await response.blob()
                  const url = window.URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = `foto-${employee.name.replace(/\s+/g, '-').toLowerCase()}.${blob.type.split('/')[1] || 'jpg'}`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  window.URL.revokeObjectURL(url)
                } catch (error) {
                  console.error('Erro ao baixar foto:', error)
                  toast({
                    title: 'Erro no download',
                    description: 'Não foi possível baixar a foto automaticamente.',
                    variant: 'destructive',
                  })
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" /> Baixar Foto
            </Button>
          )}
          <Button
            onClick={() => setIsEditDialogOpen(true)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Edit className="h-4 w-4 mr-2" /> Editar Perfil
          </Button>
        </div>
      </div>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="w-full justify-start rounded-md border bg-muted/20 p-1 flex-wrap h-auto mb-6">
          <TabsTrigger value="geral" className="px-6">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="px-6">
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="documentacao" className="px-6">
            Documentação
          </TabsTrigger>
          <TabsTrigger value="holerites" className="px-6">
            Holerites
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="mt-0">
          <ColaboradorGeralTab employee={employee} />
        </TabsContent>

        <TabsContent value="financeiro" className="mt-0">
          <ColaboradorFinanceiroTab employee={employee} />
        </TabsContent>

        <TabsContent value="documentacao" className="mt-0">
          <ColaboradorDocumentosTab documents={employee.documents} />
        </TabsContent>

        <TabsContent value="holerites" className="mt-0">
          <ColaboradorHoleritesTab employeeId={employee.id} />
        </TabsContent>
      </Tabs>

      <ColaboradorFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        employeeToEdit={employee}
      />
    </div>
  )
}
