import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ONBOARDING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    logStep('Function started');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error('Invalid token');

    const userId = userData.user.id;
    logStep('User authenticated', { userId });

    const url = new URL(req.url);
    const body = req.method === 'POST' || req.method === 'PATCH' ? await req.json() : {};

    if (req.method === 'GET') {
      // List all onboarding statuses (for implementers)
      const tenantId = url.searchParams.get('tenantId');

      if (tenantId) {
        // Get specific tenant onboarding
        const { data, error } = await supabaseAdmin
          .from('tenant_onboarding')
          .select(`
            *,
            tenant:tenants(id, name, subdomain, status),
            niche_template:niche_templates(id, name, slug)
          `)
          .eq('tenant_id', tenantId)
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ onboarding: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // List all
      const { data, error } = await supabaseAdmin
        .from('tenant_onboarding')
        .select(`
          *,
          tenant:tenants(id, name, subdomain, status, created_at),
          niche_template:niche_templates(id, name, slug)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ onboardings: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const { action, tenantId, templateId, status, checklistItem, notes } = body;

      if (action === 'init') {
        // Initialize onboarding for a tenant
        if (!tenantId) throw new Error('tenantId is required');

        // Check if already exists
        const { data: existing } = await supabaseAdmin
          .from('tenant_onboarding')
          .select('id')
          .eq('tenant_id', tenantId)
          .single();

        if (existing) {
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Onboarding already initialized',
            onboardingId: existing.id 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data, error } = await supabaseAdmin
          .from('tenant_onboarding')
          .insert({
            tenant_id: tenantId,
            assigned_implementer_id: userId,
            niche_template_id: templateId || null,
          })
          .select()
          .single();

        if (error) throw error;

        logStep('Onboarding initialized', { tenantId, onboardingId: data.id });

        return new Response(JSON.stringify({ success: true, onboarding: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'apply_template') {
        // Apply niche template to tenant
        if (!tenantId || !templateId) throw new Error('tenantId and templateId are required');

        // Get template
        const { data: template, error: templateError } = await supabaseAdmin
          .from('niche_templates')
          .select('*')
          .eq('id', templateId)
          .single();

        if (templateError || !template) throw new Error('Template not found');

        // Update tenant config with template data
        const { data: tenant, error: tenantError } = await supabaseAdmin
          .from('tenants')
          .select('config')
          .eq('id', tenantId)
          .single();

        if (tenantError) throw tenantError;

        const newConfig = {
          ...(tenant?.config || {}),
          niche: template.slug,
          prompts: template.prompts,
          flows: template.flows,
          kanban_tags: template.kanban_tags,
          template_applied_at: new Date().toISOString(),
        };

        await supabaseAdmin
          .from('tenants')
          .update({ config: newConfig })
          .eq('id', tenantId);

        // Update onboarding
        await supabaseAdmin
          .from('tenant_onboarding')
          .update({ niche_template_id: templateId })
          .eq('tenant_id', tenantId);

        // Log audit
        await supabaseAdmin.rpc('log_audit', {
          _user_id: userId,
          _tenant_id: tenantId,
          _action: 'template_applied',
          _entity_type: 'tenant',
          _entity_id: tenantId,
          _new_values: { template_id: templateId, template_name: template.name },
        });

        logStep('Template applied', { tenantId, templateId, templateName: template.name });

        return new Response(JSON.stringify({
          success: true,
          template: {
            id: template.id,
            name: template.name,
            slug: template.slug,
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'update_status') {
        // Update onboarding status
        if (!tenantId || !status) throw new Error('tenantId and status are required');

        const validStatuses = ['pending', 'configuring', 'whatsapp_connected', 'training_done', 'go_live'];
        if (!validStatuses.includes(status)) {
          throw new Error(`Invalid status. Valid: ${validStatuses.join(', ')}`);
        }

        const updateData: Record<string, unknown> = { status };
        if (status === 'go_live') {
          updateData.completed_at = new Date().toISOString();
        }

        const { error } = await supabaseAdmin
          .from('tenant_onboarding')
          .update(updateData)
          .eq('tenant_id', tenantId);

        if (error) throw error;

        // Log audit
        await supabaseAdmin.rpc('log_audit', {
          _user_id: userId,
          _tenant_id: tenantId,
          _action: 'onboarding_status_updated',
          _entity_type: 'tenant_onboarding',
          _new_values: { status },
        });

        logStep('Status updated', { tenantId, status });

        return new Response(JSON.stringify({ success: true, status }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'update_checklist') {
        // Update checklist item
        if (!tenantId || !checklistItem) throw new Error('tenantId and checklistItem are required');

        const { data: current, error: fetchError } = await supabaseAdmin
          .from('tenant_onboarding')
          .select('checklist')
          .eq('tenant_id', tenantId)
          .single();

        if (fetchError) throw fetchError;

        const updatedChecklist = {
          ...(current?.checklist || {}),
          [checklistItem.key]: checklistItem.value,
        };

        const { error } = await supabaseAdmin
          .from('tenant_onboarding')
          .update({ checklist: updatedChecklist })
          .eq('tenant_id', tenantId);

        if (error) throw error;

        logStep('Checklist updated', { tenantId, checklistItem });

        return new Response(JSON.stringify({ success: true, checklist: updatedChecklist }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'add_note') {
        // Add note to onboarding
        if (!tenantId || !notes) throw new Error('tenantId and notes are required');

        const { data: current } = await supabaseAdmin
          .from('tenant_onboarding')
          .select('notes')
          .eq('tenant_id', tenantId)
          .single();

        const timestamp = new Date().toISOString();
        const newNote = `[${timestamp}] ${notes}`;
        const allNotes = current?.notes ? `${current.notes}\n${newNote}` : newNote;

        const { error } = await supabaseAdmin
          .from('tenant_onboarding')
          .update({ notes: allNotes })
          .eq('tenant_id', tenantId);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // GET templates
    if (req.method === 'GET' && url.pathname.includes('templates')) {
      const { data, error } = await supabaseAdmin
        .from('niche_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return new Response(JSON.stringify({ templates: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid request');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
