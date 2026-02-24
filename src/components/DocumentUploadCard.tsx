import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { FileUploader } from '@/components/FileUploader'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn, getAlertStatus } from '@/lib/utils'

interface DocumentUploadCardProps {
  type: string
  onTypeChange?: (value: string) => void
  expiry: Date | undefined
  onExpiryChange: (date: Date | undefined) => void
  file: File | null
  onFileChange: (file: File) => void
  existingDoc?: {
    name: string
    url: string
    expiry?: Date
    description?: string
  } | null
  isFixed?: boolean
  onRemove?: () => void
  availableTypes?: { value: string; label: string }[]
  description?: string
  onDescriptionChange?: (value: string) => void
  uploaderId?: string
  requiresExpiry?: boolean
}

export function DocumentUploadCard({
  type,
  onTypeChange,
  expiry,
  onExpiryChange,
  file,
  onFileChange,
  existingDoc,
  isFixed = false,
  onRemove,
  availableTypes = [],
  description,
  onDescriptionChange,
  uploaderId,
  requiresExpiry = true,
}: DocumentUploadCardProps) {
  // Determine status for existing documents
  const status = existingDoc?.expiry ? getAlertStatus(existingDoc.expiry) : null

  // If we have a selected expiry (even if not saved yet), we can show status preview
  const previewStatus = expiry ? getAlertStatus(expiry) : null
  const displayStatus = file || expiry ? previewStatus : status

  // We show description input if type is 'outros', whether dynamic or fixed
  const showDescriptionInput = type === 'outros'

  // Use stable ID from parent if available to prevent re-mounting/focus loss on re-renders
  const fileInputId = uploaderId || `upload-${type}-${Math.random()}`

  return (
    <Card className="overflow-hidden border shadow-sm">
      <div className="bg-muted/10 px-4 py-3 border-b flex items-center justify-between">
        {isFixed ? (
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm md:text-base">{type}</span>
            {displayStatus && displayStatus.severity !== 'ok' && (
              <Badge
                className={cn(
                  displayStatus.bg,
                  displayStatus.color,
                  displayStatus.border,
                  'border shadow-none ml-2',
                )}
              >
                {displayStatus.label}
              </Badge>
            )}
            {displayStatus?.severity === 'ok' && (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200 ml-2"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" /> {displayStatus.label}
              </Badge>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Select value={type} onValueChange={onTypeChange}>
              <SelectTrigger className="h-8 bg-background">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-2">
          {existingDoc && !file && (
            <a
              href={existingDoc.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              Ver atual
            </a>
          )}
          {!isFixed && onRemove && (
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        {showDescriptionInput && (
          <div className="mb-4">
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Nome do Documento / Descrição
            </Label>
            <Input
              value={description || ''}
              onChange={(e) => onDescriptionChange?.(e.target.value)}
              placeholder="Ex: Certificado de Curso Especial"
              className="w-full"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Data de Validade{' '}
              {requiresExpiry && <span className="text-destructive">*</span>}
            </Label>
            <DatePicker
              date={expiry}
              setDate={onExpiryChange}
              placeholder="Selecione a data"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <FileUploader
              id={fileInputId}
              currentFileName={file?.name}
              onFileSelect={(f) => onFileChange(f as File)}
            />
          </div>
        </div>

        {/* Warning if date is present but no file */}
        {expiry && !file && !existingDoc && (
          <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
            <AlertCircle className="h-3 w-3" />
            <span>Não esqueça de anexar o arquivo</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
