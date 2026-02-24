import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { FileUploader } from '@/components/FileUploader'
import { useToast } from '@/hooks/use-toast'
import { obrasService } from '@/services/obrasService'
import { Loader2 } from 'lucide-react'

const DOC_TYPES = [
  { value: 'pgr', label: 'PGR' },
  { value: 'pcmso', label: 'PCMSO' },
  { value: 'art', label: 'ART' },
  { value: 'seguro', label: 'Seguro' },
  { value: 'cno', label: 'CNO' },
  { value: 'alvara', label: 'Alvará' },
  { value: 'licenca_ambiental', label: 'Licença Ambiental' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'outros', label: 'Outros' },
]

interface AddDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  obraId: string
  onSuccess: () => void
}

export function AddDocumentDialog({
  open,
  onOpenChange,
  obraId,
  onSuccess,
}: AddDocumentDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [type, setType] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [expiry, setExpiry] = useState<Date | undefined>(undefined)
  const [file, setFile] = useState<File | null>(null)

  const handleSave = async () => {
    if (!type) {
      toast({
        title: 'Campo obrigatório',
        description: 'Selecione o tipo do documento.',
        variant: 'destructive',
      })
      return
    }
    if (!file) {
      toast({
        title: 'Campo obrigatório',
        description: 'Selecione um arquivo.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      await obrasService.uploadAndSaveDoc(
        obraId,
        type,
        file,
        expiry,
        undefined,
        description,
      )
      toast({
        title: 'Documento adicionado',
        description: 'O documento foi salvo com sucesso.',
      })
      // Reset form
      setType('')
      setDescription('')
      setExpiry(undefined)
      setFile(null)
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar o documento.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Documento</DialogTitle>
          <DialogClose />
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>
              Tipo de Documento <span className="text-red-500">*</span>
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((dt) => (
                  <SelectItem key={dt.value} value={dt.value}>
                    {dt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descrição (Opcional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Cópia assinada"
            />
          </div>

          <div className="space-y-2">
            <Label>Data de Validade</Label>
            <DatePicker
              date={expiry}
              setDate={setExpiry}
              placeholder="Selecione a data de vencimento"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Arquivo <span className="text-red-500">*</span>
            </Label>
            <FileUploader
              id="new-doc-upload"
              currentFileName={file?.name}
              onFileSelect={(f) => setFile(f as File)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className="bg-orange-600 hover:bg-orange-700"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
