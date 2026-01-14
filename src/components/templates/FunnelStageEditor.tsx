import { useFormContext, useFieldArray } from 'react-hook-form';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Trash2, GripVertical, Trophy, XCircle, Lock } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TemplateFormData, FunnelStage } from '@/types/templates';

const DEFAULT_COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#EF4444', '#06B6D4'];

interface SortableStageCardProps {
  id: string;
  index: number;
  stage: FunnelStage;
  onNameChange: (index: number, name: string) => void;
  onRemove: (index: number) => void;
  onColorChange: (index: number, color: string) => void;
  onWonChange: (index: number, checked: boolean) => void;
  onLostChange: (index: number, checked: boolean) => void;
  canRemove: boolean;
  register: any;
}

function SortableStageCard({
  id,
  index,
  stage,
  onNameChange,
  onRemove,
  onColorChange,
  onWonChange,
  onLostChange,
  canRemove,
  register,
}: SortableStageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const isSystemStage = stage?.is_system === true;

  return (
    <Card ref={setNodeRef} style={style} className={`overflow-hidden ${isDragging ? 'shadow-lg' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex items-center justify-center w-8 h-8 rounded bg-muted cursor-grab active:cursor-grabbing mt-1 hover:bg-muted/80 transition-colors"
          >
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
              <Label className="text-xs flex items-center gap-1">
                Nome
                {isSystemStage && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    <Lock className="h-2 w-2 mr-0.5" />
                    Sistema
                  </Badge>
                )}
              </Label>
              <Input
                placeholder="Ex: Novo Lead"
                value={stage?.name || ''}
                onChange={(e) => onNameChange(index, e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Slug</Label>
              <Input
                placeholder="novo-lead"
                className="font-mono text-sm"
                {...register(`funnel_stages.${index}.slug`)}
                disabled={isSystemStage}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Cor</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  className="w-10 h-9 rounded border cursor-pointer"
                  value={stage?.color || '#3B82F6'}
                  onChange={(e) => onColorChange(index, e.target.value)}
                />
                <Input
                  placeholder="#3B82F6"
                  className="font-mono text-sm flex-1"
                  {...register(`funnel_stages.${index}.color`)}
                />
              </div>
            </div>

            <div className="flex items-end gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={stage?.is_won || false}
                        onCheckedChange={(checked) => onWonChange(index, checked)}
                        disabled={isSystemStage}
                      />
                      <div className="flex items-center gap-1">
                        <Trophy className={`h-4 w-4 ${stage?.is_won ? 'text-green-500' : 'text-muted-foreground'}`} />
                        <span className="text-xs text-muted-foreground">Ganho</span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isSystemStage 
                      ? 'Etapa de sistema - não pode ser alterada'
                      : 'Marcar como etapa de conversão (venda fechada)'
                    }
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={stage?.is_lost || false}
                        onCheckedChange={(checked) => onLostChange(index, checked)}
                        disabled={isSystemStage}
                      />
                      <div className="flex items-center gap-1">
                        <XCircle className={`h-4 w-4 ${stage?.is_lost ? 'text-red-500' : 'text-muted-foreground'}`} />
                        <span className="text-xs text-muted-foreground">Perdido</span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isSystemStage 
                      ? 'Etapa de sistema - não pode ser alterada'
                      : 'Marcar como etapa de perda (lead descartado)'
                    }
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Delete */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive disabled:opacity-50"
                    onClick={() => onRemove(index)}
                    disabled={!canRemove || isSystemStage}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {isSystemStage 
                  ? 'Etapas de sistema não podem ser removidas'
                  : !canRemove 
                    ? 'Mínimo de 2 etapas obrigatório'
                    : 'Remover etapa'
                }
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}

export function FunnelStageEditor() {
  const { control, register, watch, setValue } = useFormContext<TemplateFormData>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'funnel_stages',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const recalculateSortOrders = useCallback(() => {
    fields.forEach((_, index) => {
      setValue(`funnel_stages.${index}.sort_order`, index + 1);
    });
  }, [fields, setValue]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      move(oldIndex, newIndex);
      
      // Recalculate sort orders after a small delay to ensure state is updated
      setTimeout(() => {
        recalculateSortOrders();
      }, 0);
    }
  };

  const handleAddStage = () => {
    // Find position before "Ganho" stage (first is_won stage)
    const wonIndex = fields.findIndex((_, i) => {
      const stage = watch(`funnel_stages.${i}`);
      return stage?.is_won === true;
    });
    
    const insertIndex = wonIndex > 0 ? wonIndex : fields.length;
    const nextOrder = insertIndex + 1;
    const color = DEFAULT_COLORS[(nextOrder - 1) % DEFAULT_COLORS.length];
    
    append({
      name: '',
      slug: '',
      color,
      sort_order: nextOrder,
      is_won: false,
      is_lost: false,
      is_system: false,
    });

    // Recalculate all sort orders
    setTimeout(() => {
      recalculateSortOrders();
    }, 0);
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
    const stage = watch(`funnel_stages.${index}`);
    setValue(`funnel_stages.${index}.name`, name);
    // Only auto-generate slug for non-system stages
    if (!stage?.is_system) {
      setValue(`funnel_stages.${index}.slug`, generateSlug(name));
    }
  };

  const handleRemove = (index: number) => {
    remove(index);
    setTimeout(() => {
      recalculateSortOrders();
    }, 0);
  };

  const handleColorChange = (index: number, color: string) => {
    setValue(`funnel_stages.${index}.color`, color);
  };

  const handleWonChange = (index: number, checked: boolean) => {
    setValue(`funnel_stages.${index}.is_won`, checked);
    if (checked) setValue(`funnel_stages.${index}.is_lost`, false);
  };

  const handleLostChange = (index: number, checked: boolean) => {
    setValue(`funnel_stages.${index}.is_lost`, checked);
    if (checked) setValue(`funnel_stages.${index}.is_won`, false);
  };

  const canRemoveStage = fields.length > 3; // Keep at least 3 stages (Novos, Ganho, Perdido)

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
        <p className="mt-2 text-amber-600 dark:text-amber-400">
          <span className="font-medium">⚠️ Etapas de Sistema:</span> "Novos", "Ganho" e "Perdido" são obrigatórias para consistência com o CRM.
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {fields.map((field, index) => {
              const stage = watch(`funnel_stages.${index}`);
              return (
                <SortableStageCard
                  key={field.id}
                  id={field.id}
                  index={index}
                  stage={stage}
                  onNameChange={handleNameChange}
                  onRemove={handleRemove}
                  onColorChange={handleColorChange}
                  onWonChange={handleWonChange}
                  onLostChange={handleLostChange}
                  canRemove={canRemoveStage}
                  register={register}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
        <p>
          <span className="inline-flex items-center gap-1">
            <Lock className="h-3 w-3" /> Etapas de sistema não podem ser removidas
          </span>
        </p>
        <p>
          Marque uma etapa como <Trophy className="h-3 w-3 inline text-green-500" /> Ganho e outra como <XCircle className="h-3 w-3 inline text-red-500" /> Perdido
        </p>
      </div>
    </div>
  );
}
