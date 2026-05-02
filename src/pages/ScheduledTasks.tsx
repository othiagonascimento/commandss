import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Clock,
  Plus,
  Calendar,
  Play,
  Pause,
  Trash2,
  MoreVertical,
  Loader2,
  RefreshCw,
  Megaphone,
  Brain,
  FileText,
  Bell,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ScheduledTask {
  id: string;
  name: string;
  description: string | null;
  action_type: string;
  action_payload: Record<string, unknown>;
  target_type: string;
  target_ids: string[];
  target_filter: Record<string, unknown> | null;
  scheduled_at: string;
  repeat_type: string | null;
  repeat_config: Record<string, unknown> | null;
  status: string;
  last_run_at: string | null;
  next_run_at: string | null;
  run_count: number;
  max_runs: number | null;
  error_message: string | null;
  created_at: string;
}

const actionTypes = [
  { value: 'broadcast', label: 'Enviar Broadcast', icon: Megaphone, color: 'bg-blue-500' },
  { value: 'status_change', label: 'Alterar Status', icon: Users, color: 'bg-amber-500' },
  { value: 'template_sync', label: 'Sincronizar Template', icon: Brain, color: 'bg-purple-500' },
  { value: 'report', label: 'Gerar Relatório', icon: FileText, color: 'bg-green-500' },
  { value: 'notification', label: 'Enviar Notificação', icon: Bell, color: 'bg-pink-500' },
];

const targetTypes = [
  { value: 'all_tenants', label: 'Todos os Tenants' },
  { value: 'specific_tenants', label: 'Tenants Específicos' },
  { value: 'plan_filter', label: 'Por Plano' },
  { value: 'tag_filter', label: 'Por Tag' },
];

const repeatTypes = [
  { value: 'once', label: 'Uma vez' },
  { value: 'daily', label: 'Diariamente' },
  { value: 'weekly', label: 'Semanalmente' },
  { value: 'monthly', label: 'Mensalmente' },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle2 }> = {
  pending: { label: 'Pendente', variant: 'secondary', icon: Clock },
  running: { label: 'Executando', variant: 'default', icon: Play },
  completed: { label: 'Concluído', variant: 'outline', icon: CheckCircle2 },
  failed: { label: 'Falhou', variant: 'destructive', icon: XCircle },
  cancelled: { label: 'Cancelado', variant: 'outline', icon: AlertCircle },
};

export default function ScheduledTasks() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    action_type: 'broadcast',
    target_type: 'all_tenants',
    scheduled_at: '',
    repeat_type: 'once',
  });

  // Fetch tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['scheduled-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_tasks')
        .select('*')
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      return data as ScheduledTask[];
    },
  });

  // Filter tasks
  const filteredTasks = tasks?.filter(t => 
    statusFilter === 'all' || t.status === statusFilter
  );

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('scheduled_tasks')
        .insert({
          name: formData.name,
          description: formData.description || null,
          action_type: formData.action_type,
          action_payload: {},
          target_type: formData.target_type,
          target_ids: [],
          scheduled_at: formData.scheduled_at,
          repeat_type: formData.repeat_type,
          next_run_at: formData.scheduled_at,
          created_by: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tarefa agendada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['scheduled-tasks'] });
      setIsCreateOpen(false);
      setFormData({
        name: '',
        description: '',
        action_type: 'broadcast',
        target_type: 'all_tenants',
        scheduled_at: '',
        repeat_type: 'once',
      });
    },
    onError: (err) => {
      toast.error('Erro ao criar tarefa: ' + (err as Error).message);
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('scheduled_tasks')
        .update({ status: 'cancelled' })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tarefa cancelada');
      queryClient.invalidateQueries({ queryKey: ['scheduled-tasks'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('scheduled_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tarefa removida');
      queryClient.invalidateQueries({ queryKey: ['scheduled-tasks'] });
    },
  });

  const getActionInfo = (type: string) => {
    return actionTypes.find(a => a.value === type) || actionTypes[0];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.scheduled_at) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    createMutation.mutate();
  };

  return (
    <DashboardLayout>
      <PageHeader
        numeral="07 /"
        label="Administração · Automação"
        title="Tarefas agendadas"
        description="Pipeline de execução automática de ações agendadas"
        icon={Clock}
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="running">Executando</SelectItem>
            <SelectItem value="completed">Concluídos</SelectItem>
            <SelectItem value="failed">Falharam</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2 ml-auto">
          {['pending', 'completed', 'failed'].map(status => {
            const count = tasks?.filter(t => t.status === status).length || 0;
            const config = statusConfig[status];
            return (
              <Badge key={status} variant={config.variant} className="gap-1">
                <config.icon className="w-3 h-3" />
                {count}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredTasks?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma tarefa agendada</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Crie tarefas para automatizar ações no sistema
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Tarefa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      {!isLoading && filteredTasks && filteredTasks.length > 0 && (
        <div className="space-y-4">
          {filteredTasks.map(task => {
            const actionInfo = getActionInfo(task.action_type);
            const statusInfo = statusConfig[task.status] || statusConfig.pending;
            const ActionIcon = actionInfo.icon;
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Icon & Main Info */}
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        actionInfo.color
                      )}>
                        <ActionIcon className="w-6 h-6 text-white" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{task.name}</h3>
                          <Badge variant={statusInfo.variant} className="gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </Badge>
                        </div>

                        {task.description && (
                          <p className="text-sm text-muted-foreground">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {format(parseISO(task.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>

                          {task.repeat_type && task.repeat_type !== 'once' && (
                            <div className="flex items-center gap-1">
                              <RefreshCw className="w-3 h-3" />
                              <span>
                                {repeatTypes.find(r => r.value === task.repeat_type)?.label}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>
                              {targetTypes.find(t => t.value === task.target_type)?.label}
                            </span>
                          </div>

                          {task.run_count > 0 && (
                            <span>
                              Executado {task.run_count}x
                            </span>
                          )}
                        </div>

                        {task.error_message && (
                          <p className="text-xs text-destructive mt-2">
                            Erro: {task.error_message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {task.status === 'pending' && (
                          <DropdownMenuItem
                            onClick={() => cancelMutation.mutate(task.id)}
                          >
                            <Pause className="w-4 h-4 mr-2" />
                            Cancelar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => deleteMutation.mutate(task.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Next Run */}
                  {task.status === 'pending' && task.next_run_at && (
                    <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">Próxima execução:</span>
                      <span className="font-medium">
                        {formatDistanceToNow(parseISO(task.next_run_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Nova Tarefa Agendada
            </DialogTitle>
            <DialogDescription>
              Configure uma ação para execução automática
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Tarefa *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Broadcast de fim de mês"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição opcional..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Ação *</Label>
                <Select
                  value={formData.action_type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, action_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Destino *</Label>
                <Select
                  value={formData.target_type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, target_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {targetTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled_at">Data/Hora *</Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Repetição</Label>
                <Select
                  value={formData.repeat_type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, repeat_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {repeatTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Tarefa
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
