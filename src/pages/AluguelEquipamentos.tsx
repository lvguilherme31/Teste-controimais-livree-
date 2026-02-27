import React from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Calendar,
    Building2,
    Phone,
    MapPin,
    HardHat,
    CheckCircle2,
    Clock
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { AluguelEquipamento } from '@/types'
import { aluguelService } from '@/services/aluguelService'
import { AluguelFormDialog } from '@/components/AluguelFormDialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn, getAlertStatus } from '@/lib/utils'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

export default function AluguelEquipamentos() {
    const { projects: obras, rentals: alugueis, fetchRentals, deleteRental, updateRental } = useAppStore()
    const [search, setSearch] = React.useState('')
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [selectedAluguel, setSelectedAluguel] = React.useState<AluguelEquipamento | null>(null)
    const [deleteId, setDeleteId] = React.useState<string | null>(null)
    const [loading, setLoading] = React.useState(true)

    const fetchData = async () => {
        setLoading(true)
        try {
            await fetchRentals()
        } catch (error) {
            console.error(error)
            toast.error('Erro ao carregar aluguéis')
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        fetchData()
    }, [])

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await deleteRental(deleteId)
            toast.success('Aluguel removido com sucesso')
            // fetchData() // No need to call fetchData, the store action already does it
        } catch (error) {
            console.error(error)
            toast.error('Erro ao remover aluguel')
        } finally {
            setDeleteId(null)
        }
    }

    const handleTogglePago = async (item: AluguelEquipamento) => {
        try {
            const novoPago = !item.pago
            await updateRental(item.id, {
                pago: novoPago,
                dataPagamento: novoPago ? new Date() : null,
            })
            toast.success(novoPago ? 'Aluguel marcado como pago!' : 'Aluguel marcado como pendente')
        } catch (error) {
            console.error(error)
            toast.error('Erro ao atualizar status de pagamento')
        }
    }

    const filteredAlugueis = alugueis.filter(item => {
        const obra = obras.find(o => o.id === item.obraId)
        const searchLower = search.toLowerCase()
        return (
            item.nome.toLowerCase().includes(searchLower) ||
            item.empresaNome?.toLowerCase().includes(searchLower) ||
            item.empresaCnpj?.toLowerCase().includes(searchLower) ||
            obra?.name.toLowerCase().includes(searchLower)
        )
    })

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Aluguel de Equipamentos</h1>
                    <p className="text-gray-500">Gerencie os equipamentos locados e seus vencimentos.</p>
                </div>
                <Button
                    onClick={() => {
                        setSelectedAluguel(null)
                        setIsDialogOpen(true)
                    }}
                    className="bg-orange-600 hover:bg-orange-700"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Aluguel
                </Button>
            </div>

            <div className="flex items-center gap-2 bg-white p-3 rounded-lg border shadow-sm">
                <Search className="h-5 w-5 text-gray-400" />
                <Input
                    placeholder="Buscar por equipamento, empresa ou obra..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-0 focus-visible:ring-0 shadow-none"
                />
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Equipamento</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Obra</TableHead>
                            <TableHead>Empresa Locadora</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                    Carregando aluguéis...
                                </TableCell>
                            </TableRow>
                        ) : filteredAlugueis.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                    Nenhum aluguel encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAlugueis.map((item) => {
                                const obra = obras.find(o => o.id === item.obraId)
                                return (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <HardHat className="h-4 w-4 text-orange-600" />
                                                <span className="font-medium">{item.nome}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold text-gray-900">
                                                {new Intl.NumberFormat('pt-BR', {
                                                    style: 'currency',
                                                    currency: 'BRL'
                                                }).format(item.valor)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {format(item.dataVencimento, 'dd/MM/yyyy')}
                                                </div>
                                                {(() => {
                                                    const status = getAlertStatus(item.dataVencimento)
                                                    return status.severity !== 'ok' && !item.pago && (
                                                        <span className={cn("text-[10px] font-bold uppercase tracking-wider", status.color)}>
                                                            {status.label}
                                                        </span>
                                                    )
                                                })()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <button
                                                onClick={() => handleTogglePago(item)}
                                                title={item.pago ? 'Clique para marcar como pendente' : 'Clique para marcar como pago'}
                                                className={cn(
                                                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border',
                                                    item.pago
                                                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                                        : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                                                )}
                                            >
                                                {item.pago ? (
                                                    <><CheckCircle2 className="h-3.5 w-3.5" /> Pago</>
                                                ) : (
                                                    <><Clock className="h-3.5 w-3.5" /> Pendente</>
                                                )}
                                            </button>
                                            {item.pago && item.dataPagamento && (
                                                <div className="text-[10px] text-muted-foreground mt-0.5 pl-1">
                                                    {format(item.dataPagamento, "dd/MM/yyyy", { locale: ptBR })}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {obra ? (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    {obra.name}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">{item.empresaNome || '-'}</span>
                                                    {item.empresaCnpj && (
                                                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                                                            {item.empresaCnpj}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col text-[11px] text-muted-foreground">
                                                    {(item.empresaRua || item.empresaEndereco) && (
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {item.empresaRua ? (
                                                                `${item.empresaRua}, ${item.empresaNumero || 's/n'} - ${item.empresaCidade}/${item.empresaEstado}`
                                                            ) : (
                                                                item.empresaEndereco
                                                            )}
                                                        </div>
                                                    )}
                                                    {item.empresaTelefone && (
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {item.empresaTelefone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedAluguel(item)
                                                        setIsDialogOpen(true)
                                                    }}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-600 hover:text-red-700"
                                                    onClick={() => setDeleteId(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <AluguelFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                aluguel={selectedAluguel}
                onSuccess={fetchData}
            />

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Aluguel</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja remover este aluguel?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    )
}
