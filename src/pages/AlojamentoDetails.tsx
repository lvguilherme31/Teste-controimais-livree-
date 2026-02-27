import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '@/stores/useAppStore'
import { Accommodation, UtilityExpense, AccommodationDocument } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
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
  ArrowLeft,
  Save,
  Loader2,
  UploadCloud,
  Plus,
  Trash2,
  Edit,
  Home,
  Upload,
  FileText,
  User,
  MapPin,
  Calendar,
  Activity,
  Building,
  RotateCcw,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getAlertStatus, BR_STATES, cn } from '@/lib/utils'
import { alojamentosService } from '@/services/alojamentosService'
import { DocumentUploadRow } from '@/components/DocumentUploadRow'
import { FileUploader } from '@/components/FileUploader'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"

const DOC_TYPES = [
  { key: 'contrato_locacao', label: 'Vencimento de Contrato', showExpiry: true },
  { key: 'laudo_vistoria_inicio', label: 'Vistoria Início', showExpiry: true },
  { key: 'laudo_vistoria_fim', label: 'Vistoria Fim', showExpiry: true },
]

export default function AlojamentoDetails() {
  const { id } = useParams()
  const location = useLocation()
  const { accommodations, addAccommodation, updateAccommodation, projects } =
    useAppStore()
  const navigate = useNavigate()
  const { toast } = useToast()

  const isNew = id === 'novo'
  const readOnly = location.state?.readOnly === true
  const [isEditing, setIsEditing] = useState(isNew && !readOnly)

  // Sync isEditing with readOnly state on mount/location change
  useEffect(() => {
    if (readOnly) {
      setIsEditing(false)
    } else if (isNew) {
      setIsEditing(true)
    }
  }, [readOnly, isNew])

  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  // Main data state
  const [data, setData] = useState<Partial<Accommodation>>({
    status: 'active',
    utilities: [],
    documents: {},
  })
  const [documents, setDocuments] = useState<any[]>([])

  // Expenses State
  const [expenses, setExpenses] = useState<any[]>([])
  const [isSavingUtilities, setIsSavingUtilities] = useState(false)

  // Pending updates state for documents
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({})
  const [docDates, setDocDates] = useState<Record<string, Date | undefined>>({})

  // Categories State
  const [categories, setCategories] = useState<{ id: string; nome: string }[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [openCombobox, setOpenCombobox] = useState(false)
  const [searchCategory, setSearchCategory] = useState('')

  const fetchLocalExpenses = async () => {
    if (!id || id === 'novo') return
    try {
      const data = await alojamentosService.getExpenses(id)
      setExpenses(data || [])
    } catch (error) {
      console.error(error)
    }
  }

  const resetForm = () => {
    setData({
      status: 'active',
      utilities: [],
      documents: {},
    })
    setExpenses([])
    setDocuments([])
    setPendingFiles({})
    setDocDates({})
    setNewCategoryName('')
    setSearchCategory('')
  }

  useEffect(() => {
    // Load categories
    alojamentosService.getCategories().then(setCategories).catch(console.error)

    if (!isNew && id) {
      const loadDetails = async () => {
        setLoading(true)
        try {
          const [accommodation, expensesData] = await Promise.all([
            alojamentosService.getById(id),
            alojamentosService.getExpenses(id),
          ])

          if (accommodation) {
            // Sanitize utilities on load to ensure launching area is clean
            const sanitizedUtilities = (accommodation.utilities || []).map((u: any) => ({
              ...u,
              value: 0,
              dueDay: undefined,
              documentUrl: undefined,
              documentName: undefined,
              _tempDate: undefined,
            }))
            setData({ ...accommodation, utilities: sanitizedUtilities })
            // Initialize date state for documents
            const initialDates: Record<string, Date | undefined> = {}
            Object.entries(accommodation.documents || {}).forEach(([key, doc]) => {
              const d = doc as AccommodationDocument
              if (d?.expiry) {
                initialDates[key] = new Date(d.expiry)
              }
            })

            // Sync contractExpiry to docDates if missing in doc list
            if (accommodation.contractExpiry && !initialDates['contrato_locacao']) {
              initialDates['contrato_locacao'] = new Date(accommodation.contractExpiry)
            }

            setDocDates(initialDates)

            // Set documents from accommodation data
            if (accommodation.documents) {
              setDocuments(Object.values(accommodation.documents))
            }
          }

          if (expensesData) {
            setExpenses(expensesData)
          }
        } catch (e) {
          console.error(e)
          toast({
            title: 'Erro',
            description: 'Falha ao carregar detalhes do alojamento.',
            variant: 'destructive',
          })
        } finally {
          setLoading(false)
        }
      }
      loadDetails()
    } else {
      resetForm()
      setLoading(false)
    }
  }, [id, isNew, toast])

  const handleSave = async (): Promise<string | null> => {
    // Sync contractExpiry from docDates if missing (and vice versa)
    let contractEx = data.contractExpiry
    if (!contractEx && docDates['contrato_locacao']) {
      contractEx = docDates['contrato_locacao']
    }

    if (!data.name || !data.projectId || !contractEx) {
      toast({
        title: 'Erro',
        description: 'Preencha os campos obrigatórios (Nome, Obra, Vencimento)',
        variant: 'destructive',
      })
      return null
    }

    const finalData = { ...data, contractExpiry: contractEx }
    setIsSaving(true)
    try {
      let savedId = id!
      let currentAccommodation = finalData as Accommodation

      if (isNew) {
        // Create
        // Sanitize utilities for new accommodation template
        const sanitizedUtilities = (finalData.utilities || []).map((u: any) => ({
          ...u,
          value: 0,
          dueDay: undefined,
          documentUrl: undefined,
          documentName: undefined,
          _tempDate: undefined,
        }))
        const newAcc = await alojamentosService.create({ ...finalData, utilities: sanitizedUtilities } as Accommodation)
        savedId = newAcc.id
        addAccommodation(newAcc) // update store
        currentAccommodation = newAcc
        toast({
          title: 'Criado',
          description: 'Alojamento cadastrado com sucesso.',
        })
        navigate(`/alojamentos/${savedId}`, { replace: true })
      } else {
        // Update basic info
        // Sanitize utilities before saving lodging template
        const sanitizedUtilities = (finalData.utilities || []).map((u: any) => ({
          ...u,
          value: 0,
          dueDay: undefined,
          documentUrl: undefined,
          documentName: undefined,
          _tempDate: undefined,
        }))
        const savePayload = { ...finalData, utilities: sanitizedUtilities }
        await alojamentosService.update(id!, savePayload)
        updateAccommodation(id!, savePayload)
      }

      // Handle docs
      const promises: Promise<void>[] = []
      const allKeys = new Set([
        ...Object.keys(currentAccommodation.documents || {}),
        ...Object.keys(pendingFiles),
        ...Object.keys(docDates),
      ])

      for (const key of allKeys) {
        const file = pendingFiles[key]
        const expiry = docDates[key]
        const existingDoc = currentAccommodation.documents?.[key]

        const hasFileChange = !!file
        const hasDateChange =
          expiry?.getTime() !== (existingDoc?.expiry ? new Date(existingDoc.expiry).getTime() : undefined)

        if (hasFileChange || hasDateChange) {
          promises.push(
            alojamentosService.upsertDocument(
              savedId,
              key,
              file || null,
              expiry,
              existingDoc?.id
            )
          )
        }
      }

      await Promise.all(promises)
      if (!isNew) {
        toast({ title: 'Sucesso', description: 'Dados salvos com sucesso.' })
      }
      return savedId
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Erro',
        description: `Falha ao salvar: ${error.message}`,
        variant: 'destructive',
      })
      return null
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveUtilitiesAsBills = async () => {
    let targetId = id

    if (isNew) {
      // If new, try to save the accommodation first
      if (!confirm('O alojamento precisa ser salvo antes de gerar contas. Deseja salvar agora?')) return

      const savedId = await handleSave()
      if (!savedId) return // Validation failed or error

      targetId = savedId
      // NOTE: handleSave will navigate to new URL, but we continue here.
      // Ideally we should wait for navigation or component re-mount, 
      // but since we have the ID, we can proceed with creating bills 
      // even if the component is about to unmount/remount.
    }

    if (!data.utilities || data.utilities.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Nenhuma conta configurada para salvar.',
        variant: 'destructive',
      })
      return
    }

    setIsSavingUtilities(true)
    try {
      // Collect dates and values for launch
      const billsToCreate = (data.utilities || [])
        .filter((util) => util.value && util.dueDay)
        .filter((util) => {
          // Use selected date from _tempDate or current month/year
          const launchDate = util._tempDate || new Date()
          const month = launchDate.getMonth()
          const year = launchDate.getFullYear()

          const desc = `Alojamento / ${util.type}`
          const exists = expenses.some((e) => {
            const expDate = new Date(e.data_vencimento)
            return (
              e.descricao === desc &&
              expDate.getMonth() === month &&
              expDate.getFullYear() === year
            )
          })
          return !exists
        })
        .map((util) => {
          const launchDate = util._tempDate || new Date()
          const dueDate = new Date(launchDate.getFullYear(), launchDate.getMonth(), util.dueDay!)
          return {
            descricao: `Alojamento / ${util.type}`,
            valor: Number(util.value) || 0,
            data_vencimento: dueDate.toISOString(),
            status: 'pendente',
            categoria_id: null,
            obra_id: data.projectId || null,
            url_boleto: util.documentUrl || '',
            alojamento_id: targetId,
          }
        })

      if (billsToCreate.length === 0) {
        toast({
          title: 'Aviso',
          description: 'Preencha o valor e o dia do vencimento para salvar as contas.',
          variant: 'destructive',
        })
        return
      }

      // Create all bills
      await Promise.all(
        billsToCreate.map((bill) => alojamentosService.addExpense(bill)),
      )

      await Promise.all([
        fetchLocalExpenses(), // Refresh local list
        useAppStore.getState().fetchBills(), // Refresh global finance store
      ])

      toast({
        title: 'Sucesso',
        description: `${billsToCreate.length} conta(s) salva(s) com sucesso.`,
      })

      // Clean forecast inputs after success
      const cleanedUtilities = (data.utilities || []).map(u => ({
        ...u,
        value: 0,
        dueDay: undefined,
        documentUrl: undefined,
        documentName: undefined,
        _tempDate: undefined
      }))
      const newData = { ...data, utilities: cleanedUtilities }
      setData(newData as any)

      // Persist the cleaned template to the database
      await alojamentosService.update(targetId, { utilities: cleanedUtilities })
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Erro',
        description: `Falha ao gerar contas: ${error.message}`,
        variant: 'destructive',
      })
    } finally {
      setIsSavingUtilities(false)
    }
  }

  // Document Handlers
  const handleBulkUpload = (files: File[]) => {
    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    const oversized = files.filter((f) => f.size > MAX_SIZE)

    if (oversized.length > 0) {
      toast({
        title: 'Arquivo muito grande',
        description: 'Alguns arquivos excedem o limite de 5MB e foram ignorados.',
        variant: 'destructive',
      })
    }

    const validFiles = files.filter((f) => f.size <= MAX_SIZE)
    if (validFiles.length === 0) return

    const newPending = { ...pendingFiles }
    validFiles.forEach((file) => {
      let key = 'outros'
      const name = file.name.toLowerCase()
      if (name.includes('contrato')) key = 'contrato_locacao'
      else if (name.includes('vistoria') && (name.includes('inicio') || name.includes('início')))
        key = 'laudo_vistoria_inicio'
      else if (name.includes('vistoria') && name.includes('fim'))
        key = 'laudo_vistoria_fim'
      else if (name.includes('vistoria')) key = 'laudo_vistoria_inicio' // Default to inicio if generic
      else if (name.includes('luz') || name.includes('energia'))
        key = 'conta_luz'
      else if (name.includes('agua')) key = 'conta_agua'

      newPending[key] = file
    })
    setPendingFiles(newPending)
    toast({
      title: 'Arquivos selecionados',
      description: `${validFiles.length} arquivos prontos para salvar.`,
    })
  }

  const handleSaveDocument = async (key: string) => {
    if (!id || id === 'novo') {
      toast({
        title: 'Erro',
        description: 'Salve o alojamento antes de adicionar documentos.',
        variant: 'destructive',
      })
      return
    }

    const file = pendingFiles[key]
    const expiry = docDates[key]
    const existingDoc = data.documents?.[key]

    if (file && file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo permitido é 5MB.',
        variant: 'destructive',
      })
      return
    }

    if (!file && !expiry) {
      toast({
        title: 'Aviso',
        description: 'Selecione um arquivo ou data para salvar.',
      })
      return
    }

    try {
      await alojamentosService.upsertDocument(
        id,
        key,
        file || null,
        expiry,
        existingDoc?.id,
      )

      // Refresh just this doc in state ideally, or whole data
      const refreshed = await alojamentosService.getById(id)
      if (refreshed) {
        setData(refreshed)
        // Clear pending for this key
        const newPending = { ...pendingFiles }
        delete newPending[key]
        setPendingFiles(newPending)

        // Update documents list
        if (refreshed.documents) {
          setDocuments(Object.values(refreshed.documents))
        }

        // Sync contractExpiry if this was the lease contract
        if (key === 'contrato_locacao' && refreshed.contractExpiry) {
          setData((prev) => ({ ...prev, contractExpiry: refreshed.contractExpiry }))
        }
      }

      toast({ title: 'Sucesso', description: 'Documento salvo.' })
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Erro',
        description: `Falha ao salvar documento: ${error.message}`,
        variant: 'destructive',
      })
    }
  }

  // Utilities Handlers
  const handleAddUtility = () => {
    const newUtility: UtilityExpense = {
      id: crypto.randomUUID(),
      type: '',
      value: 0,
      dueDay: 5,
      documentUrl: undefined,
      documentName: undefined,
      _tempDate: undefined
    }
    setData({
      ...data,
      utilities: [...(data.utilities || []), newUtility],
    })
  }

  const handleRemoveUtility = (index: number) => {
    const newUtilities = [...(data.utilities || [])]
    newUtilities.splice(index, 1)
    setData({ ...data, utilities: newUtilities })
  }

  const handleUtilityChange = (
    index: number,
    field: keyof UtilityExpense | '_tempDate',
    value: any,
  ) => {
    const newUtilities = [...(data.utilities || [])]
    // @ts-ignore
    newUtilities[index] = { ...newUtilities[index], [field]: value }
    setData({ ...data, utilities: newUtilities })
  }


  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return

    try {
      await alojamentosService.deleteExpense(expenseId)
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId))
      toast({ title: 'Sucesso', description: 'Conta excluída.' })
      await Promise.all([
        fetchLocalExpenses(),
        useAppStore.getState().fetchBills(),
      ])
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Erro',
        description: `Falha ao excluir conta: ${error.message}`,
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10" >
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/alojamentos')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <h1 className="text-2xl font-bold">
          {isNew ? 'Novo Alojamento' : data.name}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          {!isEditing ? (
            !readOnly && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <div className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  <span>Editar</span>
                </div>
              </Button>
            )
          ) : (
            <>
              {!isNew && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false)
                    // Reset data to initial state could be better, but acceptable for now
                  }}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
              )}
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Visão Geral</TabsTrigger>
          <TabsTrigger value="finances">Financeiro</TabsTrigger>
          <TabsTrigger value="docs">Documentação</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          {!isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Gerais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nome do Alojamento</p>
                      <p className="text-base font-semibold">{data.name || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Building className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Obra Vinculada</p>
                      <p className="text-base font-semibold">
                        {projects.find(p => p.id === data.projectId)?.name || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Endereço</p>
                      <p className="text-base font-semibold">
                        {[
                          data.logradouro,
                          data.numero ? `nº ${data.numero}` : '',
                          data.complemento,
                          data.bairro,
                          data.cidade && data.estado ? `${data.cidade} - ${data.estado}` : ''
                        ].filter(Boolean).join(', ') || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge variant={data.status === 'active' ? 'default' : 'secondary'}>
                        {data.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Datas Importantes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data de Entrada</p>
                      <p className="text-base font-semibold">
                        {data.entryDate ? format(new Date(data.entryDate), 'dd/MM/yyyy') : '-'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <RotateCcw className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Vencimento do Contrato</p>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold">
                          {data.contractExpiry ? format(new Date(data.contractExpiry), 'dd/MM/yyyy') : '-'}
                        </p>
                        {data.contractExpiry && (
                          (() => {
                            const status = getAlertStatus(new Date(data.contractExpiry));
                            if (status.severity !== 'ok') {
                              return (
                                <Badge className={cn(status.bg, status.color, status.border)}>
                                  {status.label}
                                </Badge>
                              )
                            }
                            return null
                          })()
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Gerais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do Alojamento</Label>
                    <Input
                      value={data.name || ''}
                      onChange={(e) => setData({ ...data, name: e.target.value })}
                      placeholder="Ex: Alojamento Centro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Obra Vinculada</Label>
                    <Select
                      value={data.projectId}
                      onValueChange={(v) => setData({ ...data, projectId: v })}
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
                    <Label className="text-base font-semibold">Endereço</Label>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-4 md:col-span-1 space-y-2">
                        <Label>CEP</Label>
                        <Input
                          placeholder="00000-000"
                          value={data.cep || ''}
                          onChange={(e) =>
                            setData({ ...data, cep: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-4 md:col-span-3 space-y-2">
                        <Label>Rua / Logradouro</Label>
                        <Input
                          placeholder="Ex: Rua das Flores"
                          value={data.logradouro || ''}
                          onChange={(e) =>
                            setData({ ...data, logradouro: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-span-4 md:col-span-1 space-y-2">
                        <Label>Número</Label>
                        <Input
                          placeholder="Ex: 123"
                          value={data.numero || ''}
                          onChange={(e) =>
                            setData({ ...data, numero: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Complemento</Label>
                      <Input
                        placeholder="Ex: Apto 101"
                        value={data.complemento || ''}
                        onChange={(e) =>
                          setData({ ...data, complemento: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Bairro</Label>
                        <Input
                          placeholder="Ex: Centro"
                          value={data.bairro || ''}
                          onChange={(e) =>
                            setData({ ...data, bairro: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cidade</Label>
                        <Input
                          placeholder="Ex: São Paulo"
                          value={data.cidade || ''}
                          onChange={(e) =>
                            setData({ ...data, cidade: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Estado</Label>
                        <Select
                          value={data.estado || undefined}
                          onValueChange={(v) => setData({ ...data, estado: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {BR_STATES.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={data.status}
                      onValueChange={(v: any) => setData({ ...data, status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Datas Importantes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Data de Entrada</Label>
                    <Input
                      type="date"
                      value={
                        data.entryDate && !isNaN(new Date(data.entryDate).getTime())
                          ? new Date(data.entryDate).toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value
                        if (!val) {
                          setData({ ...data, entryDate: undefined })
                          return
                        }
                        const date = new Date(val + 'T12:00:00') // Force noon to avoid timezone shift issues on simple date selection
                        if (!isNaN(date.getTime())) {
                          setData({
                            ...data,
                            entryDate: date,
                          })
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Vencimento do Contrato</Label>
                      {data.contractExpiry && (
                        (() => {
                          const status = getAlertStatus(new Date(data.contractExpiry));
                          if (status.severity !== 'ok') {
                            return (
                              <Badge className={cn(status.bg, status.color, status.border)}>
                                {status.label}
                              </Badge>
                            )
                          }
                          return null
                        })()
                      )}
                    </div>
                    <Input
                      type="date"
                      value={
                        data.contractExpiry && !isNaN(new Date(data.contractExpiry).getTime())
                          ? new Date(data.contractExpiry).toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value
                        if (!val) {
                          setData({ ...data, contractExpiry: undefined })
                          setDocDates((prev) => ({ ...prev, contrato_locacao: undefined }))
                          return
                        }
                        const date = new Date(val + 'T12:00:00')
                        if (!isNaN(date.getTime())) {
                          setData({
                            ...data,
                            contractExpiry: date,
                          })
                          // Sync with documentation tab
                          setDocDates((prev) => ({ ...prev, contrato_locacao: date }))
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="finances" className="space-y-6">
          {/* Forecast Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Lançamento De Contas [Despesas]</CardTitle>
                <CardDescription>
                  Previsão mensal de despesas fixas para este alojamento.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveUtilitiesAsBills}
                  variant="default"
                  size="sm"
                  disabled={isSavingUtilities}
                >
                  {isSavingUtilities ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSavingUtilities ? 'Salvando...' : 'Salvar Contas'}
                </Button>
                <Button onClick={handleAddUtility} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Conta
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(!data.utilities || data.utilities.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                  <p>Nenhuma conta configurada.</p>
                  <Button
                    variant="link"
                    onClick={handleAddUtility}
                    className="mt-2"
                  >
                    Adicionar agora
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.utilities.map((util, index) => (
                    <div
                      key={util.id || index}
                      className="p-4 border rounded-md bg-muted/10 space-y-3 hover:bg-muted/20 transition-colors relative"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1 max-w-[50%]">
                          <div className="flex gap-2">
                            <Select
                              value={
                                [
                                  'Aluguel',
                                  'Energia',
                                  'Água',
                                  'Internet',
                                  'Gás',
                                ].includes(util.type)
                                  ? util.type
                                  : 'Outros'
                              }
                              onValueChange={(v) => {
                                if (v === 'Outros') {
                                  handleUtilityChange(index, 'type', '')
                                } else {
                                  handleUtilityChange(index, 'type', v)
                                }
                              }}
                            >
                              <SelectTrigger className="w-[180px] bg-background">
                                <SelectValue placeholder="Tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Aluguel">Aluguel</SelectItem>
                                <SelectItem value="Energia">Energia</SelectItem>
                                <SelectItem value="Água">Água</SelectItem>
                                <SelectItem value="Internet">Internet</SelectItem>
                                <SelectItem value="Gás">Gás</SelectItem>
                                <SelectItem value="Outros">Outros</SelectItem>
                              </SelectContent>
                            </Select>
                            {(![
                              'Aluguel',
                              'Energia',
                              'Água',
                              'Internet',
                              'Gás',
                            ].includes(util.type) ||
                              util.type === '') && (
                                <Input
                                  value={util.type}
                                  onChange={(e) =>
                                    handleUtilityChange(
                                      index,
                                      'type',
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Digite o tipo"
                                  className="flex-1 bg-background"
                                />
                              )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {(() => {
                            if (!util.dueDay || !util.value) return null
                            // Prioritize selected _tempDate for status calculation
                            const now = new Date()
                            const referenceDate = util._tempDate || now
                            const currentDue = new Date(
                              referenceDate.getFullYear(),
                              referenceDate.getMonth(),
                              util.dueDay,
                            )
                            const status = getAlertStatus(currentDue)

                            if (status.severity !== 'ok') {
                              return (
                                <Badge
                                  className={cn(
                                    status.bg,
                                    status.color,
                                    status.border,
                                    'border shadow-none',
                                  )}
                                >
                                  {status.label}
                                </Badge>
                              )
                            }
                            return null
                          })()}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveUtility(index)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mobile-grid">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Valor Previsto (R$)
                          </Label>
                          <MoneyInput
                            value={util.value}
                            onChange={(val) => handleUtilityChange(index, 'value', val)}
                            placeholder="0,00"
                            className="bg-background"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Dia de Vencimento
                          </Label>
                          <DatePicker
                            date={
                              util._tempDate ||
                              (util.dueDay
                                ? new Date(
                                  new Date().getFullYear(),
                                  new Date().getMonth(),
                                  util.dueDay,
                                )
                                : undefined)
                            }
                            setDate={(date) => {
                              if (date) {
                                const newUtilities = [...(data.utilities || [])]
                                newUtilities[index] = {
                                  ...newUtilities[index],
                                  _tempDate: date,
                                  dueDay: date.getDate(),
                                }
                                setData({ ...data, utilities: newUtilities })
                              }
                            }}
                            placeholder="Selecione o dia"
                            className="w-full bg-background"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Documento Modelo
                          </Label>
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Input
                                type="file"
                                className="hidden"
                                id={`upload-util-${index}`}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    if (file.size > 5 * 1024 * 1024) {
                                      toast({
                                        title: 'Arquivo muito grande',
                                        description: 'O tamanho máximo permitido é 5MB.',
                                        variant: 'destructive',
                                      })
                                      return
                                    }
                                    try {
                                      const url =
                                        await alojamentosService.uploadUtilityDocument(
                                          file,
                                        )
                                      const newUtilities = [...data.utilities!]
                                      newUtilities[index] = {
                                        ...newUtilities[index],
                                        documentUrl: url,
                                        documentName: file.name,
                                      }
                                      setData({
                                        ...data,
                                        utilities: newUtilities,
                                      })
                                      toast({
                                        title: 'Sucesso',
                                        description: 'Documento anexado.',
                                      })
                                    } catch (err) {
                                      toast({
                                        title: 'Erro',
                                        description:
                                          'Falha ao anexar documento.',
                                        variant: 'destructive',
                                      })
                                    }
                                  }
                                }}
                              />
                              <Label
                                htmlFor={`upload-util-${index}`}
                                className="cursor-pointer inline-flex w-full items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 gap-2"
                              >
                                <Upload className="h-4 w-4" />
                                <span>
                                  {util.documentName
                                    ? 'Alterar Arquivo'
                                    : 'Escolher arquivo'}
                                </span>
                              </Label>
                            </div>
                            {util.documentUrl && (
                              <a
                                href={util.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline overflow-hidden max-w-[150px] whitespace-nowrap"
                                title={util.documentName || 'Documento'}
                              >
                                <FileText className="h-4 w-4 shrink-0" />
                                <span className="truncate text-xs">
                                  {util.documentName || 'Ver'}
                                </span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* History Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Contas Lançadas</CardTitle>
                <CardDescription>
                  Registro de contas já processadas para este alojamento.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                  <p>Nenhuma conta lançada para este alojamento.</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => {
                        const status = getAlertStatus(expense.data_vencimento)
                        return (
                          <TableRow key={expense.id}>
                            <TableCell className="font-medium">
                              {expense.descricao}
                            </TableCell>
                            <TableCell>
                              {format(new Date(expense.data_vencimento), 'dd/MM/yyyy')}
                            </TableCell>
                            <TableCell>
                              R$ {Number(expense.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  status.bg,
                                  status.color,
                                  status.border,
                                  'border shadow-none',
                                )}
                              >
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8"
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card>
            <CardHeader>
              <CardTitle>Documentação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Bulk Upload Section */}
                <div className="p-4 border border-dashed rounded-lg bg-muted/20 flex flex-col items-center justify-center gap-2">
                  <UploadCloud className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium">Upload em Massa</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Selecione vários arquivos para adicionar de uma vez.
                  </p>
                  <FileUploader
                    id="bulk-upload"
                    multiple={true}
                    onFileSelect={(files) =>
                      handleBulkUpload(files as File[])
                    }
                  />
                </div>

                {/* Document List */}
                <div className="grid grid-cols-1 gap-4">
                  {DOC_TYPES.map(({ key, label, showExpiry }) => {
                    const existingDoc = data.documents?.[key]
                    const date = docDates[key]
                    const file = pendingFiles[key]
                    const status = date ? getAlertStatus(date) : null

                    return (
                      <DocumentUploadRow
                        key={key}
                        label={label}
                        selectedDate={date}
                        onDateChange={(d) => {
                          setDocDates({ ...docDates, [key]: d })
                          // Sync with Visão Geral if it's lease contract
                          if (key === 'contrato_locacao') {
                            setData((prev) => ({ ...prev, contractExpiry: d }))
                          }
                        }}
                        selectedFile={file || null}
                        onFileSelect={(f) => {
                          if (f && f.size > 5 * 1024 * 1024) {
                            toast({
                              title: 'Arquivo muito grande',
                              description: 'O tamanho máximo permitido é 5MB.',
                              variant: 'destructive',
                            })
                            return
                          }
                          setPendingFiles({ ...pendingFiles, [key]: f })
                        }}
                        existingDoc={existingDoc}
                        status={status}
                        showExpiry={showExpiry}
                        onSave={async () => {
                          await handleSaveDocument(key)
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
