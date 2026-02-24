import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AcessoFuncionario() {
    const navigate = useNavigate();

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
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-black/20 p-3">
                            <svg
                                viewBox="0 0 48 48"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-full h-full"
                            >
                                <path d="M4 44L4 24L14 19V44H4Z" fill="#f97316" />
                                <path d="M19 44V16.5L29 11.5V44H19Z" fill="#f97316" />
                                <path d="M34 44V9L44 4V44H34Z" fill="#f97316" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Acesso Funcionário</h1>
                        <p className="text-slate-400 text-sm mt-2">Em desenvolvimento</p>
                    </div>

                    <div className="text-center space-y-4">
                        <p className="text-slate-300">
                            Esta funcionalidade estará disponível em breve.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-orange-900/20"
                        >
                            Voltar ao login
                        </button>
                    </div>
                </div>
            </div>

            <div className="relative z-10 mt-8 text-center px-4">
                <p className="text-slate-500 text-xs font-medium">
                    © 2025 Constroimais. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}
