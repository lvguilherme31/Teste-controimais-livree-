import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usersService } from '@/services/usersService'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ArrowRight, ShieldCheck, Mail, Lock } from 'lucide-react'
import { UserInvite } from '@/types'

export default function PrimeiroAcesso() {
    const [step, setStep] = useState(1) // 1: Email Verification, 2: Password Setup
    const [email, setEmail] = useState('')
    const [invite, setInvite] = useState<UserInvite | null>(null)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()
    const navigate = useNavigate()

    const handleVerifyEmail = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return

        setLoading(true)
        try {
            // 1. Check if user is already activated
            const isActivated = await usersService.isUserActivated(email)
            if (isActivated) {
                toast({
                    title: 'Usuário já Ativo',
                    description: 'Sua conta já foi ativada. Por favor, faça login.',
                    variant: 'default',
                })
                navigate('/login')
                return
            }

            // 2. Check for invite
            const inviteData = await usersService.checkInvite(email)
            if (!inviteData) {
                toast({
                    title: 'Convite não encontrado',
                    description: 'Não encontramos um convite pendente para este e-mail. Entre em contato com seu administrador.',
                    variant: 'destructive',
                })
                return
            }

            setInvite(inviteData)
            setStep(2)
            toast({
                title: 'Convite Verificado',
                description: `Olá ${inviteData.name}! Agora, crie sua senha de acesso.`,
            })
        } catch (error: any) {
            toast({
                title: 'Erro na verificação',
                description: error.message || 'Ocorreu um erro inesperado.',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSetupPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            toast({ title: 'Senhas não conferem', variant: 'destructive' })
            return
        }

        if (password.length < 8) {
            toast({ title: 'Senha muito curta', description: 'A senha deve ter pelo menos 8 caracteres.', variant: 'destructive' })
            return
        }

        setLoading(true)
        try {
            // 1. SignUp in Supabase Auth
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            })

            if (signUpError) throw signUpError
            if (!authData.user) throw new Error('Falha ao criar usuário na autenticação.')

            // 2. Complete First Access (Move to public.usuarios and delete invite)
            if (invite) {
                await usersService.completeFirstAccess(authData.user.id, email, invite)
            }

            toast({
                title: 'Conta Ativada!',
                description: 'Seu acesso foi configurado com sucesso. Você já pode fazer login.',
            })
            navigate('/login')
        } catch (error: any) {
            toast({
                title: 'Erro na ativação',
                description: error.message || 'Falha ao ativar sua conta.',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">CRM Engenharia</h1>
                    <p className="text-slate-500 font-medium italic">Portal de Ativação</p>
                </div>

                <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-sm">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                            {step === 1 ? <Mail className="h-6 w-6 text-primary" /> : <Lock className="h-6 w-6 text-primary" />}
                            {step === 1 ? 'Primeiro Acesso' : 'Definir Senha'}
                        </CardTitle>
                        <CardDescription>
                            {step === 1
                                ? 'Informe seu e-mail para verificar seu convite.'
                                : `Bem-vindo, ${invite?.name}. Escolha uma senha segura.`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {step === 1 ? (
                            <form onSubmit={handleVerifyEmail} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Seu E-mail Profissional</Label>
                                    <div className="relative">
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="exemplo@empresa.com"
                                            className="pl-10 h-12"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                            required
                                        />
                                        <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full h-12 text-base font-semibold transition-all hover:scale-[1.02]" disabled={loading}>
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                        <>Verificar Convite <ArrowRight className="ml-2 h-4 w-4" /></>
                                    )}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleSetupPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Nova Senha</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="No mínimo 8 caracteres"
                                            className="pl-10 h-12"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="Repita a senha"
                                            className="pl-10 h-12"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                        <ShieldCheck className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02]" disabled={loading}>
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Ativar minha Conta'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full text-xs text-slate-500"
                                    onClick={() => setStep(1)}
                                    disabled={loading}
                                >
                                    Voltar para o e-mail
                                </Button>
                            </form>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 border-t bg-slate-50/50 pt-6">
                        <div className="text-center text-sm text-slate-500">
                            Já possui uma conta ativada? <Link to="/login" className="text-primary font-bold hover:underline">Fazer Login</Link>
                        </div>
                    </CardFooter>
                </Card>

                <div className="text-center flex items-center justify-center gap-2 text-slate-400 text-xs">
                    <ShieldCheck className="h-3 w-3" />
                    Ambiente Seguro CRM Engenharia
                </div>
            </div>
        </div>
    )
}
