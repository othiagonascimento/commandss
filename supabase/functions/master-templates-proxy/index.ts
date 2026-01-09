import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Remote Supabase project (Uôpa CRM)
const REMOTE_SUPABASE_URL = Deno.env.get('REMOTE_SUPABASE_URL') || 'https://opvoghzpocraibchbczs.supabase.co';
const REMOTE_SUPABASE_ANON_KEY = Deno.env.get('REMOTE_SUPABASE_ANON_KEY') || '';

serve(async (req) => {
  // Handle CORS preflight
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

    console.log(`[master-templates-proxy] Action: ${action}, Params:`, params);

    // Create remote Supabase client
    const remoteSupabase = createClient(REMOTE_SUPABASE_URL, REMOTE_SUPABASE_ANON_KEY);

    let responseData: unknown;

    switch (action) {
      case 'list': {
        // Get all niche_templates from remote database
        const { data, error } = await remoteSupabase
          .from('niche_templates')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[master-templates-proxy] List error:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        responseData = data || [];
        break;
      }

      case 'get': {
        const templateId = params.template_id;
        if (!templateId) {
          return new Response(
            JSON.stringify({ error: 'template_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await remoteSupabase
          .from('niche_templates')
          .select('*')
          .eq('id', templateId)
          .single();

        if (error) {
          console.error('[master-templates-proxy] Get error:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        responseData = data;
        break;
      }

      case 'publish': {
        // Update template in remote database
        const { template_id, ...updateData } = params;
        if (!template_id) {
          return new Response(
            JSON.stringify({ error: 'template_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await remoteSupabase
          .from('niche_templates')
          .update({ ...updateData, updated_at: new Date().toISOString() })
          .eq('id', template_id)
          .select()
          .single();

        if (error) {
          console.error('[master-templates-proxy] Publish error:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        responseData = data;
        break;
      }

      case 'sync': {
        // For now, sync just returns the current template data
        // In future, this could sync with tenants
        const templateId = params.template_id;
        if (!templateId) {
          return new Response(
            JSON.stringify({ error: 'template_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await remoteSupabase
          .from('niche_templates')
          .select('*')
          .eq('id', templateId)
          .single();

        if (error) {
          console.error('[master-templates-proxy] Sync error:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Return sync result
        responseData = {
          success: true,
          template: data,
          synced_tenants: 0,
          message: 'Template carregado. Sincronização com tenants em desenvolvimento.'
        };
        break;
      }

      case 'clone': {
        const { source_id, new_name, new_slug } = params;
        if (!source_id || !new_name || !new_slug) {
          return new Response(
            JSON.stringify({ error: 'source_id, new_name, and new_slug required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get source template
        const { data: source, error: sourceError } = await remoteSupabase
          .from('niche_templates')
          .select('*')
          .eq('id', source_id)
          .single();

        if (sourceError || !source) {
          return new Response(
            JSON.stringify({ error: 'Source template not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create clone
        const { data: clone, error: cloneError } = await remoteSupabase
          .from('niche_templates')
          .insert({
            name: new_name,
            slug: new_slug,
            description: source.description,
            flows: source.flows,
            prompts: source.prompts,
            kanban_tags: source.kanban_tags,
            is_active: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (cloneError) {
          console.error('[master-templates-proxy] Clone error:', cloneError);
          return new Response(
            JSON.stringify({ error: cloneError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        responseData = clone;
        break;
      }

      case 'history': {
        // For now, return empty history (could implement versioning later)
        responseData = {
          history: [],
          message: 'Histórico de versões em desenvolvimento.'
        };
        break;
      }

      case 'subscribers': {
        // Get tenants using this template from local database
        const templateId = params.template_id;
        
        // For now, return mock data - in production, query tenants table
        responseData = {
          subscribers: [],
          count: 0,
          message: 'Lista de assinantes em desenvolvimento.'
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action', allowed: ['list', 'get', 'publish', 'sync', 'clone', 'history', 'subscribers'] }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`[master-templates-proxy] Success: ${action}`);

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    console.error('[master-templates-proxy] Error:', err);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
