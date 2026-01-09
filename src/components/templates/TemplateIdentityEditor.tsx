import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Target, Users, DollarSign, Clock, Sparkles, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { TemplateFormData } from '@/types/templates';
import { HelpTooltip, SectionHelp } from '@/components/ui/help-tooltip';

const EMOJI_OPTIONS = ['📋', '🚗', '🏠', '💼', '🛒', '💰', '📱', '🎯', '⚡', '🔧', '🏥', '📚', '🍔', '✈️', '🎮', '👗', '💎', '🏋️', '🎓', '🔌'];

export function TemplateIdentityEditor() {
  const { register, watch, setValue } = useFormContext<TemplateFormData>();
  const [newAdvantage, setNewAdvantage] = useState('');
  
  const isBaseTemplate = watch('is_base_template');
  const icon = watch('icon');
  const category = watch('category');
  const businessContext = watch('business_context');
  const advantages = businessContext?.competitive_advantages || [];

  const addAdvantage = () => {
    if (newAdvantage.trim()) {
      setValue('business_context.competitive_advantages', [...advantages, newAdvantage.trim()]);
      setNewAdvantage('');
    }
  };

  const removeAdvantage = (index: number) => {
    setValue('business_context.competitive_advantages', advantages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <SectionHelp
        title="Identidade do Template"
        description="Defina o nome, categoria e contexto de negócio. Essas informações ajudam a IA a entender o segmento do cliente e adaptar suas respostas automaticamente."
        impact="Todos os tenants que usarem este template terão a IA pré-configurada para este tipo de negócio."
      />

      {/* Basic Info Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Informações Básicas
          </CardTitle>
          <CardDescription>Identificação e classificação do template</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Template *</Label>
              <Input
                id="name"
                placeholder="Ex: Template Veículos"
                {...register('name', { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="inline-flex items-center">
                Identificador (Slug) *
                <HelpTooltip 
                  title="O que é Slug?"
                  description="Nome técnico usado em URLs e integrações. Deve ser único, sem espaços ou caracteres especiais."
                  example="Ex: veiculos → usado em api.uopa.com/veiculos"
                />
              </Label>
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

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o propósito e diferenciais deste template..."
              rows={2}
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

            <div className="space-y-2 col-span-2 md:col-span-2">
              <Label>Template Base</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  checked={isBaseTemplate}
                  onCheckedChange={(checked) => setValue('is_base_template', checked)}
                />
                <span className="text-sm text-muted-foreground">
                  {isBaseTemplate ? 'Pode ser herdado por outros' : 'Template independente'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Context Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Contexto do Negócio
          </CardTitle>
          <CardDescription>Informações que ajudam a IA a entender o contexto de vendas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Tipo de Negócio
                <HelpTooltip 
                  description="Define para quem você vende: empresas (B2B), consumidores (B2C) ou híbrido."
                />
              </Label>
              <Select 
                value={businessContext?.business_type || 'B2C'} 
                onValueChange={(value) => setValue('business_context.business_type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B2B">B2B (Venda para Empresas)</SelectItem>
                  <SelectItem value="B2C">B2C (Venda para Consumidor)</SelectItem>
                  <SelectItem value="D2C">D2C (Venda Direta, sem intermediários)</SelectItem>
                  <SelectItem value="B2B2C">B2B2C (Híbrido: vende para empresa que revende)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                Segmento de Mercado
              </Label>
              <Input
                placeholder="Ex: Automotivo"
                {...register('business_context.market_segment')}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Ticket Médio (R$)
                <HelpTooltip 
                  description="Valor médio de cada venda. Ajuda a IA a calibrar argumentos."
                  example="Ex: R$ 50.000 para carros, R$ 50 para fast-food"
                />
              </Label>
              <Input
                type="number"
                placeholder="0"
                {...register('business_context.average_ticket', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Ciclo de Vendas (dias)
                <HelpTooltip 
                  description="Tempo médio entre primeiro contato e fechamento da venda."
                  example="Ex: 1 dia para e-commerce, 90 dias para imóveis"
                />
              </Label>
              <Input
                type="number"
                placeholder="7"
                {...register('business_context.sales_cycle_days', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Público-Alvo</Label>
            <Input
              placeholder="Ex: Pessoas físicas de 25-45 anos interessadas em comprar veículos seminovos"
              {...register('business_context.target_audience')}
            />
          </div>

          <div className="space-y-2">
            <Label>Principais Produtos/Serviços</Label>
            <Input
              placeholder="Ex: Veículos novos e seminovos, financiamento, seguros"
              {...register('business_context.main_products_services')}
            />
          </div>

          <div className="space-y-2">
            <Label>Proposta de Valor</Label>
            <Textarea
              placeholder="O que torna este negócio único? Por que clientes escolhem você?"
              rows={2}
              {...register('business_context.value_proposition')}
            />
          </div>

          <div className="space-y-2">
            <Label>Diferenciais Competitivos</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {advantages.map((adv, index) => (
                <Badge key={index} variant="secondary" className="gap-1 pr-1">
                  {adv}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 hover:bg-destructive/20"
                    onClick={() => removeAdvantage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar diferencial..."
                value={newAdvantage}
                onChange={(e) => setNewAdvantage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAdvantage())}
              />
              <Button type="button" variant="outline" size="icon" onClick={addAdvantage}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
