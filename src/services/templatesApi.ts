// API Service for Templates - Using real data from master_niche_templates table
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
} from '@/types/templates';

interface ApiResponse<T> {
  data?: T;
  error?: string;
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

// Transform database row to Template format
function dbRowToTemplate(row: any): Template {
  const prompts = row.prompts as any;
  const aiConfig = row.ai_config as any;
  
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: prompts?.description || '',
    category: prompts?.category || 'universal',
    icon: prompts?.icon || '📋',
    is_base_template: prompts?.is_base_template ?? true,
    parent_template_id: prompts?.parent_template_id,
    version: aiConfig?.version || '1.0',
    created_at: row.created_at,
    updated_at: row.created_at, // Using created_at as we don't have updated_at
    published_at: row.created_at,
    subscriber_count: 0, // Will be calculated from subscriptions
  };
}

// Transform database row to full TemplateData
function dbRowToTemplateData(row: any): TemplateData {
  const prompts = row.prompts as any || {};
  const aiConfig = row.ai_config as any || {};
  
  return {
    slug: row.slug,
    name: row.name,
    description: prompts.description || '',
    category: prompts.category || 'universal',
    icon: prompts.icon || '📋',
    is_base_template: prompts.is_base_template ?? true,
    parent_template_id: prompts.parent_template_id,
    funnel_config: {
      stages: prompts.funnel_stages || [],
    },
    tags: {
      categories: prompts.tag_categories || [],
    },
    quick_replies_config: prompts.quick_replies || [],
    prompts: {
      greeting: prompts.greeting || '',
      system_prompt: prompts.system_prompt || '',
      objection_handlers: prompts.objection_handlers || {},
      qualification_criteria: prompts.qualification_criteria || {},
    },
    ai_config: {
      personality: aiConfig.personality || '',
      mode: aiConfig.mode || 'copilot',
      temperature: aiConfig.temperature || 0.7,
      techniques: aiConfig.techniques || [],
    },
    automation_flows_config: prompts.automation_flows || [],
    sla_config: prompts.sla_config || {
      first_response_minutes: 5,
      follow_up_hours: 24,
      escalation_hours: 48,
      working_hours: { start: '08:00', end: '18:00' },
      working_days: [1, 2, 3, 4, 5],
    },
    product_categories: prompts.product_categories || [],
    // Enhanced configs if available
    uopa_ai_core: prompts.uopa_ai_core,
    copilot_config: prompts.copilot_config,
    insights_config: prompts.insights_config,
    agents_config: prompts.agents_config,
    playbook_config: prompts.playbook_config,
    operations_config: prompts.operations_config,
    catalog_config: prompts.catalog_config,
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
  // List all templates from master_niche_templates
  async list(): Promise<ApiResponse<Template[]>> {
    try {
      const { data, error } = await supabase
        .from('master_niche_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('[templatesApi] list error:', error);
        return { error: error.message };
      }

      // Get subscriber counts
      const { data: subscriptions } = await supabase
        .from('tenant_template_subscriptions')
        .select('template_id');

      const subscriberCounts: Record<string, number> = {};
      subscriptions?.forEach(sub => {
        if (sub.template_id) {
          subscriberCounts[sub.template_id] = (subscriberCounts[sub.template_id] || 0) + 1;
        }
      });

      const templates = data.map(row => ({
        ...dbRowToTemplate(row),
        subscriber_count: subscriberCounts[row.id] || 0,
      }));

      return { data: templates };
    } catch (err) {
      console.error('[templatesApi] list exception:', err);
      return { error: err instanceof Error ? err.message : 'Erro ao listar templates' };
    }
  },

  // Get single template with full data
  async get(templateId: string): Promise<ApiResponse<Template & { data: TemplateData }>> {
    try {
      const { data, error } = await supabase
        .from('master_niche_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) {
        console.error('[templatesApi] get error:', error);
        return { error: error.message };
      }

      if (!data) {
        return { error: 'Template não encontrado' };
      }

      const template = dbRowToTemplate(data);
      const templateData = dbRowToTemplateData(data);

      return { data: { ...template, data: templateData } };
    } catch (err) {
      console.error('[templatesApi] get exception:', err);
      return { error: err instanceof Error ? err.message : 'Erro ao buscar template' };
    }
  },

  // Publish (create or update) template
  async publish(
    formData: TemplateFormData,
    changelog: string,
    incrementMajor: boolean = false,
    templateId?: string
  ): Promise<ApiResponse<PublishResponse>> {
    try {
      const templateData = formDataToTemplateData(formData);
      
      // Prepare prompts JSON with all template data - cast to any for JSON compatibility
      const prompts: Record<string, unknown> = {
        description: formData.description,
        category: formData.category,
        icon: formData.icon,
        is_base_template: formData.is_base_template,
        parent_template_id: formData.parent_template_id,
        funnel_stages: formData.funnel_stages as unknown[],
        tag_categories: formData.tag_categories as unknown[],
        quick_replies: formData.quick_replies as unknown[],
        greeting: formData.prompts.greeting,
        system_prompt: formData.prompts.system_prompt,
        objection_handlers: formData.prompts.objection_handlers,
        qualification_criteria: formData.prompts.qualification_criteria,
        automation_flows: templateData.automation_flows_config as unknown[],
        sla_config: templateData.sla_config as unknown,
        product_categories: formData.product_categories as unknown[],
      };
      
      // Prepare AI config JSON
      const aiConfig: Record<string, unknown> = {
        personality: formData.ai_config.personality,
        mode: formData.ai_config.mode,
        temperature: formData.ai_config.temperature,
        techniques: formData.ai_config.techniques,
        version: incrementMajor ? '2.0' : '1.1',
        changelog,
      };

      if (templateId) {
        // Update existing template
        const { error } = await supabase
          .from('master_niche_templates')
          .update({
            name: formData.name,
            slug: formData.slug,
            prompts: prompts as any,
            ai_config: aiConfig as any,
          })
          .eq('id', templateId);

        if (error) {
          console.error('[templatesApi] publish update error:', error);
          return { error: error.message };
        }

        return {
          data: {
            success: true,
            template_id: templateId,
            version: String(aiConfig.version),
            action: 'updated',
          },
        };
      } else {
        // Create new template
        const { data, error } = await supabase
          .from('master_niche_templates')
          .insert({
            name: formData.name,
            slug: formData.slug,
            prompts: prompts as any,
            ai_config: aiConfig as any,
            is_active: true,
          })
          .select('id')
          .single();

        if (error) {
          console.error('[templatesApi] publish insert error:', error);
          return { error: error.message };
        }

        return {
          data: {
            success: true,
            template_id: data.id,
            version: '1.0',
            action: 'created',
          },
        };
      }
    } catch (err) {
      console.error('[templatesApi] publish exception:', err);
      return { error: err instanceof Error ? err.message : 'Erro ao publicar template' };
    }
  },

  // Sync template to all subscribed tenants
  async sync(
    templateId: string,
    changelog?: string,
    forceSync: boolean = false
  ): Promise<ApiResponse<SyncResponse>> {
    try {
      // Get all subscriptions for this template
      const { data: subscriptions, error: subError } = await supabase
        .from('tenant_template_subscriptions')
        .select(`
          id,
          tenant_id,
          sync_mode,
          sync_sections,
          local_overrides,
          tenants:tenant_id (name)
        `)
        .eq('template_id', templateId);

      if (subError) {
        console.error('[templatesApi] sync subscriptions error:', subError);
        return { error: subError.message };
      }

      if (!subscriptions || subscriptions.length === 0) {
        return {
          data: {
            success: true,
            version: '1.0',
            results: {
              total: 0,
              synced: 0,
              skipped: 0,
              errors: 0,
              details: [],
            },
          },
        };
      }

      // Get template data
      const { data: template } = await supabase
        .from('master_niche_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      const version = (template?.ai_config as any)?.version || '1.0';
      const results: SyncResponse['results']['details'] = [];
      let synced = 0;
      let skipped = 0;
      let errors = 0;

      for (const sub of subscriptions) {
        const tenantName = (sub.tenants as any)?.name || 'Unknown';
        
        // Skip locked subscriptions unless forced
        if (sub.sync_mode === 'locked' && !forceSync) {
          results.push({
            tenant_id: sub.tenant_id!,
            tenant_name: tenantName,
            status: 'skipped',
            skipped: ['locked_by_tenant'],
          });
          skipped++;
          continue;
        }

        try {
          // Update subscription with sync info
          const { error: updateError } = await supabase
            .from('tenant_template_subscriptions')
            .update({
              last_synced_at: new Date().toISOString(),
              last_synced_version: version,
              sync_status: 'synced',
              sync_error: null,
            })
            .eq('id', sub.id);

          if (updateError) throw updateError;

          // Record sync in history
          await supabase.from('template_sync_history').insert({
            subscription_id: sub.id,
            template_id: templateId,
            tenant_id: sub.tenant_id,
            sync_type: forceSync ? 'force' : 'manual',
            status: 'success',
            sections_synced: sub.sync_sections || ['all'],
            template_version: version,
            changes_applied: { changelog },
          });

          results.push({
            tenant_id: sub.tenant_id!,
            tenant_name: tenantName,
            status: 'success',
            applied: sub.sync_sections || ['all'],
          });
          synced++;
        } catch (err) {
          results.push({
            tenant_id: sub.tenant_id!,
            tenant_name: tenantName,
            status: 'error',
            error: err instanceof Error ? err.message : 'Erro desconhecido',
          });
          errors++;
        }
      }

      return {
        data: {
          success: errors === 0,
          version,
          results: {
            total: subscriptions.length,
            synced,
            skipped,
            errors,
            details: results,
          },
        },
      };
    } catch (err) {
      console.error('[templatesApi] sync exception:', err);
      return { error: err instanceof Error ? err.message : 'Erro ao sincronizar template' };
    }
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
    try {
      // Get template by slug
      const { data: template, error } = await supabase
        .from('master_niche_templates')
        .select('*')
        .eq('slug', templateSlug)
        .single();

      if (error || !template) {
        return { error: 'Template não encontrado' };
      }

      const templateObj = dbRowToTemplate(template);
      const prompts = template.prompts as any || {};
      
      // Count applied resources based on options
      const applied: Record<string, number> = {};
      
      if (options?.clone_funnels !== false) {
        applied.funnel_stages = (prompts.funnel_stages || []).length;
      }
      if (options?.clone_tags !== false) {
        applied.tag_categories = (prompts.tag_categories || []).length;
      }
      if (options?.clone_quick_replies !== false) {
        applied.quick_replies = (prompts.quick_replies || []).length;
      }
      if (options?.clone_sla_config !== false) {
        applied.sla_config = 1;
      }

      // Create subscription for the tenant
      const { error: subError } = await supabase
        .from('tenant_template_subscriptions')
        .upsert({
          tenant_id: targetTenantId,
          template_id: template.id,
          sync_mode: 'auto',
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
          last_synced_version: (template.ai_config as any)?.version || '1.0',
          sync_sections: Object.keys(applied),
        }, {
          onConflict: 'tenant_id,template_id',
        });

      if (subError) {
        console.error('[templatesApi] clone subscription error:', subError);
        return { error: subError.message };
      }

      return {
        data: {
          success: true,
          template: templateObj,
          applied_resources: applied,
        },
      };
    } catch (err) {
      console.error('[templatesApi] clone exception:', err);
      return { error: err instanceof Error ? err.message : 'Erro ao clonar template' };
    }
  },

  // Get version history (from ai_config changelog)
  async getHistory(templateId: string): Promise<ApiResponse<TemplateVersion[]>> {
    try {
      // Get sync history as version history proxy
      const { data: history, error } = await supabase
        .from('template_sync_history')
        .select('*')
        .eq('template_id', templateId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('[templatesApi] getHistory error:', error);
        return { error: error.message };
      }

      // Get template for snapshot
      const { data: template } = await supabase
        .from('master_niche_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      const templateData = template ? dbRowToTemplateData(template) : null;

      const versions: TemplateVersion[] = (history || []).map((h: any) => ({
        id: h.id,
        template_id: templateId,
        version: h.template_version || '1.0',
        changelog: (h.changes_applied as any)?.changelog || 'Sincronização automática',
        published_by: h.triggered_by || 'Sistema',
        published_at: h.created_at,
        data_snapshot: templateData!,
      }));

      return { data: versions };
    } catch (err) {
      console.error('[templatesApi] getHistory exception:', err);
      return { error: err instanceof Error ? err.message : 'Erro ao buscar histórico' };
    }
  },

  // Get subscribers from tenant_template_subscriptions
  async getSubscribers(templateId: string): Promise<ApiResponse<TemplateSubscriber[]>> {
    try {
      const { data, error } = await supabase
        .from('tenant_template_subscriptions')
        .select(`
          tenant_id,
          created_at,
          last_synced_at,
          local_overrides,
          sync_sections,
          tenants:tenant_id (name)
        `)
        .eq('template_id', templateId);

      if (error) {
        console.error('[templatesApi] getSubscribers error:', error);
        return { error: error.message };
      }

      const subscribers: TemplateSubscriber[] = (data || []).map((sub: any) => ({
        tenant_id: sub.tenant_id,
        tenant_name: sub.tenants?.name || 'Unknown',
        subscribed_at: sub.created_at,
        last_synced_at: sub.last_synced_at,
        has_overrides: sub.local_overrides && Object.keys(sub.local_overrides).length > 0,
        overridden_sections: sub.local_overrides ? Object.keys(sub.local_overrides) : [],
      }));

      return { data: subscribers };
    } catch (err) {
      console.error('[templatesApi] getSubscribers exception:', err);
      return { error: err instanceof Error ? err.message : 'Erro ao buscar assinantes' };
    }
  },
};
