import { useState } from 'react'
import { Budget } from '@/types'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    Building2,
    Calendar,
    CreditCard,
    FileText,
    MapPin,
    Plus,
    Eye,
    Pencil,
} from 'lucide-react'

interface ClientDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    clientName: string
    budgets: Budget[]
    onAddBudget: () => void
    onEditBudget: (budget: Budget) => void
    onViewBudget: (budget: Budget) => void
}

export function ClientDetailsDialog({
    open,
    onOpenChange,
    clientName,
    budgets,
    onAddBudget,
    onEditBudget,
    onViewBudget,
}: ClientDetailsDialogProps) {
    // Derive client info from the most recent budget that has it
    // In a real app, this would come from a Clients table/service
    const clientInfo = budgets.find(
        (b) => b.cnpj || b.street || b.city
    ) || budgets[0]

    const totalValue = budgets.reduce((acc, curr) => acc + (curr.totalValue || 0), 0)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2 border-b flex flex-row items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-orange-600" />
                            {clientName}
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            {budgets.length} orçamento(s) cadastrado(s)
                        </p>
                    </div>
                    <DialogDescription className="sr-only">
                        Detalhes do cliente e histórico de orçamentos.
                    </DialogDescription>
                    <DialogClose className="opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground" />
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 pl-6 h-auto">
                            <TabsTrigger
                                value="overview"
                                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            >
                                Visão Geral
                            </TabsTrigger>
                            <TabsTrigger
                                value="budgets"
                                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            >
                                Orçamentos
                            </TabsTrigger>
                        </TabsList>

                        <div className="p-6">
                            <TabsContent value="overview" className="mt-0 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Informações Básicas */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Dados Cadastrais
                                        </h3>
                                        <div className="bg-muted/10 p-4 rounded-lg space-y-3 border">
                                            <div className="grid grid-cols-3 gap-2 text-sm">
                                                <span className="text-muted-foreground">Nome/Razão:</span>
                                                <span className="col-span-2 font-medium">
                                                    {clientInfo?.client || '-'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-sm">
                                                <span className="text-muted-foreground">CNPJ/CPF:</span>
                                                <span className="col-span-2 font-medium">
                                                    {clientInfo?.cnpj || '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Endereço */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            Endereço
                                        </h3>
                                        <div className="bg-muted/10 p-4 rounded-lg space-y-3 border">
                                            <div className="text-sm">
                                                <p className="font-medium">
                                                    {clientInfo?.street &&
                                                        `${clientInfo.street}, ${clientInfo.neighborhood || ''}`}
                                                </p>
                                                <p className="text-muted-foreground">
                                                    {clientInfo?.city &&
                                                        `${clientInfo.city} - ${clientInfo?.state || ''}`}
                                                </p>
                                                {!clientInfo?.street && !clientInfo?.city && (
                                                    <span className="text-muted-foreground italic">
                                                        Endereço não informado nos orçamentos recentes.
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Resumo Financeiro */}
                                    <div className="md:col-span-2 space-y-4">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" />
                                            Resumo Financeiro
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                                                <span className="text-xs text-orange-600 font-medium uppercase">
                                                    Total em Orçamentos
                                                </span>
                                                <p className="text-2xl font-bold text-orange-700 mt-1">
                                                    {new Intl.NumberFormat('pt-BR', {
                                                        style: 'currency',
                                                        currency: 'BRL',
                                                    }).format(totalValue)}
                                                </p>
                                            </div>
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                                <span className="text-xs text-blue-600 font-medium uppercase">
                                                    Último Orçamento
                                                </span>
                                                <p className="text-2xl font-bold text-blue-700 mt-1">
                                                    {clientInfo?.date
                                                        ? format(new Date(clientInfo.date), 'dd/MM/yyyy')
                                                        : '-'}
                                                </p>
                                            </div>
                                            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                                <span className="text-xs text-green-600 font-medium uppercase">
                                                    Qtde. Orçamentos
                                                </span>
                                                <p className="text-2xl font-bold text-green-700 mt-1">
                                                    {budgets.length}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="budgets" className="mt-0 space-y-4">
                                <div className="flex justify-between items-center bg-muted/10 p-4 rounded-lg border">
                                    <div>
                                        <h3 className="font-medium">Histórico de Orçamentos</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Gerencie todos os orçamentos deste cliente.
                                        </p>
                                    </div>
                                    <Button onClick={onAddBudget} className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Novo Orçamento
                                    </Button>
                                </div>

                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Código</TableHead>
                                                <TableHead>Data</TableHead>
                                                <TableHead>Descrição/Obra</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Valor</TableHead>
                                                <TableHead className="text-right">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {budgets.map((budget) => (
                                                <TableRow key={budget.id}>
                                                    <TableCell className="font-medium">
                                                        {budget.visualId}
                                                    </TableCell>
                                                    <TableCell>
                                                        {budget.date
                                                            ? format(new Date(budget.date), 'dd/MM/yyyy')
                                                            : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {budget.description ||
                                                            budget.location ||
                                                            'Sem descrição'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                              ${budget.status === 'approved'
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : budget.status === 'rejected'
                                                                        ? 'bg-red-100 text-red-700'
                                                                        : budget.status === 'sent'
                                                                            ? 'bg-blue-100 text-blue-700'
                                                                            : 'bg-gray-100 text-gray-700'
                                                                }`}
                                                        >
                                                            {budget.status === 'approved'
                                                                ? 'Aprovado'
                                                                : budget.status === 'rejected'
                                                                    ? 'Rejeitado'
                                                                    : budget.status === 'sent'
                                                                        ? 'Enviado'
                                                                        : 'Rascunho'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {new Intl.NumberFormat('pt-BR', {
                                                            style: 'currency',
                                                            currency: 'BRL',
                                                        }).format(budget.totalValue || 0)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => onViewBudget(budget)}
                                                                title="Visualizar"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => onEditBudget(budget)}
                                                                title="Editar"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    )
}
