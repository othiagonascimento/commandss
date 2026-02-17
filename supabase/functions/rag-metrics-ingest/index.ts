import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateWebhookSignature } from '../_shared/webhookSignature.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-action',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const secret = Deno.env.get('MASTER_WEBHOOK_SECRET');
    if (!secret) {
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const bodyText = await req.text();
    const signature = req.headers.get('x-webhook-signature');

    if (!signature || !validateWebhookSignature(secret, bodyText, signature)) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.parse(bodyText);
    const events = Array.isArray(payload.events) ? payload.events : [payload];

    if (events.length === 0) {
      return new Response(JSON.stringify({ inserted: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Map events to rag_events rows
    const rows = events.map((e: Record<string, unknown>) => ({
      tenant_id: e.tenant_id,
      query_length: e.query_length ?? 0,
      was_reformulated: e.was_reformulated ?? false,
      vector_results_count: e.vector_results_count ?? 0,
      keyword_results_count: e.keyword_results_count ?? 0,
      hybrid_rrf_used: e.hybrid_rrf_used ?? false,
      reranker_used: e.reranker_used ?? false,
      top_similarity_score: e.top_similarity_score ?? null,
      knowledge_items_used: e.knowledge_items_used ?? [],
      uopa_context_used: e.uopa_context_used ?? false,
      product_context_used: e.product_context_used ?? false,
      fallback_to_keyword: e.fallback_to_keyword ?? false,
      fallback_to_general: e.fallback_to_general ?? false,
      layer_used: e.layer_used ?? null,
      model_used: e.model_used ?? null,
      response_confidence: e.response_confidence ?? null,
      chunked_results_count: e.chunked_results_count ?? 0,
      feedback_type: e.feedback_type ?? null,
    }));

    const { error } = await supabase.from('rag_events').insert(rows);

    if (error) {
      console.error('[RAG-INGEST] Insert error:', error);
      return new Response(JSON.stringify({ error: 'Insert failed', details: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[RAG-INGEST] Inserted ${rows.length} events`);

    return new Response(JSON.stringify({ inserted: rows.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[RAG-INGEST] Error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
