import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Zap, Clock, MessageSquare, Mail, Bell } from 'lucide-react';
import type { TemplateFormData } from '@/types/templates';

const TRIGGER_TYPES = [
  { value: 'no_response', label: 'Sem resposta', icon: Clock },
  { value: 'stage_change', label: 'Mudança de etapa', icon: Zap },
  { value: 'tag_added', label: 'Tag adicionada', icon: Bell },
  { value: 'scheduled', label: 'Agendado', icon: Clock },
];

const ACTION_TYPES = [
  { value: 'send_message', label: 'Enviar mensagem', icon: MessageSquare },
  { value: 'send_email', label: 'Enviar email', icon: Mail },
  { value: 'notify_team', label: 'Notificar equipe', icon: Bell },
  { value: 'change_stage', label: 'Mudar etapa', icon: Zap },
];

export function AutomationFlowEditor() {
  const { control, register, watch, setValue } = useFormContext<TemplateFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'automations',
  });

  const handleAdd = () => {
    append({
      id: `auto_${Date.now()}`,
      name: '',
      trigger_type: 'no_response',
      trigger_value: 24,
      action_type: 'send_message',
      action_message: '',
      is_active: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Automações</h3>
          <p className="text-sm text-muted-foreground">
            Configure fluxos automáticos de follow-up e ações
          </p>
        </div>
        <Button type="button" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Automação
        </Button>
      </div>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma automação configurada</p>
            <Button type="button" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Automação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => {
            const automation = watch(`automations.${index}`);
            const TriggerIcon = TRIGGER_TYPES.find((t) => t.value === automation?.trigger_type)?.icon || Clock;
            const ActionIcon = ACTION_TYPES.find((a) => a.value === automation?.action_type)?.icon || MessageSquare;

            return (
              <Card key={field.id} className={!automation?.is_active ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <Input
                          placeholder="Nome da automação"
                          className="font-medium border-0 p-0 h-auto focus-visible:ring-0"
                          {...register(`automations.${index}.name`)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={automation?.is_active}
                        onCheckedChange={(checked) => setValue(`automations.${index}.is_active`, checked)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Trigger */}
                  <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="h-8 w-8 rounded bg-blue-500/10 flex items-center justify-center shrink-0">
                      <TriggerIcon className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Gatilho</Label>
                        <Select
                          value={automation?.trigger_type}
                          onValueChange={(value) => setValue(`automations.${index}.trigger_type`, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TRIGGER_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          {automation?.trigger_type === 'no_response' ? 'Horas sem resposta' : 'Valor'}
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          {...register(`automations.${index}.trigger_value`, { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="w-0.5 h-6 bg-border" />
                  </div>

                  {/* Action */}
                  <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="h-8 w-8 rounded bg-green-500/10 flex items-center justify-center shrink-0">
                      <ActionIcon className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Ação</Label>
                          <Select
                            value={automation?.action_type}
                            onValueChange={(value) => setValue(`automations.${index}.action_type`, value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ACTION_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {(automation?.action_type === 'send_message' || automation?.action_type === 'send_email') && (
                        <div className="space-y-1">
                          <Label className="text-xs">Mensagem</Label>
                          <Textarea
                            placeholder="Oi {nome}! Vi que você estava interessado em..."
                            rows={3}
                            {...register(`automations.${index}.action_message`)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Use {'{nome}'}, {'{produto}'} para variáveis
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
