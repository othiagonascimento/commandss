/**
 * Webhook Signature Utility
 * Implements the Master → CRM webhook signature protocol
 * 
 * ALGORITHM: btoa(MASTER_WEBHOOK_SECRET + payload.substring(0, 32))
 * HEADER: x-webhook-signature
 * ENDPOINT: https://btoyclznuuwvxbsacemw.supabase.co/functions/v1/master-core
 */

const CRM_WEBHOOK_URL = 'https://btoyclznuuwvxbsacemw.supabase.co/functions/v1/master-core';

export type WebhookEvent = 
  | 'settings.updated'
  | 'template.updated'
  | 'template.created'
  | 'tenant.provision'
  | 'subscription.updated';

export interface WebhookPayload {
  event: WebhookEvent;
  data: Record<string, unknown>;
  timestamp: string;
}

/**
 * Sign a webhook payload using the documented algorithm
 * Algorithm: btoa(secret + payload.substring(0, 32))
 */
export function signWebhookPayload(secret: string, payload: string): string {
  // Use first 32 chars of payload + secret for signature
  return btoa(secret + payload.substring(0, 32));
}

/**
 * Validate a webhook signature
 */
export function validateWebhookSignature(
  secret: string, 
  payload: string, 
  signature: string
): boolean {
  const expectedSignature = signWebhookPayload(secret, payload);
  return signature === expectedSignature;
}

/**
 * Send a signed webhook to the CRM master-core/webhooks endpoint
 * 
 * @param event - The event type (e.g., 'settings.updated', 'template.updated')
 * @param data - The event payload data
 * @returns Promise with success status and optional error
 */
export async function sendWebhookToCRM(
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string; status?: number }> {
  const secret = Deno.env.get('MASTER_WEBHOOK_SECRET');
  
  if (!secret) {
    console.warn('[WEBHOOK] MASTER_WEBHOOK_SECRET not configured, skipping webhook');
    return { success: false, error: 'MASTER_WEBHOOK_SECRET not configured' };
  }

  const webhookPayload: WebhookPayload = {
    event,
    data,
    timestamp: new Date().toISOString(),
  };

  const payloadString = JSON.stringify(webhookPayload);
  const signature = signWebhookPayload(secret, payloadString);

  console.log(`[WEBHOOK] Sending ${event} to CRM`, { 
    dataKeys: Object.keys(data),
    payloadLength: payloadString.length,
  });

  try {
    const response = await fetch(CRM_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': signature,
        'x-webhook-action': 'webhooks',
      },
      body: payloadString,
    });

    const responseText = await response.text().catch(() => '');
    
    if (!response.ok) {
      console.error(`[WEBHOOK] CRM responded with error`, {
        status: response.status,
        statusText: response.statusText,
        body: responseText.substring(0, 200),
      });
      return { 
        success: false, 
        error: `CRM error: ${response.status} ${response.statusText}`,
        status: response.status,
      };
    }

    console.log(`[WEBHOOK] ${event} sent successfully`, { 
      status: response.status,
    });

    return { success: true, status: response.status };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[WEBHOOK] Failed to send ${event}`, { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Send settings.updated webhook with AI Engine configuration
 */
export async function sendSettingsUpdatedWebhook(settings: {
  ai_layer_1_model?: string | null;
  ai_layer_2_model?: string | null;
  ai_layer_3_model?: string | null;
  ai_layer_1_instructions?: string | null;
  ai_layer_2_instructions?: string | null;
  ai_layer_3_instructions?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  return sendWebhookToCRM('settings.updated', {
    ai_layer_1_model: settings.ai_layer_1_model,
    ai_layer_2_model: settings.ai_layer_2_model,
    ai_layer_3_model: settings.ai_layer_3_model,
    ai_layer_1_instructions: settings.ai_layer_1_instructions,
    ai_layer_2_instructions: settings.ai_layer_2_instructions,
    ai_layer_3_instructions: settings.ai_layer_3_instructions,
    // Cost values as per architecture docs
    ai_layer_1_cost: 0,
    ai_layer_2_cost: 1,
    ai_layer_3_cost: 15,
  });
}

/**
 * Send template.updated or template.created webhook
 */
export async function sendTemplateWebhook(
  eventType: 'template.updated' | 'template.created',
  template: {
    id: string;
    name: string;
    slug: string;
    ai_config?: Record<string, unknown> | null;
    prompts?: Record<string, unknown> | null;
    is_active?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  return sendWebhookToCRM(eventType, {
    id: template.id,
    name: template.name,
    slug: template.slug,
    ai_config: template.ai_config,
    prompts: template.prompts,
    is_active: template.is_active,
  });
}

/**
 * Send tenant.provision webhook
 */
export async function sendTenantProvisionWebhook(tenant: {
  id: string;
  name: string;
  subdomain?: string | null;
  subdomain_slug?: string | null;
  plan_type?: string;
  owner_email?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  return sendWebhookToCRM('tenant.provision', {
    id: tenant.id,
    name: tenant.name,
    subdomain: tenant.subdomain,
    subdomain_slug: tenant.subdomain_slug || tenant.subdomain,
    plan_type: tenant.plan_type || 'trial',
    owner_email: tenant.owner_email,
  });
}

/**
 * Send subscription.updated webhook
 */
export async function sendSubscriptionUpdatedWebhook(subscription: {
  tenant_id: string;
  plan_type: string;
  status: string;
  current_period_end?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  return sendWebhookToCRM('subscription.updated', {
    tenant_id: subscription.tenant_id,
    plan_type: subscription.plan_type,
    status: subscription.status,
    current_period_end: subscription.current_period_end,
  });
}
