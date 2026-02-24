import { useState, useEffect } from 'react'
import { pagamentosService } from '@/services/pagamentosService'
import { Payslip } from '@/types'
import { FileText, Loader2, Download, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ColaboradorHoleritesTabProps {
    employeeId: string
}

export function ColaboradorHoleritesTab({ employeeId }: ColaboradorHoleritesTabProps) {
    const [payslips, setPayslips] = useState<Payslip[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadPayslips() {
            setIsLoading(true)
            try {
                const data = await pagamentosService.getPayslips(employeeId)
                setPayslips(data || [])
            } catch (error) {
                console.error('Error loading payslips:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (employeeId) {
            loadPayslips()
        }
    }, [employeeId])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        )
    }

    if (payslips.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <FileText className="h-12 w-12 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">Nenhum holerite encontrado.</p>
                    <p className="text-slate-400 text-sm max-w-sm">
                        Os holerites aparecem aqui automaticamente quando anexados no lançamento de pagamentos para este colaborador.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-orange-600" />
                        Histórico de Holerites
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {payslips.map((slip) => (
                            <div
                                key={slip.id}
                                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">
                                            Mês de Referência: {slip.mesReferencia}
                                        </h4>
                                        <p className="text-xs text-slate-500">{slip.nomeArquivo}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-slate-600 hover:text-orange-600"
                                        asChild
                                    >
                                        <a
                                            href={slip.urlArquivo}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Visualizar"
                                        >
                                            <Eye className="h-4 w-4" />
                                            <span className="ml-2 hidden sm:inline">Visualizar</span>
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
