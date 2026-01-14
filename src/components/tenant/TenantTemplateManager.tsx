import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  RefreshCw, 
  Link2, 
  Unlink, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  Settings2,
  History,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TenantTemplateManagerProps {
  tenantId: string;
  tenantName: string;
}

interface TemplateSubscription {
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
  local_overrides: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
}

interface Template {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

interface SyncHistoryEntry {
  id: string;
  template_version: string;
  sync_type: string;
  status: string;
  sections_synced: string[];
  sections_skipped: string[];
  error_message: string | null;
  created_at: string;
}

const SYNC_SECTIONS = [
  { key: 'prompts', label: 'Prompts' },
  { key: 'ai_config', label: 'Config IA' },
  { key: 'funnel', label: 'Funil' },
  { key: 'automations', label: 'Automações' },
  { key: 'sla', label: 'SLA' },
];

const syncStatusConfig: Record<string, { icon: React.ReactNode; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  synced: { icon: <CheckCircle2 className="w-3 h-3" />, label: 'Sincronizado', variant: 'default' },
  pending: { icon: <Clock className="w-3 h-3" />, label: 'Pendente', variant: 'secondary' },
  outdated: { icon: <AlertCircle className="w-3 h-3" />, label: 'Desatualizado', variant: 'outline' },
  error: { icon: <AlertCircle className="w-3 h-3" />, label: 'Erro', variant: 'destructive' },
};

const syncModeConfig: Record<string, { icon: React.ReactNode; label: string; description: string }> = {
  auto: { icon: <RefreshCw className="w-4 h-4" />, label: 'Automático', description: 'Sincroniza quando o template é atualizado' },
  manual: { icon: <Settings2 className="w-4 h-4" />, label: 'Manual', description: 'Sincroniza apenas quando você solicitar' },
  locked: { icon: <Lock className="w-4 h-4" />, label: 'Travado', description: 'Nunca sincroniza automaticamente' },
};

export function TenantTemplateManager({ tenantId, tenantName }: TenantTemplateManagerProps) {
  const queryClient = useQueryClient();
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  // Fetch available templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['templates-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('master_niche_templates')
        .select('id, name, slug, is_active')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Template[];
    },
  });

  // Fetch current subscription
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['tenant-template-subscription', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_template_subscriptions')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();
      
      if (error) throw error;
      return data as TemplateSubscription | null;
    },
  });

  // Fetch sync history
  const { data: syncHistory } = useQuery({
    queryKey: ['tenant-sync-history', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('template_sync_history')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data as SyncHistoryEntry[];
    },
    enabled: !!subscription,
  });

  // Link template mutation
  const linkMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { data, error } = await supabase
        .from('tenant_template_subscriptions')
        .insert({
          tenant_id: tenantId,
          template_id: templateId,
          auto_sync_enabled: true,
          sync_mode: 'auto',
          sync_status: 'pending',
          sync_sections: SYNC_SECTIONS.map(s => s.key),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Template vinculado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['tenant-template-subscription', tenantId] });
    },
    onError: (error) => {
      toast.error(`Erro ao vincular template: ${error.message}`);
    },
  });

  // Unlink template mutation
  const unlinkMutation = useMutation({
    mutationFn: async () => {
      if (!subscription) return;
      
      const { error } = await supabase
        .from('tenant_template_subscriptions')
        .delete()
        .eq('id', subscription.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Template desvinculado.');
      queryClient.invalidateQueries({ queryKey: ['tenant-template-subscription', tenantId] });
    },
    onError: (error) => {
      toast.error(`Erro ao desvincular: ${error.message}`);
    },
  });

  // Update subscription mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: { 
      sync_mode?: string; 
      sync_sections?: string[]; 
      auto_sync_enabled?: boolean;
    }) => {
      if (!subscription) return;
      
      const { data, error } = await supabase
        .from('tenant_template_subscriptions')
        .update(updates)
        .eq('id', subscription.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Configuração atualizada!');
      queryClient.invalidateQueries({ queryKey: ['tenant-template-subscription', tenantId] });
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  // Sync now mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!subscription) return;
      
      // Call the sync endpoint
      const { data, error } = await supabase.functions.invoke('master-templates-proxy', {
        body: {
          _action: 'sync-tenant',
          tenant_id: tenantId,
          template_id: subscription.template_id,
          sections: selectedSections.length > 0 ? selectedSections : subscription.sync_sections,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Sincronização iniciada!');
      queryClient.invalidateQueries({ queryKey: ['tenant-template-subscription', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['tenant-sync-history', tenantId] });
    },
    onError: (error) => {
      toast.error(`Erro ao sincronizar: ${error.message}`);
    },
  });

  const currentTemplate = templates?.find(t => t.id === subscription?.template_id);

  if (templatesLoading || subscriptionLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Template Vinculado
              </CardTitle>
              <CardDescription>
                Gerencie a conexão do tenant com um template de nicho
              </CardDescription>
            </div>
            {subscription && (
              <Badge variant={syncStatusConfig[subscription.sync_status]?.variant || 'secondary'} className="gap-1">
                {syncStatusConfig[subscription.sync_status]?.icon}
                {syncStatusConfig[subscription.sync_status]?.label}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!subscription ? (
            // No template linked
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Este tenant não está vinculado a nenhum template.
              </p>
              <div className="flex items-center gap-3">
                <Select onValueChange={(value) => linkMutation.mutate(value)}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {linkMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
            </div>
          ) : (
            // Template linked
            <div className="space-y-6">
              {/* Current Template Info */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div>
                  <p className="font-medium">{currentTemplate?.name || 'Template'}</p>
                  <p className="text-sm text-muted-foreground">
                    Slug: {currentTemplate?.slug}
                  </p>
                  {subscription.last_synced_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Última sync: {formatDistanceToNow(new Date(subscription.last_synced_at), { addSuffix: true, locale: ptBR })}
                      {subscription.last_synced_version && ` (v${subscription.last_synced_version})`}
                    </p>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => unlinkMutation.mutate()}
                  disabled={unlinkMutation.isPending}
                >
                  <Unlink className="w-4 h-4 mr-1" />
                  Desvincular
                </Button>
              </div>

              {/* Sync Mode */}
              <div className="space-y-3">
                <Label>Modo de Sincronização</Label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(syncModeConfig).map(([mode, config]) => (
                    <button
                      key={mode}
                      onClick={() => updateMutation.mutate({ sync_mode: mode as 'auto' | 'manual' | 'locked' })}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        subscription.sync_mode === mode 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {config.icon}
                        <span className="font-medium text-sm">{config.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sync Sections */}
              <div className="space-y-3">
                <Label>Seções Sincronizadas</Label>
                <div className="flex flex-wrap gap-2">
                  {SYNC_SECTIONS.map((section) => {
                    const isEnabled = subscription.sync_sections?.includes(section.key);
                    return (
                      <button
                        key={section.key}
                        onClick={() => {
                          const newSections = isEnabled
                            ? subscription.sync_sections.filter(s => s !== section.key)
                            : [...(subscription.sync_sections || []), section.key];
                          updateMutation.mutate({ sync_sections: newSections });
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          isEnabled
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {section.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sync Actions */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <Button 
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending || subscription.sync_mode === 'locked'}
                >
                  {syncMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sincronizar Agora
                </Button>
                <span className="text-sm text-muted-foreground">
                  {subscription.sync_mode === 'locked' && 'Sincronização travada'}
                </span>
              </div>

              {/* Error Display */}
              {subscription.sync_error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{subscription.sync_error}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync History Card */}
      {subscription && syncHistory && syncHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="w-4 h-4" />
              Histórico de Sincronização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {syncHistory.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <Badge 
                      variant={entry.status === 'success' ? 'default' : entry.status === 'error' ? 'destructive' : 'secondary'}
                      className="shrink-0"
                    >
                      {entry.status}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        {entry.sync_type === 'auto' ? 'Automático' : entry.sync_type === 'manual' ? 'Manual' : entry.sync_type}
                        {entry.template_version && ` • v${entry.template_version}`}
                      </p>
                      {entry.sections_synced?.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Seções: {entry.sections_synced.join(', ')}
                        </p>
                      )}
                      {entry.error_message && (
                        <p className="text-xs text-destructive mt-1">{entry.error_message}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(entry.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
