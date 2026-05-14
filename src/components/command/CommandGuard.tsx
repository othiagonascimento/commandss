import { Navigate } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { COMMAND_MASTER_USER_ID } from '@/lib/command/master';

export function CommandGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--canvas))]">
        <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--brand-magenta))]" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (user.id !== COMMAND_MASTER_USER_ID) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[hsl(var(--canvas))] text-center px-6">
        <ShieldAlert className="w-12 h-12 text-[hsl(var(--coral))]" />
        <h1 className="text-2xl font-display tracking-tight">Command AI</h1>
        <p className="text-sm text-[hsl(var(--ink-secondary))] max-w-md">
          Esta área é exclusiva do operador master. Nenhum outro usuário tem acesso, por design.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
