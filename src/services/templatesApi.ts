// API Service for communicating with the destination project's Edge Functions
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

const DESTINATION_BASE_URL = 'https://opvoghzpocraibchbczs.supabase.co/functions/v1';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function callDestinationApi<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown
): Promise<ApiResponse<T>> {
  const token = await getAuthToken();
  
  if (!token) {
    return { error: 'Não autenticado' };
  }

  try {
    const response = await fetch(`${DESTINATION_BASE_URL}/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: method !== 'GET' ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || `Erro ${response.status}` };
    }

    return { data };
  } catch (error) {
    console.error(`[templatesApi] ${endpoint} error:`, error);
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
  if (!data) {
    // Return defaults with basic info
    return {
      slug: template.slug,
      name: template.name,
      description: template.description || '',
      category: (template.category as 'universal' | 'vendas' | 'custom') || 'universal',
      icon: template.icon || '📋',
      is_base_template: template.is_base_template,
      parent_template_id: template.parent_template_id,
      funnel_stages: [],
      tag_categories: [],
      quick_replies: [],
      prompts: { greeting: '', system_prompt: '', objection_handlers: {}, qualification_criteria: {} },
      ai_config: { personality: '', mode: 'copilot', temperature: 0.7, techniques: [] },
      automations: [],
      sla: {
        first_response_minutes: 5,
        follow_up_hours: 24,
        escalation_hours: 48,
        working_hours_start: '08:00',
        working_hours_end: '18:00',
        working_days: [1, 2, 3, 4, 5],
      },
      product_categories: [],
    };
  }

  return {
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
      objection_handlers: data.prompts?.objection_handlers || {},
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
    return callDestinationApi<Template[]>('master-list-templates');
  },

  // Get single template with full data
  async get(templateId: string): Promise<ApiResponse<Template & { data: TemplateData }>> {
    return callDestinationApi<Template & { data: TemplateData }>(`master-get-template?id=${templateId}`);
  },

  // Publish (create or update) template
  async publish(
    formData: TemplateFormData,
    changelog: string,
    incrementMajor: boolean = false,
    templateId?: string
  ): Promise<ApiResponse<PublishResponse>> {
    const templateData = formDataToTemplateData(formData);
    
    return callDestinationApi<PublishResponse>('master-publish-template', 'POST', {
      template_id: templateId,
      template_data: templateData,
      changelog,
      increment_major: incrementMajor,
    });
  },

  // Sync template to all subscribed tenants
  async sync(
    templateId: string,
    changelog?: string,
    forceSync: boolean = false
  ): Promise<ApiResponse<SyncResponse>> {
    return callDestinationApi<SyncResponse>('master-sync-template', 'POST', {
      template_id: templateId,
      changelog,
      force_sync: forceSync,
    });
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
    return callDestinationApi('master-clone-template', 'POST', {
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
  },

  // Get version history
  async getHistory(templateId: string): Promise<ApiResponse<TemplateVersion[]>> {
    return callDestinationApi<TemplateVersion[]>(`master-template-history?template_id=${templateId}`);
  },

  // Get subscribers
  async getSubscribers(templateId: string): Promise<ApiResponse<TemplateSubscriber[]>> {
    return callDestinationApi<TemplateSubscriber[]>(`master-template-subscribers?template_id=${templateId}`);
  },
};
