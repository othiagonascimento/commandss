import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Loader2, 
  FileText, 
  AlertCircle, 
  Users, 
  MessageSquare, 
  Percent,
  Clock,
  CreditCard,
  Calculator
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ContractFormData {
  // Cliente
  name: string;
  subdomain: string;
  document: string;
  contact_email: string;
  company_name: string;
  primary_color: string;
  
  // Pricing
  price_per_user: number;
  contracted_users: number;
  extra_channels: number;
  implementation_fee: number;
  charge_implementation: boolean;
  
  // Discount
  discount_type: 'percentage' | 'fixed' | null;
  discount_value: number;
  
  // Trial
  trial_enabled: boolean;
  trial_days: number;
  
  // Limits
  ai_token_limit: number;
  storage_limit_gb: number;
}

const CHANNEL_PRICE = 19.90;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function NewContract() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ContractFormData>({
    name: '',
    subdomain: '',
    document: '',
    contact_email: '',
    company_name: '',
    primary_color: '#3b82f6',
    price_per_user: 69.00,
    contracted_users: 1,
    extra_channels: 0,
    implementation_fee: 2500.00,
    charge_implementation: true,
    discount_type: null,
    discount_value: 0,
    trial_enabled: false,
    trial_days: 30,
    ai_token_limit: 100000,
    storage_limit_gb: 5,
  });

  // Calculate pricing
  const pricing = useMemo(() => {
    const usersCost = formData.price_per_user * formData.contracted_users;
    const extraChannelsCost = Math.max(0, formData.extra_channels) * CHANNEL_PRICE;
    const subtotal = usersCost + extraChannelsCost;
    
    let discountAmount = 0;
    if (formData.discount_type === 'percentage' && formData.discount_value > 0) {
      discountAmount = subtotal * (formData.discount_value / 100);
    } else if (formData.discount_type === 'fixed' && formData.discount_value > 0) {
      discountAmount = formData.discount_value;
    }
    
    const monthlyTotal = Math.max(0, subtotal - discountAmount);
    const implementationTotal = formData.charge_implementation ? formData.implementation_fee : 0;
    
    return {
      usersCost,
      extraChannelsCost,
      subtotal,
      discountAmount,
      monthlyTotal,
      implementationTotal,
      firstInvoice: monthlyTotal + implementationTotal,
    };
  }, [formData]);

  const createMutation = useMutation({
    mutationFn: async (data: ContractFormData) => {
      const { data: result, error } = await supabase.functions.invoke('create-subscription', {
        body: data,
      });
      
      if (error) throw new Error(error.message);
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (data) => {
      toast.success('Contrato criado com sucesso!');
      if (data.payment_url) {
        window.open(data.payment_url, '_blank');
      }
      navigate(`/tenants/${data.tenant?.id || ''}`);
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error('Erro ao criar contrato');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.name || !formData.subdomain || !formData.contact_email) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }
    
    if (!formData.document) {
      setError('CPF/CNPJ é obrigatório');
      return;
    }

    createMutation.mutate(formData);
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      subdomain: slugify(name),
      company_name: prev.company_name || name,
    }));
  };

  const updateField = <K extends keyof ContractFormData>(field: K, value: ContractFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <Header onMenuClick={() => setMobileMenuOpen(true)} />
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <main
        className={cn(
          'transition-[margin] duration-300 p-4 lg:p-6',
          'lg:ml-[280px]',
          sidebarCollapsed && 'lg:ml-[72px]'
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/tenants')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Novo Contrato
            </h1>
            <p className="text-muted-foreground">
              Configure o plano e precificação para o novo cliente
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Dados do Cliente
                </CardTitle>
                <CardDescription>Informações básicas do contratante</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Empresa *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Empresa XYZ"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subdomain">Slug (URL) *</Label>
                    <Input
                      id="subdomain"
                      value={formData.subdomain}
                      onChange={(e) => updateField('subdomain', e.target.value)}
                      placeholder="empresa-xyz"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.subdomain || 'slug'}.uopa.app
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="document">CPF/CNPJ *</Label>
                    <Input
                      id="document"
                      value={formData.document}
                      onChange={(e) => updateField('document', e.target.value)}
                      placeholder="00.000.000/0001-00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Email de Contato *</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => updateField('contact_email', e.target.value)}
                      placeholder="contato@empresa.com"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Config */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Configuração de Plano
                </CardTitle>
                <CardDescription>Modelo de precificação por usuário</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price_per_user">Valor por Usuário (R$)</Label>
                    <Input
                      id="price_per_user"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price_per_user}
                      onChange={(e) => updateField('price_per_user', parseFloat(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Preço Beta: R$ 69,00 | Preço Cheio: R$ 89,00
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contracted_users">Qtde. Usuários Contratados</Label>
                    <Input
                      id="contracted_users"
                      type="number"
                      min="1"
                      value={formData.contracted_users}
                      onChange={(e) => updateField('contracted_users', parseInt(e.target.value) || 1)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Subtotal: {formatCurrency(pricing.usersCost)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <Label>Canais de Atendimento</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium">1 Canal WhatsApp</p>
                      <p className="text-xs text-muted-foreground">Incluso na base</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="extra_channels">Canais Extras</Label>
                      <Input
                        id="extra_channels"
                        type="number"
                        min="0"
                        value={formData.extra_channels}
                        onChange={(e) => updateField('extra_channels', parseInt(e.target.value) || 0)}
                      />
                      <p className="text-xs text-muted-foreground">
                        R$ 19,90 por canal extra = {formatCurrency(pricing.extraChannelsCost)}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="implementation_fee">Taxa de Implementação (R$)</Label>
                    <Input
                      id="implementation_fee"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.implementation_fee}
                      onChange={(e) => updateField('implementation_fee', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Checkbox
                      id="charge_implementation"
                      checked={formData.charge_implementation}
                      onCheckedChange={(checked) => updateField('charge_implementation', !!checked)}
                    />
                    <Label htmlFor="charge_implementation" className="text-sm">
                      Cobrar no Stripe
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      (Se não, assume-se pago por fora)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Discount */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5" />
                  Negociação (Desconto)
                </CardTitle>
                <CardDescription>Aplique descontos para fechar a venda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discount_type">Tipo de Desconto</Label>
                    <Select
                      value={formData.discount_type || 'none'}
                      onValueChange={(v) => updateField('discount_type', v === 'none' ? null : v as 'percentage' | 'fixed')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sem desconto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem desconto</SelectItem>
                        <SelectItem value="percentage">Percentual (%)</SelectItem>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.discount_type && (
                    <div className="space-y-2">
                      <Label htmlFor="discount_value">
                        {formData.discount_type === 'percentage' ? 'Desconto (%)' : 'Desconto (R$)'}
                      </Label>
                      <Input
                        id="discount_value"
                        type="number"
                        step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                        min="0"
                        max={formData.discount_type === 'percentage' ? '100' : undefined}
                        value={formData.discount_value}
                        onChange={(e) => updateField('discount_value', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  )}
                </div>
                {pricing.discountAmount > 0 && (
                  <p className="text-sm text-green-600">
                    Economia mensal: {formatCurrency(pricing.discountAmount)}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Trial */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Período de Teste
                </CardTitle>
                <CardDescription>Configure trial gratuito</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="trial_enabled">Liberar Período de Teste</Label>
                    <p className="text-sm text-muted-foreground">
                      Cliente não será cobrado durante o trial
                    </p>
                  </div>
                  <Switch
                    id="trial_enabled"
                    checked={formData.trial_enabled}
                    onCheckedChange={(checked) => updateField('trial_enabled', checked)}
                  />
                </div>
                
                {formData.trial_enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="trial_days">Dias de Teste</Label>
                    <Select
                      value={String(formData.trial_days)}
                      onValueChange={(v) => updateField('trial_days', parseInt(v))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 dias</SelectItem>
                        <SelectItem value="15">15 dias</SelectItem>
                        <SelectItem value="30">30 dias</SelectItem>
                        <SelectItem value="60">60 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Limites de Consumo
                </CardTitle>
                <CardDescription>Soft limits para alertas e bloqueio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ai_token_limit">Limite de Tokens IA</Label>
                    <Input
                      id="ai_token_limit"
                      type="number"
                      min="0"
                      value={formData.ai_token_limit}
                      onChange={(e) => updateField('ai_token_limit', parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tokens de IA por mês
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storage_limit_gb">Limite de Storage (GB)</Label>
                    <Input
                      id="storage_limit_gb"
                      type="number"
                      min="0"
                      value={formData.storage_limit_gb}
                      onChange={(e) => updateField('storage_limit_gb', parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Armazenamento de arquivos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <Card className="border-primary/20">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Resumo do Contrato
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Usuários ({formData.contracted_users}x)</span>
                      <span>{formatCurrency(pricing.usersCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Canais extras ({formData.extra_channels}x)</span>
                      <span>{formatCurrency(pricing.extraChannelsCost)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal mensal</span>
                      <span>{formatCurrency(pricing.subtotal)}</span>
                    </div>
                    {pricing.discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Desconto</span>
                        <span>-{formatCurrency(pricing.discountAmount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total Mensal</span>
                      <span className="text-lg">{formatCurrency(pricing.monthlyTotal)}</span>
                    </div>
                  </div>

                  {formData.trial_enabled && (
                    <div className="p-3 rounded-lg bg-blue-500/10 text-blue-600 text-sm">
                      <Clock className="w-4 h-4 inline-block mr-2" />
                      {formData.trial_days} dias de teste grátis
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxa de Implementação</span>
                      <span>
                        {formData.charge_implementation 
                          ? formatCurrency(formData.implementation_fee)
                          : <span className="text-muted-foreground">Pago por fora</span>
                        }
                      </span>
                    </div>
                    {formData.charge_implementation && (
                      <>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>1ª Fatura</span>
                          <span className="text-lg text-primary">{formatCurrency(pricing.firstInvoice)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-3">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando Contrato...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Criar Contrato
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/tenants')}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
