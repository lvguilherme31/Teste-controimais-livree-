import { ProjectDocument } from '@/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, Eye, Trash2, Download } from 'lucide-react'
import { cn, safeFormat, getAlertStatus } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { differenceInDays, startOfDay } from 'date-fns'

const DOC_TYPE_LABELS: Record<string, string> = {
  pgr: 'PGR',
  pcmso: 'PCMSO',
  art: 'ART',
  seguro: 'Seguro',
  cno: 'CNO',
  alvara: 'Alvará',
  licenca_ambiental: 'Licença Ambiental',
  outros: 'Outros',
  cnpj: 'CNPJ',
  contrato: 'Contrato',
}

interface ObraDocumentosTabProps {
  documents: ProjectDocument[]
  onDeleteClick: (doc: ProjectDocument) => void
}

export function ObraDocumentosTab({
  documents,
  onDeleteClick,
}: ObraDocumentosTabProps) {
  const { toast } = useToast()

  const handleDownload = async (url: string | undefined, filename: string) => {
    if (!url) return

    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Network response was not ok')
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)

      toast({
        title: 'Download concluído',
        description: `O arquivo ${filename} foi baixado com sucesso.`,
      })
    } catch (error) {
      console.error('Download failed', error)
      toast({
        title: 'Erro no download',
        description:
          'Não foi possível baixar o arquivo diretamente. Abrindo em nova aba...',
        variant: 'destructive',
      })
      window.open(url, '_blank')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Documentação
            </CardTitle>
            <CardDescription>
              Gerencie os documentos obrigatórios e adicionais da obra.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
            <FileText className="h-10 w-10 mb-2 opacity-20" />
            <p>Nenhum documento anexado</p>
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de documento</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status (Alertas)</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  if (!doc) return null
                  let typeLabel =
                    DOC_TYPE_LABELS[doc.type || 'outros'] ||
                    doc.type?.toUpperCase() ||
                    'Outros'

                  if (doc.type === 'outros' && doc.description) {
                    typeLabel = doc.description
                  } else if (doc.description) {
                    typeLabel = `${typeLabel} - ${doc.description}`
                  }

                  const status = getAlertStatus(doc.expiry)
                  const daysRemaining = doc.expiry
                    ? differenceInDays(
                        startOfDay(new Date(doc.expiry)),
                        startOfDay(new Date()),
                      )
                    : null

                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{typeLabel}</TableCell>
                      <TableCell>
                        <span>{safeFormat(doc.expiry, 'dd/MM/yyyy')}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 w-fit">
                          <Badge
                            className={cn(
                              status.bg,
                              status.color,
                              status.border,
                              'border shadow-none whitespace-nowrap font-semibold',
                            )}
                          >
                            {status.label}
                          </Badge>
                          {status.severity === 'warning' &&
                            daysRemaining !== null && (
                              <span className="text-xs text-amber-600 font-medium">
                                Faltam {daysRemaining} dias
                              </span>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleDownload(doc.url, doc.name)}
                            disabled={!doc.url}
                            title={doc.url ? 'Realizar download' : 'Sem anexo'}
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download</span>
                          </Button>
                          {doc.url ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                title="Visualizar"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Visualizar</span>
                              </a>
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled
                              className="h-8 w-8 text-muted-foreground opacity-50"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Sem visualização</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => onDeleteClick(doc)}
                            title="Deletar"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Deletar</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
