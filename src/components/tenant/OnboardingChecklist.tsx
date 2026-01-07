import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  CheckCircle2, 
  Circle, 
  Loader2,
  Sparkles,
  MessageSquare,
  GraduationCap,
  Rocket,
  Settings,
} from 'lucide-react';

interface OnboardingChecklistProps {
  tenantId: string;
  onboarding?: {
    status: string;
    checklist: Record<string, boolean>;
    niche_template?: { id: string; name: string; slug: string };
    notes?: string;
  };
  templates?: Array<{ id: string; name: string; slug: string; description: string }>;
}

const STATUS_CONFIG = {
  pending: { label: 'Pendente', color: 'bg-muted text-muted-foreground', icon: Circle },
  configuring: { label: 'Configurando', color: 'bg-warning/20 text-warning', icon: Settings },
  whatsapp_connected: { label: 'WhatsApp Conectado', color: 'bg-success/20 text-success', icon: MessageSquare },
  training_done: { label: 'Treinamento Feito', color: 'bg-primary/20 text-primary', icon: GraduationCap },
  go_live: { label: 'Go Live', color: 'bg-success text-success-foreground', icon: Rocket },
};

const CHECKLIST_ITEMS = [
  { key: 'basic_config', label: 'Configuração básica', description: 'Nome, logo, cores' },
  { key: 'whatsapp_connected', label: 'WhatsApp conectado', description: 'Integração ativa' },
  { key: 'team_trained', label: 'Equipe treinada', description: 'Reunião de onboarding' },
  { key: 'first_flow_created', label: 'Primeiro fluxo criado', description: 'Automação funcionando' },
  { key: 'go_live_approved', label: 'Go Live aprovado', description: 'Cliente validou' },
];

export function OnboardingChecklist({ tenantId, onboarding, templates }: OnboardingChecklistProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  
  const status = onboarding?.status || 'pending';
  const checklist = onboarding?.checklist || {};
  const StatusIcon = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.icon || Circle;

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { data, error } = await supabase.functions.invoke('onboarding', {
        method: 'POST',
        body: { action: 'update_status', tenantId, status: newStatus },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Status atualizado!');
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao atualizar status'),
  });

  const updateChecklistMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      const { data, error } = await supabase.functions.invoke('onboarding', {
        method: 'POST',
        body: { action: 'update_checklist', tenantId, checklistItem: { key, value } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao atualizar checklist'),
  });

  const applyTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { data, error } = await supabase.functions.invoke('onboarding', {
        method: 'POST',
        body: { action: 'apply_template', tenantId, templateId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Template "${data.template.name}" aplicado!`);
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao aplicar template'),
  });

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('onboarding', {
        method: 'POST',
        body: { action: 'add_note', tenantId, notes },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Nota adicionada!');
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao adicionar nota'),
  });

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = CHECKLIST_ITEMS.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Status do Onboarding</CardTitle>
            <Badge className={STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label}
            </Badge>
          </div>
          <CardDescription>Progresso: {progress}% ({completedCount}/{totalCount})</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div 
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.keys(STATUS_CONFIG).map((s) => {
              const config = STATUS_CONFIG[s as keyof typeof STATUS_CONFIG];
              const Icon = config.icon;
              return (
                <Button
                  key={s}
                  size="sm"
                  variant={status === s ? 'default' : 'outline'}
                  onClick={() => updateStatusMutation.mutate(s)}
                  disabled={updateStatusMutation.isPending}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {config.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Template Injection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Template de Nicho
          </CardTitle>
          <CardDescription>
            Injeta prompts, fluxos e tags automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {onboarding?.niche_template ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {onboarding.niche_template.name}
              </Badge>
              <span className="text-sm text-muted-foreground">aplicado</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select
                onValueChange={(value) => applyTemplateMutation.mutate(value)}
                disabled={applyTemplateMutation.isPending}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selecionar nicho..." />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {applyTemplateMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Checklist de Onboarding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {CHECKLIST_ITEMS.map((item) => (
            <div
              key={item.key}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={checklist[item.key] || false}
                onCheckedChange={(checked) =>
                  updateChecklistMutation.mutate({ key: item.key, value: checked as boolean })
                }
                disabled={updateChecklistMutation.isPending}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              {checklist[item.key] && (
                <CheckCircle2 className="w-4 h-4 text-success" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Notas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {onboarding?.notes && (
            <pre className="text-xs bg-muted p-3 rounded-lg whitespace-pre-wrap max-h-32 overflow-auto">
              {onboarding.notes}
            </pre>
          )}
          <div className="flex gap-2">
            <Textarea
              placeholder="Adicionar nota..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-sm"
              rows={2}
            />
            <Button
              size="sm"
              onClick={() => addNoteMutation.mutate()}
              disabled={!notes.trim() || addNoteMutation.isPending}
            >
              {addNoteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
