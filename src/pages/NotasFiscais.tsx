import { useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Invoice } from '@/types'
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
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Plus,
  FileText,
  Search,
  Download,
  Trash2,
  Edit,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { getAlertStatus, cn, formatCNPJ } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { notasService } from '@/services/notasService'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const STATUS_MAP = {
  paid: {
    label: 'Pago',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  pending: {
    label: 'Pendente',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  overdue: {
    label: 'Vencido',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  cancelled: {
    label: 'Cancelado',
    color: 'text-gray-700',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
  },
}

export default function NotasFiscais() {
  const { invoices, addInvoice, deleteInvoice, updateInvoice } = useAppStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null)
  const [currentInvoice, setCurrentInvoice] = useState<Partial<Invoice>>({})
  const [itemsText, setItemsText] = useState('')

  const handleOpen = async (invoice?: Invoice) => {
    if (invoice) {
      setCurrentInvoice({ ...invoice })
      // Convert items array to string for textarea
      setItemsText(
        invoice.items && Array.isArray(invoice.items)
          ? invoice.items.join('\n')
          : '',
      )
      setIsOpen(true)
    } else {
      // Pre-fill with automatic number
      const nextNumber = await notasService.getNextNumber()
      setCurrentInvoice({
        number: nextNumber,
        issueDate: new Date(),
        dueDate: new Date(),
        status: 'pending',
        items: [],
      })
      setItemsText('')
      setIsOpen(true)
    }
  }

  const handleSave = async () => {
    if (
      !currentInvoice.number ||
      !currentInvoice.value ||
      !currentInvoice.issueDate ||
      !currentInvoice.dueDate ||
      !currentInvoice.status
    ) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Process items from text area
      const processedItems = itemsText
        .split('\n')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)

      const invoiceToSave = {
        ...currentInvoice,
        items: processedItems,
      } as Invoice

      if (currentInvoice.id) {
        await updateInvoice(currentInvoice.id, invoiceToSave)
        toast({
          title: 'Nota Atualizada',
          description: 'Dados salvos com sucesso.',
        })
      } else {
        await addInvoice(invoiceToSave)
        toast({ title: 'Nota Lançada', description: 'Nota fiscal registrada.' })
      }
      setIsOpen(false)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar a nota.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta nota?')) {
      try {
        await deleteInvoice(id)
        toast({ title: 'Removido', description: 'Nota fiscal removida.' })
      } catch (error) {
        console.error(error)
        toast({
          title: 'Erro ao excluir',
          description: 'Não foi possível excluir a nota.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleDownloadDocument = async (invoice: Invoice) => {
    try {
      setIsGeneratingPdf(invoice.id)
      toast({
        title: 'Gerando PDF...',
        description: 'O download iniciará em alguns instantes.',
      })
      await notasService.generateAndDownloadDocument(invoice)
      toast({
        title: 'Sucesso',
        description: 'Download do PDF iniciado.',
      })
    } catch (error) {
      console.error('Error generating document:', error)
      toast({
        title: 'Erro ao gerar documento',
        description: 'Não foi possível criar o arquivo PDF da nota.',
        variant: 'destructive',
      })
    } finally {
      setIsGeneratingPdf(null)
    }
  }

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.number.includes(searchTerm) ||
      inv.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.cnpj.includes(searchTerm),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notas Fiscais</h1>
          <p className="text-muted-foreground">
            Gestão de emissão e recebimento de notas
          </p>
        </div>
        <Button onClick={() => handleOpen()}>
          <Plus className="mr-2 h-4 w-4" /> Lançar Nota
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-lg border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, cliente ou CNPJ..."
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
              <TableHead>Número (NF)</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead>Cliente / Fornecedor</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhuma nota encontrada.
                </TableCell>
              </TableRow>
            )}
            {filteredInvoices.map((inv) => {
              const dateStatus = getAlertStatus(inv.dueDate)
              const statusInfo = STATUS_MAP[inv.status as keyof typeof STATUS_MAP] || {
                label: inv.status,
                color: 'text-muted-foreground',
                bg: 'bg-muted/10',
                border: 'border-muted',
              }
              const isGenerating = isGeneratingPdf === inv.id

              return (
                <TableRow key={inv.id} className={cn('hover:bg-muted/50')}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {inv.number}
                  </TableCell>
                  <TableCell>
                    {format(new Date(inv.issueDate), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>{inv.client}</TableCell>
                  <TableCell>{inv.cnpj}</TableCell>
                  <TableCell>
                    R${' '}
                    {inv.value.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className={cn('font-bold', dateStatus.color)}>
                    {format(new Date(inv.dueDate), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        statusInfo.bg,
                        statusInfo.color,
                        statusInfo.border,
                        'border shadow-none whitespace-nowrap',
                      )}
                    >
                      {statusInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadDocument(inv)}
                            disabled={isGenerating}
                          >
                            {isGenerating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Baixar PDF da Nota</p>
                        </TooltipContent>
                      </Tooltip>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpen(inv)}
                        disabled={isGenerating}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(inv.id)}
                        className="text-destructive hover:text-destructive"
                        disabled={isGenerating}
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentInvoice.id ? 'Editar Nota' : 'Nova Nota Fiscal'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* 1. Número (Auto) e Valor */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número</Label>
                <Input
                  value={currentInvoice.number || ''}
                  disabled
                  className="bg-muted"
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Valor <span className="text-red-500">*</span>
                </Label>
                <MoneyInput
                  value={currentInvoice.value || 0}
                  onChange={(val) =>
                    setCurrentInvoice({
                      ...currentInvoice,
                      value: val,
                    })
                  }
                />
              </div>
            </div>

            {/* 2. Data Emissão e Vencimento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Data Emissão <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  date={currentInvoice.issueDate}
                  setDate={(date) =>
                    setCurrentInvoice({ ...currentInvoice, issueDate: date })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Vencimento <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  date={currentInvoice.dueDate}
                  setDate={(date) =>
                    setCurrentInvoice({ ...currentInvoice, dueDate: date })
                  }
                />
              </div>
            </div>

            {/* 3. Status */}
            <div className="space-y-2">
              <Label>
                Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={currentInvoice.status}
                onValueChange={(v: any) =>
                  setCurrentInvoice({ ...currentInvoice, status: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 4. Cliente / Fornecedor */}
            <div className="space-y-2">
              <Label>Cliente / Fornecedor</Label>
              <Input
                value={currentInvoice.client || ''}
                onChange={(e) =>
                  setCurrentInvoice({
                    ...currentInvoice,
                    client: e.target.value,
                  })
                }
              />
            </div>

            {/* 5. CNPJ */}
            <div className="space-y-2">
              <Label>CNPJ / CPF</Label>
              <Input
                value={currentInvoice.cnpj || ''}
                onChange={(e) =>
                  setCurrentInvoice({ ...currentInvoice, cnpj: formatCNPJ(e.target.value) })
                }
              />
            </div>

            {/* 6. Dados do Emitente */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Dados do Emitente (Sua Empresa)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Razão Social</Label>
                  <Input
                    value={currentInvoice.emitterName || ''}
                    onChange={(e) =>
                      setCurrentInvoice({
                        ...currentInvoice,
                        emitterName: e.target.value,
                      })
                    }
                    placeholder="Nome da sua empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ do Emitente</Label>
                  <Input
                    value={currentInvoice.emitterCnpj || ''}
                    onChange={(e) =>
                      setCurrentInvoice({
                        ...currentInvoice,
                        emitterCnpj: formatCNPJ(e.target.value),
                      })
                    }
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>
            </div>

            {/* 7. Itens / Descrição (Substitui Anexos) */}
            <div className="space-y-2 border-t pt-4">
              <Label>
                Descrição dos Itens / Serviços (um por linha)
                <span className="ml-1 text-xs text-muted-foreground font-normal">
                  * Esses dados aparecerão no documento gerado
                </span>
              </Label>
              <Textarea
                placeholder="Ex: Consultoria Técnica - 10h&#10;Material Elétrico - Lote 2"
                rows={5}
                value={itemsText}
                onChange={(e) => setItemsText(e.target.value)}
              />
            </div>

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
                'Salvar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
