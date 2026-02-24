import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { useAppStore } from '@/stores/useAppStore'
import { AluguelEquipamento } from '@/types'
import { aluguelService } from '@/services/aluguelService'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn, getAlertStatus } from '@/lib/utils'

interface AluguelFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    aluguel?: AluguelEquipamento | null
    onSuccess: () => void
}

const ESTADOS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export function AluguelFormDialog({
    open,
    onOpenChange,
    aluguel,
    onSuccess,
}: AluguelFormDialogProps) {
    const { projects: obras, addRental, updateRental } = useAppStore()
    const [loading, setLoading] = React.useState(false)
    const [data, setData] = React.useState<Partial<AluguelEquipamento>>({
        nome: '',
        obraId: null,
        dataVencimento: new Date(),
        empresaNome: '',
        empresaRua: '',
        empresaNumero: '',
        empresaCidade: '',
        empresaEstado: '',
        empresaTelefone: '',
        empresaCnpj: '',
    })

    React.useEffect(() => {
        if (aluguel) {
            setData({
                nome: aluguel.nome,
                valor: aluguel.valor,
                obraId: aluguel.obraId,
                dataVencimento: aluguel.dataVencimento,
                empresaNome: aluguel.empresaNome,
                empresaRua: aluguel.empresaRua,
                empresaNumero: aluguel.empresaNumero,
                empresaCidade: aluguel.empresaCidade,
                empresaEstado: aluguel.empresaEstado,
                empresaTelefone: aluguel.empresaTelefone,
                empresaCnpj: aluguel.empresaCnpj,
            })
        } else {
            setData({
                nome: '',
                obraId: null,
                dataVencimento: new Date(),
                empresaNome: '',
                empresaRua: '',
                empresaNumero: '',
                empresaCidade: '',
                empresaEstado: '',
                empresaTelefone: '',
                empresaCnpj: '',
            })
        }
    }, [aluguel, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!data.nome || !data.valor || !data.dataVencimento) {
            toast.error('Preencha os campos obrigatórios')
            return
        }

        setLoading(true)
        try {
            // Concatenate address for legacy support if needed
            const fullAddress = [data.empresaRua, data.empresaNumero, data.empresaCidade, data.empresaEstado]
                .filter(Boolean)
                .join(', ')

            const payload = { ...data, empresaEndereco: fullAddress }

            if (aluguel) {
                await updateRental(aluguel.id, payload)
                toast.success('Aluguel atualizado com sucesso')
            } else {
                await addRental(payload as any)
                toast.success('Aluguel cadastrado e lançado no financeiro')
            }
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error(error)
            toast.error('Erro ao salvar aluguel')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {aluguel ? 'Editar Aluguel' : 'Novo Aluguel'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="nome">Nome do Equipamento *</Label>
                            <Input
                                id="nome"
                                value={data.nome}
                                onChange={(e) => setData({ ...data, nome: e.target.value })}
                                placeholder="Ex: Andaime, Gerador..."
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="valor">Valor Mensal *</Label>
                                <MoneyInput
                                    id="valor"
                                    value={data.valor || 0}
                                    onChange={(val) => setData({ ...data, valor: val })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dataVencimento">Vencimento *</Label>
                                <DatePicker
                                    date={data.dataVencimento}
                                    setDate={(d) => setData({ ...data, dataVencimento: d })}
                                />
                                {data.dataVencimento && (() => {
                                    const status = getAlertStatus(data.dataVencimento)
                                    return status.severity !== 'ok' && (
                                        <div className={cn("text-[10px] font-bold uppercase tracking-wider", status.color)}>
                                            {status.label}
                                        </div>
                                    )
                                })()}
                            </div>
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="obra">Obra Alocada</Label>
                            <Select
                                value={data.obraId || 'none'}
                                onValueChange={(v) => setData({ ...data, obraId: v === 'none' ? null : v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a obra..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Não alocado</SelectItem>
                                    {obras.map((obra) => (
                                        <SelectItem key={obra.id} value={obra.id}>
                                            {obra.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3 pt-3 border-t sm:col-span-2">
                            <h4 className="text-sm font-medium">Empresa Locadora</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="empresaNome">Nome da Empresa</Label>
                                    <Input
                                        id="empresaNome"
                                        value={data.empresaNome || ''}
                                        onChange={(e) => setData({ ...data, empresaNome: e.target.value })}
                                        placeholder="Razão Social ou Fantasia"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="empresaTelefone">Telefone</Label>
                                    <Input
                                        id="empresaTelefone"
                                        value={data.empresaTelefone || ''}
                                        onChange={(e) => setData({ ...data, empresaTelefone: e.target.value })}
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="empresaCnpj">CNPJ</Label>
                                    <Input
                                        id="empresaCnpj"
                                        value={data.empresaCnpj || ''}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 14)
                                            let masked = val
                                            if (val.length > 12) masked = val.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5')
                                            else if (val.length > 8) masked = val.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4}).*/, '$1.$2.$3/$4')
                                            else if (val.length > 5) masked = val.replace(/^(\d{2})(\d{3})(\d{1,3}).*/, '$1.$2.$3')
                                            else if (val.length > 2) masked = val.replace(/^(\d{2})(\d{1,3}).*/, '$1.$2')
                                            setData({ ...data, empresaCnpj: masked })
                                        }}
                                        placeholder="00.000.000/0000-00"
                                    />
                                </div>

                                <div className="space-y-2 sm:col-span-2 grid grid-cols-4 gap-4">
                                    <div className="col-span-3 space-y-2">
                                        <Label htmlFor="empresaRua">Rua</Label>
                                        <Input
                                            id="empresaRua"
                                            value={data.empresaRua || ''}
                                            onChange={(e) => setData({ ...data, empresaRua: e.target.value })}
                                            placeholder="Rua..."
                                        />
                                    </div>
                                    <div className="col-span-1 space-y-2">
                                        <Label htmlFor="empresaNumero">Nº</Label>
                                        <Input
                                            id="empresaNumero"
                                            value={data.empresaNumero || ''}
                                            onChange={(e) => setData({ ...data, empresaNumero: e.target.value })}
                                            placeholder="00"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="empresaCidade">Cidade</Label>
                                    <Input
                                        id="empresaCidade"
                                        value={data.empresaCidade || ''}
                                        onChange={(e) => setData({ ...data, empresaCidade: e.target.value })}
                                        placeholder="Cidade"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="empresaEstado">Estado</Label>
                                    <Select
                                        value={data.empresaEstado || ''}
                                        onValueChange={(v) => setData({ ...data, empresaEstado: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="UF" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ESTADOS.map((uf) => (
                                                <SelectItem key={uf} value={uf}>
                                                    {uf}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                            {loading ? 'Salvando...' : 'Salvar Aluguel'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
