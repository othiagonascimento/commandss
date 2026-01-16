import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Remote Supabase project (Uôpa CRM)
const REMOTE_SUPABASE_URL = Deno.env.get('REMOTE_SUPABASE_URL') || '';
const REMOTE_SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('REMOTE_SUPABASE_SERVICE_ROLE_KEY') || '';
const REMOTE_SUPABASE_ANON_KEY = Deno.env.get('REMOTE_SUPABASE_ANON_KEY') || '';

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MASTER-TEMPLATES-PROXY] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse body
    const body = await req.json().catch(() => ({}));
    const action = body._action;
    const params = body._params || {};

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action required', allowed: ['list', 'get', 'publish', 'sync', 'clone', 'history', 'subscribers'] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep(`Action: ${action}`, params);

    // Master Supabase for local operations
    const masterSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Remote CRM Supabase with Service Role for write operations
    const crmSupabase = createClient(
      REMOTE_SUPABASE_URL,
      REMOTE_SUPABASE_SERVICE_ROLE_KEY || REMOTE_SUPABASE_ANON_KEY,
      { auth: { persistSession: false } }
    );

    let responseData: unknown;

    switch (action) {
      case 'list': {
        // Get all master_niche_templates from CRM
        const { data, error } = await crmSupabase
          .from('master_niche_templates')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          logStep('List error', { error: error.message });
          throw error;
        }

        // Get subscriber counts for each template
        const templatesWithCounts = await Promise.all((data || []).map(async (template) => {
          const { count } = await crmSupabase
            .from('tenant_template_subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('template_id', template.id);

          return {
            ...template,
            subscriber_count: count || 0,
          };
        }));

        responseData = templatesWithCounts;
        break;
      }

      case 'get': {
        const templateId = params.template_id;
        if (!templateId) {
          throw new Error('template_id required');
        }

        const { data, error } = await crmSupabase
          .from('master_niche_templates')
          .select('*')
          .eq('id', templateId)
          .single();

        if (error) {
          logStep('Get error', { error: error.message });
          throw error;
        }

        responseData = data;
        break;
      }

      case 'publish': {
        const { template_id, ...updateData } = params;
        if (!template_id) {
          throw new Error('template_id required');
        }

        const { data, error } = await crmSupabase
          .from('master_niche_templates')
          .update({ ...updateData, updated_at: new Date().toISOString() })
          .eq('id', template_id)
          .select()
          .single();

        if (error) {
          logStep('Publish error', { error: error.message });
          throw error;
        }

        logStep('Template published', { templateId: template_id });
        responseData = data;
        break;
      }

      case 'sync': {
        const templateId = params.template_id;
        const targetTenantIds = params.tenant_ids as string[] | undefined;
        const forceSync = params.force_sync === true;

        if (!templateId) {
          throw new Error('template_id required');
        }

        // 1. Fetch full template
        const { data: template, error: templateError } = await crmSupabase
          .from('master_niche_templates')
          .select('*')
          .eq('id', templateId)
          .single();

        if (templateError || !template) {
          throw new Error('Template not found');
        }

        logStep('Template fetched for sync', { name: template.name, slug: template.slug });

        // 2. Fetch active subscriptions
        let subscriptionQuery = crmSupabase
          .from('tenant_template_subscriptions')
          .select(`
            id,
            tenant_id,
            sync_mode,
            sync_sections,
            last_synced_version,
            tenants (
              id,
              name,
              subdomain,
              is_blocked
            )
          `)
          .eq('template_id', templateId);

        if (!forceSync) {
          subscriptionQuery = subscriptionQuery.neq('sync_mode', 'locked');
        }

        if (targetTenantIds?.length) {
          subscriptionQuery = subscriptionQuery.in('tenant_id', targetTenantIds);
        }

        const { data: subscriptions, error: subError } = await subscriptionQuery;

        if (subError) {
          logStep('Error fetching subscriptions', { error: subError.message });
          throw subError;
        }

        logStep('Subscriptions found', { count: subscriptions?.length || 0 });

        // 3. Sync to each tenant
        const results: Array<{ tenant_id: string; tenant_name?: string; status: string; error?: string }> = [];

        for (const sub of subscriptions || []) {
          const tenant = sub.tenants as unknown as { id: string; name: string; subdomain: string; is_blocked: boolean } | null;
          
          if (!tenant || tenant.is_blocked) {
            results.push({
              tenant_id: sub.tenant_id,
              tenant_name: tenant?.name,
              status: 'skipped',
              error: tenant ? 'Tenant is blocked' : 'Tenant not found',
            });
            continue;
          }

          try {
            const sectionsToSync = sub.sync_sections || ['prompts', 'flows', 'kanban_tags'];

            // Update or create local niche_template for tenant
            const templateData: Record<string, unknown> = {
              slug: template.slug,
              name: template.name,
              is_active: template.is_active,
              updated_at: new Date().toISOString(),
            };

            if (sectionsToSync.includes('prompts')) {
              templateData.prompts = template.prompts;
            }
            if (sectionsToSync.includes('flows')) {
              templateData.flows = template.flows;
            }
            if (sectionsToSync.includes('kanban_tags')) {
              templateData.kanban_tags = template.kanban_tags;
            }
            if (sectionsToSync.includes('ai_config') && template.ai_config) {
              templateData.ai_config = template.ai_config;
            }

            // Upsert niche_template in CRM for this tenant
            await crmSupabase
              .from('niche_templates')
              .upsert({
                id: templateId, // Use same ID for reference
                tenant_id: sub.tenant_id,
                ...templateData,
              }, { onConflict: 'id' });

            // If syncing AI config, also update ai_agent_config
            if (sectionsToSync.includes('ai_config') && template.ai_config) {
              const aiConfig = template.ai_config as Record<string, unknown>;
              await crmSupabase
                .from('ai_agent_config')
                .update({
                  layer_1_model: aiConfig.layer_1_model,
                  layer_2_model: aiConfig.layer_2_model,
                  layer_3_model: aiConfig.layer_3_model,
                  personality_prompt: aiConfig.personality_prompt,
                  niche_category: template.slug,
                  updated_at: new Date().toISOString(),
                })
                .eq('tenant_id', sub.tenant_id);
            }

            // Update subscription with sync info
            await crmSupabase
              .from('tenant_template_subscriptions')
              .update({
                last_synced_at: new Date().toISOString(),
                last_synced_version: template.version || 1,
                sync_status: 'synced',
              })
              .eq('id', sub.id);

            // Record in sync history
            await masterSupabase
              .from('template_sync_history')
              .insert({
                template_id: templateId,
                tenant_id: sub.tenant_id,
                sync_type: forceSync ? 'manual_sync' : 'template_publish',
                status: 'success',
                sections_synced: sectionsToSync,
              });

            results.push({
              tenant_id: sub.tenant_id,
              tenant_name: tenant.name,
              status: 'success',
            });

            logStep('Tenant synced', { tenantId: sub.tenant_id, name: tenant.name });

          } catch (syncError) {
            const errorMsg = syncError instanceof Error ? syncError.message : 'Unknown error';
            
            results.push({
              tenant_id: sub.tenant_id,
              tenant_name: tenant?.name,
              status: 'error',
              error: errorMsg,
            });

            // Record error in history
            await masterSupabase
              .from('template_sync_history')
              .insert({
                template_id: templateId,
                tenant_id: sub.tenant_id,
                sync_type: forceSync ? 'manual_sync' : 'template_publish',
                status: 'error',
                error_message: errorMsg,
              });

            logStep('Tenant sync failed', { tenantId: sub.tenant_id, error: errorMsg });
          }
        }

        const successCount = results.filter(r => r.status === 'success').length;
        const errorCount = results.filter(r => r.status === 'error').length;
        const skippedCount = results.filter(r => r.status === 'skipped').length;

        responseData = {
          success: true,
          template: {
            id: template.id,
            name: template.name,
            slug: template.slug,
          },
          synced_tenants: successCount,
          errors: errorCount,
          skipped: skippedCount,
          results,
          message: `Sincronização concluída: ${successCount} sucesso, ${errorCount} erros, ${skippedCount} ignorados`,
        };
        break;
      }

      case 'clone': {
        const { source_id, new_name, new_slug } = params;
        if (!source_id || !new_name || !new_slug) {
          throw new Error('source_id, new_name, and new_slug required');
        }

        // Get source template
        const { data: source, error: sourceError } = await crmSupabase
          .from('master_niche_templates')
          .select('*')
          .eq('id', source_id)
          .single();

        if (sourceError || !source) {
          throw new Error('Source template not found');
        }

        // Create clone
        const { data: clone, error: cloneError } = await crmSupabase
          .from('master_niche_templates')
          .insert({
            name: new_name,
            slug: new_slug,
            description: source.description,
            flows: source.flows,
            prompts: source.prompts,
            kanban_tags: source.kanban_tags,
            ai_config: source.ai_config,
            is_active: false,
            version: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (cloneError) {
          logStep('Clone error', { error: cloneError.message });
          throw cloneError;
        }

        logStep('Template cloned', { sourceId: source_id, newId: clone.id });
        responseData = clone;
        break;
      }

      case 'history': {
        const templateId = params.template_id;
        
        if (!templateId) {
          throw new Error('template_id required');
        }

        // Get sync history from Master
        const { data: history, error } = await masterSupabase
          .from('template_sync_history')
          .select(`
            id,
            tenant_id,
            sync_type,
            status,
            sections_synced,
            error_message,
            created_at,
            tenants (
              name,
              subdomain
            )
          `)
          .eq('template_id', templateId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          logStep('History error', { error: error.message });
          throw error;
        }

        responseData = {
          history: (history || []).map(h => ({
            id: h.id,
            tenant_id: h.tenant_id,
            tenant_name: (h.tenants as unknown as { name: string } | null)?.name,
            sync_type: h.sync_type,
            status: h.status,
            sections_synced: h.sections_synced,
            error_message: h.error_message,
            created_at: h.created_at,
          })),
          count: history?.length || 0,
        };
        break;
      }

      case 'subscribers': {
        const templateId = params.template_id;
        
        if (!templateId) {
          throw new Error('template_id required');
        }

        // Get real subscribers from CRM
        const { data: subscriptions, error } = await crmSupabase
          .from('tenant_template_subscriptions')
          .select(`
            id,
            tenant_id,
            sync_mode,
            sync_sections,
            last_synced_at,
            last_synced_version,
            sync_status,
            auto_sync_enabled,
            created_at,
            tenants (
              id,
              name,
              subdomain,
              status,
              plan_type,
              is_blocked
            )
          `)
          .eq('template_id', templateId)
          .order('created_at', { ascending: false });

        if (error) {
          logStep('Subscribers error', { error: error.message });
          throw error;
        }

        responseData = {
          subscribers: (subscriptions || []).map(sub => {
            const tenant = sub.tenants as unknown as {
              id: string;
              name: string;
              subdomain: string;
              status: string;
              plan_type: string;
              is_blocked: boolean;
            } | null;

            return {
              id: sub.id,
              tenant_id: sub.tenant_id,
              tenant_name: tenant?.name || 'Unknown',
              tenant_subdomain: tenant?.subdomain,
              tenant_plan: tenant?.plan_type,
              tenant_status: tenant?.is_blocked ? 'blocked' : tenant?.status,
              sync_mode: sub.sync_mode,
              sync_sections: sub.sync_sections,
              last_synced_at: sub.last_synced_at,
              last_synced_version: sub.last_synced_version,
              sync_status: sub.sync_status,
              auto_sync_enabled: sub.auto_sync_enabled,
              subscribed_at: sub.created_at,
            };
          }),
          count: subscriptions?.length || 0,
        };

        logStep('Subscribers fetched', { count: subscriptions?.length || 0 });
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action', allowed: ['list', 'get', 'publish', 'sync', 'clone', 'history', 'subscribers'] }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    logStep(`Success: ${action}`);

    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    logStep('Error', { error: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
