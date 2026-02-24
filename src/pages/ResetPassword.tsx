import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPassword() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast({
                title: 'Senhas não conferem',
                description: 'As senhas digitadas não são iguais.',
                variant: 'destructive',
            });
            return;
        }

        if (password.length < 8) {
            toast({
                title: 'Senha muito curta',
                description: 'A senha deve ter pelo menos 8 caracteres.',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) {
                toast({
                    title: 'Erro ao atualizar senha',
                    description: error.message || 'Não foi possível atualizar sua senha.',
                    variant: 'destructive',
                });
                return;
            }

            toast({
                title: 'Senha atualizada!',
                description: 'Sua senha foi redefinida com sucesso. Você já pode fazer login.',
            });

            navigate('/login');
        } catch {
            toast({
                title: 'Ocorreu um erro',
                description: 'Não foi possível completar a operação. Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden font-sans">
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                    backgroundImage:
                        'url("https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop")',
                }}
            >
                <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-[2px]" />
            </div>

            <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
                <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="space-y-4 text-center pb-8 border-b bg-slate-50/50">
                        <div className="mx-auto w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center shadow-inner">
                            <Lock className="h-8 w-8 text-orange-600" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-bold text-slate-900">Nova Senha</CardTitle>
                            <CardDescription className="text-slate-500">
                                Digite sua nova senha de acesso abaixo.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="password">Nova Senha</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Mínimo 8 caracteres"
                                        className="pl-10 h-12 focus-visible:ring-orange-500"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Repita a nova senha"
                                        className="pl-10 h-12 focus-visible:ring-orange-500"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                    <ShieldCheck className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-12 text-base font-bold bg-orange-600 hover:bg-orange-700 transition-all hover:scale-[1.02] shadow-lg shadow-orange-900/20"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>Redefinir Senha <ArrowRight className="ml-2 h-4 w-4" /></>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="text-center mt-6 text-slate-400 text-xs flex items-center justify-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Ambiente de Redefinição Seguro
                </div>
            </div>
        </div>
    );
}
