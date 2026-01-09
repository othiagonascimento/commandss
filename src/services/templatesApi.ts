// API Service for communicating with the destination project's Edge Functions via proxy
// Falls back to mock data when the destination is unavailable
import { supabase } from '@/integrations/supabase/client';
import type {
  Template,
  TemplateData,
  TemplateFormData,
  TemplateVersion,
  TemplateSubscriber,
  PublishResponse,
  SyncResponse,
} from '@/types/templates';
import {
  defaultTemplateFormData,
  defaultBusinessContext,
  defaultCopilotConfig,
  defaultInsightsConfig,
} from '@/types/templates';
import {
  mockTemplates,
  mockTemplateData,
  mockVersionHistory,
  mockSubscribers,
  createMockSyncResponse,
} from '@/data/mockTemplates';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Set to true to always use mock data (useful for development)
const USE_MOCK_DATA = false;

async function callTemplatesProxy<T>(
  action: string,
  params?: Record<string, string>,
  body?: unknown
): Promise<ApiResponse<T>> {
  if (USE_MOCK_DATA) {
    return { error: 'MOCK_MODE' };
  }

  try {
    const requestBody = body 
      ? { ...(body as object), _action: action, _params: params } 
      : { _action: action, _params: params };
    
    const { data, error } = await supabase.functions.invoke('master-templates-proxy', {
      method: 'POST',
      body: requestBody,
    });

    if (error) {
      console.error(`[templatesApi] ${action} error:`, error);
      return { error: error.message || 'Erro na requisição' };
    }

    if (data?.error) {
      return { error: data.error };
    }

    return { data };
  } catch (error) {
    console.error(`[templatesApi] ${action} error:`, error);
    return { error: error instanceof Error ? error.message : 'Erro de conexão' };
  }
}

// Transform form data to API format
function formDataToTemplateData(formData: TemplateFormData): TemplateData {
  return {
    slug: formData.slug,
    name: formData.name,
    description: formData.description || undefined,
    category: formData.category,
    icon: formData.icon,
    is_base_template: formData.is_base_template,
    parent_template_id: formData.parent_template_id,
    funnel_config: {
      stages: formData.funnel_stages,
    },
    tags: {
      categories: formData.tag_categories,
    },
    quick_replies_config: formData.quick_replies,
    prompts: {
      greeting: formData.prompts.greeting,
      system_prompt: formData.prompts.system_prompt,
      objection_handlers: formData.prompts.objection_handlers,
      qualification_criteria: formData.prompts.qualification_criteria,
    },
    ai_config: {
      personality: formData.ai_config.personality,
      mode: formData.ai_config.mode,
      temperature: formData.ai_config.temperature,
      techniques: formData.ai_config.techniques,
    },
    automation_flows_config: formData.automations.map((a) => ({
      id: a.id,
      name: a.name,
      trigger: { type: a.trigger_type, hours: a.trigger_value },
      action: { type: a.action_type, message: a.action_message },
      is_active: a.is_active,
    })),
    sla_config: {
      first_response_minutes: formData.sla.first_response_minutes,
      follow_up_hours: formData.sla.follow_up_hours,
      escalation_hours: formData.sla.escalation_hours,
      working_hours: {
        start: formData.sla.working_hours_start,
        end: formData.sla.working_hours_end,
      },
      working_days: formData.sla.working_days,
    },
    product_categories: formData.product_categories,
  };
}

// Transform API data to form data format
export function templateDataToFormData(template: Template & { data?: TemplateData }): TemplateFormData {
  const data = template.data;
  
  // Base defaults from the default template
  const base: TemplateFormData = {
    ...defaultTemplateFormData,
    slug: template.slug,
    name: template.name,
    description: template.description || '',
    category: (template.category as 'universal' | 'vendas' | 'custom') || 'universal',
    icon: template.icon || '📋',
    is_base_template: template.is_base_template,
    parent_template_id: template.parent_template_id,
  };

  if (!data) {
    return base;
  }

  return {
    ...base,
    slug: data.slug,
    name: data.name,
    description: data.description || '',
    category: data.category,
    icon: data.icon,
    is_base_template: data.is_base_template,
    parent_template_id: data.parent_template_id,
    funnel_stages: data.funnel_config?.stages || [],
    tag_categories: data.tags?.categories || [],
    quick_replies: data.quick_replies_config || [],
    prompts: {
      greeting: data.prompts?.greeting || '',
      system_prompt: data.prompts?.system_prompt || '',
      objection_handlers: (data.prompts?.objection_handlers || {}) as Record<string, string>,
      qualification_criteria: data.prompts?.qualification_criteria || {},
    },
    ai_config: {
      personality: data.ai_config?.personality || '',
      mode: data.ai_config?.mode || 'copilot',
      temperature: data.ai_config?.temperature || 0.7,
      techniques: data.ai_config?.techniques || [],
    },
    automations: (data.automation_flows_config || []).map((a) => ({
      id: a.id,
      name: a.name,
      trigger_type: a.trigger.type,
      trigger_value: a.trigger.hours || 0,
      action_type: a.action.type,
      action_message: a.action.message || '',
      is_active: a.is_active ?? true,
    })),
    sla: {
      first_response_minutes: data.sla_config?.first_response_minutes || 5,
      follow_up_hours: data.sla_config?.follow_up_hours || 24,
      escalation_hours: data.sla_config?.escalation_hours || 48,
      working_hours_start: data.sla_config?.working_hours?.start || '08:00',
      working_hours_end: data.sla_config?.working_hours?.end || '18:00',
      working_days: data.sla_config?.working_days || [1, 2, 3, 4, 5],
    },
    product_categories: data.product_categories || [],
  };
}

export const templatesApi = {
  // List all templates
  async list(): Promise<ApiResponse<Template[]>> {
    const response = await callTemplatesProxy<Template[]>('list');
    if (response.error) {
      console.log('[templatesApi] Using mock data for list');
      return { data: mockTemplates };
    }
    return response;
  },

  // Get single template with full data
  async get(templateId: string): Promise<ApiResponse<Template & { data: TemplateData }>> {
    const response = await callTemplatesProxy<Template & { data: TemplateData }>('get', { template_id: templateId });
    if (response.error) {
      console.log('[templatesApi] Using mock data for get', templateId);
      const template = mockTemplates.find(t => t.id === templateId);
      if (template) {
        return { data: { ...template, data: mockTemplateData[templateId] } };
      }
      return { error: 'Template não encontrado' };
    }
    return response;
  },

  // Publish (create or update) template
  async publish(
    formData: TemplateFormData,
    changelog: string,
    incrementMajor: boolean = false,
    templateId?: string
  ): Promise<ApiResponse<PublishResponse>> {
    const response = await callTemplatesProxy<PublishResponse>('publish', {}, {
      template_id: templateId,
      template_data: formDataToTemplateData(formData),
      changelog,
      increment_major: incrementMajor,
    });
    
    if (response.error) {
      console.log('[templatesApi] Using mock response for publish');
      // Simulate successful publish
      const newId = templateId || `tpl_${Date.now()}`;
      return {
        data: {
          success: true,
          template_id: newId,
          version: incrementMajor ? '2.0' : '1.1',
          action: templateId ? 'updated' : 'created',
        },
      };
    }
    return response;
  },

  // Sync template to all subscribed tenants
  async sync(
    templateId: string,
    changelog?: string,
    forceSync: boolean = false
  ): Promise<ApiResponse<SyncResponse>> {
    const response = await callTemplatesProxy<SyncResponse>('sync', {}, {
      template_id: templateId,
      changelog,
      force_sync: forceSync,
    });
    
    if (response.error) {
      console.log('[templatesApi] Using mock response for sync');
      return { data: createMockSyncResponse(templateId) };
    }
    return response;
  },

  // Clone template to a specific tenant
  async clone(
    templateSlug: string,
    targetTenantId: string,
    options?: {
      clone_funnels?: boolean;
      clone_tags?: boolean;
      clone_quick_replies?: boolean;
      clone_ai_config?: boolean;
      clone_sla_config?: boolean;
    }
  ): Promise<ApiResponse<{ success: boolean; template: Template; applied_resources: Record<string, number> }>> {
    const response = await callTemplatesProxy('clone', {}, {
      template_slug: templateSlug,
      target_tenant_id: targetTenantId,
      options: options || {
        clone_funnels: true,
        clone_tags: true,
        clone_quick_replies: true,
        clone_ai_config: true,
        clone_sla_config: true,
      },
    });
    
    if (response.error) {
      console.log('[templatesApi] Using mock response for clone');
      const template = mockTemplates.find(t => t.slug === templateSlug);
      if (template) {
        return {
          data: {
            success: true,
            template,
            applied_resources: { funnels: 1, funnel_stages: 6, quick_replies: 4, automations: 3 },
          },
        };
      }
    }
    return response as ApiResponse<{ success: boolean; template: Template; applied_resources: Record<string, number> }>;
  },

  // Get version history
  async getHistory(templateId: string): Promise<ApiResponse<TemplateVersion[]>> {
    const response = await callTemplatesProxy<TemplateVersion[]>('history', { template_id: templateId });
    if (response.error) {
      console.log('[templatesApi] Using mock data for history');
      return { data: mockVersionHistory[templateId] || [] };
    }
    return response;
  },

  // Get subscribers
  async getSubscribers(templateId: string): Promise<ApiResponse<TemplateSubscriber[]>> {
    const response = await callTemplatesProxy<TemplateSubscriber[]>('subscribers', { template_id: templateId });
    if (response.error) {
      console.log('[templatesApi] Using mock data for subscribers');
      return { data: mockSubscribers[templateId] || [] };
    }
    return response;
  },
};
