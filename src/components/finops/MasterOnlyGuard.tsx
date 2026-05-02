import { Navigate } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  children: React.ReactNode;
}

export function MasterOnlyGuard({ children }: Props) {
  const { user, loading: authLoading } = useAuth();
  const { isLoading, isSuperAdmin, masterUser } = usePermissions();

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Super admin OR legacy master user without roles configured = allow
  const allowed = isSuperAdmin() || (!!masterUser && (masterUser as { is_active?: boolean }).is_active !== false);

  if (!allowed) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-6">
        <ShieldAlert className="w-10 h-10 text-destructive" />
        <h2 className="text-lg font-semibold">Área restrita</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          A telemetria econômica privada (FinOps) é visível apenas para usuários Master com privilégios elevados.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
