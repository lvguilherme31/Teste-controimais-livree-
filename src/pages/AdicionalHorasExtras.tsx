import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { colaboradoresService } from '@/services/colaboradoresService'
import { adicionalHorasExtrasService } from '@/services/adicionalHorasExtrasService'
import { Employee, AdicionalHorasExtras as AdicionalHorasExtrasType } from '@/types'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useToast } from '@/components/ui/use-toast'
import { Save, Loader2, Calendar as CalendarIcon } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AdicionalHorasExtras() {
    const [colaboradores, setColaboradores] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const { toast } = useToast()

    const currentYear = new Date().getFullYear()
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0')
    const [selectedMes, setSelectedMes] = useState(currentMonth)
    const [selectedAno, setSelectedAno] = useState(currentYear.toString())

    const [data, setData] = useState<Record<string, Record<number, { horas: string, observacao: string }>>>({})

    const fetchDados = async () => {
        try {
            setLoading(true)
            const emp = await colaboradoresService.getAll()
            setColaboradores(emp.filter(e => e.status === 'ativo'))

            const mesAno = `${selectedAno}-${selectedMes}`
            const registros = await adicionalHorasExtrasService.getByMesAno(mesAno)

            const parsedData: Record<string, Record<number, { horas: string, observacao: string }>> = {}

            registros.forEach(rek => {
                if (!parsedData[rek.colaborador_id]) {
                    parsedData[rek.colaborador_id] = {}
                }
                parsedData[rek.colaborador_id][rek.dia] = {
                    horas: rek.horas || '',
                    observacao: rek.observacao || ''
                }
            })
            setData(parsedData)

        } catch (error) {
            console.error(error)
            toast({ title: 'Erro', description: 'Erro ao carregar os dados', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDados()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMes, selectedAno])

    const handleInputChange = (colaboradorId: string, dia: number, field: 'horas' | 'observacao', value: string) => {
        setData(prev => ({
            ...prev,
            [colaboradorId]: {
                ...(prev[colaboradorId] || {}),
                [dia]: {
                    ...(prev[colaboradorId]?.[dia] || { horas: '', observacao: '' }),
                    [field]: value
                }
            }
        }))
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            const mesAno = `${selectedAno}-${selectedMes}`
            const recordsToUpsert: Omit<AdicionalHorasExtrasType, 'id' | 'created_at'>[] = []

            // Iterate over data state and prepare for batch insert
            Object.keys(data).forEach(colabId => {
                Object.keys(data[colabId]).forEach(d => {
                    const dia = parseInt(d)
                    const info = data[colabId][dia]
                    if (info.horas?.trim() || info.observacao?.trim()) { // Only save if there's data
                        recordsToUpsert.push({
                            colaborador_id: colabId,
                            mes_ano: mesAno,
                            dia,
                            horas: info.horas,
                            observacao: info.observacao
                        })
                    } else {
                        // If they cleared the data previously filled, we still need to send it to update as empty, 
                        // but if they just never filled it, we don't. For simplicity, we can pass empty strings
                        recordsToUpsert.push({
                            colaborador_id: colabId,
                            mes_ano: mesAno,
                            dia,
                            horas: '',
                            observacao: ''
                        })
                    }
                })
            })

            if (recordsToUpsert.length > 0) {
                await adicionalHorasExtrasService.upsertMany(recordsToUpsert)
                toast({ title: 'Sucesso', description: 'Registros salvos com sucesso' })
                fetchDados()
            } else {
                toast({ title: 'Ok', description: 'Nenhum dado para salvar' })
            }
        } catch (error: any) {
            console.error(error)
            toast({ title: 'Erro ao salvar', description: error.message || 'Erro desconhecido', variant: 'destructive' })
        } finally {
            setSaving(false)
        }
    }

    const meses = [
        { value: '01', label: 'Janeiro' },
        { value: '02', label: 'Fevereiro' },
        { value: '03', label: 'Março' },
        { value: '04', label: 'Abril' },
        { value: '05', label: 'Maio' },
        { value: '06', label: 'Junho' },
        { value: '07', label: 'Julho' },
        { value: '08', label: 'Agosto' },
        { value: '09', label: 'Setembro' },
        { value: '10', label: 'Outubro' },
        { value: '11', label: 'Novembro' },
        { value: '12', label: 'Dezembro' },
    ]

    const anos = Array.from({ length: 5 }, (_, i) => (currentYear - Math.floor(i / 2) + Math.ceil(i / 2)).toString())
    // a bit simpler:
    const anosList = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(String)

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 space-x-2">
                <Loader2 className="h-4 w-4 animate-spin disabled text-primary" />
                <span className="text-muted-foreground text-sm font-medium">Carregando quadro de horas extras...</span>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-8 sm:ml-64 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Adicional Horas Extras</h1>
                    <p className="text-muted-foreground">Lançamento diário de horas e observações por colaborador ativo.</p>
                </div>
                <Button onClick={handleSave} disabled={saving} size="lg">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Alterações
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <CalendarIcon className="h-5 w-5" />
                        <span>Selecione a Competência</span>
                    </CardTitle>
                    <CardDescription>
                        Escolha o mês e ano para registrar ou consultar as horas extras.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 max-w-sm">
                        <div className="flex-1 space-y-1">
                            <Label>Mês</Label>
                            <Select value={selectedMes} onValueChange={setSelectedMes}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Mês" />
                                </SelectTrigger>
                                <SelectContent>
                                    {meses.map(m => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 space-y-1">
                            <Label>Ano</Label>
                            <Select value={selectedAno} onValueChange={setSelectedAno}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Ano" />
                                </SelectTrigger>
                                <SelectContent>
                                    {anosList.map(a => (
                                        <SelectItem key={a} value={a}>{a}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-card rounded-lg border shadow-sm">
                <Accordion type="multiple" className="w-full">
                    {colaboradores.map(colab => {
                        // Count total rows filled temporarily to show in summary
                        const colabData = data[colab.id] || {}
                        let totalDias = 0
                        Object.values(colabData).forEach(d => {
                            if (d.horas || d.observacao) totalDias++
                        })

                        return (
                            <AccordionItem key={colab.id} value={colab.id} className="border-b px-4">
                                <AccordionTrigger className="hover:no-underline hover:bg-muted/50 rounded-lg px-4 my-1 transition-colors">
                                    <div className="flex items-center gap-4 w-full pr-4">
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="font-semibold">{colab.name}</span>
                                            <span className="text-xs text-muted-foreground font-normal">{colab.role || 'Sem cargo definido'}</span>
                                        </div>
                                        {totalDias > 0 && (
                                            <span className="ml-auto text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                {totalDias} {totalDias === 1 ? 'dia preenchido' : 'dias preenchidos'}
                                            </span>
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-4 pb-6 px-4">
                                    <div className="space-y-4 max-w-4xl mx-auto">
                                        <div className="grid grid-cols-[80px_1fr_2fr] gap-4 mb-2 pb-2 border-b font-medium text-sm text-muted-foreground">
                                            <div>Dia</div>
                                            <div>Horas Trabalhadas</div>
                                            <div>Observação</div>
                                        </div>
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(dia => (
                                            <div key={dia} className="grid grid-cols-[80px_1fr_2fr] items-center gap-4 py-1">
                                                <div className="font-medium text-sm pl-2">Dia {dia.toString().padStart(2, '0')}</div>
                                                <div>
                                                    <Input
                                                        placeholder="Ex: 02:30 ou 2"
                                                        value={data[colab.id]?.[dia]?.horas || ''}
                                                        onChange={e => handleInputChange(colab.id, dia, 'horas', e.target.value)}
                                                        className="h-8"
                                                    />
                                                </div>
                                                <div>
                                                    <Input
                                                        placeholder="Observação (opcional)"
                                                        value={data[colab.id]?.[dia]?.observacao || ''}
                                                        onChange={e => handleInputChange(colab.id, dia, 'observacao', e.target.value)}
                                                        className="h-8"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                    {colaboradores.length === 0 && (
                        <div className="py-8 text-center text-muted-foreground">Nenhum colaborador ativo encontrado.</div>
                    )}
                </Accordion>
            </div>

        </div>
    )
}
