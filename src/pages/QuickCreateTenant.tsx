import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { tenantsApi, CreateTenantPayload } from '@/services/masterApi';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  Building2, 
  AlertCircle, 
  Check, 
  Users, 
  Database, 
  Cpu, 
  HardDrive,
  Zap,
  Mail,
  Phone,
  Brain,
  Sparkles,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  max_users: number;
  max_leads: number | null;
  max_channels: number;
  max_storage_gb: number;
  max_ai_tokens: number;
  features_enabled: string[];
}

interface NicheTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatLimit(value: number | null): string {
  if (value === null || value === -1) return '∞';
  return value.toLocaleString('pt-BR');
}

const steps = [
  { id: 1, title: 'Dados Básicos', icon: Building2 },
  { id: 2, title: 'Template & Plano', icon: Brain },
  { id: 3, title: 'Revisão', icon: Check },
];

export default function QuickCreateTenant() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    template_id: '',
    plan_id: '',
  });

  // Fetch plans
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['plans-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Plan[];
    },
  });

  // Fetch niche templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['niche-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('niche_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as NicheTemplate[];
    },
  });

  const selectedPlan = plans?.find(p => p.id === formData.plan_id);
  const selectedTemplate = templates?.find(t => t.id === formData.template_id);

  const createMutation = useMutation({
    mutationFn: async () => {
      const plan = plans?.find(p => p.id === formData.plan_id);
      const payload: CreateTenantPayload = {
        name: formData.name,
        slug: formData.slug,
        subdomain: formData.slug,
        plan_type: plan?.slug || 'basic',
        plan_id: formData.plan_id,
        branding: {
          company_name: formData.name,
        },
      };
      
      const result = await tenantsApi.create(payload);
      if (result.error) throw new Error(result.error);
      
      // If template selected, apply it
      if (formData.template_id && result.data?.id) {
        const { error: onboardError } = await supabase
          .from('tenant_onboarding')
          .upsert({
            tenant_id: result.data.id,
            niche_template_id: formData.template_id,
            status: 'configuring',
          });
        
        if (onboardError) console.error('Error applying template:', onboardError);
      }

      // Update contact email if provided
      if (formData.email && result.data?.id) {
        await supabase
          .from('tenants')
          .update({ contact_email: formData.email })
          .eq('id', result.data.id);
      }
      
      return result.data;
    },
    onSuccess: (data) => {
      toast.success('Tenant criado com sucesso!');
      navigate(`/tenants/${data?.id || ''}`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: slugify(name),
    }));
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return formData.name.length >= 2 && formData.slug.length >= 2;
    }
    if (currentStep === 2) {
      return formData.plan_id !== '';
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else {
      createMutation.mutate();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate('/tenants');
    }
  };

  const isLoading = plansLoading || templatesLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/tenants')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              Criação Rápida de Tenant
            </h1>
            <p className="text-muted-foreground">
              3 passos simples para criar um novo cliente
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 px-4">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                    currentStep >= step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className={cn(
                  "text-xs mt-2 font-medium",
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "w-24 h-0.5 mx-4",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Dados do Cliente
                  </CardTitle>
                  <CardDescription>
                    Informações básicas para identificar o novo tenant
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome da Empresa *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Nome do cliente"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug (URL)</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="nome-do-cliente"
                      />
                      <p className="text-xs text-muted-foreground">
                        {formData.slug || 'slug'}.suaapp.com
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5" />
                        Email de Contato
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="contato@empresa.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" />
                        Telefone
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Template & Plan */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Template de Nicho
                  </CardTitle>
                  <CardDescription>
                    Selecione um template para pré-configurar a IA (opcional)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div
                      onClick={() => setFormData(prev => ({ ...prev, template_id: '' }))}
                      className={cn(
                        "p-4 rounded-lg border-2 cursor-pointer transition-all text-center",
                        formData.template_id === ''
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      <Sparkles className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <span className="text-sm font-medium">Sem template</span>
                      <p className="text-xs text-muted-foreground">Configurar manualmente</p>
                    </div>
                    {templates?.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => setFormData(prev => ({ ...prev, template_id: template.id }))}
                        className={cn(
                          "p-4 rounded-lg border-2 cursor-pointer transition-all text-center",
                          formData.template_id === template.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground"
                        )}
                      >
                        {formData.template_id === template.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                        <Brain className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <span className="text-sm font-medium">{template.name}</span>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {template.description || template.slug}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Plans */}
              <Card>
                <CardHeader>
                  <CardTitle>Plano *</CardTitle>
                  <CardDescription>Selecione o plano para este cliente</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans?.map((plan) => (
                      <div
                        key={plan.id}
                        onClick={() => setFormData(prev => ({ ...prev, plan_id: plan.id }))}
                        className={cn(
                          "relative p-4 rounded-lg border-2 cursor-pointer transition-all",
                          formData.plan_id === plan.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground"
                        )}
                      >
                        {formData.plan_id === plan.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                        
                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                        <div className="text-xl font-bold my-2">
                          R$ {plan.price_monthly.toFixed(2).replace('.', ',')}
                          <span className="text-sm font-normal text-muted-foreground">/mês</span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" />
                            <span>{formatLimit(plan.max_users)} usuários</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Database className="w-3.5 h-3.5" />
                            <span>{formatLimit(plan.max_leads)} leads</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Cpu className="w-3.5 h-3.5" />
                            <span>{formatLimit(plan.max_ai_tokens)} tokens IA</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <HardDrive className="w-3.5 h-3.5" />
                            <span>{plan.max_storage_gb} GB</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    Revisar e Criar
                  </CardTitle>
                  <CardDescription>
                    Confirme os dados antes de criar o tenant
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                        Dados do Cliente
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nome:</span>
                          <span className="font-medium">{formData.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">URL:</span>
                          <span className="font-mono text-sm">{formData.slug}.suaapp.com</span>
                        </div>
                        {formData.email && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span>{formData.email}</span>
                          </div>
                        )}
                        {formData.phone && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Telefone:</span>
                            <span>{formData.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                        Configuração
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Plano:</span>
                          <Badge variant="default">{selectedPlan?.name || '-'}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Template:</span>
                          <Badge variant={selectedTemplate ? "secondary" : "outline"}>
                            {selectedTemplate?.name || 'Nenhum'}
                          </Badge>
                        </div>
                        {selectedPlan && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Valor:</span>
                            <span className="font-semibold text-primary">
                              R$ {selectedPlan.price_monthly.toFixed(2).replace('.', ',')}/mês
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* What will be created */}
                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      O que será criado:
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                      <li>Tenant com dados de branding configurados</li>
                      <li>Limites do plano {selectedPlan?.name} aplicados</li>
                      {selectedTemplate && <li>Template "{selectedTemplate.name}" vinculado ao onboarding</li>}
                      <li>Pronto para adicionar usuários e configurar integrações</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Cancelar' : 'Voltar'}
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={!canProceed() || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : currentStep === 3 ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Criar Tenant
              </>
            ) : (
              <>
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
