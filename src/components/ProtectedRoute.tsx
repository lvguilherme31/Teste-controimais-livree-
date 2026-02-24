import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { User } from '@/types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermission?: keyof User['permissions'];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission }) => {
    const { user, loading: authLoading } = useAuth();
    const { currentUser, isInitializing } = useAppStore();
    const location = useLocation();

    if (authLoading || isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        // Redirect to login but save the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If we have an auth session but no user record was loaded in state
    // AND it's not a temporary loading state, it means the user was likely deleted
    if (user && !currentUser) {
        console.warn('Orphaned auth session detected. Redirecting to login.');
        return <Navigate to="/login" replace />;
    }

    if (requiredPermission && currentUser && currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
        const hasPermission = (currentUser.permissions as any)?.[requiredPermission];
        if (!hasPermission) {
            return (
                <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
                    <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-full mb-6">
                        <ShieldAlert className="h-16 w-16 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                        Acesso Restrito
                    </h1>
                    <p className="text-slate-500 text-center max-w-md mb-8">
                        Você não tem permissão para acessar esta área do sistema. Entre em contato com um administrador se precisar de acesso.
                    </p>
                </div>
            );
        }
    }

    return <>{children}</>;
};
