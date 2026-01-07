import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REMOTE_SUPABASE_URL = Deno.env.get('REMOTE_SUPABASE_URL');
const REMOTE_SUPABASE_ANON_KEY = Deno.env.get('REMOTE_SUPABASE_ANON_KEY');

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if secrets are configured
    if (!REMOTE_SUPABASE_URL || !REMOTE_SUPABASE_ANON_KEY) {
      console.error('[Master Proxy] Missing secrets: REMOTE_SUPABASE_URL or REMOTE_SUPABASE_ANON_KEY');
      return new Response(
        JSON.stringify({ 
          error: 'Proxy not configured. Missing REMOTE_SUPABASE_URL or REMOTE_SUPABASE_ANON_KEY secrets.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body (frontend sends path and method in body)
    let requestBody: { path?: string; method?: string; payload?: unknown } = {};
    try {
      const text = await req.text();
      if (text) {
        requestBody = JSON.parse(text);
      }
    } catch (e) {
      console.error('[Master Proxy] Failed to parse body:', e);
    }

    const path = requestBody.path;
    const method = requestBody.method || 'GET';
    const payload = requestBody.payload;

    if (!path) {
      return new Response(
        JSON.stringify({ error: 'Missing path in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Master Proxy] ${method} ${path}`);

    // Get authorization from request
    const authHeader = req.headers.get('Authorization');
    
    // Build remote URL
    const remoteUrl = `${REMOTE_SUPABASE_URL}/functions/v1${path}`;
    
    console.log(`[Master Proxy] Forwarding to: ${remoteUrl}`);

    // Build headers for remote request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': REMOTE_SUPABASE_ANON_KEY,
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Make request to remote Supabase
    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    // Add body for non-GET requests
    if (method !== 'GET' && method !== 'HEAD' && payload) {
      fetchOptions.body = JSON.stringify(payload);
    }

    const response = await fetch(remoteUrl, fetchOptions);
    const responseData = await response.text();
    
    console.log(`[Master Proxy] Response status: ${response.status}`);
    console.log(`[Master Proxy] Response preview: ${responseData.substring(0, 200)}`);

    return new Response(responseData, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });

  } catch (error) {
    console.error('[Master Proxy] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
