import { useState, useEffect } from 'react'
import { Project, ProjectDocument } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DatePicker } from '@/components/ui/date-picker'
import { FileUploader } from '@/components/FileUploader'
import { useAppStore } from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'
import {
  formatCNPJ,
  validateCNPJ,
  getAlertStatus,
  cn,
  BR_STATES,
} from '@/lib/utils'
import {
  Loader2,
  FileText,
  AlertCircle,
  Plus,
  AlertTriangle,
  X,
  Trash2,
} from 'lucide-react'
import { DocumentUploadRow } from '@/components/DocumentUploadRow'
import { ProjectDocumentUpload } from '@/services/obrasService'

const FIXED_DOC_TYPES = [
  { label: 'PGR', type: 'pgr' },
  { label: 'PCMSO', type: 'pcmso' },
  { label: 'ART', type: 'art' },
  { label: 'Seguro', type: 'seguro' },
  { label: 'CNO', type: 'cno' },
]

interface DocumentUpload {
  file?: File
  expiry?: Date
  existingDoc?: ProjectDocument
}

interface CustomDoc {
  id: string
  description: string
  expiry?: Date
  file?: File
  existingDoc?: ProjectDocument
  dbId?: string
}

interface ContractUpload {
  id: string
  dbId?: string
  description: string
  value: number
  file?: File
  expiry?: string
  existingUrl?: string
  existingName?: string
}

interface ObraFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectToEdit?: Project
}

export function ObraFormDialog({
  open,
  onOpenChange,
  projectToEdit,
}: ObraFormDialogProps) {
  const { addProject, updateProject } = useAppStore()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cnpjError, setCnpjError] = useState<string | null>(null)

  // Form State
  const [currentProject, setCurrentProject] = useState<Partial<Project>>({
    status: 'ativa',
    documents: {},
    startDate: undefined,
    predictedEndDate: undefined,
    contractValue: 0,
  })

  // File States
  const [fixedDocs, setFixedDocs] = useState<Record<string, DocumentUpload>>({})
  const [customDocs, setCustomDocs] = useState<CustomDoc[]>([])
  const [contracts, setContracts] = useState<ContractUpload[]>([
    { id: crypto.randomUUID(), description: 'Contrato Principal', value: 0 },
  ])
  const [contractToDelete, setContractToDelete] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (projectToEdit) {
        setCurrentProject({ ...projectToEdit })

        const initialFixedDocs: Record<string, DocumentUpload> = {}
        const initialCustomDocs: CustomDoc[] = []
        const fixedTypeKeys = FIXED_DOC_TYPES.map((t) => t.type)

        if (projectToEdit.documents) {
          Object.values(projectToEdit.documents).forEach((doc) => {
            if (!doc) return

            // If it's one of the fixed types, populate fixedDocs
            if (doc.type && fixedTypeKeys.includes(doc.type.toLowerCase())) {
              initialFixedDocs[doc.type.toLowerCase()] = {
                expiry: doc.expiry ? new Date(doc.expiry) : undefined,
                existingDoc: doc,
              }
            } else {
              // Otherwise, treat as custom doc
              initialCustomDocs.push({
                id: crypto.randomUUID(),
                dbId: doc.id,
                description: doc.description || doc.type || 'Documento',
                expiry: doc.expiry ? new Date(doc.expiry) : undefined,
                existingDoc: doc,
              })
            }
          })
        }
        setFixedDocs(initialFixedDocs)
        setCustomDocs(initialCustomDocs)

        // Initialize Contracts
        const initialContracts = projectToEdit.contracts?.map((c) => ({
          id: crypto.randomUUID(),
          dbId: c.id,
          description: c.description || c.name,
          value: c.value || 0,
          existingUrl: c.url,
          existingName: c.name,
          expiry: c.expiry ? c.expiry.toISOString() : undefined,
        })) || [
            {
              id: crypto.randomUUID(),
              description: 'Contrato Principal',
              value: 0,
            },
          ]
        setContracts(initialContracts)
      } else {
        // Reset for new project
        setCurrentProject({
          status: 'ativa',
          cnpj: '',
          startDate: undefined,
          predictedEndDate: undefined,
          contractValue: 0,
        })
        setFixedDocs({})
        setCustomDocs([])
        setContracts([
          {
            id: crypto.randomUUID(),
            description: 'Contrato Principal',
            value: 0,
          },
        ])
      }
      setCnpjError(null)
    }
  }, [open, projectToEdit])

  const handleSave = async () => {
    if (!currentProject.name) {
      toast({
        title: 'Campos Obrigatórios',
        description: 'Por favor, preencha o nome da obra.',
        variant: 'destructive',
      })
      return
    }

    if (currentProject.cnpj && !validateCNPJ(currentProject.cnpj)) {
      setCnpjError('CNPJ inválido')
      toast({
        title: 'Dados Inválidos',
        description: 'Por favor, corrija o CNPJ antes de salvar.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const projectToSave = {
        ...currentProject,
      }

      // Build documents payload for the service
      const documentsPayload: ProjectDocumentUpload[] = []

      // 1. Fixed Documents
      FIXED_DOC_TYPES.forEach(({ type }) => {
        const docData = fixedDocs[type]
        if (docData) {
          // If we have a file or existing doc with changes
          if (docData.file || docData.existingDoc) {
            documentsPayload.push({
              type,
              file: docData.file,
              expiry: docData.expiry,
              id: docData.existingDoc?.id,
            })
          }
        }
      })

      // 2. Custom Documents
      customDocs.forEach((doc) => {
        if (doc.file || doc.existingDoc) {
          documentsPayload.push({
            type: 'outros',
            description: doc.description,
            file: doc.file,
            expiry: doc.expiry,
            id: doc.dbId,
          })
        }
      })

      const contractsPayload = contracts.map((c) => ({
        id: c.dbId,
        file: c.file,
        expiry: c.expiry ? new Date(c.expiry) : undefined,
        description: c.description,
        value: c.value,
        name: c.file?.name,
      }))

      const filesPayload = {
        documents: documentsPayload,
        contracts: contractsPayload,
      }

      if (currentProject.id) {
        await updateProject(currentProject.id, projectToSave, filesPayload)
        toast({
          title: 'Obra Atualizada',
          description: 'Dados salvos com sucesso.',
        })
      } else {
        await addProject(projectToSave, filesPayload)
        toast({ title: 'Obra Criada', description: 'Nova obra iniciada.' })
      }
      onOpenChange(false)
    } catch (error: any) {
      console.error(error)
      let description =
        error.message || 'Falha ao salvar obra. Tente novamente.'
      if (
        description.includes('row-level security') ||
        description.includes('42501')
      ) {
        description =
          'Erro de permissão: Você não tem acesso para realizar esta operação.'
      }

      toast({
        title: 'Erro',
        description,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCNPJChange = (value: string) => {
    const formatted = formatCNPJ(value)
    setCurrentProject({ ...currentProject, cnpj: formatted })

    if (value.length === 0) {
      setCnpjError(null)
    } else if (value.length >= 14) {
      if (!validateCNPJ(formatted)) {
        setCnpjError('CNPJ inválido')
      } else {
        setCnpjError(null)
      }
    } else {
      setCnpjError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2 border-b flex flex-row items-center justify-between">
          <DialogTitle className="text-xl">
            {projectToEdit ? 'Editar Obra' : 'Nova Obra'}
          </DialogTitle>
          <DialogClose className="opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground" />
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="geral" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 pl-6 flex-wrap h-auto">
              <TabsTrigger
                value="geral"
                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Dados Gerais
              </TabsTrigger>
              <TabsTrigger
                value="datas"
                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Datas & Prazos
              </TabsTrigger>
              <TabsTrigger
                value="docs"
                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Documentos
              </TabsTrigger>
              <TabsTrigger
                value="contracts"
                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Contratos
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="geral" className="space-y-4 mt-0">
                <div className="border rounded-lg p-4 bg-muted/10">
                  <div className="flex items-center gap-4">
                    <Label className="w-20 font-semibold">Status</Label>
                    <Select
                      value={currentProject.status}
                      onValueChange={(v) =>
                        setCurrentProject({
                          ...currentProject,
                          status: v as any,
                        })
                      }
                    >
                      <SelectTrigger className="bg-background max-w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativa">Ativa</SelectItem>
                        <SelectItem value="inativa">Inativa</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label>
                      Nome da Obra <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Ex: Edifício Residencial Aurora"
                      value={currentProject.name || ''}
                      onChange={(e) =>
                        setCurrentProject({
                          ...currentProject,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>CNPJ</Label>
                    <div className="relative">
                      <Input
                        placeholder="00.000.000/0000-00"
                        value={currentProject.cnpj || ''}
                        maxLength={18}
                        onChange={(e) => handleCNPJChange(e.target.value)}
                        className={cn(cnpjError && 'border-red-500 pr-10')}
                      />
                      {cnpjError && (
                        <div className="absolute right-3 top-2.5 text-red-500 pointer-events-none">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    {cnpjError && (
                      <p className="text-xs text-red-500 mt-1">{cnpjError}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label>Cliente</Label>
                    <Input
                      placeholder="Nome do Cliente"
                      value={currentProject.client || ''}
                      onChange={(e) =>
                        setCurrentProject({
                          ...currentProject,
                          client: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Endereço</Label>
                    <Input
                      value={currentProject.address || ''}
                      onChange={(e) =>
                        setCurrentProject({
                          ...currentProject,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Cidade</Label>
                      <Input
                        placeholder="Cidade"
                        value={currentProject.city || ''}
                        onChange={(e) =>
                          setCurrentProject({
                            ...currentProject,
                            city: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Estado</Label>
                      <Select
                        value={currentProject.state}
                        onValueChange={(v) =>
                          setCurrentProject({
                            ...currentProject,
                            state: v,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {BR_STATES.map((uf) => (
                            <SelectItem key={uf} value={uf}>
                              {uf}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="datas" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Data de Início</Label>
                    <DatePicker
                      date={currentProject.startDate}
                      setDate={(date) =>
                        setCurrentProject({
                          ...currentProject,
                          startDate: date,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Previsão de Término</Label>
                    <DatePicker
                      date={currentProject.predictedEndDate}
                      setDate={(date) =>
                        setCurrentProject({
                          ...currentProject,
                          predictedEndDate: date,
                        })
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="docs" className="space-y-6 mt-0">
                {/* Fixed Documents List */}
                <div className="grid grid-cols-1 gap-4">
                  {FIXED_DOC_TYPES.map(({ label, type }) => {
                    const currentFile = fixedDocs[type]
                    const existingDoc = currentFile?.existingDoc

                    // Calculate status for alert
                    const status =
                      currentFile?.expiry || existingDoc?.expiry
                        ? getAlertStatus(
                          currentFile?.expiry || existingDoc?.expiry,
                        )
                        : null

                    return (
                      <DocumentUploadRow
                        key={type}
                        label={label}
                        selectedDate={currentFile?.expiry}
                        onDateChange={(d) =>
                          setFixedDocs((prev) => ({
                            ...prev,
                            [type]: { ...prev[type], expiry: d },
                          }))
                        }
                        selectedFile={currentFile?.file || null}
                        onFileSelect={(f) =>
                          setFixedDocs((prev) => ({
                            ...prev,
                            [type]: { ...prev[type], file: f },
                          }))
                        }
                        existingDoc={
                          existingDoc
                            ? {
                              name: existingDoc.name,
                              url: existingDoc.url || '',
                              expiry: existingDoc.expiry,
                            }
                            : null
                        }
                        status={status}
                        showExpiry={true}
                      />
                    )
                  })}

                  {/* Custom Documents List */}
                  {customDocs.map((doc, index) => {
                    // Alert Logic
                    const status =
                      doc.expiry || doc.existingDoc?.expiry
                        ? getAlertStatus(doc.expiry || doc.existingDoc?.expiry)
                        : null

                    return (
                      <div
                        key={doc.id}
                        className="p-4 border rounded-md bg-muted/10 space-y-3 relative group hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex justify-between items-center pr-2 mb-2">
                          <Input
                            placeholder="Nome do Documento (Ex: Alvará, Licença)"
                            value={doc.description}
                            onChange={(e) => {
                              const newDocs = [...customDocs]
                              newDocs[index].description = e.target.value
                              setCustomDocs(newDocs)
                            }}
                            className="font-bold text-base h-9 w-[300px]"
                          />
                          <div className="flex items-center gap-2">
                            {doc.file && (
                              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                                Novo
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                const newDocs = customDocs.filter(
                                  (_, i) => i !== index,
                                )
                                setCustomDocs(newDocs)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {doc.existingDoc && !doc.file && (
                          <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                            <FileText className="h-4 w-4" />
                            {doc.existingDoc.url ? (
                              <a
                                href={doc.existingDoc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:underline truncate max-w-[300px]"
                                title={doc.existingDoc.name}
                              >
                                {doc.existingDoc.name}
                              </a>
                            ) : (
                              <span className="text-muted-foreground italic">
                                {doc.existingDoc.name || 'Sem anexo'}
                              </span>
                            )}
                            {status && status.severity !== 'ok' && (
                              <span
                                className={cn(
                                  'text-xs px-2 py-0.5 rounded-full border',
                                  status.bg,
                                  status.color,
                                  status.border,
                                )}
                              >
                                {status.label}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">
                              Data de Validade
                            </Label>
                            <DatePicker
                              date={doc.expiry}
                              setDate={(d) => {
                                const newDocs = [...customDocs]
                                newDocs[index].expiry = d
                                setCustomDocs(newDocs)
                              }}
                              placeholder="Selecione a data"
                              className="w-full bg-background"
                            />
                          </div>
                          <div className="flex items-end">
                            <FileUploader
                              id={`custom-doc-${doc.id}`}
                              currentFileName={doc.file?.name}
                              onFileSelect={(f) => {
                                const newDocs = [...customDocs]
                                newDocs[index].file = f as File
                                setCustomDocs(newDocs)
                              }}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed mt-4"
                  onClick={() =>
                    setCustomDocs([
                      ...customDocs,
                      { id: crypto.randomUUID(), description: '' },
                    ])
                  }
                >
                  <Plus className="h-4 w-4 mr-2" /> Adicionar Documento
                </Button>
              </TabsContent>

              <TabsContent value="contracts" className="space-y-6 mt-0">
                {contracts.map((c, i) => (
                  <div
                    key={c.id}
                    className="p-4 border rounded-md bg-muted/10 space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-sm">
                        Contrato / Aditivo {i + 1}
                      </h4>
                      {contracts.length > 1 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setContractToDelete(c.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Descrição do Contrato / Aditivo</Label>
                        <Input
                          placeholder="Ex: Contrato Principal"
                          value={c.description}
                          onChange={(e) => {
                            const newContracts = [...contracts]
                            newContracts[i].description = e.target.value
                            setContracts(newContracts)
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Valor (R$)</Label>
                        <MoneyInput
                          placeholder="0,00"
                          value={c.value}
                          onChange={(val) => {
                            const newContracts = [...contracts]
                            newContracts[i].value = val
                            setContracts(newContracts)
                          }}
                        />
                      </div>
                    </div>

                    {c.existingName && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <FileText className="h-4 w-4" />
                        {c.existingUrl ? (
                          <a
                            href={c.existingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline"
                          >
                            {c.existingName || 'Visualizar Contrato'}
                          </a>
                        ) : (
                          <span className="text-muted-foreground italic">
                            {c.existingName} (Sem anexo)
                          </span>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Data de Validade (Opcional)</Label>
                        <Input
                          type="date"
                          value={c.expiry || ''}
                          onChange={(e) => {
                            const newContracts = [...contracts]
                            newContracts[i].expiry = e.target.value
                            setContracts(newContracts)
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <FileUploader
                          id={`contract-file-${c.id}`}
                          label="Anexo (Opcional)"
                          currentFileName={c.file?.name}
                          onFileSelect={(file) => {
                            const newContracts = [...contracts]
                            newContracts[i].file = file as File
                            setContracts(newContracts)
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => {
                    setContracts([
                      ...contracts,
                      {
                        id: crypto.randomUUID(),
                        description: `Aditivo ${contracts.length + 1}`,
                        value: 0,
                      },
                    ])
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" /> Adicionar Outro Contrato
                </Button>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="p-6 pt-4 border-t mt-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || !!cnpjError}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Obra'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog
        open={!!contractToDelete}
        onOpenChange={(open) => !open && setContractToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Contrato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este contrato? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (contractToDelete) {
                  setContracts(contracts.filter((c) => c.id !== contractToDelete))
                  setContractToDelete(null)
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
