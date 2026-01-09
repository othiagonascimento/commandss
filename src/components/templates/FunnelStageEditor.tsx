import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, Trophy, XCircle } from 'lucide-react';
import type { TemplateFormData, FunnelStage } from '@/types/templates';

const DEFAULT_COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#EF4444', '#06B6D4'];

export function FunnelStageEditor() {
  const { control, register, watch, setValue } = useFormContext<TemplateFormData>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'funnel_stages',
  });

  const handleAddStage = () => {
    const nextOrder = fields.length + 1;
    const color = DEFAULT_COLORS[(nextOrder - 1) % DEFAULT_COLORS.length];
    append({
      name: '',
      slug: '',
      color,
      sort_order: nextOrder,
      is_won: false,
      is_lost: false,
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (index: number, name: string) => {
    setValue(`funnel_stages.${index}.name`, name);
    setValue(`funnel_stages.${index}.slug`, generateSlug(name));
  };

  return (
    <div className="space-y-6">
      {/* Texto Educativo */}
      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mb-4">
        <p className="font-medium text-foreground mb-1">📊 Etapas do Funil de Vendas</p>
        <p className="leading-relaxed">
          O funil define a jornada do lead desde o primeiro contato até a conversão. 
          Cada etapa representa um estágio diferente: novo lead, em negociação, proposta enviada, etc.
        </p>
        <p className="mt-2 text-primary/80">
          <span className="font-medium">Impacto no tenant:</span> Define o kanban de leads e métricas de conversão entre etapas.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Etapas do Funil</h3>
          <p className="text-sm text-muted-foreground">
            Configure as etapas do funil de vendas. Arraste para reordenar.
          </p>
        </div>
        <Button type="button" onClick={handleAddStage}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Etapa
        </Button>
      </div>

      {fields.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Nenhuma etapa configurada</p>
            <Button type="button" onClick={handleAddStage}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Etapa
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => {
          const stage = watch(`funnel_stages.${index}`);
          return (
            <Card key={field.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Drag Handle */}
                  <div className="flex items-center justify-center w-8 h-8 rounded bg-muted cursor-move mt-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Color Indicator */}
                  <div
                    className="w-3 h-full min-h-[80px] rounded-full mt-1"
                    style={{ backgroundColor: stage?.color || '#3B82F6' }}
                  />

                  {/* Fields */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Nome</Label>
                      <Input
                        placeholder="Ex: Novo Lead"
                        value={stage?.name || ''}
                        onChange={(e) => handleNameChange(index, e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Slug</Label>
                      <Input
                        placeholder="novo-lead"
                        className="font-mono text-sm"
                        {...register(`funnel_stages.${index}.slug`)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Cor</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          className="w-10 h-9 rounded border cursor-pointer"
                          value={stage?.color || '#3B82F6'}
                          onChange={(e) => setValue(`funnel_stages.${index}.color`, e.target.value)}
                        />
                        <Input
                          placeholder="#3B82F6"
                          className="font-mono text-sm flex-1"
                          {...register(`funnel_stages.${index}.color`)}
                        />
                      </div>
                    </div>

                    <div className="flex items-end gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={stage?.is_won || false}
                          onCheckedChange={(checked) => {
                            setValue(`funnel_stages.${index}.is_won`, checked);
                            if (checked) setValue(`funnel_stages.${index}.is_lost`, false);
                          }}
                        />
                        <Trophy className={`h-4 w-4 ${stage?.is_won ? 'text-green-500' : 'text-muted-foreground'}`} />
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={stage?.is_lost || false}
                          onCheckedChange={(checked) => {
                            setValue(`funnel_stages.${index}.is_lost`, checked);
                            if (checked) setValue(`funnel_stages.${index}.is_won`, false);
                          }}
                        />
                        <XCircle className={`h-4 w-4 ${stage?.is_lost ? 'text-red-500' : 'text-muted-foreground'}`} />
                      </div>
                    </div>
                  </div>

                  {/* Delete */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 2}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Mínimo de 2 etapas. Marque uma como "Ganho" (🏆) e outra como "Perdido" (❌).
      </p>
    </div>
  );
}
