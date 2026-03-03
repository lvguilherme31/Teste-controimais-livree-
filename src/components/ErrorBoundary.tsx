import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Atualiza o state para que a próxima renderização mostre a UI de fallback.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);

        // Se for um erro de "Failed to fetch dynamically imported module" (ChunkLoadError),
        // é problema de cache antigo tentando carregar arquivo deletado após um deploy.
        const isChunkError = error?.message?.toLowerCase().includes('fetch') ||
            error?.name === 'ChunkLoadError' ||
            error?.message?.toLowerCase().includes('dynamically imported module');

        if (isChunkError) {
            // Auto-reload ignorando o cache para resolver silenciosamente para o usuário
            window.location.reload();
        }
    }

    private handleReload = () => {
        // Força um recarregamento completo ignorando o cache
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            const isChunkError = this.state.error?.message?.toLowerCase().includes('fetch') ||
                this.state.error?.name === 'ChunkLoadError' ||
                this.state.error?.message?.toLowerCase().includes('dynamically imported module');

            // Se for erro de chunk, a página será recarregada automaticamente (veja componentDidCatch). 
            // Mostramos apenas uma pequena mensagem de "Atualizando..." enquanto isso ocorre.
            if (isChunkError) {
                return (
                    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans text-slate-800">
                        <div className="text-center space-y-4">
                            <RefreshCw className="h-8 w-8 text-orange-500 animate-spin mx-auto" />
                            <p className="text-sm font-medium text-slate-500 animate-pulse">
                                Atualizando sistema para a versão mais recente...
                            </p>
                        </div>
                    </div>
                );
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans text-slate-800">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="h-20 w-20 bg-orange-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="h-10 w-10 text-orange-600" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                Oops, ocorreu um erro inesperado.
                            </h1>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Desculpe, algo não ocorreu como o esperado na interface. Tente recarregar a página para voltar ao normal.
                            </p>
                        </div>

                        <Button
                            onClick={this.handleReload}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 text-sm font-semibold rounded-xl shadow-md shadow-orange-900/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Recarregar Sistema
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
