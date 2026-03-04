import * as React from 'react'
import { format, parse, isValid } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { ptBR } from 'date-fns/locale'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'

interface DatePickerProps {
  date?: Date
  setDate: (date?: Date) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({
  date,
  setDate,
  placeholder = 'DD/MM/AAAA',
  className,
  disabled,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState<string>('')

  // Sync input value with external date changes
  React.useEffect(() => {
    if (date) {
      if (isValid(date)) {
        setInputValue(format(date, 'dd/MM/yyyy'))
      }
    } else {
      setInputValue('')
    }
  }, [date])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Apenas números
    let rawValue = e.target.value.replace(/\D/g, '')

    // Máscara DD/MM/AAAA
    let maskedValue = ''
    if (rawValue.length > 0) {
      maskedValue = rawValue.substring(0, 2)
      if (rawValue.length > 2) {
        maskedValue += '/' + rawValue.substring(2, 4)
        if (rawValue.length > 4) {
          maskedValue += '/' + rawValue.substring(4, 8)
        }
      }
    }

    setInputValue(maskedValue)

    // Se completou a digitação, tenta fazer o parse
    if (maskedValue.length === 10) {
      const parsedDate = parse(maskedValue, 'dd/MM/yyyy', new Date())
      if (isValid(parsedDate)) {
        // Verifica também o ano para evitar datas no formato 01/01/0001
        if (parsedDate.getFullYear() > 1900 && parsedDate.getFullYear() < 2100) {
          setDate(parsedDate)
        }
      }
    } else if (maskedValue === '') {
      setDate(undefined)
    }
  }

  return (
    <div className={cn("relative flex items-center w-full", className)}>
      <Input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        disabled={disabled}
        className="pr-10 w-full"
        maxLength={10}
      />
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent"
            disabled={disabled}
            type="button"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              setDate(d)
              setIsOpen(false)
            }}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
