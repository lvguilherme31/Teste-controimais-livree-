import { useState, useEffect } from 'react'
import { Vehicle } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { veiculosService } from '@/services/veiculosService'
import { validateVehiclePlate } from '@/lib/utils'
import { DocumentUploadCard } from './DocumentUploadCard'
import { DatePicker } from './ui/date-picker'

interface VeiculoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicleToEdit?: Vehicle
}

export function VeiculoFormDialog({
  open,
  onOpenChange,
  vehicleToEdit,
}: VeiculoFormDialogProps) {
  const {
    updateVehicle,
    addVehicle,
    projects,
    fetchVehicles,
    fetchExpiringDocuments,
  } = useAppStore()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [data, setData] = useState<Partial<Vehicle>>({
    plate: '',
    brand: '',
    model: '',
    status: 'ativo',
    projectId: undefined,
  })

  // Document State
  const [crlvFile, setCrlvFile] = useState<File | null>(null)
  const [crlvDate, setCrlvDate] = useState<Date | undefined>(undefined)

  useEffect(() => {
    if (open && vehicleToEdit) {
      setData({ ...vehicleToEdit })
      setCrlvDate(vehicleToEdit.documentExpiry)
      setCrlvFile(null)
    } else {
      setData({
        plate: '',
        brand: '',
        model: '',
        status: 'ativo',
        projectId: undefined,
        pneuEstado: undefined,
        pneuDataTroca: undefined,
        bateriaSerie: '',
        bateriaAmperagem: '',
        bateriaDataTroca: undefined,
      })
      setCrlvDate(undefined)
      setCrlvFile(null)
    }
  }, [open, vehicleToEdit])

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
        description: 'A placa deve seguir o padrão Mercosul (ex: BRA1B23).',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      let vehicleId = vehicleToEdit?.id

      if (vehicleToEdit && vehicleToEdit.id) {
        await veiculosService.update(vehicleToEdit.id, data)
        updateVehicle(vehicleToEdit.id, data)
        toast({
          title: 'Veículo Atualizado',
          description: 'As informações do veículo foram salvas com sucesso.',
        })
      } else {
        // Create new vehicle
        const newVehicle = await addVehicle(data as Vehicle)
        vehicleId = newVehicle.id
        toast({
          title: 'Veículo Criado',
          description: 'Veículo adicionado com sucesso.',
        })
      }

      // Handle Document Upload
      if (vehicleId) {
        // If there's a file OR a date change, we update
        // We need to know if we are updating an existing doc or creating a new one
        // For new vehicles, we always create
        // For existing, we check vehicleToEdit.documents?.['crlv']?.id

        const existingDocId = vehicleToEdit?.documents?.['crlv']?.id

        if (crlvFile || (existingDocId && crlvDate)) {
          await veiculosService.upsertDocument(
            vehicleId,
            'crlv',
            crlvFile,
            crlvDate,
            existingDocId
          )
        }
      }

      await fetchVehicles()
      await fetchExpiringDocuments()
      onOpenChange(false)
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Erro',
        description: `Falha ao salvar: ${error.message}`,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isPlateValid = data.plate ? validateVehiclePlate(data.plate) : true
  const showPlateError = !isPlateValid && data.plate && data.plate.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vehicleToEdit ? 'Editar Veículo' : 'Novo Veículo'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plate">
                Placa <span className="text-red-500">*</span>
              </Label>
              <Input
                id="plate"
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
                  Padrão Mercosul: LLLNLNN (ex: BRA1B23)
                </span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={data.status}
                onValueChange={(v: any) => setData({ ...data, status: v })}
              >
                <SelectTrigger id="status">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">
                Marca <span className="text-red-500">*</span>
              </Label>
              <Input
                id="brand"
                value={data.brand || ''}
                onChange={(e) => setData({ ...data, brand: e.target.value })}
                placeholder="Ex: Fiat"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">
                Modelo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="model"
                value={data.model || ''}
                onChange={(e) => setData({ ...data, model: e.target.value })}
                placeholder="Ex: Strada"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Obra Alocada</Label>
            <Select
              value={data.projectId || 'none'}
              onValueChange={(v) =>
                setData({
                  ...data,
                  projectId: v === 'none' ? undefined : v,
                })
              }
            >
              <SelectTrigger id="project">
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
            <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
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

          <div className="space-y-2 border-t pt-4 mt-2">
            <Label className="text-base font-semibold">Documentação</Label>
            <DocumentUploadCard
              type="Documento do Veículo (CRLV)"
              expiry={crlvDate}
              onExpiryChange={setCrlvDate}
              file={crlvFile}
              onFileChange={setCrlvFile}
              existingDoc={
                vehicleToEdit?.documentUrl
                  ? {
                    name: 'CRLV Anexado',
                    url: vehicleToEdit.documentUrl,
                    expiry: vehicleToEdit.documentExpiry,
                  }
                  : null
              }
              isFixed={true}
            />
            <div className="mt-4 pt-4 border-t text-center">
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
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
