import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { usersService, UserInvite } from '@/services/usersService'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react'

export default function FirstAccess() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const [step, setStep] = useState<'email' | 'password'>('email')
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [invite, setInvite] = useState<UserInvite | null>(null)

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const handleCheckEmail = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return

        setLoading(true)
        try {
            const inviteData = await usersService.checkInvite(email)

            if (inviteData) {
                setInvite(inviteData)
                setStep('password')
                toast({ title: 'Email verificado!', description: `Olá, ${inviteData.name}. Defina sua senha.` })
            } else {
                toast({
                    title: 'Convite não encontrado',
                    description: 'Verifique se o email está correto ou contate o administrador.',
                    variant: 'destructive'
                })
            }
        } catch (error) {
            console.error(error)
            toast({
                title: 'Erro',
                description: 'Falha ao verificar convite. Tente novamente.',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'destructive' })
            return
        }
        if (password.length < 6) {
            toast({ title: 'Erro', description: 'A senha deve ter pelo menos 6 caracteres.', variant: 'destructive' })
            return
        }
        if (!invite) return

        setLoading(true)
        try {
            // 1. SignUp with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        name: invite.name,
                    }
                }
            })

            if (authError) {
                // If user already exists in Auth but maybe not in public.usuarios correctly?
                // Or if simple duplicate.
                throw authError
            }

            const user = authData.user
            if (!user) throw new Error('Falha ao criar usuário de autenticação.')

            // 2. Complete First Access (Move to public.usuarios and delete invite)
            await usersService.completeFirstAccess(user.id, email, invite)

            toast({
                title: 'Cadastro Concluído!',
                description: 'Seu acesso foi configurado com sucesso. Entrando...'
            })

            // 3. Auto Login is often handled by Supabase client automatically storing session.
            // We can just navigate to home.
            // A slight delay to ensure session propagation if needed, or just go.
            setTimeout(() => navigate('/'), 1000)

        } catch (error: any) {
            console.error(error)
            toast({
                title: 'Erro no Cadastro',
                description: error.message || 'Ocorreu um erro ao finalizar seu cadastro.',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <div className="flex items-center mb-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="p-0 h-auto hover:bg-transparent text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                        </Button>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center text-primary">Primeiro Acesso</CardTitle>
                    <CardDescription className="text-center">
                        {step === 'email'
                            ? 'Digite seu email para verificar o convite.'
                            : `Defina uma senha para ${invite?.name}`
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 'email' ? (
                        <form onSubmit={handleCheckEmail} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Verificar Convite
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="flex justify-center mb-4">
                                <div className="bg-green-100 p-3 rounded-full">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                            </div>
                            <div className="text-center mb-4 text-sm text-muted-foreground">
                                Tudo certo! Encontramos seu convite como <strong>{invite?.role === 'admin' ? 'Administrador' : 'Sub-usuário'}</strong>.
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Nova Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Finalizar Cadastro
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
