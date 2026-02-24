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
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/stores/useAppStore'
import { Tool } from '@/types'
import { ferramentasService } from '@/services/ferramentasService'
import { toast } from 'sonner'

interface FerramentaFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    tool?: Tool | null
    onSuccess: () => void
}

export function FerramentaFormDialog({
    open,
    onOpenChange,
    tool,
    onSuccess,
}: FerramentaFormDialogProps) {
    const { projects: obras, employees: colaboradores } = useAppStore()
    const [loading, setLoading] = React.useState(false)
    const [data, setData] = React.useState<Partial<Tool>>({
        nome: '',
        codigo: '',
        obraId: null,
        responsavelNome: '',
        responsavelCargo: '',
        responsavelTelefone: '',
    })

    React.useEffect(() => {
        if (tool) {
            setData({
                nome: tool.nome,
                codigo: tool.codigo,
                obraId: tool.obraId,
                responsavelNome: tool.responsavelNome,
                responsavelCargo: tool.responsavelCargo,
                responsavelTelefone: tool.responsavelTelefone,
            })
        } else {
            setData({
                nome: '',
                codigo: '',
                obraId: null,
                responsavelNome: '',
                responsavelCargo: '',
                responsavelTelefone: '',
            })
        }
    }, [tool, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!data.nome || !data.codigo) {
            toast.error('Preencha os campos obrigatórios')
            return
        }

        setLoading(true)
        try {
            if (tool) {
                await ferramentasService.update(tool.id, data)
                toast.success('Equipamento atualizado com sucesso')
            } else {
                await ferramentasService.create(data as any)
                toast.success('Equipamento cadastrado com sucesso')
            }
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error('Erro detalhado ao salvar:', error)
            if (error.code === '23505') {
                toast.error('Código de equipamento já existe')
            } else {
                toast.error(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {tool ? 'Editar Equipamento' : 'Novo Equipamento'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="nome">Nome do Equipamento *</Label>
                            <Input
                                id="nome"
                                value={data.nome}
                                onChange={(e) => setData({ ...data, nome: e.target.value })}
                                placeholder="Ex: Betoneira"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="codigo">Código do Equipamento *</Label>
                            <Input
                                id="codigo"
                                value={data.codigo}
                                onChange={(e) => setData({ ...data, codigo: e.target.value })}
                                placeholder="Ex: BT-001"
                                required
                            />
                        </div>
                        <div className="space-y-2">
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
                        <div className="space-y-4 pt-4 border-t">
                            <h4 className="text-sm font-medium">Dados do Responsável</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="responsavelNome">Nome do Responsável</Label>
                                    <Input
                                        id="responsavelNome"
                                        value={data.responsavelNome || ''}
                                        onChange={(e) => setData({ ...data, responsavelNome: e.target.value })}
                                        placeholder="Nome completo..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="responsavelCargo">Cargo</Label>
                                    <Input
                                        id="responsavelCargo"
                                        value={data.responsavelCargo || ''}
                                        onChange={(e) => setData({ ...data, responsavelCargo: e.target.value })}
                                        placeholder="Ex: Engenheiro, Mestre..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="responsavelTelefone">Telefone</Label>
                                    <Input
                                        id="responsavelTelefone"
                                        value={data.responsavelTelefone || ''}
                                        onChange={(e) => setData({ ...data, responsavelTelefone: e.target.value })}
                                        placeholder="(00) 00000-0000"
                                    />
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
                            {loading ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
