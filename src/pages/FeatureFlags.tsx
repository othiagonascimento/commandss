import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Flag, 
  Plus, 
  Loader2, 
  Globe, 
  Users, 
  Percent,
  Trash2,
} from 'lucide-react';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  is_enabled_globally: boolean;
  enabled_tenant_ids: string[];
  rollout_percentage: number;
  created_at: string;
}

export default function FeatureFlags() {
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFlag, setNewFlag] = useState({ name: '', description: '' });

  const { data: flags, isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('feature-flags', {
        method: 'GET',
      });
      if (error) throw error;
      return data.flags as FeatureFlag[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('feature-flags', {
        body: { action: 'create', ...newFlag },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Feature flag criada!');
      setCreateDialogOpen(false);
      setNewFlag({ name: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
    onError: () => toast.error('Erro ao criar feature flag'),
  });

  const updateMutation = useMutation({
    mutationFn: async (params: { flagId: string; updates: Partial<FeatureFlag> }) => {
      const { data, error } = await supabase.functions.invoke('feature-flags', {
        body: { 
          action: 'update', 
          flagId: params.flagId,
          isEnabledGlobally: params.updates.is_enabled_globally,
          rolloutPercentage: params.updates.rollout_percentage,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (flagId: string) => {
      const { data, error } = await supabase.functions.invoke('feature-flags', {
        body: { action: 'delete', flagId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Feature flag removida!');
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
    onError: () => toast.error('Erro ao remover feature flag'),
  });

  return (
    <div className="min-h-screen w-full bg-background">
      <Header onMenuClick={() => setMobileMenuOpen(true)} />
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <main
        className={cn(
          'transition-[margin] duration-300 p-4 lg:p-6',
          'lg:ml-[280px]',
          sidebarCollapsed && 'lg:ml-[72px]'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Flag className="w-6 h-6" />
              Feature Flags
            </h1>
            <p className="text-muted-foreground">
              Controle de funcionalidades por tenant
            </p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Flag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Feature Flag</DialogTitle>
                <DialogDescription>
                  Adicione uma nova flag para controlar funcionalidades
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome (slug)</Label>
                  <Input
                    placeholder="ex: ai_transcription_v2"
                    value={newFlag.name}
                    onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    placeholder="Nova versão da transcrição de áudio"
                    value={newFlag.description}
                    onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!newFlag.name || createMutation.isPending}
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Flags Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4">
            {flags?.map((flag) => (
              <Card key={flag.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-mono">{flag.name}</CardTitle>
                      <CardDescription>{flag.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={flag.is_enabled_globally ? 'default' : 'secondary'}>
                        {flag.is_enabled_globally ? 'Global' : 'Parcial'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(flag.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Global Toggle */}
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        <span className="text-sm">Habilitado Globalmente</span>
                      </div>
                      <Switch
                        checked={flag.is_enabled_globally}
                        onCheckedChange={(checked) =>
                          updateMutation.mutate({
                            flagId: flag.id,
                            updates: { is_enabled_globally: checked },
                          })
                        }
                      />
                    </div>

                    {/* Tenant Count */}
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-sm">Tenants Específicos</span>
                      </div>
                      <Badge variant="outline">
                        {flag.enabled_tenant_ids?.length || 0}
                      </Badge>
                    </div>

                    {/* Rollout Percentage */}
                    <div className="p-3 bg-muted rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4 text-primary" />
                          <span className="text-sm">Rollout</span>
                        </div>
                        <span className="text-sm font-medium">
                          {flag.rollout_percentage}%
                        </span>
                      </div>
                      <Slider
                        value={[flag.rollout_percentage]}
                        max={100}
                        step={5}
                        onValueChange={([value]) =>
                          updateMutation.mutate({
                            flagId: flag.id,
                            updates: { rollout_percentage: value },
                          })
                        }
                        disabled={flag.is_enabled_globally}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {flags?.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Flag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma feature flag criada ainda.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
