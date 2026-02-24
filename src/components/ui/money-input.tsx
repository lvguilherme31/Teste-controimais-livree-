import * as React from 'react'
import { Input } from './input'
import { cn } from '@/lib/utils'

interface MoneyInputProps extends Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> {
    value: number
    onChange: (value: number) => void
}

export function MoneyInput({ value, onChange, className, ...props }: MoneyInputProps) {
    const formatValue = (val: number) => {
        return val.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    }

    const [displayValue, setDisplayValue] = React.useState(formatValue(value || 0))

    React.useEffect(() => {
        setDisplayValue(formatValue(value || 0))
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '')
        const numericValue = rawValue ? Number(rawValue) / 100 : 0

        // Immediate update of display value for responsiveness
        setDisplayValue(formatValue(numericValue))

        // Call the parent's onChange with the numeric value
        onChange(numericValue)
    }

    return (
        <Input
            {...props}
            className={cn('text-right font-mono', className)}
            value={displayValue}
            onChange={handleChange}
            placeholder="0,00"
        />
    )
}
