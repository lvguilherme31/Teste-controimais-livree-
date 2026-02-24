import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/stores/useAppStore'
import { Project, ProjectDocument } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Building2, Edit, Loader2 } from 'lucide-react'
import { ObraFormDialog } from '@/components/ObraFormDialog'
import { cn } from '@/lib/utils'
import { obrasService } from '@/services/obrasService'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
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
import { ObraGeralTab } from '@/components/obra/ObraGeralTab'
import { ObraFinanceiroTab } from '@/components/obra/ObraFinanceiroTab'
import { ObraDocumentosTab } from '@/components/obra/ObraDocumentosTab'

export default function ObraDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { projects, loadingProjects, fetchProjects } = useAppStore()
  const { toast } = useToast()

  // Local state to supplement global store, for faster updates on this page
  const [project, setProject] = useState<Project | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] =
    useState<ProjectDocument | null>(null)

  const [isDeletingDoc, setIsDeletingDoc] = useState(false)

  useEffect(() => {
    if (!projects.length && !loadingProjects) {
      fetchProjects()
    }
  }, [projects.length, loadingProjects, fetchProjects])

  // Sync with global store initially and on updates
  useEffect(() => {
    if (id && projects.length > 0) {
      const found = projects.find((p) => p.id === id)
      if (found) {
        setProject(found)
      }
    }
  }, [id, projects])

  // Local refresh function
  const refreshProject = async () => {
    if (!id) return
    try {
      const updated = await obrasService.getById(id)
      if (updated) {
        setProject(updated)
        // Also trigger global update eventually
        fetchProjects()
      }
    } catch (error) {
      console.error('Failed to refresh project', error)
    }
  }

  const handleDeleteDocument = async () => {
    if (!documentToDelete || !documentToDelete.id) return
    setIsDeletingDoc(true)
    try {
      await obrasService.deleteDocument(documentToDelete.id)
      toast({
        title: 'Documento removido',
        description: 'O documento foi excluído com sucesso.',
      })
      await refreshProject()
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Não foi possível excluir o documento.',
        variant: 'destructive',
      })
    } finally {
      setIsDeletingDoc(false)
      setDocumentToDelete(null)
    }
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center">
        {loadingProjects ? (
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        ) : (
          'Obra não encontrada'
        )}
      </div>
    )
  }

  // Get documents list from project (excluding contracts which are handled separately in data structure but might be in documents too)
  const documents = Object.values(project.documents || {}).filter(
    (d) => d && d.type !== 'contrato',
  )

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/obras')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              {project.name}
              <Badge
                variant={
                  project.status === 'ativa'
                    ? 'default'
                    : project.status === 'concluida'
                      ? 'secondary'
                      : 'outline'
                }
                className={cn(
                  project.status === 'ativa' &&
                    'bg-emerald-500 hover:bg-emerald-600',
                  project.status === 'inativa' && 'bg-red-500 hover:bg-red-600',
                )}
              >
                {project.status === 'ativa'
                  ? 'Ativa'
                  : project.status === 'concluida'
                    ? 'Concluída'
                    : 'Inativa'}
              </Badge>
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 text-sm mt-1">
              <Building2 className="h-3 w-3" /> {project.client}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsEditDialogOpen(true)}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Edit className="h-4 w-4 mr-2" /> Editar Obra
        </Button>
      </div>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="w-full justify-start rounded-md border bg-muted/20 p-1 flex-wrap h-auto mb-6">
          <TabsTrigger value="geral" className="px-6">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="px-6">
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="documentos" className="px-6">
            Documentação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="mt-0">
          <ObraGeralTab project={project} />
        </TabsContent>

        <TabsContent value="financeiro" className="mt-0">
          <ObraFinanceiroTab project={project} />
        </TabsContent>

        <TabsContent value="documentos" className="mt-0">
          <ObraDocumentosTab
            documents={documents as ProjectDocument[]}
            onDeleteClick={setDocumentToDelete}
          />
        </TabsContent>
      </Tabs>

      <ObraFormDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) {
            refreshProject()
          }
        }}
        projectToEdit={project}
      />

      <AlertDialog
        open={!!documentToDelete}
        onOpenChange={(open) => !open && setDocumentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento será permanentemente
              excluído do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingDoc}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteDocument()
              }}
              disabled={isDeletingDoc}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingDoc ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removendo...
                </>
              ) : (
                'Remover'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
