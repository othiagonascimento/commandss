import { useState } from 'react';
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
  Megaphone, 
  Plus, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Info,
  Sparkles,
  XCircle,
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
  warning: { label: 'Aviso', icon: AlertCircle, color: 'bg-warning/10 text-warning' },
  success: { label: 'Sucesso', icon: CheckCircle2, color: 'bg-success/10 text-success' },
  feature: { label: 'Nova Feature', icon: Sparkles, color: 'bg-secondary text-secondary-foreground' },
};

export default function Broadcasts() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newBroadcast, setNewBroadcast] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    endsInHours: 24,
  });

  const { data: broadcasts, isLoading } = useQuery({
    queryKey: ['broadcasts'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('broadcasts', {
        method: 'GET',
      });
      if (error) throw error;
      return data.broadcasts as Broadcast[];
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
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Broadcast enviado!');
      setCreateDialogOpen(false);
      setNewBroadcast({ title: '', message: '', type: 'info', endsInHours: 24 });
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao enviar broadcast'),
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
      toast.success('Broadcast encerrado!');
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao encerrar broadcast'),
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
        title="Central de Avisos"
        description="Envie mensagens para todos os usuários"
        icon={Megaphone}
        actions={
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Broadcast
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Broadcast</DialogTitle>
                <DialogDescription>
                  Envie uma mensagem para todos os usuários
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    placeholder="Novidade: Chegou a Transcrição 2.0!"
                    value={newBroadcast.title}
                    onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mensagem</Label>
                  <Textarea
                    placeholder="Descreva a novidade ou aviso..."
                    value={newBroadcast.message}
                    onChange={(e) => setNewBroadcast({ ...newBroadcast, message: e.target.value })}
                    rows={3}
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
                    <Label>Duração (horas)</Label>
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
                        <SelectItem value="1">1 hora</SelectItem>
                        <SelectItem value="6">6 horas</SelectItem>
                        <SelectItem value="24">24 horas</SelectItem>
                        <SelectItem value="72">3 dias</SelectItem>
                        <SelectItem value="168">1 semana</SelectItem>
                      </SelectContent>
                    </Select>
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
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Enviar
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
                        <div className="flex items-center gap-2">
                          <Badge className={config.color}>
                            <Icon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
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
                      <p className="text-xs text-muted-foreground">
                        Expira: {broadcast.ends_at 
                          ? format(new Date(broadcast.ends_at), "dd MMM 'às' HH:mm", { locale: ptBR })
                          : 'Nunca'}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
              {activeBroadcasts.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Megaphone className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhum broadcast ativo</p>
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
                {pastBroadcasts.slice(0, 5).map((broadcast) => (
                  <div
                    key={broadcast.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm"
                  >
                    <span>{broadcast.title}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(broadcast.ends_at!), "dd MMM", { locale: ptBR })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
