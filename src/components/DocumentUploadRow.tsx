import { DatePicker } from '@/components/ui/date-picker'
import { FileUploader } from '@/components/FileUploader'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { FileText, Save, Loader2 } from 'lucide-react'
import { AlertStatus, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface DocumentUploadRowProps {
  label: string
  selectedDate: Date | undefined
  onDateChange: (date: Date | undefined) => void
  selectedFile: File | null
  onFileSelect: (file: File) => void
  existingDoc: { name: string; url: string; expiry?: Date } | null | undefined
  status: AlertStatus | null
  datePickerClassName?: string
  requiresExpiry?: boolean
  showExpiry?: boolean
  onSave?: () => Promise<void>
}

export function DocumentUploadRow({
  label,
  selectedDate,
  onDateChange,
  selectedFile,
  onFileSelect,
  existingDoc,
  status,
  datePickerClassName,
  requiresExpiry = false,
  showExpiry = false,
  onSave,
}: DocumentUploadRowProps) {
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveWrapper = async () => {
    if (!onSave) return
    setIsSaving(true)
    try {
      await onSave()
    } finally {
      setIsSaving(false)
    }
  }
  return (
    <div className="p-4 border rounded-md bg-muted/10 space-y-3 relative group hover:bg-muted/20 transition-colors">
      <div className="flex justify-between items-center pr-2">
        <div className="flex items-center gap-2">
          <Label className="font-bold text-base">{label}</Label>
          {selectedFile && (
            <Badge
              variant="outline"
              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
            >
              Novo Arquivo
            </Badge>
          )}
        </div>
        {status &&
          status.severity !== 'ok' &&
          !selectedFile &&
          (requiresExpiry || showExpiry) && (
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
          )}
      </div>

      {existingDoc && !selectedFile && (
        <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
          <FileText className="h-4 w-4" />
          <a
            href={existingDoc.url}
            target="_blank"
            rel="noreferrer"
            className="hover:underline truncate max-w-[300px]"
            title={existingDoc.name}
          >
            {existingDoc.name}
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(requiresExpiry || showExpiry) && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Data de Validade {requiresExpiry && <span className="text-red-500">*</span>}
            </Label>
            <DatePicker
              date={selectedDate}
              setDate={onDateChange}
              placeholder="Selecione a data"
              className={cn('w-full bg-background', datePickerClassName)}
            />
          </div>
        )}
        <div
          className={cn('flex items-end', (!requiresExpiry && !showExpiry) && 'md:col-span-2')}
        >
          <FileUploader
            id={`file-${label}`}
            currentFileName={selectedFile?.name}
            onFileSelect={(f) => onFileSelect(f as File)}
            className="w-full"
          />
          {onSave && (
            <div className="ml-2 pb-1">
              <Button
                size="sm"
                onClick={handleSaveWrapper}
                disabled={isSaving || !selectedFile}
                className="h-9"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="sr-only sm:not-sr-only sm:ml-2">Salvar</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
