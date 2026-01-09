import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use environment variables for destination project
const REMOTE_SUPABASE_URL = Deno.env.get('REMOTE_SUPABASE_URL') || 'https://opvoghzpocraibchbczs.supabase.co';
const REMOTE_SUPABASE_ANON_KEY = Deno.env.get('REMOTE_SUPABASE_ANON_KEY');
const DESTINATION_URL = `${REMOTE_SUPABASE_URL}/functions/v1`;

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

    // Remove internal params from body
    delete body._action;
    delete body._params;

    // Route to appropriate destination endpoint
    let destinationEndpoint: string;
    let destinationMethod: string;

    switch (action) {
      case 'list':
        destinationEndpoint = 'master-list-templates';
        destinationMethod = 'GET';
        break;
      case 'get':
        destinationEndpoint = `master-get-template?id=${params.template_id}`;
        destinationMethod = 'GET';
        break;
      case 'publish':
        destinationEndpoint = 'master-publish-template';
        destinationMethod = 'POST';
        break;
      case 'sync':
        destinationEndpoint = 'master-sync-template';
        destinationMethod = 'POST';
        break;
      case 'clone':
        destinationEndpoint = 'master-clone-template';
        destinationMethod = 'POST';
        break;
      case 'history':
        destinationEndpoint = `master-template-history?template_id=${params.template_id}`;
        destinationMethod = 'GET';
        break;
      case 'subscribers':
        destinationEndpoint = `master-template-subscribers?template_id=${params.template_id}`;
        destinationMethod = 'GET';
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action', allowed: ['list', 'get', 'publish', 'sync', 'clone', 'history', 'subscribers'] }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`[master-templates-proxy] Proxying ${action} to ${DESTINATION_URL}/${destinationEndpoint}`);

    // Use the remote anon key if available, otherwise fall back to the request's auth header
    const authorizationHeader = REMOTE_SUPABASE_ANON_KEY 
      ? `Bearer ${REMOTE_SUPABASE_ANON_KEY}` 
      : authHeader;

    // Make request to destination project
    const hasBody = Object.keys(body).length > 0 && destinationMethod !== 'GET';
    
    const destinationResponse = await fetch(`${DESTINATION_URL}/${destinationEndpoint}`, {
      method: destinationMethod,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorizationHeader,
        'apikey': REMOTE_SUPABASE_ANON_KEY || '',
      },
      body: hasBody ? JSON.stringify(body) : undefined,
    });

    const responseText = await destinationResponse.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { error: `Invalid response: ${responseText.slice(0, 100)}` };
    }

    console.log(`[master-templates-proxy] Response status: ${destinationResponse.status}`);

    return new Response(
      JSON.stringify(responseData),
      { 
        status: destinationResponse.status, 
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
