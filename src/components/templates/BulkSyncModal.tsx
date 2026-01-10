import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  Loader2,
  RefreshCw,
  Building2,
  Check,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface BulkSyncModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateName: string;
}

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan_type: string;
  status: string;
  is_excluded?: boolean;
}

interface SyncResult {
  tenant_id: string;
  tenant_name: string;
  success: boolean;
  error?: string;
}

export function BulkSyncModal({ 
  open, 
  onOpenChange, 
  templateId, 
  templateName 
}: BulkSyncModalProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [showExcluded, setShowExcluded] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[] | null>(null);

  // Fetch all tenants with template exclusions
  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants-for-sync', templateId],
    queryFn: async () => {
      // Get all active tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, name, subdomain, plan_type, status')
        .eq('status', 'active')
        .order('name');

      if (tenantsError) throw tenantsError;

      // Get exclusions for this template
      const { data: exclusions, error: exclusionsError } = await supabase
        .from('tenant_template_exclusions')
        .select('tenant_id')
        .eq('template_id', templateId);

      if (exclusionsError) throw exclusionsError;

      const excludedIds = new Set(exclusions?.map(e => e.tenant_id) || []);

      return (tenantsData || []).map(t => ({
        ...t,
        is_excluded: excludedIds.has(t.id),
      })) as Tenant[];
    },
    enabled: open,
  });

  // Filter tenants
  const filteredTenants = tenants?.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subdomain.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const availableTenants = filteredTenants?.filter(t => !t.is_excluded) || [];
  const excludedTenants = filteredTenants?.filter(t => t.is_excluded) || [];

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async (tenantIds: string[]) => {
      const results: SyncResult[] = [];

      for (const tenantId of tenantIds) {
        const tenant = tenants?.find(t => t.id === tenantId);
        try {
          // Update tenant onboarding with template
          const { error } = await supabase
            .from('tenant_onboarding')
            .upsert({
              tenant_id: tenantId,
              niche_template_id: templateId,
              status: 'configuring',
              updated_at: new Date().toISOString(),
            });

          if (error) throw error;

          results.push({
            tenant_id: tenantId,
            tenant_name: tenant?.name || tenantId,
            success: true,
          });
        } catch (err) {
          results.push({
            tenant_id: tenantId,
            tenant_name: tenant?.name || tenantId,
            success: false,
            error: (err as Error).message,
          });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setSyncResults(results);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      if (failCount === 0) {
        toast.success(`Template sincronizado com ${successCount} tenant(s)`);
      } else {
        toast.warning(`${successCount} sucesso, ${failCount} falha(s)`);
      }
      
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (err) => {
      toast.error('Erro ao sincronizar: ' + (err as Error).message);
    },
  });

  // Toggle exclusion
  const toggleExclusion = async (tenantId: string, exclude: boolean) => {
    try {
      if (exclude) {
        await supabase
          .from('tenant_template_exclusions')
          .insert({
            tenant_id: tenantId,
            template_id: templateId,
            item_key: `template_${templateId}`,
            exclusion_type: 'manual',
            reason: 'Excluded via bulk sync modal',
          });
      } else {
        await supabase
          .from('tenant_template_exclusions')
          .delete()
          .eq('tenant_id', tenantId)
          .eq('template_id', templateId);
      }
      
      queryClient.invalidateQueries({ queryKey: ['tenants-for-sync', templateId] });
      toast.success(exclude ? 'Tenant excluído do template' : 'Exclusão removida');
    } catch (err) {
      toast.error('Erro ao atualizar exclusão');
    }
  };

  const handleSelectAll = () => {
    if (selectedTenants.length === availableTenants.length) {
      setSelectedTenants([]);
    } else {
      setSelectedTenants(availableTenants.map(t => t.id));
    }
  };

  const handleToggleTenant = (tenantId: string) => {
    setSelectedTenants(prev =>
      prev.includes(tenantId)
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const handleSync = () => {
    if (selectedTenants.length === 0) {
      toast.error('Selecione ao menos um tenant');
      return;
    }
    syncMutation.mutate(selectedTenants);
  };

  const handleClose = () => {
    setSearch('');
    setSelectedTenants([]);
    setSyncResults(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Sincronizar Template em Lote
          </DialogTitle>
          <DialogDescription>
            Aplicar o template "{templateName}" a múltiplos tenants de uma vez
          </DialogDescription>
        </DialogHeader>

        {syncResults ? (
          /* Results View */
          <div className="space-y-4">
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                Sincronização concluída: {syncResults.filter(r => r.success).length} sucesso,{' '}
                {syncResults.filter(r => !r.success).length} falha(s)
              </AlertDescription>
            </Alert>

            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {syncResults.map((result) => (
                  <div
                    key={result.tenant_id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {result.success ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="font-medium">{result.tenant_name}</span>
                    </div>
                    {result.error && (
                      <span className="text-xs text-red-600">{result.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          </div>
        ) : (
          /* Selection View */
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tenants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Select All */}
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedTenants.length === availableTenants.length && availableTenants.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm font-medium">
                      Selecionar todos ({availableTenants.length})
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {selectedTenants.length} selecionados
                  </Badge>
                </div>

                {/* Tenants List */}
                <ScrollArea className="flex-1 min-h-[200px] max-h-[300px]">
                  <div className="space-y-1">
                    {availableTenants.map((tenant) => (
                      <div
                        key={tenant.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer",
                          selectedTenants.includes(tenant.id) && "bg-primary/5"
                        )}
                        onClick={() => handleToggleTenant(tenant.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedTenants.includes(tenant.id)}
                            onCheckedChange={() => handleToggleTenant(tenant.id)}
                          />
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium">{tenant.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {tenant.subdomain}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {tenant.plan_type}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExclusion(tenant.id, true);
                            }}
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ))}

                    {availableTenants.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum tenant disponível para sincronização
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Excluded Tenants */}
                {excludedTenants.length > 0 && (
                  <Collapsible open={showExcluded} onOpenChange={setShowExcluded}>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full py-2">
                      {showExcluded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      {excludedTenants.length} tenant(s) excluído(s) deste template
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-1 ml-6 mt-2">
                        {excludedTenants.map((tenant) => (
                          <div
                            key={tenant.id}
                            className="flex items-center justify-between p-2 rounded bg-muted/30"
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{tenant.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => toggleExclusion(tenant.id, false)}
                            >
                              Remover exclusão
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={handleClose} className="flex-1">
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSync}
                    disabled={selectedTenants.length === 0 || syncMutation.isPending}
                    className="flex-1"
                  >
                    {syncMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sincronizar {selectedTenants.length} tenant(s)
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
