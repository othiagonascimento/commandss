import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  Save, 
  Upload, 
  RefreshCw, 
  ArrowLeft, 
  Loader2,
  Menu,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { templatesApi, templateDataToFormData } from '@/services/templatesApi';
import { FunnelStageEditor } from '@/components/templates/FunnelStageEditor';
import { PromptEditor } from '@/components/templates/PromptEditor';
import { QuickRepliesEditor } from '@/components/templates/QuickRepliesEditor';
import { AutomationFlowEditor } from '@/components/templates/AutomationFlowEditor';
import { SLAConfigForm } from '@/components/templates/SLAConfigForm';
import { ProductCategoriesEditor } from '@/components/templates/ProductCategoriesEditor';
import { TemplateBasicInfo } from '@/components/templates/TemplateBasicInfo';
import { PublishModal } from '@/components/templates/PublishModal';
import { SyncResultsModal } from '@/components/templates/SyncResultsModal';
import { TemplateIdentityEditor } from '@/components/templates/TemplateIdentityEditor';
import { UopaAICoreEditor } from '@/components/templates/UopaAICoreEditor';
import { CopilotModeEditor } from '@/components/templates/CopilotModeEditor';
import { InsightsModeEditor } from '@/components/templates/InsightsModeEditor';
import { AIAgentsEditor } from '@/components/templates/AIAgentsEditor';
import { SalesPlaybookEditor } from '@/components/templates/SalesPlaybookEditor';
import { OperationsConfigEditor } from '@/components/templates/OperationsConfigEditor';
import { CatalogKnowledgeEditor } from '@/components/templates/CatalogKnowledgeEditor';
import { TemplateSubscribersTab } from '@/components/templates/TemplateSubscribersTab';
import type { TemplateFormData, SyncResponse, SLAConfig, OperatingHours } from '@/types/templates';
import { defaultTemplateFormData } from '@/types/templates';

const TABS = [
  { value: 'identity', label: 'Identidade', shortLabel: 'ID' },
  { value: 'funnel', label: 'Funil', shortLabel: 'Funil' },
  { value: 'uopa-core', label: 'Uôpa AI Core', shortLabel: 'Core' },
  { value: 'copilot', label: 'Copiloto', shortLabel: 'Copilot' },
  { value: 'insights', label: 'Insights', shortLabel: 'Insights' },
  { value: 'agents', label: 'Agentes', shortLabel: 'Agentes' },
  { value: 'playbook', label: 'Playbook', shortLabel: 'Play' },
  { value: 'automations', label: 'Automações', shortLabel: 'Auto' },
  { value: 'operations', label: 'Operações', shortLabel: 'Ops' },
  { value: 'catalog', label: 'Catálogo', shortLabel: 'Cat' },
  { value: 'subscribers', label: 'Assinantes', shortLabel: 'Subs' },
];

export default function TemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('identity');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResponse | null>(null);

  const methods = useForm<TemplateFormData>({
    defaultValues: defaultTemplateFormData,
  });

  const { data: template, isLoading } = useQuery({
    queryKey: ['template', id],
    queryFn: async () => {
      if (isNew) return null;
      const response = await templatesApi.get(id!);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    enabled: !isNew,
  });

  // Populate form when template loads
  useEffect(() => {
    if (template) {
      const formData = templateDataToFormData(template);
      methods.reset(formData);
    }
  }, [template, methods]);

  const publishMutation = useMutation({
    mutationFn: async ({ changelog, incrementMajor }: { changelog: string; incrementMajor: boolean }) => {
      const formData = methods.getValues();
      const response = await templatesApi.publish(formData, changelog, incrementMajor, isNew ? undefined : id);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Template ${data?.action === 'created' ? 'criado' : 'atualizado'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['template', id] });
      setShowPublishModal(false);
      if (isNew && data?.template_id) {
        navigate(`/admin/templates/${data.template_id}`, { replace: true });
      }
    },
    onError: (error) => {
      toast.error(`Erro ao publicar: ${error.message}`);
    },
  });

  const syncMutation = useMutation({
    mutationFn: async ({ forceSync }: { forceSync: boolean }) => {
      if (!id) throw new Error('Template ID não encontrado');
      const response = await templatesApi.sync(id, undefined, forceSync);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: (data) => {
      if (data) {
        setSyncResults(data);
        setShowSyncModal(true);
      }
    },
    onError: (error) => {
      toast.error(`Erro ao sincronizar: ${error.message}`);
    },
  });

  const handleSaveDraft = () => {
    const formData = methods.getValues();
    localStorage.setItem(`template_draft_${id || 'new'}`, JSON.stringify(formData));
    toast.success('Rascunho salvo localmente');
  };

  const handlePublish = () => {
    const formData = methods.getValues();
    
    if (!formData.slug || !/^[a-z0-9-]+$/.test(formData.slug)) {
      toast.error('Slug inválido. Use apenas letras minúsculas, números e hífens.');
      setActiveTab('identity');
      return;
    }
    
    if (!formData.name) {
      toast.error('Nome do template é obrigatório');
      setActiveTab('identity');
      return;
    }

    if (formData.funnel_stages.length < 3) {
      toast.error('O funil precisa ter pelo menos 3 etapas (incluindo Novos, Ganho e Perdido)');
      setActiveTab('funnel');
      return;
    }

    // Validate required system stages
    const hasWonStage = formData.funnel_stages.some(s => s.is_won === true);
    const hasLostStage = formData.funnel_stages.some(s => s.is_lost === true);
    const hasEntryStage = formData.funnel_stages.some(s => !s.is_won && !s.is_lost);

    if (!hasWonStage) {
      toast.error('O funil precisa ter pelo menos uma etapa marcada como "Ganho" 🏆');
      setActiveTab('funnel');
      return;
    }

    if (!hasLostStage) {
      toast.error('O funil precisa ter pelo menos uma etapa marcada como "Perdido" ❌');
      setActiveTab('funnel');
      return;
    }

    if (!hasEntryStage) {
      toast.error('O funil precisa ter pelo menos uma etapa de entrada (não marcada como Ganho ou Perdido)');
      setActiveTab('funnel');
      return;
    }

    if (!formData.prompts.greeting) {
      toast.error('Mensagem de saudação é obrigatória');
      setActiveTab('uopa-core');
      return;
    }

    if (!formData.prompts.system_prompt) {
      toast.error('System prompt é obrigatório');
      setActiveTab('uopa-core');
      return;
    }

    setShowPublishModal(true);
  };

  const currentTabLabel = TABS.find(t => t.value === activeTab)?.label || 'Identidade';

  // Helper to get default operating hours
  const getOperatingHours = (): OperatingHours => ({
    respect_business_hours: true,
    start_time: methods.getValues('operations.sla.working_hours_start') || '08:00',
    end_time: methods.getValues('operations.sla.working_hours_end') || '18:00',
    timezone: 'America/Sao_Paulo',
    working_days: methods.getValues('operations.sla.working_days') || [1, 2, 3, 4, 5],
    off_hours_message: methods.getValues('operations.out_of_hours_message') || '',
  });

  // Helper to convert operations SLA to SLAConfig format
  const getSLAConfig = (): SLAConfig => ({
    first_response_minutes: methods.getValues('operations.sla.first_response_minutes') || 5,
    first_response_seconds: (methods.getValues('operations.sla.first_response_minutes') || 5) * 60,
    resolution_minutes: 30,
    idle_timeout_minutes: 10,
    max_ai_messages: 10,
    follow_up_hours: methods.getValues('operations.sla.follow_up_hours') || 24,
    escalation_hours: methods.getValues('operations.sla.escalation_hours') || 48,
    working_hours: {
      start: methods.getValues('operations.sla.working_hours_start') || '08:00',
      end: methods.getValues('operations.sla.working_hours_end') || '18:00',
    },
    working_days: methods.getValues('operations.sla.working_days') || [1, 2, 3, 4, 5],
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 sm:gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/templates')} className="shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">
                    {isNew ? 'Novo Template' : `${template?.name || 'Editar Template'}`}
                  </h1>
                  {!isNew && template?.version && (
                    <p className="text-xs sm:text-sm text-muted-foreground">Versão {template.version}</p>
                  )}
                </div>
              </div>
              
              {/* Action Buttons - Mobile */}
              <div className="flex gap-2 sm:hidden">
                <Button variant="outline" size="sm" onClick={handleSaveDraft} className="flex-1">
                  <Save className="h-4 w-4 mr-1" />
                  Rascunho
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="flex-1">
                      <Menu className="h-4 w-4 mr-1" />
                      Ações
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!isNew && (
                      <DropdownMenuItem 
                        onClick={() => syncMutation.mutate({ forceSync: false })}
                        disabled={syncMutation.isPending}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sincronizar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handlePublish} disabled={publishMutation.isPending}>
                      <Upload className="h-4 w-4 mr-2" />
                      Publicar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Action Buttons - Desktop */}
              <div className="hidden sm:flex items-center gap-2 justify-end">
                <Button variant="outline" onClick={handleSaveDraft}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Rascunho
                </Button>
                
                {!isNew && (
                  <Button 
                    variant="outline" 
                    onClick={() => syncMutation.mutate({ forceSync: false })}
                    disabled={syncMutation.isPending}
                  >
                    {syncMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Sincronizar
                  </Button>
                )}
                
                <Button onClick={handlePublish} disabled={publishMutation.isPending}>
                  {publishMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Publicar
                </Button>
              </div>
            </div>

            {/* Form */}
            <FormProvider {...methods}>
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    {/* Mobile Tab Selector */}
                    <div className="sm:hidden mb-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            {currentTabLabel}
                            <ChevronDown className="h-4 w-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[200px]">
                          {TABS.map((tab) => (
                            <DropdownMenuItem
                              key={tab.value}
                              onClick={() => setActiveTab(tab.value)}
                              className={activeTab === tab.value ? 'bg-muted' : ''}
                            >
                              {tab.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Desktop Tabs */}
                    <ScrollArea className="hidden sm:block w-full">
                      <TabsList className="inline-flex w-full sm:w-auto mb-6">
                        {TABS.map((tab) => (
                          <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
                            <span className="hidden md:inline">{tab.label}</span>
                            <span className="md:hidden">{tab.shortLabel}</span>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>

                    <TabsContent value="identity">
                      <TemplateIdentityEditor />
                    </TabsContent>

                    <TabsContent value="funnel">
                      <FunnelStageEditor />
                    </TabsContent>

                    <TabsContent value="uopa-core">
                      <UopaAICoreEditor />
                    </TabsContent>

                    <TabsContent value="copilot">
                      <CopilotModeEditor
                        config={methods.watch('copilot_config')}
                        onChange={(config) => methods.setValue('copilot_config', config)}
                      />
                    </TabsContent>

                    <TabsContent value="insights">
                      <InsightsModeEditor
                        config={methods.watch('insights_config')}
                        onChange={(config) => methods.setValue('insights_config', config)}
                      />
                    </TabsContent>

                    <TabsContent value="agents">
                      <AIAgentsEditor
                        agents={methods.watch('agents')}
                        onChange={(agents) => methods.setValue('agents', agents)}
                      />
                    </TabsContent>

                    <TabsContent value="playbook">
                      <SalesPlaybookEditor
                        methodologies={methods.watch('playbook.methodologies')}
                        quickReplies={methods.watch('quick_replies')}
                        objectionHandlers={methods.watch('playbook.objection_handlers') as any}
                        closingScripts={methods.watch('playbook.closing_scripts')}
                        prohibitedPhrases={methods.watch('uopa_ai_core.prohibited_phrases')}
                        onChange={(data) => {
                          methods.setValue('playbook.methodologies', data.methodologies);
                          methods.setValue('quick_replies', data.quickReplies);
                          methods.setValue('playbook.objection_handlers', data.objectionHandlers as any);
                          methods.setValue('playbook.closing_scripts', data.closingScripts);
                          methods.setValue('uopa_ai_core.prohibited_phrases', data.prohibitedPhrases);
                        }}
                      />
                    </TabsContent>

                    <TabsContent value="automations">
                      <AutomationFlowEditor />
                    </TabsContent>

                    <TabsContent value="operations">
                      <OperationsConfigEditor
                        slaConfig={getSLAConfig()}
                        escalationRules={methods.watch('operations.escalation_rules')}
                        successMetrics={methods.watch('operations.success_metrics')}
                        operatingHours={getOperatingHours()}
                        onChange={(data) => {
                          methods.setValue('operations.sla.first_response_minutes', data.slaConfig.first_response_minutes);
                          methods.setValue('operations.sla.follow_up_hours', data.slaConfig.follow_up_hours);
                          methods.setValue('operations.sla.escalation_hours', data.slaConfig.escalation_hours);
                          methods.setValue('operations.sla.working_hours_start', data.operatingHours.start_time);
                          methods.setValue('operations.sla.working_hours_end', data.operatingHours.end_time);
                          methods.setValue('operations.sla.working_days', data.operatingHours.working_days);
                          methods.setValue('operations.escalation_rules', data.escalationRules);
                          methods.setValue('operations.success_metrics', data.successMetrics);
                          methods.setValue('operations.out_of_hours_message', data.operatingHours.off_hours_message);
                        }}
                      />
                    </TabsContent>

                    <TabsContent value="catalog">
                      <CatalogKnowledgeEditor
                        products={methods.watch('catalog.products')}
                        knowledgeArticles={methods.watch('catalog.general_policies').map(p => ({
                          id: p.id,
                          title: p.question,
                          content: p.answer,
                          category: p.category,
                          tags: p.keywords
                        }))}
                        competitors={methods.watch('catalog.competitors')}
                        onChange={(data) => {
                          methods.setValue('catalog.products', data.products);
                          methods.setValue('catalog.competitors', data.competitors);
                        }}
                      />
                    </TabsContent>

                    <TabsContent value="subscribers">
                      {!isNew && id ? (
                        <TemplateSubscribersTab templateId={id} />
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Salve o template primeiro para gerenciar assinantes.
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </FormProvider>
          </div>
      {/* Modals */}
      <PublishModal
        open={showPublishModal}
        onOpenChange={setShowPublishModal}
        onPublish={(changelog, incrementMajor) => publishMutation.mutate({ changelog, incrementMajor })}
        isLoading={publishMutation.isPending}
        isNew={isNew}
      />

      <SyncResultsModal
        open={showSyncModal}
        onOpenChange={setShowSyncModal}
        results={syncResults}
      />
    </DashboardLayout>
  );
}
