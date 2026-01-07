import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Save, 
  Upload, 
  RefreshCw, 
  ArrowLeft, 
  Eye,
  Loader2
} from 'lucide-react';
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
import type { TemplateFormData, SyncResponse } from '@/types/templates';
import { defaultTemplateFormData } from '@/types/templates';

export default function TemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');
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
    // Save to localStorage for now
    const formData = methods.getValues();
    localStorage.setItem(`template_draft_${id || 'new'}`, JSON.stringify(formData));
    toast.success('Rascunho salvo localmente');
  };

  const handlePublish = () => {
    // Validate form before showing modal
    const formData = methods.getValues();
    
    // Basic validations
    if (!formData.slug || !/^[a-z0-9-]+$/.test(formData.slug)) {
      toast.error('Slug inválido. Use apenas letras minúsculas, números e hífens.');
      setActiveTab('basic');
      return;
    }
    
    if (!formData.name) {
      toast.error('Nome do template é obrigatório');
      setActiveTab('basic');
      return;
    }

    if (formData.funnel_stages.length < 2) {
      toast.error('O funil precisa ter pelo menos 2 etapas');
      setActiveTab('funnel');
      return;
    }

    if (!formData.prompts.greeting) {
      toast.error('Mensagem de saudação é obrigatória');
      setActiveTab('prompts');
      return;
    }

    if (!formData.prompts.system_prompt) {
      toast.error('System prompt é obrigatório');
      setActiveTab('prompts');
      return;
    }

    if (formData.quick_replies.length < 1) {
      toast.error('Pelo menos uma resposta rápida é necessária');
      setActiveTab('quick-replies');
      return;
    }

    setShowPublishModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar collapsed={!sidebarOpen} onCollapse={(c) => setSidebarOpen(!c)} mobileOpen={false} onMobileClose={() => {}} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-5xl mx-auto space-y-6">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-[600px] w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar collapsed={!sidebarOpen} onCollapse={(c) => setSidebarOpen(!c)} mobileOpen={false} onMobileClose={() => {}} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/templates')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {isNew ? 'Novo Template' : `Editar: ${template?.name || ''}`}
                  </h1>
                  {!isNew && template?.version && (
                    <p className="text-sm text-muted-foreground">Versão {template.version}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
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
                <CardContent className="p-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 mb-6">
                      <TabsTrigger value="basic">Básico</TabsTrigger>
                      <TabsTrigger value="funnel">Funil</TabsTrigger>
                      <TabsTrigger value="prompts">Prompts</TabsTrigger>
                      <TabsTrigger value="quick-replies">Respostas</TabsTrigger>
                      <TabsTrigger value="automations">Automações</TabsTrigger>
                      <TabsTrigger value="sla">SLA</TabsTrigger>
                      <TabsTrigger value="categories">Categorias</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic">
                      <TemplateBasicInfo />
                    </TabsContent>

                    <TabsContent value="funnel">
                      <FunnelStageEditor />
                    </TabsContent>

                    <TabsContent value="prompts">
                      <PromptEditor />
                    </TabsContent>

                    <TabsContent value="quick-replies">
                      <QuickRepliesEditor />
                    </TabsContent>

                    <TabsContent value="automations">
                      <AutomationFlowEditor />
                    </TabsContent>

                    <TabsContent value="sla">
                      <SLAConfigForm />
                    </TabsContent>

                    <TabsContent value="categories">
                      <ProductCategoriesEditor />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </FormProvider>
          </div>
        </main>
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
    </div>
  );
}
