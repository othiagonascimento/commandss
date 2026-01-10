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
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const queryClient = useQueryClient();
  
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

  // Save AI Engine settings
  const saveAiEngineMutation = useMutation({
    mutationFn: async () => {
      setIsSavingAiEngine(true);
      const { error } = await supabase
        .from('master_settings')
        .update({
          ai_layer_1_model: aiLayer1Model,
          ai_layer_1_instructions: aiLayer1Instructions,
          ai_layer_2_model: aiLayer2Model,
          ai_layer_2_instructions: aiLayer2Instructions,
          ai_layer_3_model: aiLayer3Model,
          ai_layer_3_instructions: aiLayer3Instructions,
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'ai_global_engine');
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Configurações do Motor de IA salvas com sucesso!');
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
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="general" className="gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="ai-engine" className="gap-2">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Motor de IA</span>
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
            <div className="space-y-6">
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
                        <Input
                          id="layer1Model"
                          value={aiLayer1Model}
                          onChange={(e) => setAiLayer1Model(e.target.value)}
                          placeholder="Ex: gpt-4o-mini, claude-3-haiku"
                        />
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
                        <Input
                          id="layer2Model"
                          value={aiLayer2Model}
                          onChange={(e) => setAiLayer2Model(e.target.value)}
                          placeholder="Ex: gpt-4o, claude-3-5-sonnet"
                        />
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
                        <Input
                          id="layer3Model"
                          value={aiLayer3Model}
                          onChange={(e) => setAiLayer3Model(e.target.value)}
                          placeholder="Ex: gpt-4o, claude-sonnet-4-5"
                        />
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
