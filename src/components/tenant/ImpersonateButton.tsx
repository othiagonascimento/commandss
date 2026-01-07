import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { UserCog, ExternalLink, Loader2, Clock, Shield } from 'lucide-react';

interface ImpersonateButtonProps {
  tenantId: string;
  tenantName: string;
}

export function ImpersonateButton({ tenantId, tenantName }: ImpersonateButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sessionData, setSessionData] = useState<{
    token: string;
    accessUrl: string;
    expiresAt: string;
  } | null>(null);

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('impersonate', {
        body: { action: 'create', tenantId },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setSessionData({
        token: data.token,
        accessUrl: data.accessUrl,
        expiresAt: data.expiresAt,
      });
      toast.success('Sessão de acesso criada!');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar sessão');
    },
  });

  const handleAccess = () => {
    if (sessionData?.accessUrl) {
      window.open(sessionData.accessUrl, '_blank');
      setDialogOpen(false);
      setSessionData(null);
    }
  };

  const expiresIn = sessionData?.expiresAt
    ? Math.round((new Date(sessionData.expiresAt).getTime() - Date.now()) / 60000)
    : 0;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setDialogOpen(true);
          createSessionMutation.mutate();
        }}
        disabled={createSessionMutation.isPending}
        className="gap-2"
      >
        {createSessionMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <UserCog className="w-4 h-4" />
        )}
        Acessar como Cliente
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Acessar Painel do Cliente
            </DialogTitle>
            <DialogDescription>
              Você está prestes a acessar o painel de <strong>{tenantName}</strong>
            </DialogDescription>
          </DialogHeader>

          {createSessionMutation.isPending ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sessionData ? (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-warning" />
                  <span>Sessão expira em <strong>{expiresIn} minutos</strong></span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Este acesso é temporário e será registrado nos logs de auditoria.
                </p>
              </div>

              <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
                <p className="text-xs font-mono break-all text-muted-foreground">
                  {sessionData.accessUrl}
                </p>
              </div>
            </div>
          ) : createSessionMutation.isError ? (
            <div className="text-center py-4 text-destructive">
              {createSessionMutation.error instanceof Error
                ? createSessionMutation.error.message
                : 'Erro ao criar sessão'}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            {sessionData && (
              <Button onClick={handleAccess} className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Abrir Painel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
