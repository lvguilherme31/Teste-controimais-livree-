import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function EsqueceuSenha() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                console.error('Supabase Reset Error:', error);
                if (error.message === 'email rate limit exceeded') {
                    setError('Muitas solicitações em pouco tempo. Por favor, aguarde 60 segundos antes de tentar novamente.');
                } else {
                    setError(error.message || 'Não foi possível enviar o email de recuperação. Verifique o endereço informado.');
                }
                return;
            }

            setSuccess(true);
        } catch {
            setError('Ocorreu um erro. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    const inputBase =
        'w-full px-4 py-3.5 bg-slate-900/60 border rounded-lg outline-none text-white placeholder-slate-500 transition-all text-sm';

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative font-sans">
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                    backgroundImage:
                        'url("https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop")',
                }}
            >
                <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-[2px]" />
            </div>

            <div className="relative z-10 w-full max-w-[440px] p-4">
                <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl p-8 md:p-10">
                    <div className="flex flex-col items-center mb-8">
                        <div className="bg-white rounded-2xl flex flex-col items-center justify-center mb-4 shadow-lg shadow-black/20 p-2 overflow-hidden">
                            <img src="/logo.png" alt="TOPAZIO Empreendimentos" className="h-[72px] object-contain" />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Recuperar Senha</h1>
                        <p className="text-slate-400 text-sm mt-2">
                            {success ? 'Email enviado!' : 'Informe seu email para recuperar o acesso'}
                        </p>
                    </div>

                    {success ? (
                        <div className="space-y-4">
                            <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-lg px-4 py-3 text-sm text-emerald-300">
                                Enviamos um link de recuperação para <strong>{email}</strong>. Verifique sua caixa de entrada e spam.
                            </div>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={18} />
                                Voltar ao login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-300 ml-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    className={`${inputBase} border-slate-700/80 focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                                    placeholder="Digite seu email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            {error && (
                                <div className="text-sm text-red-300 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" /> Enviando...
                                        </>
                                    ) : (
                                        'Enviar link de recuperação'
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="w-full bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 font-medium py-3.5 rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={18} />
                                    Voltar ao login
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <div className="relative z-10 mt-8 text-center px-4">
                <p className="text-slate-500 text-xs font-medium">
                    © 2025 TOPAZIO Empreendimentos. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}
