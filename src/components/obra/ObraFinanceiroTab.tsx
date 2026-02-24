import { useState, useMemo } from 'react'
import { Project } from '@/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DollarSign, Filter, X, FileCheck, Eye, Download } from 'lucide-react'
import { safeFormat } from '@/lib/utils'
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

interface ObraFinanceiroTabProps {
  project: Project
}

export function ObraFinanceiroTab({ project }: ObraFinanceiroTabProps) {
  const { toast } = useToast()

  // Filters State
  const [dateFilterStart, setDateFilterStart] = useState<Date | undefined>()
  const [dateFilterEnd, setDateFilterEnd] = useState<Date | undefined>()
  const [minValue, setMinValue] = useState<string>('')
  const [maxValue, setMaxValue] = useState<string>('')

  // Memoized sorted contracts
  const sortedContracts = useMemo(() => {
    return project?.contracts
      ? [...project.contracts].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
      : []
  }, [project?.contracts])

  // Filtered Contracts
  const filteredContracts = useMemo(() => {
    if (!sortedContracts) return []

    return sortedContracts.filter((contract) => {
      // Date Filter
      let dateMatch = true
      if (dateFilterStart || dateFilterEnd) {
        const contractDate = new Date(contract.date)
        if (dateFilterStart && dateFilterEnd) {
          dateMatch = isWithinInterval(contractDate, {
            start: startOfDay(dateFilterStart),
            end: endOfDay(dateFilterEnd),
          })
        } else if (dateFilterStart) {
          dateMatch = contractDate >= startOfDay(dateFilterStart)
        } else if (dateFilterEnd) {
          dateMatch = contractDate <= endOfDay(dateFilterEnd)
        }
      }

      // Value Filter
      let valueMatch = true
      const contractValue = contract.value || 0

      if (minValue) {
        const min = parseFloat(minValue)
        if (!isNaN(min) && contractValue < min) valueMatch = false
      }

      if (maxValue) {
        const max = parseFloat(maxValue)
        if (!isNaN(max) && contractValue > max) valueMatch = false
      }

      return dateMatch && valueMatch
    })
  }, [sortedContracts, dateFilterStart, dateFilterEnd, minValue, maxValue])

  // Grand Total Value Calculation (All Contracts)
  const grandTotalContractsValue = useMemo(() => {
    return sortedContracts.reduce((acc, curr) => acc + (curr.value || 0), 0)
  }, [sortedContracts])

  // Filtered Total Value Calculation
  const filteredTotalValue = useMemo(() => {
    return filteredContracts.reduce((acc, curr) => acc + (curr.value || 0), 0)
  }, [filteredContracts])

  const hasActiveFilters =
    !!dateFilterStart || !!dateFilterEnd || !!minValue || !!maxValue

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
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" /> Gestão Financeira
        </CardTitle>
        <CardDescription>
          Gerencie os valores e contratos relacionados a esta obra. O valor
          total é calculado somando todos os contratos anexados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters Section */}
        <div className="flex flex-col gap-4 p-4 border rounded-md bg-muted/10">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground">
              Filtros Avançados
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-xs">Data Inicial</Label>
              <DatePicker
                date={dateFilterStart}
                setDate={setDateFilterStart}
                placeholder="dd/mm/aaaa"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Data Final</Label>
              <DatePicker
                date={dateFilterEnd}
                setDate={setDateFilterEnd}
                placeholder="dd/mm/aaaa"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Valor Mínimo (R$)</Label>
              <MoneyInput
                placeholder="0,00"
                value={parseFloat(minValue) || 0}
                onChange={(val) => setMinValue(val.toString())}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Valor Máximo (R$)</Label>
              <MoneyInput
                placeholder="0,00"
                value={parseFloat(maxValue) || 0}
                onChange={(val) => setMaxValue(val.toString())}
              />
            </div>
            <div className="pb-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFilterStart(undefined)
                  setDateFilterEnd(undefined)
                  setMinValue('')
                  setMaxValue('')
                }}
                title="Limpar Filtros"
                className="w-full hover:text-destructive hover:bg-destructive/10 border border-dashed border-transparent hover:border-destructive/30"
                disabled={!hasActiveFilters}
              >
                <X className="h-4 w-4 mr-2" /> Limpar
              </Button>
            </div>
          </div>
        </div>

        {/* Filtered Total (Displayed only when filtering) */}
        {hasActiveFilters && (
          <div className="flex flex-col p-4 bg-orange-50 rounded-md border border-l-4 border-l-orange-500/50">
            <span className="text-sm font-semibold text-orange-800 flex items-center gap-2 mb-1">
              <Filter className="h-4 w-4" /> Total Filtrado
            </span>
            <span className="text-2xl font-bold text-orange-900">
              {filteredTotalValue.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
            <span className="text-xs text-orange-700 mt-1">
              Exibindo {filteredContracts.length} de {sortedContracts.length}{' '}
              contratos
            </span>
          </div>
        )}

        {/* Table */}
        {sortedContracts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg bg-muted/10">
            <FileCheck className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p>Nenhum contrato anexado.</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
            <Filter className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p>Nenhum contrato encontrado com os filtros selecionados.</p>
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrato / Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data de Upload</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {contract.description || 'Contrato'}
                        </span>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {contract.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {contract.value
                        ? contract.value.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {safeFormat(contract.date, 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      {contract.expiry
                        ? safeFormat(contract.expiry, 'dd/MM/yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {contract.url ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              handleDownload(contract.url, contract.name)
                            }
                            title="Baixar documento"
                          >
                            <Download className="h-4 w-4 mr-2" /> Baixar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <a
                              href={contract.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Eye className="h-4 w-4 mr-2" /> Visualizar
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic px-3">
                          Sem anexo
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Grand Total - Repositioned to Bottom Right */}
        <div className="flex justify-end mt-6">
          <div className="flex flex-col p-4 bg-card rounded-md border shadow-sm border-l-4 border-l-orange-400 min-w-[300px]">
            <span className="text-sm font-medium text-muted-foreground mb-1">
              $ Valor Total Contratado
            </span>
            <span className="text-2xl font-bold text-foreground">
              {grandTotalContractsValue.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              Soma de {sortedContracts.length} contratos
            </span>
          </div>
        </div>

        <div className="text-sm text-muted-foreground bg-blue-50 text-blue-800 p-3 rounded-md border border-blue-100 flex items-start gap-2">
          <span className="font-bold shrink-0 mt-0.5">Nota:</span>
          <p>
            A lista acima exibe os contratos anexados a esta obra. Para
            adicionar novos contratos, aditivos ou alterar valores, utilize o
            botão "Editar Obra" no topo da página. O valor total é atualizado
            automaticamente.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
