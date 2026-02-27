import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Plus,
    Search,
    Loader2,
    Contact,
    Edit,
    Trash2,
    XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ServiceProvider } from '@/types'
import { BR_STATES } from '@/lib/utils'


export default function Prestadores() {

    const {
        serviceProviders,
        fetchServiceProviders,
        addServiceProvider,
        updateServiceProvider,
        deleteServiceProvider
    } = useAppStore()

    const { toast } = useToast()
    const [searchTerm, setSearchTerm] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Dialog States
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null)
    const [formData, setFormData] = useState({
        nome: '',
        telefone_1: '',
        telefone_2: '',
        rua: '',
        numero: '',
        cidade: '',
        estado: '',
        funcao: '',
    })

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            await fetchServiceProviders()
            setIsLoading(false)
        }
        loadData()
    }, [fetchServiceProviders])

    const filteredProviders = serviceProviders.filter((p) => {
        const search = searchTerm.toLowerCase()
        return (
            (p.nome?.toLowerCase() || '').includes(search) ||
            (p.funcao?.toLowerCase() || '').includes(search) ||
            (p.cidade?.toLowerCase() || '').includes(search) ||
            (p.telefone_1?.toLowerCase() || '').includes(search) ||
            (p.telefone_2?.toLowerCase() || '').includes(search) ||
            (p.rua?.toLowerCase() || '').includes(search) ||
            (p.estado?.toLowerCase() || '').includes(search)
        )
    })

    const handleCreate = () => {
        setEditingProvider(null)
        setFormData({
            nome: '',
            telefone_1: '',
            telefone_2: '',
            rua: '',
            numero: '',
            cidade: '',
            estado: '',
            funcao: '',
        })
        setIsFormOpen(true)
    }

    const handleEdit = (provider: ServiceProvider) => {
        setEditingProvider(provider)
        setFormData({
            nome: provider.nome,
            telefone_1: provider.telefone_1,
            telefone_2: provider.telefone_2 || '',
            rua: provider.rua || '',
            numero: provider.numero || '',
            cidade: provider.cidade || '',
            estado: provider.estado || '',
            funcao: provider.funcao,
        })
        setIsFormOpen(true)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.nome || !formData.telefone_1 || !formData.funcao) {
            toast({
                title: 'Campos obrigatórios',
                description: 'Por favor, preencha nome, telefone 1 e função.',
                variant: 'destructive',
            })
            return
        }

        try {
            if (editingProvider) {
                await updateServiceProvider(editingProvider.id, formData)
                toast({ title: 'Prestador Atualizado', description: 'Dados salvos com sucesso.' })
            } else {
                await addServiceProvider(formData)
                toast({ title: 'Prestador Cadastrado', description: 'Novo prestador adicionado ao fichário.' })
            }
            setIsFormOpen(false)
        } catch (error: any) {
            console.error('Erro ao salvar prestador:', error)
            toast({
                title: 'Erro ao salvar',
                description: error.message || 'Não foi possível salvar os dados. Verifique sua conexão ou permissões.',
                variant: 'destructive',
            })
        }
    }

    const confirmDelete = async () => {
        if (!deleteId) return
        setIsDeleting(true)
        try {
            await deleteServiceProvider(deleteId)
            toast({ title: 'Cadastro Excluído', description: 'O prestador foi removido com sucesso.' })
            setIsDeleteOpen(false)
            setDeleteId(null)
        } catch (error) {
            toast({
                title: 'Erro ao excluir',
                description: 'Não foi possível remover o cadastro.',
                variant: 'destructive',
            })
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Fichário de Funções</h1>
                    <p className="text-muted-foreground">
                        Gestão de prestadores de serviço e profissionais externos
                    </p>
                </div>
                <Button
                    onClick={handleCreate}
                    className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
                >
                    <Plus className="mr-2 h-4 w-4" /> Novo Prestador
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total de Prestadores
                        </CardTitle>
                        <div className="bg-blue-50 p-2 rounded-full">
                            <Contact className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{serviceProviders.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 bg-muted/20 p-4 rounded-lg border items-start md:items-center">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome, função, telefone ou endereço..."
                        className="pl-9 bg-background"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {searchTerm && (
                    <Button
                        variant="ghost"
                        onClick={() => setSearchTerm('')}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <XCircle className="h-4 w-4 mr-2" />
                        Limpar Filtros
                    </Button>
                )}
            </div>

            <div className="border rounded-md bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="w-[25%] text-xs font-bold uppercase tracking-wider text-muted-foreground pl-6">
                                Prestador
                            </TableHead>
                            <TableHead className="w-[20%] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Função
                            </TableHead>
                            <TableHead className="w-[15%] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Telefones
                            </TableHead>
                            <TableHead className="w-[30%] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Endereço
                            </TableHead>
                            <TableHead className="w-[10%] text-xs font-bold uppercase tracking-wider text-muted-foreground text-right pr-6">
                                Ações
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProviders.length === 0 && !isLoading && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Contact className="h-10 w-10 text-muted-foreground/30" />
                                        <p>Nenhum prestador encontrado.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                        {isLoading && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        )}
                        {filteredProviders.map((provider) => (
                            <TableRow key={provider.id} className="hover:bg-muted/30 transition-colors group">
                                <TableCell className="pl-6 py-4">
                                    <span className="font-semibold text-foreground text-base">
                                        {provider.nome}
                                    </span>
                                </TableCell>
                                <TableCell className="py-4 font-medium text-foreground/80 lowercase italic first-letter:uppercase">
                                    {provider.funcao}
                                </TableCell>
                                <TableCell className="py-4 text-muted-foreground">
                                    <div>{provider.telefone_1}</div>
                                    {provider.telefone_2 && <div className="text-xs">{provider.telefone_2}</div>}
                                </TableCell>
                                <TableCell className="py-4 text-muted-foreground text-sm">
                                    {(provider.rua || provider.cidade || provider.estado) ? (
                                        <div>
                                            {provider.rua && (
                                                <>
                                                    {provider.rua}{provider.numero ? `, ${provider.numero}` : ''}
                                                    <br />
                                                </>
                                            )}
                                            <span className="text-xs uppercase opacity-70">
                                                {provider.cidade}{provider.estado ? ` - ${provider.estado}` : ''}
                                            </span>
                                        </div>
                                    ) : '-'}
                                </TableCell>
                                <TableCell className="text-right pr-6 py-4">
                                    <div className="flex justify-end items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(provider)}
                                            className="text-muted-foreground hover:text-orange-600 hover:bg-orange-50"
                                            title="Editar"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setDeleteId(provider.id)
                                                setIsDeleteOpen(true)
                                            }}
                                            className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                            title="Excluir"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Form Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingProvider ? 'Editar Prestador' : 'Novo Prestador'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="nome">Nome Completo *</Label>
                            <Input
                                id="nome"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="telefone_1">Telefone 1 *</Label>
                                <Input
                                    id="telefone_1"
                                    value={formData.telefone_1}
                                    onChange={(e) => setFormData({ ...formData, telefone_1: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="telefone_2">Telefone 2</Label>
                                <Input
                                    id="telefone_2"
                                    value={formData.telefone_2}
                                    onChange={(e) => setFormData({ ...formData, telefone_2: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="funcao">Função / Especialidade *</Label>
                            <Input
                                id="funcao"
                                placeholder="Ex: Eletricista, Encanador..."
                                value={formData.funcao}
                                onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
                                required
                            />
                        </div>

                        {/* New Split Address Fields */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-3 space-y-2">
                                <Label htmlFor="rua">Rua</Label>
                                <Input
                                    id="rua"
                                    placeholder="Rua, Avenida..."
                                    value={formData.rua}
                                    onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="numero">Nº</Label>
                                <Input
                                    id="numero"
                                    value={formData.numero}
                                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cidade">Cidade</Label>
                                <Input
                                    id="cidade"
                                    value={formData.cidade}
                                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="estado">Estado (UF)</Label>
                                <Select
                                    value={formData.estado}
                                    onValueChange={(value) => setFormData({ ...formData, estado: value })}
                                >
                                    <SelectTrigger id="estado">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BR_STATES.map((estado) => (
                                            <SelectItem key={estado} value={estado}>
                                                {estado}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                                {editingProvider ? 'Salvar Alterações' : 'Cadastrar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir cadastro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O registro do prestador será removido permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Excluindo...' : 'Excluir'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

