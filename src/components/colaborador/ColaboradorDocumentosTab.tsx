import { EmployeeDocument } from '@/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Eye } from 'lucide-react'
import { safeFormat, cn, getAlertStatus } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { differenceInDays, startOfDay } from 'date-fns'

interface ColaboradorDocumentosTabProps {
  documents: Record<string, EmployeeDocument | undefined>
}

const DOC_TYPE_LABELS: Record<string, string> = {
  rg: 'RG (Identidade)',
  cpf: 'CPF (Cadastro de Pessoa Física)',
  contrato: 'Contrato de Trabalho',
  folha_registro: 'Folha de Registro',
  aso: 'ASO (Atestado de Saúde)',
  epi: 'Ficha de EPI',
  nr6: 'NR 06 - EPI',
  nr10: 'NR 10 - Eletricidade',
  nr12: 'NR 12 - Máquinas',
  nr17: 'NR 17 - Ergonomia',
  nr18: 'NR 18 - Construção Civil',
  nr35: 'NR 35 - Altura',
  os: 'Ordem de Serviço (OS)',
}

export function ColaboradorDocumentosTab({
  documents,
}: ColaboradorDocumentosTabProps) {
  const { toast } = useToast()
  const docsList = Object.values(documents).filter(
    Boolean,
  ) as EmployeeDocument[]

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
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Documentação
        </CardTitle>
        <CardDescription>
          Documentos de admissão e registros de segurança (ASO, EPI, NRs).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {docsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
            <FileText className="h-10 w-10 mb-2 opacity-20" />
            <p>Nenhum documento anexado</p>
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Documento</TableHead>
                  <TableHead>Descrição / Obs.</TableHead>
                  <TableHead>Nome do Arquivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Validade</TableHead>
                  <TableHead>Data de Upload</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docsList.map((doc) => {
                  // Determine label
                  let typeLabel =
                    DOC_TYPE_LABELS[doc.type || 'outros'] ||
                    doc.type?.toUpperCase().replace(/_/g, ' ') ||
                    'Documento'

                  if (doc.type === 'outros' && doc.description) {
                    typeLabel = doc.description
                  } else if (doc.description) {
                    typeLabel = `${typeLabel} - ${doc.description}`
                  }

                  // Determine status
                  const status = getAlertStatus(doc.expiry)
                  const daysRemaining = doc.expiry
                    ? differenceInDays(
                      startOfDay(new Date(doc.expiry)),
                      startOfDay(new Date()),
                    )
                    : null

                  return (
                    <TableRow key={doc.id || doc.name}>
                      <TableCell className="font-medium whitespace-nowrap">{typeLabel}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={doc.description || '-'}>
                        {doc.description || '-'}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={doc.name}>{doc.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 w-fit">
                          <Badge
                            className={cn(
                              'w-fit whitespace-nowrap border shadow-none font-semibold',
                              status.bg,
                              status.color,
                              status.border,
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
                      <TableCell>
                        {doc.expiry
                          ? safeFormat(doc.expiry, 'dd/MM/yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {safeFormat(doc.uploadDate, 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleDownload(doc.url, doc.name)}
                            title="Baixar"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
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
                            </a>
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
