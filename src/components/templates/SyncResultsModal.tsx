import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, AlertCircle, SkipForward } from 'lucide-react';
import type { SyncResponse } from '@/types/templates';

interface SyncResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: SyncResponse | null;
}

export function SyncResultsModal({ open, onOpenChange, results }: SyncResultsModalProps) {
  if (!results) return null;

  const { version, results: syncResults } = results;
  const { total, synced, skipped, errors, details } = syncResults;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Resultado da Sincronização</DialogTitle>
          <DialogDescription>
            Versão {version} sincronizada com {total} tenant(s)
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="text-center p-4 bg-green-500/10 rounded-lg">
            <CheckCircle2 className="h-6 w-6 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold text-green-600">{synced}</p>
            <p className="text-xs text-muted-foreground">Sincronizados</p>
          </div>
          <div className="text-center p-4 bg-amber-500/10 rounded-lg">
            <SkipForward className="h-6 w-6 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-bold text-amber-600">{skipped}</p>
            <p className="text-xs text-muted-foreground">Pulados</p>
          </div>
          <div className="text-center p-4 bg-red-500/10 rounded-lg">
            <XCircle className="h-6 w-6 mx-auto text-red-500 mb-2" />
            <p className="text-2xl font-bold text-red-600">{errors}</p>
            <p className="text-xs text-muted-foreground">Erros</p>
          </div>
        </div>

        {/* Details */}
        <ScrollArea className="h-[300px] border rounded-lg">
          <div className="p-4 space-y-3">
            {details.map((detail, index) => (
              <div
                key={detail.tenant_id || index}
                className={`
                  p-3 rounded-lg border
                  ${detail.status === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' : ''}
                  ${detail.status === 'skipped' ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900' : ''}
                  ${detail.status === 'error' ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900' : ''}
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {detail.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                    {detail.status === 'skipped' && <SkipForward className="h-4 w-4 text-amber-500 shrink-0" />}
                    {detail.status === 'error' && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                    <span className="font-medium text-sm">
                      {detail.tenant_name || detail.tenant_id}
                    </span>
                  </div>
                  <Badge variant={
                    detail.status === 'success' ? 'default' :
                    detail.status === 'skipped' ? 'secondary' : 'destructive'
                  }>
                    {detail.status === 'success' ? 'Sucesso' :
                     detail.status === 'skipped' ? 'Pulado' : 'Erro'}
                  </Badge>
                </div>

                {detail.applied && detail.applied.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Aplicado:</p>
                    <div className="flex flex-wrap gap-1">
                      {detail.applied.map((item) => (
                        <span key={item} className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {detail.skipped && detail.skipped.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Pulado (override):</p>
                    <div className="flex flex-wrap gap-1">
                      {detail.skipped.map((item) => (
                        <span key={item} className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 px-2 py-0.5 rounded">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {detail.error && (
                  <div className="mt-2">
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {detail.error}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {details.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Nenhum tenant subscrito para sincronizar</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
