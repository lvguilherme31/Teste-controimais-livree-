import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, startOfDay, format, isValid } from 'date-fns'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type AlertSeverity =
  | 'expired'
  | 'urgent'
  | 'attention'
  | 'warning'
  | 'ok'
  | 'neutral'

export interface AlertStatus {
  severity: AlertSeverity
  label: string
  color: string
  bg: string
  border: string
}

export const BR_STATES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]

export function isValidDate(date: any): boolean {
  if (!date) return false
  const d = new Date(date)
  return isValid(d)
}

export function safeFormat(
  date: any,
  formatStr: string,
  options?: any,
): string {
  if (!isValidDate(date)) return 'N/A'
  return format(new Date(date), formatStr, options)
}

export function getAlertStatus(
  date: Date | string | number | null | undefined,
): AlertStatus {
  if (!isValidDate(date)) {
    return {
      severity: 'neutral',
      label: 'N/A',
      color: 'text-muted-foreground',
      bg: 'bg-muted/10',
      border: 'border-muted',
    }
  }

  // We know date is valid here
  const d = new Date(date!)
  const today = startOfDay(new Date())
  const target = startOfDay(d)
  const diff = differenceInDays(target, today)

  if (diff < 0) {
    return {
      severity: 'expired',
      label: 'VENCIDO',
      color: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
    }
  }

  // Updated per user story: <= 30 days shows yellow ATENÇÃO
  if (diff <= 30) {
    return {
      severity: 'warning',
      label: 'ATENÇÃO',
      color: 'text-yellow-700',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
    }
  }

  return {
    severity: 'ok',
    label: 'VÁLIDO',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
  }
}

export function formatCNPJ(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18)
}

export function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/[^\d]+/g, '')

  if (cleanCNPJ.length !== 14) return false

  // Eliminate known invalid CNPJs
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false

  // Validates first check digit
  let length = cleanCNPJ.length - 2
  let numbers = cleanCNPJ.substring(0, length)
  let digits = cleanCNPJ.substring(length)
  let sum = 0
  let pos = length - 7

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0))) return false

  // Validates second check digit
  length = length + 1
  numbers = cleanCNPJ.substring(0, length)
  sum = 0
  pos = length - 7

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(1))) return false

  return true
}

export function formatCurrencyCompact(value: number) {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}K`
  }
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Validates a vehicle plate according to Mercosul standards.
 * Strictly follows the pattern: 3 Letters + 1 Number + 1 Letter + 2 Numbers (LLLNLNN).
 * Example: BRA1B23
 */
export function validateVehiclePlate(plate: string): boolean {
  if (!plate) return false
  const clean = plate.replace(/[^A-Z0-9]/gi, '').toUpperCase()
  if (clean.length !== 7) return false

  // Mercosul Pattern: LLLNLNN
  // Positions 1, 2, 3, 5 must be letters (A-Z)
  // Positions 4, 6, 7 must be numbers (0-9)
  const mercosulPattern = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/

  return mercosulPattern.test(clean)
}
