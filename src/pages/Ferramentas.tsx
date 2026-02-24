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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Pencil, Trash2, Wrench, Building2, User } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { ferramentasService } from '@/services/ferramentasService'
import { Tool } from '@/types'
import { FerramentaFormDialog } from '@/components/FerramentaFormDialog'
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
import { Badge } from '@/components/ui/badge'

export default function Ferramentas() {
    const { projects: obras, employees: colaboradores } = useAppStore()
    const [tools, setTools] = React.useState<Tool[]>([])
    const [search, setSearch] = React.useState('')
    const [loading, setLoading] = React.useState(true)
    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [editingTool, setEditingTool] = React.useState<Tool | null>(null)
    const [deleteId, setDeleteId] = React.useState<string | null>(null)

    const loadTools = React.useCallback(async () => {
        setLoading(true)
        try {
            const data = await ferramentasService.getAll()
            setTools(data)
        } catch (error) {
            console.error(error)
            toast.error('Erro ao carregar ferramentas')
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        loadTools()
    }, [loadTools])

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await ferramentasService.delete(deleteId)
            toast.success('Equipamento excluído com sucesso')
            loadTools()
        } catch (error) {
            console.error(error)
            toast.error('Erro ao excluir equipamento')
        } finally {
            setDeleteId(null)
        }
    }

    const filteredTools = tools.filter((tool) => {
        const searchLower = search.toLowerCase()
        const obra = obras.find((o) => o.id === tool.obraId)

        return (
            tool.nome.toLowerCase().includes(searchLower) ||
            tool.codigo.toLowerCase().includes(searchLower) ||
            obra?.name.toLowerCase().includes(searchLower) ||
            tool.responsavelNome?.toLowerCase().includes(searchLower) ||
            tool.responsavelCargo?.toLowerCase().includes(searchLower)
        )
    })

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ferramentas e Equipamentos</h1>
                    <p className="text-muted-foreground">
                        Gerencie o inventário de ferramentas e sua alocação em obras.
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setEditingTool(null)
                        setDialogOpen(true)
                    }}
                    className="bg-orange-600 hover:bg-orange-700"
                >
                    <Plus className="mr-2 h-4 w-4" /> Novo Equipamento
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle>Inventário</CardTitle>
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nome, código ou obra..."
                                className="pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Equipamento</TableHead>
                                <TableHead>Código</TableHead>
                                <TableHead>Obra Alocada</TableHead>
                                <TableHead>Responsável</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10">
                                        Carregando...
                                    </TableCell>
                                </TableRow>
                            ) : filteredTools.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                        Nenhum equipamento encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTools.map((tool) => {
                                    const obra = obras.find((o) => o.id === tool.obraId)

                                    return (
                                        <TableRow key={tool.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Wrench className="h-4 w-4 text-orange-600" />
                                                    {tool.nome}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{tool.codigo}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {obra ? (
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        {obra.name}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {tool.responsavelNome ? (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-medium">{tool.responsavelNome}</span>
                                                        </div>
                                                        <div className="flex flex-col text-xs text-muted-foreground ml-6">
                                                            {tool.responsavelCargo && <span>{tool.responsavelCargo}</span>}
                                                            {tool.responsavelTelefone && <span>{tool.responsavelTelefone}</span>}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setEditingTool(tool)
                                                            setDialogOpen(true)
                                                        }}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-600 hover:text-red-700"
                                                        onClick={() => setDeleteId(tool.id)}
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
                </CardContent>
            </Card>

            <FerramentaFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                tool={editingTool}
                onSuccess={loadTools}
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Equipamento</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este equipamento? Esta ação não pode ser desfeita.
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
        </div>
    )
}
