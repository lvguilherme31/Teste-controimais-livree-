import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Upload, File } from 'lucide-react'

interface FileUploaderProps {
  id: string
  label?: string
  currentFileName?: string
  onFileSelect: (file: File | File[]) => void
  accept?: string
  className?: string
  disabled?: boolean
  multiple?: boolean
}

export function FileUploader({
  id,
  label,
  currentFileName,
  onFileSelect,
  accept,
  className,
  disabled = false,
  multiple = false,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      if (multiple) {
        onFileSelect(Array.from(files))
      } else {
        onFileSelect(files[0])
      }
    }
    // Reset value so selecting the same file triggers change again if needed
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          {label}
        </Label>
      )}
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          id={id}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept={accept}
          disabled={disabled}
          multiple={multiple}
        />
        <Button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className="bg-orange-600 hover:bg-orange-700 text-white font-medium min-w-[140px] transition-colors"
        >
          <Upload className="mr-2 h-4 w-4" />
          {multiple ? 'Escolher arquivos' : 'Escolher arquivo'}
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground truncate flex-1 min-w-0">
          {currentFileName && !multiple && (
            <File className="h-4 w-4 shrink-0 text-orange-500" />
          )}
          <span className="truncate" title={currentFileName}>
            {currentFileName || 'Nenhum arquivo escolhido'}
          </span>
        </div>
      </div>
    </div>
  )
}
