import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REMOTE_SUPABASE_URL = Deno.env.get('REMOTE_SUPABASE_URL')!;
const REMOTE_SUPABASE_ANON_KEY = Deno.env.get('REMOTE_SUPABASE_ANON_KEY')!;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path');
    const method = req.method;

    if (!path) {
      return new Response(
        JSON.stringify({ error: 'Missing path parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Master Proxy] ${method} ${path}`);

    // Get authorization from request
    const authHeader = req.headers.get('Authorization');
    
    // Build remote URL
    const remoteUrl = `${REMOTE_SUPABASE_URL}/functions/v1${path}${url.search.replace(`path=${encodeURIComponent(path)}`, '').replace('?&', '?').replace(/^\?$/, '')}`;
    
    console.log(`[Master Proxy] Forwarding to: ${remoteUrl}`);

    // Build headers for remote request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': REMOTE_SUPABASE_ANON_KEY,
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Forward the request body if present
    let body: string | undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        body = await req.text();
      } catch {
        body = undefined;
      }
    }

    // Make request to remote Supabase
    const response = await fetch(remoteUrl, {
      method,
      headers,
      body: body || undefined,
    });

    const responseData = await response.text();
    
    console.log(`[Master Proxy] Response status: ${response.status}`);

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
