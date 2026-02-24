import { cn } from '@/lib/utils'

interface DetailRowProps {
  label: string
  value?: string | number | null
  icon?: React.ElementType
  children?: React.ReactNode
  className?: string
}

export function DetailRow({
  label,
  value,
  icon: Icon,
  children,
  className,
}: DetailRowProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between py-4',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground mb-1 sm:mb-0">
        {Icon && <Icon className="h-4 w-4" />}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-sm font-medium text-foreground text-left sm:text-right">
        {children || value || '-'}
      </div>
    </div>
  )
}
