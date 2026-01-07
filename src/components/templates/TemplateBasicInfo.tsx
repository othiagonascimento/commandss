import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TemplateFormData } from '@/types/templates';

const EMOJI_OPTIONS = ['📋', '🚗', '🏠', '💼', '🛒', '💰', '📱', '🎯', '⚡', '🔧', '🏥', '📚', '🍔', '✈️', '🎮'];

export function TemplateBasicInfo() {
  const { register, watch, setValue } = useFormContext<TemplateFormData>();
  const isBaseTemplate = watch('is_base_template');
  const icon = watch('icon');
  const category = watch('category');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Template *</Label>
          <Input
            id="name"
            placeholder="Ex: Template Veículos"
            {...register('name', { required: true })}
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (identificador único) *</Label>
          <Input
            id="slug"
            placeholder="Ex: veiculos"
            {...register('slug', { required: true })}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Use apenas letras minúsculas, números e hífens
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Descreva o propósito deste template..."
          rows={3}
          {...register('description')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Category */}
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={category} onValueChange={(value) => setValue('category', value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="universal">Universal</SelectItem>
              <SelectItem value="vendas">Vendas</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Icon */}
        <div className="space-y-2">
          <Label>Ícone</Label>
          <Select value={icon} onValueChange={(value) => setValue('icon', value)}>
            <SelectTrigger>
              <SelectValue>
                <span className="text-xl">{icon}</span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <div className="grid grid-cols-5 gap-1 p-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <SelectItem key={emoji} value={emoji} className="text-center text-xl cursor-pointer">
                    {emoji}
                  </SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>
        </div>

        {/* Is Base Template */}
        <div className="space-y-2">
          <Label>Template Base</Label>
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              checked={isBaseTemplate}
              onCheckedChange={(checked) => setValue('is_base_template', checked)}
            />
            <span className="text-sm text-muted-foreground">
              {isBaseTemplate ? 'Sim (pode ser herdado)' : 'Não'}
            </span>
          </div>
        </div>
      </div>

      {/* AI Config Preview */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <h3 className="font-medium mb-4">Configuração de IA</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="personality">Personalidade do Bot</Label>
            <Input
              id="personality"
              placeholder="Ex: Consultor de vendas amigável"
              {...register('ai_config.personality')}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Modo de Operação</Label>
            <Select 
              value={watch('ai_config.mode')} 
              onValueChange={(value) => setValue('ai_config.mode', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="autonomous">Autônomo</SelectItem>
                <SelectItem value="copilot">Copilot</SelectItem>
                <SelectItem value="suggestion">Sugestão</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperature">Temperatura ({watch('ai_config.temperature')})</Label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              className="w-full"
              {...register('ai_config.temperature', { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              Menor = mais focado, Maior = mais criativo
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="techniques">Técnicas de Vendas</Label>
            <Input
              id="techniques"
              placeholder="Ex: SPIN, rapport, escassez"
              value={watch('ai_config.techniques')?.join(', ') || ''}
              onChange={(e) => {
                const techniques = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                setValue('ai_config.techniques', techniques);
              }}
            />
            <p className="text-xs text-muted-foreground">Separadas por vírgula</p>
          </div>
        </div>
      </div>
    </div>
  );
}
