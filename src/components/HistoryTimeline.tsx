import { useEffect, useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { ProjectHistory } from '@/types'
import { ptBR } from 'date-fns/locale'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, History as HistoryIcon, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { safeFormat } from '@/lib/utils'

interface HistoryTimelineProps {
  obraId: string
}

export function HistoryTimeline({ obraId }: HistoryTimelineProps) {
  const { getProjectHistory } = useAppStore()
  const [history, setHistory] = useState<ProjectHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      try {
        const data = await getProjectHistory(obraId)
        setHistory(data)
      } catch (error) {
        console.error('Failed to fetch history', error)
      } finally {
        setLoading(false)
      }
    }

    if (obraId) {
      fetchHistory()
    }
  }, [obraId, getProjectHistory])

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground gap-2">
        <HistoryIcon className="h-8 w-8 opacity-50" />
        <p>Nenhuma alteração registrada ainda.</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-6 pl-2">
        {history.map((log, index) => (
          <div key={log.id} className="relative flex gap-4">
            {/* Connector Line */}
            {index !== history.length - 1 && (
              <div className="absolute left-[15px] top-8 h-full w-0.5 bg-muted" />
            )}

            <Avatar className="h-8 w-8 border bg-background">
              <AvatarFallback className="text-xs">
                {log.userName?.substring(0, 2).toUpperCase() || 'US'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">
                  {log.userName || 'Usuário'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {safeFormat(log.createdAt, 'dd MMM yyyy, HH:mm', {
                    locale: ptBR,
                  })}
                </span>
              </div>
              <p className="text-sm text-foreground">
                Alterou{' '}
                <span className="font-medium text-orange-600">{log.field}</span>
              </p>
              <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-md mt-1 border">
                <div className="grid grid-cols-2 gap-2">
                  <div className="border-r pr-2">
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground/70 mb-0.5">
                      Antes
                    </span>
                    <span className="break-words line-clamp-2">
                      {log.oldValue || '-'}
                    </span>
                  </div>
                  <div className="pl-1">
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground/70 mb-0.5">
                      Depois
                    </span>
                    <span className="break-words line-clamp-2">
                      {log.newValue || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
