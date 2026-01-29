import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGroupedModels } from '@/hooks/useAvailableModels';
import { ModelCatalogManager } from '@/components/ai-engine/ModelCatalogManager';
import { 
  Settings as SettingsIcon,
  Bell,
  Shield,
  Palette,
  Globe,
  Mail,
  Database,
  Key,
  Save,
  RefreshCw,
  Loader2,
  Brain,
  Cpu,
  Sparkles,
  Zap,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const queryClient = useQueryClient();
  const { grouped: modelsByCategory, isLoading: isLoadingModels } = useGroupedModels();
  
  // General settings
  const [systemName, setSystemName] = useState('UOPA Master');
  const [supportEmail, setSupportEmail] = useState('suporte@uopa.com.br');
  const [defaultLanguage, setDefaultLanguage] = useState('pt-BR');
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newTenantNotification, setNewTenantNotification] = useState(true);
  const [paymentNotification, setPaymentNotification] = useState(true);
  const [errorAlerts, setErrorAlerts] = useState(true);
  
  // Security settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [ipWhitelist, setIpWhitelist] = useState('');

  // AI Engine settings
  const [aiLayer1Model, setAiLayer1Model] = useState('');
  const [aiLayer1Instructions, setAiLayer1Instructions] = useState('');
  const [aiLayer2Model, setAiLayer2Model] = useState('');
  const [aiLayer2Instructions, setAiLayer2Instructions] = useState('');
  const [aiLayer3Model, setAiLayer3Model] = useState('');
  const [aiLayer3Instructions, setAiLayer3Instructions] = useState('');
  const [isLoadingAiEngine, setIsLoadingAiEngine] = useState(false);
  const [isSavingAiEngine, setIsSavingAiEngine] = useState(false);

  // Global Base Prompts
  const [basePrompts, setBasePrompts] = useState({
    system_prompt_base: '',
    greeting_base: '',
    qualification_criteria_base: '',
    objection_handlers_base: '',
    closing_techniques_base: '',
    follow_up_rules_base: '',
  });
  const [isSavingBasePrompts, setIsSavingBasePrompts] = useState(false);

  // Load AI Engine settings
  const { data: aiEngineSettings, isLoading: isLoadingAiSettings, refetch: refetchAiSettings } = useQuery({
    queryKey: ['ai-engine-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('master_settings')
        .select('*')
        .eq('key', 'ai_global_engine')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Load Global Base Prompts
  const { data: basePromptsData, isLoading: isLoadingBasePrompts } = useQuery({
    queryKey: ['global-base-prompts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('master_settings')
        .select('*')
        .eq('key', 'global_base_prompts')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Update AI state when settings load
  useEffect(() => {
    if (aiEngineSettings) {
      setAiLayer1Model(aiEngineSettings.ai_layer_1_model || '');
      setAiLayer1Instructions(aiEngineSettings.ai_layer_1_instructions || '');
      setAiLayer2Model(aiEngineSettings.ai_layer_2_model || '');
      setAiLayer2Instructions(aiEngineSettings.ai_layer_2_instructions || '');
      setAiLayer3Model(aiEngineSettings.ai_layer_3_model || '');
      setAiLayer3Instructions(aiEngineSettings.ai_layer_3_instructions || '');
    }
  }, [aiEngineSettings]);

  // Update base prompts state when loaded
  useEffect(() => {
    if (basePromptsData?.value) {
      const v = basePromptsData.value as Record<string, string>;
      setBasePrompts({
        system_prompt_base: v.system_prompt_base || '',
        greeting_base: v.greeting_base || '',
        qualification_criteria_base: v.qualification_criteria_base || '',
        objection_handlers_base: v.objection_handlers_base || '',
        closing_techniques_base: v.closing_techniques_base || '',
        follow_up_rules_base: v.follow_up_rules_base || '',
      });
    }
  }, [basePromptsData]);

  // Save Global Base Prompts
  const saveBasePromptsMutation = useMutation({
    mutationFn: async () => {
      setIsSavingBasePrompts(true);
      // Check if record exists
      const { data: existing } = await supabase
        .from('master_settings')
        .select('id')
        .eq('key', 'global_base_prompts')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('master_settings')
          .update({
            value: basePrompts,
            updated_at: new Date().toISOString(),
          })
          .eq('key', 'global_base_prompts');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('master_settings')
          .insert({
            key: 'global_base_prompts',
            category: 'prompts',
            description: 'Prompts base globais que servem como fundação para todos os templates',
            value: basePrompts,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Prompts base salvos com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['global-base-prompts'] });
      setIsSavingBasePrompts(false);
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar prompts base: ${err.message}`);
      setIsSavingBasePrompts(false);
    },
  });

  // Save AI Engine settings via Edge Function (triggers webhook to tenants)
  const saveAiEngineMutation = useMutation({
    mutationFn: async () => {
      setIsSavingAiEngine(true);
      // Use Edge Function PATCH to trigger webhook propagation to tenants
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || 'https://btoyclznuuwvxbsacemw.supabase.co'}/functions/v1/master-settings`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            key: 'ai_global_engine',
            ai_layer_1_model: aiLayer1Model,
            ai_layer_1_instructions: aiLayer1Instructions,
            ai_layer_2_model: aiLayer2Model,
            ai_layer_2_instructions: aiLayer2Instructions,
            ai_layer_3_model: aiLayer3Model,
            ai_layer_3_instructions: aiLayer3Instructions,
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save AI settings');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Configurações do Motor de IA salvas e propagadas aos tenants!');
      queryClient.invalidateQueries({ queryKey: ['ai-engine-settings'] });
      setIsSavingAiEngine(false);
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar Motor de IA: ${err.message}`);
      setIsSavingAiEngine(false);
    },
  });

  // Load settings from database
  const { data: settings, isLoading } = useQuery({
    queryKey: ['master-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('master-settings', {
        method: 'GET',
      });
      if (error) throw error;
      return data;
    },
  });

  // Update local state when settings load
  useEffect(() => {
    if (settings?.data) {
      const g = settings.data.general || {};
      const n = settings.data.notifications || {};
      const s = settings.data.security || {};
      const a = settings.data.appearance || {};
      
      if (g.system_name) setSystemName(g.system_name);
      if (g.support_email) setSupportEmail(g.support_email);
      if (g.default_language) setDefaultLanguage(g.default_language);
      
      if (n.email_notifications !== undefined) setEmailNotifications(n.email_notifications);
      if (n.new_tenant_notification !== undefined) setNewTenantNotification(n.new_tenant_notification);
      if (n.payment_notification !== undefined) setPaymentNotification(n.payment_notification);
      if (n.error_alerts !== undefined) setErrorAlerts(n.error_alerts);
      
      if (s.two_factor_enabled !== undefined) setTwoFactorEnabled(s.two_factor_enabled);
      if (s.session_timeout) setSessionTimeout(String(s.session_timeout));
      if (s.ip_whitelist) setIpWhitelist(s.ip_whitelist);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('master-settings', {
        method: 'PUT',
        body: {
          system_name: systemName,
          support_email: supportEmail,
          default_language: defaultLanguage,
          email_notifications: emailNotifications,
          new_tenant_notification: newTenantNotification,
          payment_notification: paymentNotification,
          error_alerts: errorAlerts,
          two_factor_enabled: twoFactorEnabled,
          session_timeout: sessionTimeout,
          ip_whitelist: ipWhitelist,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Configurações salvas com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['master-settings'] });
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar: ${err.message}`);
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Configurações"
        description="Gerencie as configurações do sistema master"
        icon={SettingsIcon}
        actions={
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Alterações
          </Button>
        }
      />

        {/* Tabs */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="general" className="gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="ai-engine" className="gap-2">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Motor de IA</span>
            </TabsTrigger>
            <TabsTrigger value="base-prompts" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Prompts Base</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">API</span>
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Informações do Sistema
                  </CardTitle>
                  <CardDescription>
                    Configurações gerais do sistema master
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="systemName">Nome do Sistema</Label>
                    <Input
                      id="systemName"
                      value={systemName}
                      onChange={(e) => setSystemName(e.target.value)}
                      placeholder="Nome do sistema"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="supportEmail">Email de Suporte</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="suporte@exemplo.com"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="defaultLanguage">Idioma Padrão</Label>
                    <Input
                      id="defaultLanguage"
                      value={defaultLanguage}
                      onChange={(e) => setDefaultLanguage(e.target.value)}
                      placeholder="pt-BR"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Aparência
                  </CardTitle>
                  <CardDescription>
                    Personalize a aparência do painel master
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Tema Escuro</p>
                      <p className="text-sm text-muted-foreground">
                        Ativar tema escuro por padrão
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Animações</p>
                      <p className="text-sm text-muted-foreground">
                        Ativar animações da interface
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Engine Tab */}
          <TabsContent value="ai-engine">
            <Tabs defaultValue="config" className="space-y-6">
              <TabsList>
                <TabsTrigger value="config">Configuração</TabsTrigger>
                <TabsTrigger value="catalog">Catálogo de Modelos</TabsTrigger>
              </TabsList>

              {/* Config Sub-Tab */}
              <TabsContent value="config" className="space-y-6 mt-0">
                {/* Header with Save Button */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Brain className="w-5 h-5 text-primary" />
                      Motor de IA Global
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Configure os modelos e instruções de IA que afetam todos os tenants
                    </p>
                  </div>
                  <Button 
                    onClick={() => saveAiEngineMutation.mutate()}
                    disabled={isSavingAiEngine}
                  >
                    {isSavingAiEngine ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Salvar Configurações
                  </Button>
                </div>

                {isLoadingAiSettings ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {/* Layer 1 - Router */}
                    <Card className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Cpu className="w-4 h-4 text-blue-500" />
                          </div>
                          <div>
                            <span>Camada 1 - Router</span>
                            <p className="text-sm font-normal text-muted-foreground">
                              Modelo rápido para triagem e roteamento de mensagens
                            </p>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="layer1Model">Modelo</Label>
                          <Select
                            value={aiLayer1Model}
                            onValueChange={setAiLayer1Model}
                          >
                            <SelectTrigger id="layer1Model">
                              <SelectValue placeholder="Selecione um modelo" />
                            </SelectTrigger>
                            <SelectContent>
                              {modelsByCategory.router.map((model) => (
                                <SelectItem key={model.id} value={model.model_id}>
                                  <div className="flex items-center gap-2">
                                    <span>{model.display_name}</span>
                                    <span className="text-xs text-muted-foreground">({model.provider})</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Recomendado: modelo leve e rápido para decisões simples
                          </p>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="layer1Instructions">Instruções do Sistema</Label>
                          <Textarea
                            id="layer1Instructions"
                            value={aiLayer1Instructions}
                            onChange={(e) => setAiLayer1Instructions(e.target.value)}
                            placeholder="Você é um assistente que classifica mensagens..."
                            rows={8}
                            className="font-mono text-sm"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Layer 2 - Standard */}
                    <Card className="border-l-4 border-l-amber-500">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-amber-500" />
                          </div>
                          <div>
                            <span>Camada 2 - Standard</span>
                            <p className="text-sm font-normal text-muted-foreground">
                              Modelo balanceado para interações comuns
                            </p>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="layer2Model">Modelo</Label>
                          <Select
                            value={aiLayer2Model}
                            onValueChange={setAiLayer2Model}
                          >
                            <SelectTrigger id="layer2Model">
                              <SelectValue placeholder="Selecione um modelo" />
                            </SelectTrigger>
                            <SelectContent>
                              {modelsByCategory.standard.map((model) => (
                                <SelectItem key={model.id} value={model.model_id}>
                                  <div className="flex items-center gap-2">
                                    <span>{model.display_name}</span>
                                    <span className="text-xs text-muted-foreground">({model.provider})</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Recomendado: modelo versátil com bom custo-benefício
                          </p>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="layer2Instructions">Instruções do Sistema</Label>
                          <Textarea
                            id="layer2Instructions"
                            value={aiLayer2Instructions}
                            onChange={(e) => setAiLayer2Instructions(e.target.value)}
                            placeholder="Você é um vendedor experiente..."
                            rows={8}
                            className="font-mono text-sm"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Layer 3 - Elite */}
                    <Card className="border-l-4 border-l-purple-500">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-purple-500" />
                          </div>
                          <div>
                            <span>Camada 3 - Elite (Vendedor)</span>
                            <p className="text-sm font-normal text-muted-foreground">
                              Modelo premium para objeções complexas e fechamento
                            </p>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="layer3Model">Modelo</Label>
                          <Select
                            value={aiLayer3Model}
                            onValueChange={setAiLayer3Model}
                          >
                            <SelectTrigger id="layer3Model">
                              <SelectValue placeholder="Selecione um modelo" />
                            </SelectTrigger>
                            <SelectContent>
                              {modelsByCategory.elite.map((model) => (
                                <SelectItem key={model.id} value={model.model_id}>
                                  <div className="flex items-center gap-2">
                                    <span>{model.display_name}</span>
                                    <span className="text-xs text-muted-foreground">({model.provider})</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Recomendado: modelo mais capaz para situações críticas
                          </p>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="layer3Instructions">Instruções do Sistema</Label>
                          <Textarea
                            id="layer3Instructions"
                            value={aiLayer3Instructions}
                            onChange={(e) => setAiLayer3Instructions(e.target.value)}
                            placeholder="Você é um vendedor de elite..."
                            rows={10}
                            className="font-mono text-sm"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Info Box */}
                    <Card className="bg-muted/50">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <Brain className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium">Como funciona o Motor de IA</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              As configurações definidas aqui são aplicadas globalmente a todos os tenants. 
                              Cada camada é acionada conforme a complexidade da conversa:
                            </p>
                            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                              <li><strong>Router:</strong> Triagem rápida e classificação de intenção</li>
                              <li><strong>Standard:</strong> Respostas de atendimento e vendas comuns</li>
                              <li><strong>Elite:</strong> Objeções complexas, negociação e fechamento</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* Catalog Sub-Tab */}
              <TabsContent value="catalog" className="mt-0">
                <ModelCatalogManager />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Base Prompts Tab */}
          <TabsContent value="base-prompts">
            <div className="space-y-6">
              {/* Header with Save Button */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Prompts Base Globais
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Estes prompts servem como fundação para todos os templates. Templates podem complementar ou substituir partes específicas.
                  </p>
                </div>
                <Button 
                  onClick={() => saveBasePromptsMutation.mutate()}
                  disabled={isSavingBasePrompts}
                >
                  {isSavingBasePrompts ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar Prompts Base
                </Button>
              </div>

              {isLoadingBasePrompts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-6">
                  {/* System Prompt Base */}
                  <Card className="border-l-4 border-l-primary">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Prompt de Sistema Base
                      </CardTitle>
                      <CardDescription>
                        Instruções fundamentais que definem a personalidade e comportamento da IA. Templates herdam ou estendem este prompt.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={basePrompts.system_prompt_base}
                        onChange={(e) => setBasePrompts(prev => ({ ...prev, system_prompt_base: e.target.value }))}
                        placeholder="Você é um assistente de vendas especializado. Sempre seja cordial e profissional..."
                        rows={12}
                        className="font-mono text-sm"
                      />
                    </CardContent>
                  </Card>

                  {/* Greeting Base */}
                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-green-500" />
                        Saudação Base
                      </CardTitle>
                      <CardDescription>
                        Modelo de primeira mensagem para novos leads.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={basePrompts.greeting_base}
                        onChange={(e) => setBasePrompts(prev => ({ ...prev, greeting_base: e.target.value }))}
                        placeholder="Olá! 👋 Que bom ter você aqui. Como posso ajudar?"
                        rows={4}
                        className="font-mono text-sm"
                      />
                    </CardContent>
                  </Card>

                  {/* Qualification Criteria Base */}
                  <Card className="border-l-4 border-l-amber-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-amber-500" />
                        Critérios de Qualificação Base
                      </CardTitle>
                      <CardDescription>
                        Regras para qualificar leads e identificar interesse.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={basePrompts.qualification_criteria_base}
                        onChange={(e) => setBasePrompts(prev => ({ ...prev, qualification_criteria_base: e.target.value }))}
                        placeholder="Identifique o nível de interesse, orçamento disponível e urgência da compra..."
                        rows={6}
                        className="font-mono text-sm"
                      />
                    </CardContent>
                  </Card>

                  {/* Objection Handlers Base */}
                  <Card className="border-l-4 border-l-red-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-red-500" />
                        Tratamento de Objeções Base
                      </CardTitle>
                      <CardDescription>
                        Estratégias padrão para lidar com objeções comuns.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={basePrompts.objection_handlers_base}
                        onChange={(e) => setBasePrompts(prev => ({ ...prev, objection_handlers_base: e.target.value }))}
                        placeholder="Quando o cliente diz que está caro, valide a preocupação e demonstre valor..."
                        rows={8}
                        className="font-mono text-sm"
                      />
                    </CardContent>
                  </Card>

                  {/* Closing Techniques Base */}
                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        Técnicas de Fechamento Base
                      </CardTitle>
                      <CardDescription>
                        Estratégias para conduzir o lead ao fechamento.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={basePrompts.closing_techniques_base}
                        onChange={(e) => setBasePrompts(prev => ({ ...prev, closing_techniques_base: e.target.value }))}
                        placeholder="Use perguntas de fechamento como: 'Qual a melhor forma de pagamento para você?'"
                        rows={6}
                        className="font-mono text-sm"
                      />
                    </CardContent>
                  </Card>

                  {/* Follow Up Rules Base */}
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-blue-500" />
                        Regras de Follow-up Base
                      </CardTitle>
                      <CardDescription>
                        Diretrizes para mensagens de acompanhamento.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={basePrompts.follow_up_rules_base}
                        onChange={(e) => setBasePrompts(prev => ({ ...prev, follow_up_rules_base: e.target.value }))}
                        placeholder="Após 24h sem resposta, envie uma mensagem casual perguntando se pode ajudar..."
                        rows={6}
                        className="font-mono text-sm"
                      />
                    </CardContent>
                  </Card>

                  {/* Info Box */}
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <Brain className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Como funciona a Composição de Prompts</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Os prompts base definidos aqui são herdados por todos os templates de nicho. Cada template pode:
                          </p>
                          <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                            <li><strong>Herdar:</strong> Usar o prompt base exatamente como está</li>
                            <li><strong>Complementar:</strong> Adicionar instruções específicas ao prompt base</li>
                            <li><strong>Substituir:</strong> Ignorar o prompt base e usar um completamente diferente</li>
                            <li><strong>Excluir:</strong> Remover comportamentos específicos do prompt base</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Preferências de Notificação
                </CardTitle>
                <CardDescription>
                  Configure como e quando receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificações por Email</p>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações importantes por email
                    </p>
                  </div>
                  <Switch 
                    checked={emailNotifications} 
                    onCheckedChange={setEmailNotifications} 
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Novo Tenant Cadastrado</p>
                      <p className="text-sm text-muted-foreground">
                        Notificar quando um novo tenant for criado
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={newTenantNotification} 
                    onCheckedChange={setNewTenantNotification} 
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Pagamentos</p>
                      <p className="text-sm text-muted-foreground">
                        Notificar sobre pagamentos recebidos ou falhas
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={paymentNotification} 
                    onCheckedChange={setPaymentNotification} 
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Alertas de Erro</p>
                      <p className="text-sm text-muted-foreground">
                        Receber alertas quando ocorrerem erros críticos
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={errorAlerts} 
                    onCheckedChange={setErrorAlerts} 
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Autenticação
                  </CardTitle>
                  <CardDescription>
                    Configurações de segurança e autenticação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Autenticação de Dois Fatores</p>
                      <p className="text-sm text-muted-foreground">
                        Exigir 2FA para todos os administradores
                      </p>
                    </div>
                    <Switch 
                      checked={twoFactorEnabled} 
                      onCheckedChange={setTwoFactorEnabled} 
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="grid gap-2">
                    <Label htmlFor="sessionTimeout">Timeout de Sessão (minutos)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      placeholder="30"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tempo máximo de inatividade antes de encerrar a sessão
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="ipWhitelist">IP Whitelist</Label>
                    <Input
                      id="ipWhitelist"
                      value={ipWhitelist}
                      onChange={(e) => setIpWhitelist(e.target.value)}
                      placeholder="192.168.1.1, 10.0.0.0/24"
                    />
                    <p className="text-xs text-muted-foreground">
                      IPs permitidos para acessar o painel (separados por vírgula)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    Logs de Acesso
                  </CardTitle>
                  <CardDescription>
                    Histórico de acessos ao sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Logs de acesso em breve</p>
                    <p className="text-sm">Esta funcionalidade está em desenvolvimento</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Chaves de API
                </CardTitle>
                <CardDescription>
                  Gerencie as chaves de API do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">API Key Principal</p>
                    <Badge variant="secondary">Ativa</Badge>
                  </div>
                  <code className="text-sm text-muted-foreground block mb-3">
                    sk_live_••••••••••••••••••••••••
                  </code>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Copiar</Button>
                    <Button variant="outline" size="sm">Regenerar</Button>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Endpoints Disponíveis</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><code className="bg-muted px-1 rounded">GET /api/tenants</code> - Listar tenants</p>
                    <p><code className="bg-muted px-1 rounded">GET /api/analytics</code> - Métricas do sistema</p>
                    <p><code className="bg-muted px-1 rounded">POST /api/tenants</code> - Criar tenant</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rate Limiting</p>
                    <p className="text-sm text-muted-foreground">
                      1000 requisições por minuto
                    </p>
                  </div>
                  <Badge>Padrão</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </DashboardLayout>
  );
}
