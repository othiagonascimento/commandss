import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { AIModelCatalog, CreateAIModelInput } from '@/hooks/useAIModelsCatalog';

interface ModelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model?: AIModelCatalog | null;
  onSubmit: (data: CreateAIModelInput) => void;
  isLoading?: boolean;
}

const PROVIDERS = [
  { value: 'google', label: 'Google' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'cohere', label: 'Cohere' },
  { value: 'meta', label: 'Meta (Llama)' },
  { value: 'other', label: 'Outro...' },
];

const CATEGORIES = [
  { value: 'router', label: 'Router (Camada 1)' },
  { value: 'standard', label: 'Standard (Camada 2)' },
  { value: 'elite', label: 'Elite (Camada 3)' },
];

export function ModelFormDialog({ 
  open, 
  onOpenChange, 
  model, 
  onSubmit,
  isLoading 
}: ModelFormDialogProps) {
  const [formData, setFormData] = useState<CreateAIModelInput>({
    model_id: '',
    display_name: '',
    provider: 'google',
    layer_category: 'standard',
    cost_per_1k_tokens: null,
    max_context_tokens: null,
  });
  const [customProvider, setCustomProvider] = useState('');
  const [selectedProviderKey, setSelectedProviderKey] = useState('google');

  const isEditing = !!model;

  useEffect(() => {
    if (model) {
      const knownProvider = PROVIDERS.find(p => p.value === model.provider && p.value !== 'other');
      setFormData({
        model_id: model.model_id,
        display_name: model.display_name,
        provider: model.provider,
        layer_category: model.layer_category,
        cost_per_1k_tokens: model.cost_per_1k_tokens,
        max_context_tokens: model.max_context_tokens,
      });
      if (knownProvider) {
        setSelectedProviderKey(model.provider);
        setCustomProvider('');
      } else {
        setSelectedProviderKey('other');
        setCustomProvider(model.provider);
      }
    } else {
      setFormData({
        model_id: '',
        display_name: '',
        provider: 'google',
        layer_category: 'standard',
        cost_per_1k_tokens: null,
        max_context_tokens: null,
      });
      setSelectedProviderKey('google');
      setCustomProvider('');
    }
  }, [model, open]);

  const handleProviderChange = (value: string) => {
    setSelectedProviderKey(value);
    if (value !== 'other') {
      setFormData(prev => ({ ...prev, provider: value }));
      setCustomProvider('');
    }
  };

  const handleCustomProviderChange = (value: string) => {
    setCustomProvider(value);
    setFormData(prev => ({ ...prev, provider: value.toLowerCase().replace(/\s+/g, '-') }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Modelo' : 'Novo Modelo de IA'}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Atualize as informações do modelo de IA.' 
                : 'Cadastre um novo modelo de IA no catálogo.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="model_id">ID do Modelo *</Label>
              <Input
                id="model_id"
                value={formData.model_id}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  model_id: e.target.value.toLowerCase().replace(/\s+/g, '-') 
                }))}
                placeholder="gpt-4o, gemini-2.0-flash, deepseek-chat, etc."
                disabled={isEditing}
                required
              />
              <p className="text-xs text-muted-foreground">
                Identificador único usado internamente (não pode ser alterado depois)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="display_name">Nome de Exibição *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="GPT-4o, Gemini 2.0 Flash, DeepSeek Chat, etc."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="provider">Provedor *</Label>
                <Select
                  value={selectedProviderKey}
                  onValueChange={handleProviderChange}
                >
                  <SelectTrigger id="provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map(p => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProviderKey === 'other' && (
                  <Input
                    value={customProvider}
                    onChange={(e) => handleCustomProviderChange(e.target.value)}
                    placeholder="Nome do provedor"
                    required
                  />
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="layer_category">Categoria *</Label>
                <Select
                  value={formData.layer_category}
                  onValueChange={(value: 'router' | 'standard' | 'elite') => 
                    setFormData(prev => ({ ...prev, layer_category: value }))
                  }
                >
                  <SelectTrigger id="layer_category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cost_per_1k_tokens">Custo por 1k Tokens</Label>
                <Input
                  id="cost_per_1k_tokens"
                  type="number"
                  step="0.0001"
                  min="0"
                  value={formData.cost_per_1k_tokens ?? ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    cost_per_1k_tokens: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                  placeholder="0.01"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="max_context_tokens">Contexto Máx (tokens)</Label>
                <Input
                  id="max_context_tokens"
                  type="number"
                  min="0"
                  value={formData.max_context_tokens ?? ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    max_context_tokens: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  placeholder="128000"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.model_id || !formData.display_name || (selectedProviderKey === 'other' && !customProvider)}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar Modelo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
