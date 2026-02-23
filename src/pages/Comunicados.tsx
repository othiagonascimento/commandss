import { useState } from 'react';
import { safeArray } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Bell, 
  Plus, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Info,
  Sparkles,
  XCircle,
  Users,
  Shield,
  Send,
} from 'lucide-react';

interface Broadcast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'feature';
  target_tenant_ids: string[] | null;
  target_niche: string | null;
  is_banner: boolean;
  is_push: boolean;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
}

const TYPE_CONFIG = {
  info: { label: 'Informação', icon: Info, color: 'bg-primary/10 text-primary' },
  warning: { label: 'Aviso Importante', icon: AlertCircle, color: 'bg-warning/10 text-warning' },
  success: { label: 'Novidade', icon: CheckCircle2, color: 'bg-success/10 text-success' },
  feature: { label: 'Nova Feature', icon: Sparkles, color: 'bg-secondary text-secondary-foreground' },
};

const AUDIENCE_OPTIONS = [
  { value: 'admins', label: 'Apenas Admins de Tenant', icon: Shield, description: 'Recomendado para atualizações técnicas' },
  { value: 'all', label: 'Todos os Usuários', icon: Users, description: 'Use com moderação' },
];

export default function Comunicados() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newBroadcast, setNewBroadcast] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    endsInHours: 72,
    audience: 'admins',
    showAsBanner: true,
    sendPush: false,
  });

  const { data: broadcasts, isLoading } = useQuery({
    queryKey: ['broadcasts'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('broadcasts', {
        method: 'GET',
      });
      if (error) throw error;
      return safeArray<Broadcast>(data?.broadcasts ?? data);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const endsAt = new Date(Date.now() + newBroadcast.endsInHours * 60 * 60 * 1000);
      const { data, error } = await supabase.functions.invoke('broadcasts', {
        method: 'POST',
        body: {
          action: 'create',
          title: newBroadcast.title,
          message: newBroadcast.message,
          type: newBroadcast.type,
          endsAt: endsAt.toISOString(),
          isBanner: newBroadcast.showAsBanner,
          isPush: newBroadcast.sendPush,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Comunicado enviado!');
      setCreateDialogOpen(false);
      setNewBroadcast({ 
        title: '', 
        message: '', 
        type: 'info', 
        endsInHours: 72,
        audience: 'admins',
        showAsBanner: true,
        sendPush: false,
      });
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao enviar comunicado'),
  });

  const endMutation = useMutation({
    mutationFn: async (broadcastId: string) => {
      const { data, error } = await supabase.functions.invoke('broadcasts', {
        method: 'POST',
        body: { action: 'end', broadcastId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Comunicado encerrado!');
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao encerrar comunicado'),
  });

  const now = new Date();
  const activeBroadcasts = broadcasts?.filter(b => 
    new Date(b.starts_at) <= now && (!b.ends_at || new Date(b.ends_at) > now)
  ) || [];
  const pastBroadcasts = broadcasts?.filter(b => 
    b.ends_at && new Date(b.ends_at) <= now
  ) || [];

  return (
    <DashboardLayout>
      <PageHeader
        title="Comunicados"
        description="Envie avisos e atualizações para administradores de tenants"
        icon={Bell}
        actions={
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Comunicado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Comunicado</DialogTitle>
                <DialogDescription>
                  Envie uma mensagem para os administradores dos tenants
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Audience Selection */}
                <div className="space-y-2">
                  <Label>Destinatários</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {AUDIENCE_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        onClick={() => setNewBroadcast({ ...newBroadcast, audience: option.value })}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          newBroadcast.audience === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <option.icon className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">{option.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    placeholder="Ex: Manutenção programada amanhã"
                    value={newBroadcast.title}
                    onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mensagem</Label>
                  <Textarea
                    placeholder="Descreva o comunicado em detalhes..."
                    value={newBroadcast.message}
                    onChange={(e) => setNewBroadcast({ ...newBroadcast, message: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={newBroadcast.type}
                      onValueChange={(value) => 
                        setNewBroadcast({ ...newBroadcast, type: value as typeof newBroadcast.type })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <config.icon className="w-4 h-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Expiração</Label>
                    <Select
                      value={String(newBroadcast.endsInHours)}
                      onValueChange={(value) => 
                        setNewBroadcast({ ...newBroadcast, endsInHours: Number(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">24 horas</SelectItem>
                        <SelectItem value="72">3 dias</SelectItem>
                        <SelectItem value="168">1 semana</SelectItem>
                        <SelectItem value="336">2 semanas</SelectItem>
                        <SelectItem value="720">1 mês</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="banner">Exibir como banner</Label>
                      <p className="text-xs text-muted-foreground">
                        Mostra no topo do dashboard
                      </p>
                    </div>
                    <Switch
                      id="banner"
                      checked={newBroadcast.showAsBanner}
                      onCheckedChange={(checked) => 
                        setNewBroadcast({ ...newBroadcast, showAsBanner: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push">Enviar notificação push</Label>
                      <p className="text-xs text-muted-foreground">
                        Notifica mesmo offline (se disponível)
                      </p>
                    </div>
                    <Switch
                      id="push"
                      checked={newBroadcast.sendPush}
                      onCheckedChange={(checked) => 
                        setNewBroadcast({ ...newBroadcast, sendPush: checked })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!newBroadcast.title || !newBroadcast.message || createMutation.isPending}
                  className="gap-2"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Enviar Comunicado
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Broadcasts */}
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Ativos ({activeBroadcasts.length})
            </h2>
            <div className="grid gap-4">
              {activeBroadcasts.map((broadcast) => {
                const config = TYPE_CONFIG[broadcast.type];
                const Icon = config.icon;
                return (
                  <Card key={broadcast.id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={config.color}>
                            <Icon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                          {broadcast.is_banner && (
                            <Badge variant="outline" className="text-xs">
                              Banner
                            </Badge>
                          )}
                          <CardTitle className="text-base">{broadcast.title}</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => endMutation.mutate(broadcast.id)}
                          disabled={endMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        {broadcast.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Enviado: {format(new Date(broadcast.created_at), "dd MMM 'às' HH:mm", { locale: ptBR })}
                        </span>
                        <span>
                          Expira: {broadcast.ends_at 
                            ? format(new Date(broadcast.ends_at), "dd MMM 'às' HH:mm", { locale: ptBR })
                            : 'Nunca'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {activeBroadcasts.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Bell className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhum comunicado ativo</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Crie um novo comunicado para informar seus clientes
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Past Broadcasts */}
          {pastBroadcasts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-muted-foreground">
                Histórico ({pastBroadcasts.length})
              </h2>
              <div className="grid gap-2">
                {pastBroadcasts.slice(0, 10).map((broadcast) => {
                  const config = TYPE_CONFIG[broadcast.type];
                  return (
                    <div
                      key={broadcast.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {config.label}
                        </Badge>
                        <span>{broadcast.title}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {format(new Date(broadcast.ends_at!), "dd MMM yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
