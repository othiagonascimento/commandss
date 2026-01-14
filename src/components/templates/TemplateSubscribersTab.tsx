import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Lock,
  Search,
  Users,
  Loader2,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TemplateSubscribersTabProps {
  templateId: string;
}

interface Subscriber {
  id: string;
  tenant_id: string;
  template_id: string;
  auto_sync_enabled: boolean;
  sync_mode: string;
  sync_status: string;
  sync_error: string | null;
  last_synced_at: string | null;
  last_synced_version: string | null;
  sync_sections: string[];
  created_at: string;
  tenants: {
    id: string;
    name: string;
    subdomain: string;
    status: string;
  };
}

const syncStatusConfig: Record<string, { icon: React.ReactNode; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  synced: { icon: <CheckCircle2 className="w-3 h-3" />, label: 'Sincronizado', variant: 'default' },
  pending: { icon: <Clock className="w-3 h-3" />, label: 'Pendente', variant: 'secondary' },
  outdated: { icon: <AlertCircle className="w-3 h-3" />, label: 'Desatualizado', variant: 'outline' },
  error: { icon: <AlertCircle className="w-3 h-3" />, label: 'Erro', variant: 'destructive' },
};

const syncModeLabels: Record<string, string> = {
  auto: 'Automático',
  manual: 'Manual',
  locked: 'Travado',
};

export function TemplateSubscribersTab({ templateId }: TemplateSubscribersTabProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [showBulkSyncDialog, setShowBulkSyncDialog] = useState(false);

  // Fetch subscribers
  const { data: subscribers, isLoading } = useQuery({
    queryKey: ['template-subscribers', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_template_subscriptions')
        .select(`
          *,
          tenants!inner (
            id,
            name,
            subdomain,
            status
          )
        `)
        .eq('template_id', templateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Subscriber[];
    },
    enabled: !!templateId,
  });

  // Bulk sync mutation
  const bulkSyncMutation = useMutation({
    mutationFn: async (tenantIds: string[]) => {
      const { data, error } = await supabase.functions.invoke('master-templates-proxy', {
        body: {
          _action: 'bulk-sync',
          template_id: templateId,
          tenant_ids: tenantIds,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Sincronização iniciada para ${selected.length} tenants`);
      setSelected([]);
      setShowBulkSyncDialog(false);
      queryClient.invalidateQueries({ queryKey: ['template-subscribers', templateId] });
    },
    onError: (error) => {
      toast.error(`Erro na sincronização: ${error.message}`);
    },
  });

  const filteredSubscribers = subscribers?.filter(sub => 
    sub.tenants.name.toLowerCase().includes(search.toLowerCase()) ||
    sub.tenants.subdomain.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const toggleAll = () => {
    if (selected.length === filteredSubscribers.length) {
      setSelected([]);
    } else {
      setSelected(filteredSubscribers.map(s => s.tenant_id));
    }
  };

  const toggleOne = (tenantId: string) => {
    setSelected(prev => 
      prev.includes(tenantId) 
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const stats = {
    total: subscribers?.length || 0,
    synced: subscribers?.filter(s => s.sync_status === 'synced').length || 0,
    pending: subscribers?.filter(s => s.sync_status === 'pending').length || 0,
    outdated: subscribers?.filter(s => s.sync_status === 'outdated').length || 0,
    error: subscribers?.filter(s => s.sync_status === 'error').length || 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total Assinantes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-2xl font-bold">{stats.synced}</span>
            </div>
            <p className="text-xs text-muted-foreground">Sincronizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-2xl font-bold">{stats.pending}</span>
            </div>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className="text-2xl font-bold">{stats.outdated}</span>
            </div>
            <p className="text-xs text-muted-foreground">Desatualizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-2xl font-bold">{stats.error}</span>
            </div>
            <p className="text-xs text-muted-foreground">Com Erro</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou subdomínio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => setShowBulkSyncDialog(true)}
          disabled={selected.length === 0}
        >
          <Send className="w-4 h-4 mr-2" />
          Sincronizar Selecionados ({selected.length})
        </Button>
      </div>

      {/* Subscribers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tenants Assinantes</CardTitle>
          <CardDescription>
            Tenants que recebem atualizações deste template
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSubscribers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? 'Nenhum resultado encontrado' : 'Nenhum tenant assinante'}
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selected.length === filteredSubscribers.length && filteredSubscribers.length > 0}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Modo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Sync</TableHead>
                    <TableHead>Seções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscribers.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.includes(sub.tenant_id)}
                          onCheckedChange={() => toggleOne(sub.tenant_id)}
                          disabled={sub.sync_mode === 'locked'}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sub.tenants.name}</p>
                          <p className="text-xs text-muted-foreground">{sub.tenants.subdomain}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {sub.sync_mode === 'locked' && <Lock className="w-3 h-3" />}
                          {syncModeLabels[sub.sync_mode] || sub.sync_mode}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={syncStatusConfig[sub.sync_status]?.variant || 'secondary'}
                          className="gap-1"
                        >
                          {syncStatusConfig[sub.sync_status]?.icon}
                          {syncStatusConfig[sub.sync_status]?.label || sub.sync_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sub.last_synced_at ? (
                          <div className="text-sm">
                            <p>{formatDistanceToNow(new Date(sub.last_synced_at), { addSuffix: true, locale: ptBR })}</p>
                            {sub.last_synced_version && (
                              <p className="text-xs text-muted-foreground">v{sub.last_synced_version}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {sub.sync_sections?.slice(0, 3).map((section) => (
                            <Badge key={section} variant="secondary" className="text-xs">
                              {section}
                            </Badge>
                          ))}
                          {sub.sync_sections?.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{sub.sync_sections.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Bulk Sync Dialog */}
      <Dialog open={showBulkSyncDialog} onOpenChange={setShowBulkSyncDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sincronizar Tenants</DialogTitle>
            <DialogDescription>
              Deseja sincronizar {selected.length} tenant(s) selecionado(s) com a versão atual do template?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Esta ação irá atualizar as configurações dos tenants selecionados com base no template atual.
              Tenants com modo "Travado" serão ignorados.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkSyncDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => bulkSyncMutation.mutate(selected)}
              disabled={bulkSyncMutation.isPending}
            >
              {bulkSyncMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Confirmar Sincronização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
