import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Package } from 'lucide-react';
import type { TemplateFormData } from '@/types/templates';

const EMOJI_OPTIONS = ['📦', '🔥', '⭐', '💎', '🎁', '🏷️', '🛒', '💼', '🚀', '✨'];

export function ProductCategoriesEditor() {
  const { control, register, watch, setValue } = useFormContext<TemplateFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'product_categories',
  });

  const handleAdd = () => {
    append({
      name: '',
      description: '',
      icon: '📦',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Categorias de Produtos</h3>
          <p className="text-sm text-muted-foreground">
            Organize os produtos em categorias para facilitar o atendimento
          </p>
        </div>
        <Button type="button" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma categoria configurada</p>
            <Button type="button" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Categoria
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map((field, index) => {
            const category = watch(`product_categories.${index}`);
            return (
              <Card key={field.id}>
                <CardContent className="pt-4 space-y-4">
                  {/* Icon Selector */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setValue(`product_categories.${index}.icon`, emoji)}
                          className={`
                            w-8 h-8 rounded flex items-center justify-center text-lg
                            transition-colors
                            ${category?.icon === emoji 
                              ? 'bg-primary/20 ring-2 ring-primary' 
                              : 'hover:bg-muted'}
                          `}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
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

                  {/* Name */}
                  <div className="space-y-1">
                    <Label className="text-xs">Nome da Categoria</Label>
                    <Input
                      placeholder="Ex: Mais Vendidos"
                      {...register(`product_categories.${index}.name`)}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <Label className="text-xs">Descrição</Label>
                    <Textarea
                      placeholder="Produtos com maior saída..."
                      rows={2}
                      {...register(`product_categories.${index}.description`)}
                    />
                  </div>

                  {/* Preview */}
                  <div className="p-3 bg-muted/30 rounded-lg flex items-center gap-3">
                    <span className="text-2xl">{category?.icon || '📦'}</span>
                    <div>
                      <p className="font-medium text-sm">{category?.name || 'Nome da categoria'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {category?.description || 'Descrição...'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tags Editor - Simple version */}
      <Card className="mt-8">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-medium">Categorias de Tags</h4>
              <p className="text-xs text-muted-foreground">
                Tags para classificar leads e conversas
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const current = watch('tag_categories') || [];
                setValue('tag_categories', [
                  ...current,
                  { name: '', color: '#10B981', tags: [] },
                ]);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria de Tags
            </Button>
          </div>

          <TagCategoriesEditor />
        </CardContent>
      </Card>
    </div>
  );
}

function TagCategoriesEditor() {
  const { control, register, watch, setValue } = useFormContext<TemplateFormData>();
  const { fields, remove } = useFieldArray({
    control,
    name: 'tag_categories',
  });

  if (fields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Nenhuma categoria de tags configurada
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((field, index) => {
        const category = watch(`tag_categories.${index}`);
        return (
          <div key={field.id} className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg">
            <input
              type="color"
              className="w-8 h-8 rounded cursor-pointer"
              value={category?.color || '#10B981'}
              onChange={(e) => setValue(`tag_categories.${index}.color`, e.target.value)}
            />
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Nome da categoria (ex: Interesse)"
                {...register(`tag_categories.${index}.name`)}
              />
              <Input
                placeholder="Tags separadas por vírgula (ex: alto, médio, baixo)"
                value={category?.tags?.join(', ') || ''}
                onChange={(e) => {
                  const tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                  setValue(`tag_categories.${index}.tags`, tags);
                }}
              />
              {category?.tags && category.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {category.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="text-xs px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: category.color }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
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
        );
      })}
    </div>
  );
}
