import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Budget } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Plus,
  FileText,
  Search,
  Trash2,
  Edit,
  Loader2,
  Eye,
} from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { BR_STATES } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { orcamentosService } from '@/services/orcamentosService'
import { DatePicker } from '@/components/ui/date-picker'
import { FileUploader } from '@/components/FileUploader'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Paperclip, Download } from 'lucide-react'
import { ClientDetailsDialog } from '@/components/ClientDetailsDialog'

export default function Orcamentos() {
  const {
    addBudget,
    updateBudget,
    deleteBudget,
    deleteBudgetAttachment,
    projects,
    budgets,
    fetchBudgets,
  } = useAppStore()
  const { toast } = useToast()
  // const [budgets, setBudgets] = useState<Budget[]>([]) // Removed local state
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isClientDetailsOpen, setIsClientDetailsOpen] = useState(false)
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null)

  // State for view mode
  const [isViewing, setIsViewing] = useState(false)

  const [currentBudget, setCurrentBudget] = useState<Partial<Budget>>({})
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchBudgets().finally(() => setIsLoading(false))
  }, [fetchBudgets])

  const handleOpen = async (budget?: Budget) => {
    setSelectedFiles([])
    setIsViewing(false)
    if (budget) {
      setCurrentBudget({ ...budget })
      setIsOpen(true)
    } else {
      try {
        const nextId = await orcamentosService.getNextNumber()
        setCurrentBudget({
          visualId: nextId,
          date: new Date(),
          status: 'draft',
          attachments: [],
          client: selectedClientName || '', // Pre-fill client if context exists
        })
        setIsOpen(true)
      } catch (e) {
        console.error('Error fetching next number', e)
        setCurrentBudget({
          date: new Date(),
          status: 'draft',
          attachments: [],
          client: selectedClientName || '', // Pre-fill client if context exists
        })
        setIsOpen(true)
      }
    }
  }

  const handleViewClient = (budget: Budget) => {
    if (budget.client) {
      setSelectedClientName(budget.client)
      setIsClientDetailsOpen(true)
    } else {
      // If no client name, fallback to just viewing the budget directly
      handleViewBudget(budget)
    }
  }

  const handleViewBudget = (budget: Budget) => {
    setSelectedFiles([])
    setCurrentBudget({ ...budget })
    setIsViewing(true)
    setIsOpen(true)
  }

  const handleClientAddBudget = async () => {
    // Open the creation modal, pre-filled with the current client
    await handleOpen()
    // handleOpen already checks selectedClientName, so no extra work needed
  }

  const handleClientEditBudget = (budget: Budget) => {
    handleOpen(budget)
  }

  const handleClose = () => {
    setIsOpen(false)
    setCurrentBudget({})
    setSelectedFiles([])
    setIsViewing(false)
    // We do NOT clear selectedClientName here, as we might want to return to the client view
  }

  // Filter budgets for the selected client
  const clientBudgets = budgets.filter(
    (b) => b.client === selectedClientName
  )

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      const budgetToSave = { ...currentBudget } as Budget

      if (currentBudget.id) {
        await updateBudget(currentBudget.id, budgetToSave, selectedFiles)
        toast({
          title: 'Orçamento Atualizado',
          description: 'Dados salvos com sucesso.',
        })
      } else {
        await addBudget(budgetToSave, selectedFiles)
        toast({
          title: 'Orçamento Criado',
          description: `ID: ${budgetToSave.visualId}`,
        })
      }
      setIsOpen(false)
    } catch (error: any) {
      console.error(error)
      let errorMessage =
        error.message || 'Ocorreu um erro ao salvar o orçamento.'

      // Translate RLS errors to user friendly message
      if (
        errorMessage.includes('row-level security') ||
        errorMessage.includes('permission denied')
      ) {
        errorMessage =
          'Erro de permissão: Falha na política de segurança (RLS). Tente recarregar a página ou contate o suporte.'
      }

      toast({
        title: 'Erro ao salvar',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este orçamento?')) {
      try {
        await deleteBudget(id)
        toast({ title: 'Removido', description: 'Orçamento removido.' })
      } catch (error: any) {
        console.error(error)
        toast({
          title: 'Erro ao excluir',
          description: error.message || 'Não foi possível excluir o orçamento.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleRemoveAttachment = async (attachmentId: string) => {
    if (confirm('Remover este anexo?')) {
      try {
        await deleteBudgetAttachment(attachmentId)
        // Optimistic update
        setCurrentBudget((prev) => ({
          ...prev,
          attachments: prev.attachments?.filter((a) => a.id !== attachmentId),
        }))
        toast({ title: 'Anexo removido' })
      } catch (error: any) {
        console.error(error)
        toast({
          title: 'Erro',
          description: error.message || 'Não foi possível remover o anexo.',
          variant: 'destructive',
        })
      }
    }
  }

  const getStatusBadge = (status: Budget['status']) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
            Aprovado
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
            Rejeitado
          </Badge>
        )
      case 'pendente':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
            Pendente
          </Badge>
        )
      case 'sent':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
            Enviado
          </Badge>
        )
      default:
        // Handle null/undefined status as Draft/Rascunho
        return <Badge variant="secondary">Rascunho</Badge>
    }
  }

  const getFormattedLocation = (b: Budget) => {
    const project = projects.find((p) => p.id === b.projectId)
    if (project) return project.name

    const addressParts = [b.street, b.neighborhood, b.city, b.state].filter(
      Boolean,
    )
    if (addressParts.length > 0) {
      // Basic formatting: Rua, Bairro - Cidade/UF
      const streetPart = b.street
      const neighborhoodPart = b.neighborhood
      const cityStatePart =
        b.city && b.state
          ? `${b.city}/${b.state}`
          : b.city || b.state
            ? `${b.city || ''}${b.state || ''}`
            : ''

      const parts = []
      if (streetPart) parts.push(streetPart)
      if (neighborhoodPart) parts.push(neighborhoodPart)
      if (cityStatePart) parts.push(cityStatePart)

      return parts.join(' - ')
    }

    return b.location || 'N/A'
  }

  const filteredBudgets = budgets.filter((b) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      (b.visualId || '').toLowerCase().includes(searchLower) ||
      (b.client || '').toLowerCase().includes(searchLower) ||
      (b.cnpj || '').toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orçamentos</h1>
          <p className="text-muted-foreground">
            Gerador de propostas comerciais
          </p>
        </div>
        <Button onClick={() => handleOpen()}>
          <Plus className="mr-2 h-4 w-4" /> Novo Orçamento
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-lg border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, cliente ou CNPJ..."
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Obra / Local</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBudgets.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhum orçamento encontrado.
                </TableCell>
              </TableRow>
            )}
            {filteredBudgets.map((b) => (
              <TableRow key={b.id} className="hover:bg-muted/50">
                <TableCell className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {b.visualId}
                </TableCell>
                <TableCell>
                  {b.date ? format(new Date(b.date), 'dd/MM/yyyy') : '-'}
                </TableCell>
                <TableCell>{b.client || '-'}</TableCell>
                <TableCell
                  className="max-w-[200px] truncate"
                  title={getFormattedLocation(b)}
                >
                  {getFormattedLocation(b)}
                </TableCell>
                <TableCell
                  className="max-w-[200px] truncate"
                  title={b.description || ''}
                >
                  {b.description || '-'}
                </TableCell>
                <TableCell>
                  {b.totalValue
                    ? `R$ ${b.totalValue.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}`
                    : '-'}
                </TableCell>
                <TableCell>{getStatusBadge(b.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewClient(b)}
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Visualizar</p>
                      </TooltipContent>
                    </Tooltip>

                    {b.attachments && b.attachments.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" asChild>
                            <a
                              href={b.attachments[0].url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Paperclip className="h-4 w-4" />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ver Anexos ({b.attachments.length})</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpen(b)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(b.id)}
                      className="text-destructive hover:text-destructive"
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {isViewing
                ? 'Visualizar Orçamento'
                : currentBudget.id
                  ? 'Editar Orçamento'
                  : 'Novo Orçamento'}
            </DialogTitle>
            <DialogDescription>
              {isViewing
                ? 'Visualize os detalhes do orçamento.'
                : 'Preencha os dados do orçamento abaixo.'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="dados" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="dados">Dados do Orçamento</TabsTrigger>
              <TabsTrigger value="anexos">Anexos</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-1">
              <TabsContent value="dados" className="space-y-4 m-0 pb-4">
                {/* Row 1: Number & Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número</Label>
                    <Input
                      value={currentBudget.visualId || ''}
                      disabled
                      className="bg-muted"
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Valor Total{' '}
                      <span className="text-muted-foreground text-xs font-normal ml-1">
                        (Opcional)
                      </span>
                    </Label>
                    <MoneyInput
                      value={currentBudget.totalValue ?? 0}
                      onChange={(val) =>
                        setCurrentBudget({
                          ...currentBudget,
                          totalValue: val === 0 ? null : val,
                        })
                      }
                      disabled={isViewing}
                    />
                  </div>
                </div>

                {/* Row 2: Date & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Data{' '}
                      <span className="text-muted-foreground text-xs font-normal ml-1">
                        (Opcional)
                      </span>
                    </Label>
                    <DatePicker
                      date={currentBudget.date || undefined}
                      setDate={(date) =>
                        !isViewing &&
                        setCurrentBudget({
                          ...currentBudget,
                          date: date || null,
                        })
                      }
                      disabled={isViewing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Status{' '}
                      <span className="text-muted-foreground text-xs font-normal ml-1">
                        (Opcional)
                      </span>
                    </Label>
                    <Select
                      value={currentBudget.status || undefined}
                      onValueChange={(v: any) =>
                        setCurrentBudget({ ...currentBudget, status: v })
                      }
                      disabled={isViewing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="approved">Aprovado</SelectItem>
                        <SelectItem value="rejected">Rejeitado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 3: Client & CNPJ */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Input
                      value={currentBudget.client || ''}
                      onChange={(e) =>
                        setCurrentBudget({
                          ...currentBudget,
                          client: e.target.value || null,
                        })
                      }
                      placeholder="Nome do cliente ou empresa"
                      disabled={isViewing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input
                      value={currentBudget.cnpj || ''}
                      onChange={(e) =>
                        setCurrentBudget({
                          ...currentBudget,
                          cnpj: e.target.value || null,
                        })
                      }
                      placeholder="00.000.000/0000-00"
                      disabled={isViewing}
                    />
                  </div>
                </div>

                {/* Row 4: Project */}
                <div className="space-y-2">
                  <Label>Vincular a Obra (Opcional)</Label>
                  <Select
                    value={currentBudget.projectId || 'none'}
                    onValueChange={(v) =>
                      setCurrentBudget({
                        ...currentBudget,
                        projectId: v === 'none' ? null : v,
                      })
                    }
                    disabled={isViewing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma obra..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Row 5: Detailed Address - Split into detailed fields */}
                <div className="space-y-2 border-t pt-2">
                  <Label className="font-semibold text-muted-foreground">
                    Endereço da Obra (Opcional)
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-6 space-y-2">
                      <Label>Rua / Logradouro</Label>
                      <Input
                        placeholder="Ex: Av. Paulista, 1000"
                        value={currentBudget.street || ''}
                        onChange={(e) =>
                          setCurrentBudget({
                            ...currentBudget,
                            street: e.target.value || null,
                          })
                        }
                        disabled={isViewing}
                      />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <Label>Bairro</Label>
                      <Input
                        placeholder="Bairro"
                        value={currentBudget.neighborhood || ''}
                        onChange={(e) =>
                          setCurrentBudget({
                            ...currentBudget,
                            neighborhood: e.target.value || null,
                          })
                        }
                        disabled={isViewing}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label>Cidade</Label>
                      <Input
                        placeholder="Cidade"
                        value={currentBudget.city || ''}
                        onChange={(e) =>
                          setCurrentBudget({
                            ...currentBudget,
                            city: e.target.value || null,
                          })
                        }
                        disabled={isViewing}
                      />
                    </div>
                    <div className="md:col-span-1 space-y-2">
                      <Label>Estado</Label>
                      <Select
                        value={currentBudget.state || ''}
                        onValueChange={(v) =>
                          setCurrentBudget({ ...currentBudget, state: v })
                        }
                        disabled={isViewing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="UF" />
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

                {/* Row 6: Description */}
                <div className="space-y-2">
                  <Label>
                    Descrição do Serviço{' '}
                    <span className="text-muted-foreground text-xs font-normal ml-1">
                      (Opcional)
                    </span>
                  </Label>
                  <Textarea
                    placeholder="Detalhes do orçamento..."
                    rows={4}
                    value={currentBudget.description || ''}
                    onChange={(e) =>
                      setCurrentBudget({
                        ...currentBudget,
                        description: e.target.value || null,
                      })
                    }
                    disabled={isViewing}
                  />
                </div>
              </TabsContent>

              <TabsContent value="anexos" className="space-y-4 m-0 pb-4">
                {/* Attachments Section */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Anexar Arquivos
                  </Label>
                  <div className="bg-muted/10 p-4 rounded-md border">
                    {!isViewing && (
                      <FileUploader
                        id="budget-files"
                        multiple
                        accept=".pdf,image/*"
                        onFileSelect={(files) =>
                          setSelectedFiles((prev) => [
                            ...prev,
                            ...(Array.isArray(files) ? files : [files]),
                          ])
                        }
                        currentFileName={
                          selectedFiles.length > 0
                            ? `${selectedFiles.length} arquivo(s) selecionado(s)`
                            : undefined
                        }
                      />
                    )}

                    {/* List Selected Files */}
                    {!isViewing && selectedFiles.length > 0 && (
                      <div className="mt-2 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Arquivos para enviar:
                        </p>
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-sm bg-background p-2 rounded border"
                          >
                            <span className="truncate">{file.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={() =>
                                setSelectedFiles((prev) =>
                                  prev.filter((_, i) => i !== index),
                                )
                              }
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* List Existing Attachments */}
                    {currentBudget.attachments &&
                      currentBudget.attachments.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Anexos existentes:
                          </p>
                          {currentBudget.attachments.map((att) => (
                            <div
                              key={att.id}
                              className="flex items-center justify-between text-sm bg-blue-50/50 p-2 rounded border border-blue-100"
                            >
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center hover:underline text-blue-700"
                              >
                                <Paperclip className="h-3 w-3 mr-2" />
                                {att.name}
                              </a>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-blue-600 hover:text-blue-800"
                                  asChild
                                >
                                  <a
                                    href={att.url}
                                    download
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <Download className="h-3 w-3" />
                                  </a>
                                </Button>
                                {!isViewing && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:text-destructive/80"
                                    onClick={() =>
                                      handleRemoveAttachment(att.id!)
                                    }
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    {(!currentBudget.attachments ||
                      currentBudget.attachments.length === 0) &&
                      selectedFiles.length === 0 && (
                        <p className="text-center text-muted-foreground py-4 text-sm">
                          Nenhum anexo.
                        </p>
                      )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {!isViewing && (
            <div className="pt-4 border-t mt-auto">
              <Button
                onClick={handleSave}
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Orçamento'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ClientDetailsDialog
        open={isClientDetailsOpen}
        onOpenChange={setIsClientDetailsOpen}
        clientName={selectedClientName || ''}
        budgets={clientBudgets}
        onAddBudget={handleClientAddBudget}
        onEditBudget={handleClientEditBudget}
        onViewBudget={handleViewBudget}
      />
    </div>
  )
}
