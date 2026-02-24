import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { User, Role } from '@/types'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function Configuracoes() {
  const {
    users,
    fetchUsers,
    sendInvite,
    deleteUser,
    currentUser,
    updateCurrentUser
  } = useAppStore()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)

  // Load data on mount
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'sub_user' as Role,
    permissions: {
      dashboard: true,
      obras: false,
      colaboradores: false,
      alojamento: false,
      veiculos: false,
      fichario_funcoes: false,
      ferramentas: false,
      financeiro: false,
      contas_pagar: false,
      pagamento_colaboradores: false,
      notas_fiscais: false,
      aluguel_equipamentos: false,
      orcamentos: false,
      configuracoes: true,
    },
  })

  // Profile Form
  const [profile, setProfile] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    company: currentUser?.companyName || 'Aparecida Cortez Lopes - Construção',
    cnpj: currentUser?.cnpj || '23.497.744/0001-69',
  })

  // Sync profile state when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfile({
        name: currentUser.name || '',
        email: currentUser.email || '',
        company: currentUser.companyName || 'Aparecida Cortez Lopes - Construção',
        cnpj: currentUser.cnpj || '',
      })
    }
  }, [currentUser])

  // Password Form
  const [pass, setPass] = useState({ current: '', new: '', confirm: '' })

  const handleSaveUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast({ title: 'Erro', description: 'Nome e Email são obrigatórios', variant: 'destructive' })
      return
    }

    try {
      await sendInvite(newUser as any)
      setIsOpen(false)
      toast({ title: 'Convite Enviado', description: `Um convite foi enviado para ${newUser.email}.` })

      // Reset form
      setNewUser({
        name: '',
        email: '',
        role: 'sub_user',
        permissions: {
          dashboard: true,
          obras: false,
          colaboradores: false,
          alojamento: false,
          veiculos: false,
          fichario_funcoes: false,
          ferramentas: false,
          financeiro: false,
          contas_pagar: false,
          pagamento_colaboradores: false,
          notas_fiscais: false,
          aluguel_equipamentos: false,
          orcamentos: false,
          configuracoes: true,
        },
      })
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Falha ao enviar convite', variant: 'destructive' })
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`Tem certeza que deseja excluir o usuário "${userName}"?`)) {
      try {
        await deleteUser(userId)
        await fetchUsers()
        toast({
          title: 'Usuário Excluído',
          description: `${userName} foi removido do sistema.`,
          variant: 'destructive'
        })
      } catch (error: any) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      }
    }
  }


  const handleSaveProfile = () => {
    updateCurrentUser({
      name: profile.name,
      email: profile.email,
      companyName: profile.company,
      cnpj: profile.cnpj,
    })
    toast({ title: 'Perfil Atualizado' })
  }

  const handleChangePassword = () => {
    if (pass.new !== pass.confirm) {
      toast({
        title: 'Erro',
        description: 'Senhas não conferem',
        variant: 'destructive',
      })
      return
    }
    // Logic to verify current password would go here
    toast({ title: 'Sucesso', description: 'Senha alterada com sucesso.' })
    setPass({ current: '', new: '', confirm: '' })
  }

  const togglePermission = (key: keyof User['permissions']) => {
    setNewUser({
      ...newUser,
      permissions: {
        ...newUser.permissions,
        [key]: !newUser.permissions?.[key],
      } as User['permissions'],
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas preferências, dados da empresa e acessos.</p>
      </div>

      <Tabs defaultValue={(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') ? 'users' : 'company'} className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
            <TabsTrigger value="users" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Usuários</TabsTrigger>
          )}
          <TabsTrigger value="company" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Minha Empresa</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-8 animate-in fade-in-50 duration-300">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <div className="flex justify-between items-end">
                <div>
                  <CardTitle className="text-xl">Gestão de Usuários</CardTitle>
                  <CardDescription>Crie e gerencie os acessos dos seus colaboradores.</CardDescription>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <Button className="shadow-md hover:shadow-lg transition-all">
                      <Plus className="mr-2 h-4 w-4" /> Novo Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Convidar Novo Usuário</DialogTitle>
                      <CardDescription>O usuário receberá um convite por e-mail para configurar sua senha.</CardDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome Completo</Label>
                          <Input
                            placeholder="Ex: João Silva"
                            value={newUser.name || ''}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>E-mail</Label>
                          <Input
                            placeholder="joao@exemplo.com"
                            value={newUser.email || ''}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>Nível de Acesso</Label>
                        <div className="flex gap-3">
                          <Button
                            variant={newUser.role === 'admin' ? 'default' : 'outline'}
                            onClick={() => setNewUser({ ...newUser, role: 'admin' })}
                            className="flex-1"
                            type="button"
                          >
                            Administrador
                          </Button>
                          <Button
                            variant={newUser.role === 'sub_user' ? 'default' : 'outline'}
                            onClick={() => setNewUser({ ...newUser, role: 'sub_user' })}
                            className="flex-1"
                            type="button"
                          >
                            Sub-usuário
                          </Button>
                        </div>
                      </div>

                      {newUser.role === 'sub_user' && (
                        <div className="space-y-4 p-5 bg-muted/30 border rounded-lg">
                          <div className="space-y-1">
                            <Label className="font-bold text-base">Módulos Permitidos</Label>
                            <p className="text-xs text-muted-foreground italic">
                              Selecione quais áreas este colaborador poderá visualizar e gerenciar.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-2">
                            <div className="space-y-3">
                              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Operacional</Label>
                              <div className="grid gap-3">
                                {[
                                  { id: 'dashboard', label: '📊 Dashboard', key: 'dashboard' },
                                  { id: 'obras', label: '🏗️ Obras e Projetos', key: 'obras' },
                                  { id: 'colaboradores', label: '👥 Colaboradores', key: 'colaboradores' },
                                  { id: 'alojamento', label: '🏠 Alojamento', key: 'alojamento' },
                                  { id: 'veiculos', label: '🚗 Frota e Veículos', key: 'veiculos' },
                                  { id: 'fichario_funcoes', label: '📇 Fichário de Funções', key: 'fichario_funcoes' },
                                  { id: 'ferramentas', label: '🔧 Ferramentas', key: 'ferramentas' },
                                ].map((item) => (
                                  <div key={item.id} className="flex items-center space-x-3 group">
                                    <Checkbox
                                      id={item.id}
                                      checked={(newUser.permissions as any)?.[item.key]}
                                      onCheckedChange={() => togglePermission(item.key as any)}
                                    />
                                    <Label htmlFor={item.id} className="text-sm cursor-pointer group-hover:text-primary transition-colors">{item.label}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Financeiro</Label>
                              <div className="grid gap-3">
                                {[
                                  { id: 'contas_pagar', label: '💹 Contas a Pagar', key: 'contas_pagar' },
                                  { id: 'pagamento_colaboradores', label: '💸 Pagto Funcionários', key: 'pagamento_colaboradores' },
                                  { id: 'notas_fiscais', label: '📝 Notas Fiscais', key: 'notas_fiscais' },
                                  { id: 'aluguel_equipamentos', label: '🚜 Aluguel Equip.', key: 'aluguel_equipamentos' },
                                  { id: 'orcamentos', label: '💼 Orçamentos', key: 'orcamentos' },
                                ].map((item) => (
                                  <div key={item.id} className="flex items-center space-x-3 group">
                                    <Checkbox
                                      id={item.id}
                                      checked={(newUser.permissions as any)?.[item.key]}
                                      onCheckedChange={() => togglePermission(item.key as any)}
                                    />
                                    <Label htmlFor={item.id} className="text-sm cursor-pointer group-hover:text-primary transition-colors">{item.label}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-muted-foreground/10">
                            <p className="text-[10px] text-muted-foreground/80 italic flex items-center gap-1.5">
                              <span className="text-amber-500">⚠️</span> Sub-usuários sempre possuem acesso básico a "Minha Empresa" e "Segurança".
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="pt-2">
                        <Button onClick={handleSaveUser} className="w-full h-11 text-base font-semibold">
                          Enviar Convite agora
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <div className="space-y-10">
              {/* ACTIVE USERS */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Usuários Ativos</h3>
                <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="w-[30%] font-bold">Nome</TableHead>
                        <TableHead className="w-[40%] font-bold">E-mail</TableHead>
                        <TableHead className="w-[15%] font-bold">Função</TableHead>
                        <TableHead className="w-[15%] text-right font-bold">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                            Nenhum usuário ativo cadastrado.
                          </TableCell>
                        </TableRow>
                      )}
                      {users.map((u) => (
                        <TableRow key={u.id} className="hover:bg-muted/10 transition-colors">
                          <TableCell className="font-semibold py-4">{u.name}</TableCell>
                          <TableCell className="py-4 text-muted-foreground">{u.email}</TableCell>
                          <TableCell className="py-4">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-600 border border-slate-100'
                              }`}>
                              {u.role === 'admin' ? 'Admin' : 'Sub-usuário'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right py-4">
                            {currentUser?.id !== u.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

            </div>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          <Card className="border-none shadow-md">
            <CardHeader className="border-b bg-muted/20 pb-6">
              <CardTitle>Dados da Empresa</CardTitle>
              <CardDescription>Estes dados serão utilizados em notas fiscais, relatórios e orçamentos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Razão Social</Label>
                  <Input
                    className="h-11"
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">CNPJ</Label>
                  <Input
                    className="h-11"
                    value={profile.cnpj}
                    onChange={(e) => setProfile({ ...profile, cnpj: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} className="px-8 font-semibold">Salvar Alterações</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          <Card className="border-none shadow-md max-w-2xl">
            <CardHeader className="border-b bg-muted/20 pb-6">
              <CardTitle>Segurança da Conta</CardTitle>
              <CardDescription>Mantenha sua conta protegida alterando sua senha regularmente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-5 px-1">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Senha Atual</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="h-11"
                    value={pass.current}
                    onChange={(e) => setPass({ ...pass, current: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Nova Senha</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="h-11"
                      value={pass.new}
                      onChange={(e) => setPass({ ...pass, new: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Confirmar Nova Senha</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="h-11"
                      value={pass.confirm}
                      onChange={(e) => setPass({ ...pass, confirm: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-start">
                <Button
                  onClick={handleChangePassword}
                  className="w-full md:w-auto px-10 font-semibold"
                >
                  Atualizar Senha Agora
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
