import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/stores/useAppStore'
import { Vehicle } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getAlertStatus, validateVehiclePlate } from '@/lib/utils'
import { veiculosService } from '@/services/veiculosService'
import { DocumentUploadRow } from '@/components/DocumentUploadRow'
import { DatePicker } from '@/components/ui/date-picker'

export default function VeiculoDetails() {
  const { id } = useParams()
  const { addVehicle, updateVehicle, projects } = useAppStore()
  const navigate = useNavigate()
  const { toast } = useToast()

  const isNew = id === 'novo'
  const [isSaving, setIsSaving] = useState(false)

  // Main data state
  const [data, setData] = useState<Partial<Vehicle>>({
    status: 'ativo',
    documents: {},
  })

  // Pending updates state for documents
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({})
  const [docDates, setDocDates] = useState<Record<string, Date | undefined>>({})

  useEffect(() => {
    if (!isNew && id) {
      const loadDetails = async () => {
        try {
          const detail = await veiculosService.getById(id)
          if (detail) {
            setData(detail)
            const initialDates: Record<string, Date | undefined> = {}
            Object.entries(detail.documents || {}).forEach(([key, doc]) => {
              if (doc?.expiry) {
                initialDates[key] = new Date(doc.expiry)
              }
            })
            setDocDates(initialDates)
          }
        } catch (e) {
          console.error(e)
          toast({
            title: 'Erro',
            description: 'Falha ao carregar detalhes do veículo.',
            variant: 'destructive',
          })
        }
      }
      loadDetails()
    }
  }, [id, isNew, toast])

  const handleSave = async () => {
    if (!data.plate || !data.brand || !data.model) {
      toast({
        title: 'Erro',
        description: 'Preencha os campos obrigatórios (Placa, Marca, Modelo)',
        variant: 'destructive',
      })
      return
    }

    if (!validateVehiclePlate(data.plate)) {
      toast({
        title: 'Placa Inválida',
        description:
          'A placa deve ter 7 caracteres, sendo 4 letras e 3 números (ex: BRA1B23).',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      let savedId = isNew ? '' : id!

      // 1. Create or Update Vehicle Record
      if (isNew) {
        const newVehicle = await veiculosService.create(data as Vehicle)
        savedId = newVehicle.id
        addVehicle(newVehicle)
      } else {
        await veiculosService.update(savedId, data)
        updateVehicle(savedId, data)
      }

      // 2. Handle Documents (Upload or Metadata Update)
      const promises: Promise<void>[] = []
      const allKeys = new Set([
        ...Object.keys(pendingFiles),
        ...Object.keys(docDates),
      ])

      for (const key of allKeys) {
        const file = pendingFiles[key]
        const expiry = docDates[key]
        const existingDoc = data.documents?.[key]

        const hasFileChange = !!file
        const hasDateChange = existingDoc
          ? expiry?.getTime() !== existingDoc.expiry?.getTime()
          : false

        // Only save if there's a new file or we are updating an existing doc's date
        if (hasFileChange || (existingDoc && hasDateChange)) {
          promises.push(
            veiculosService.upsertDocument(
              savedId,
              key,
              file || null,
              expiry,
              existingDoc?.id,
            ),
          )
        }
      }

      await Promise.all(promises)

      // 3. Refresh data to get final state
      const refreshed = await veiculosService.getById(savedId)
      if (refreshed) {
        setData(refreshed)
        updateVehicle(savedId, refreshed)

        // Sync local date state with refreshed data
        const initialDates: Record<string, Date | undefined> = {}
        Object.entries(refreshed.documents || {}).forEach(([key, doc]) => {
          if (doc?.expiry) {
            initialDates[key] = new Date(doc.expiry)
          }
        })
        setDocDates(initialDates)
      }

      toast({
        title: 'Salvo',
        description: 'Dados do veículo e documentos salvos com sucesso.',
      })
      setPendingFiles({})

      if (isNew) {
        navigate(`/veiculos/${savedId}`, { replace: true })
      }
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Erro',
        description: `Falha ao salvar: ${error.message}`,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const isPlateValid = data.plate ? validateVehiclePlate(data.plate) : true
  const showPlateError = !isPlateValid && data.plate && data.plate.length > 0

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/veiculos')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <h1 className="text-2xl font-bold">
          {isNew
            ? 'Novo Veículo'
            : `${data.brand} ${data.model} - ${data.plate}`}
        </h1>
        <div className="ml-auto">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="docs">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Dados Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Placa <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={data.plate || ''}
                    onChange={(e) => {
                      const val = e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, '')
                        .slice(0, 7)
                      setData({ ...data, plate: val })
                    }}
                    placeholder="BRA1B23"
                    maxLength={7}
                    className={showPlateError ? 'border-red-500' : ''}
                  />
                  {showPlateError && (
                    <span className="text-xs text-red-500 block">
                      Requer 4 letras e 3 números (ex: BRA1B23)
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>
                    Marca <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={data.brand || ''}
                    onChange={(e) =>
                      setData({ ...data, brand: e.target.value })
                    }
                    placeholder="Ex: Fiat"
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Modelo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={data.model || ''}
                    onChange={(e) =>
                      setData({ ...data, model: e.target.value })
                    }
                    placeholder="Ex: Strada"
                  />
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
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="manutencao">Em Manutenção</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Obra Alocada (Opcional)</Label>
                <Select
                  value={data.projectId || ''}
                  onValueChange={(v) =>
                    setData({
                      ...data,
                      projectId: v === 'none' ? undefined : v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não alocado</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 border-t pt-4 mt-2">
                <Label className="text-base font-semibold">Pneus</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={data.pneuEstado || 'none'}
                      onValueChange={(v: any) =>
                        setData({ ...data, pneuEstado: v === 'none' ? undefined : v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não informado</SelectItem>
                        <SelectItem value="novo">Novo</SelectItem>
                        <SelectItem value="meia-vida">Meia-vida</SelectItem>
                        <SelectItem value="ruim">Ruim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data da Troca</Label>
                    <DatePicker
                      date={data.pneuDataTroca}
                      setDate={(d) => setData({ ...data, pneuDataTroca: d })}
                      placeholder="Selecione..."
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4 mt-2">
                <Label className="text-base font-semibold">Bateria</Label>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nº de Série</Label>
                      <Input
                        value={data.bateriaSerie || ''}
                        onChange={(e) => setData({ ...data, bateriaSerie: e.target.value })}
                        placeholder="S/N..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Amperagem</Label>
                      <Input
                        value={data.bateriaAmperagem || ''}
                        onChange={(e) => setData({ ...data, bateriaAmperagem: e.target.value })}
                        placeholder="Ex: 60Ah"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 max-w-[50%]">
                    <Label>Data da Troca</Label>
                    <DatePicker
                      date={data.bateriaDataTroca}
                      setDate={(d) => setData({ ...data, bateriaDataTroca: d })}
                      placeholder="Selecione..."
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card>
            <CardHeader>
              <CardTitle>Documentação (CRLV)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <DocumentUploadRow
                  label="CRLV (Documento)"
                  selectedDate={docDates['crlv']}
                  onDateChange={(d) => setDocDates({ ...docDates, crlv: d })}
                  selectedFile={pendingFiles['crlv'] || null}
                  onFileSelect={(f) =>
                    setPendingFiles({ ...pendingFiles, crlv: f })
                  }
                  existingDoc={data.documents?.['crlv']}
                  status={
                    docDates['crlv'] ? getAlertStatus(docDates['crlv']) : null
                  }
                  requiresExpiry={true}
                />
                <div className="mt-8 pt-6 border-t text-center">
                  <p className="text-sm text-muted-foreground">
                    Caso deseja verificar multas, acesse{' '}
                    <a
                      href="https://portalservicos.senatran.serpro.gov.br"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:underline font-medium"
                    >
                      esse link
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
