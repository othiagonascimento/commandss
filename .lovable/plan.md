

# Auditoria de Segurança e Alinhamento: Projeto Master

## Resumo Executivo

Realizei uma auditoria completa do projeto Master comparando com a arquitetura documentada do CRM. Encontrei **4 problemas críticos** e **3 pontos de atenção** que precisam ser corrigidos para garantir a sincronização correta entre os sistemas.

---

## 1. PROBLEMAS CRITICOS

### 1.1 Webhook `settings.updated` NAO IMPLEMENTADO

**Severidade:** CRITICA

O prompt de arquitetura exige que quando as configurações de AI Engine forem atualizadas no Master, um webhook seja enviado ao CRM com o evento `settings.updated`. Isso **NAO existe** no codigo atual.

**Arquivo afetado:** `supabase/functions/master-settings/index.ts`

**Situacao atual (linhas 249-259):**
```typescript
// Notificar os tenants sobre a mudança
const aiSettings: AISettings = {...};
notifyTenantsAISettingsUpdated(supabaseAdmin, aiSettings);
```

**Problema:** A funcao `notifyTenantsAISettingsUpdated` envia para cada tenant individualmente via `/functions/v1/sync-master-settings`, mas NAO envia o webhook padronizado para o CRM em `master-core/webhooks` com:
- Header `x-webhook-signature`
- Evento `settings.updated`
- Algoritmo de assinatura `btoa(MASTER_WEBHOOK_SECRET + payload.substring(0, 32))`

**Solucao necessaria:** Adicionar chamada ao webhook do CRM apos salvar settings de AI.

---

### 1.2 Webhook `template.updated` NAO IMPLEMENTADO

**Severidade:** CRITICA

**Arquivo afetado:** `supabase/functions/master-templates-proxy/index.ts`

Quando um template eh publicado (action `publish`), o sistema atualiza diretamente no banco do CRM via `crmSupabase.from('master_niche_templates').update()`, mas NAO envia o webhook padronizado `template.updated`.

**Problema:** O CRM pode ter logica adicional no handler de webhook que nao eh executada.

---

### 1.3 Webhook `tenant.provision` PARCIALMENTE IMPLEMENTADO

**Severidade:** ALTA

**Arquivo afetado:** `supabase/functions/sync-tenant-to-crm/index.ts`

O codigo atual faz INSERT direto no banco do CRM (linhas 124-145), mas NAO chama o webhook `tenant.provision` como backup. Isso significa que a logica de provisionamento duplicada no `master-core/webhooks` nunca eh acionada.

**O que falta:**
1. Usar `MASTER_WEBHOOK_SECRET` para assinar
2. Enviar para `master-core/webhooks` com evento `tenant.provision`

---

### 1.4 Secret `MASTER_WEBHOOK_SECRET` NAO UTILIZADO

**Severidade:** CRITICA

Embora a secret `MASTER_WEBHOOK_SECRET` esteja configurada nas secrets do projeto, ela NAO esta sendo usada em nenhum lugar do codigo:

```
Busca por 'MASTER_WEBHOOK_SECRET': 0 resultados
Busca por 'x-webhook-signature': 0 resultados
```

**Impacto:** Nenhum webhook esta sendo assinado corretamente, o que significa que o CRM pode rejeitar chamadas ou a autenticacao nao esta funcionando.

---

## 2. PONTOS DE ATENCAO

### 2.1 Estrutura de `funnel_stages` Divergente

**Arquivo:** `src/types/templates.ts`

O documento de arquitetura diz:
> funnel_stages: `is_won`, `is_lost` existem. `slug`, `system_type`, `is_system`, `is_active` NAO EXISTEM no CRM.

Mas o codigo atual usa:
```typescript
export interface FunnelStage {
  slug: string;        // <-- NAO existe no CRM!
  is_system?: boolean; // <-- NAO existe no CRM!
  ...
}
```

**Risco:** Ao sincronizar templates para o CRM, campos inexistentes podem causar erros.

---

### 2.2 Client do Frontend Configurado Corretamente

**Status:** OK

```typescript
// .env
VITE_SUPABASE_URL="https://btoyclznuuwvxbsacemw.supabase.co"
```

O frontend esta apontando corretamente para o Supabase externo.

---

### 2.3 Secrets Configurados

**Status:** PARCIALMENTE OK

| Secret | Status |
|--------|--------|
| `REMOTE_SUPABASE_URL` | Configurado |
| `REMOTE_SUPABASE_SERVICE_ROLE_KEY` | Configurado |
| `REMOTE_SUPABASE_ANON_KEY` | Configurado |
| `MASTER_WEBHOOK_SECRET` | Configurado mas NAO UTILIZADO |

---

## 3. ACOES RECOMENDADAS

### Prioridade CRITICA

| # | Acao | Arquivo |
|---|------|---------|
| 1 | Implementar envio de webhook `settings.updated` com assinatura | `master-settings/index.ts` |
| 2 | Implementar envio de webhook `template.updated` com assinatura | `master-templates-proxy/index.ts` |
| 3 | Adicionar chamada de webhook `tenant.provision` como backup | `sync-tenant-to-crm/index.ts` |
| 4 | Criar funcao utilitaria para assinatura de webhooks | `supabase/functions/_shared/webhookSignature.ts` |

### Prioridade ALTA

| # | Acao | Arquivo |
|---|------|---------|
| 5 | Revisar mapeamento de `funnel_stages` para remover campos inexistentes no CRM | `master-templates-proxy/index.ts` |
| 6 | Documentar qual algoritmo de assinatura esta em uso | Documentacao |

---

## 4. CODIGO A IMPLEMENTAR

### 4.1 Funcao Utilitaria de Assinatura (Nova)

Criar `supabase/functions/_shared/webhookSignature.ts`:

```typescript
export function signWebhookPayload(secret: string, payload: string): string {
  return btoa(secret + payload.substring(0, 32));
}

export async function sendWebhookToCRM(
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const secret = Deno.env.get('MASTER_WEBHOOK_SECRET');
  if (!secret) {
    console.warn('[WEBHOOK] MASTER_WEBHOOK_SECRET not configured');
    return;
  }

  const payload = JSON.stringify({ event, data });
  const signature = signWebhookPayload(secret, payload);

  await fetch('https://btoyclznuuwvxbsacemw.supabase.co/functions/v1/master-core', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-signature': signature,
      'x-webhook-action': 'webhooks',
    },
    body: payload,
  });
}
```

### 4.2 Adicionar ao `master-settings/index.ts`

Apos salvar AI settings:

```typescript
import { sendWebhookToCRM } from '../_shared/webhookSignature.ts';

// Dentro do handler de PATCH para ai_global_engine:
await sendWebhookToCRM('settings.updated', {
  ai_layer_1_model,
  ai_layer_2_model,
  ai_layer_3_model,
  ai_layer_1_instructions,
  ai_layer_2_instructions,
  ai_layer_3_instructions,
  ai_layer_1_cost: 0,
  ai_layer_2_cost: 1,
  ai_layer_3_cost: 15,
});
```

### 4.3 Adicionar ao `sync-tenant-to-crm/index.ts`

Apos criar tenant no CRM:

```typescript
import { sendWebhookToCRM } from '../_shared/webhookSignature.ts';

// Apos INSERT bem-sucedido:
await sendWebhookToCRM('tenant.provision', {
  id: masterTenant.id,
  name: masterTenant.name,
  subdomain: masterTenant.subdomain,
  subdomain_slug: masterTenant.subdomain,
  plan_type: masterTenant.plan_type,
  owner_email: masterTenant.contact_email,
});
```

---

## 5. CHECKLIST DE VERIFICACAO

Antes de cada deploy, verificar:

- [ ] Webhooks usam header `x-webhook-signature`?
- [ ] Algoritmo de assinatura: `btoa(secret + payload.substring(0, 32))`?
- [ ] Eventos corretos: `settings.updated`, `template.updated`, `tenant.provision`?
- [ ] `MASTER_WEBHOOK_SECRET` igual ao configurado no CRM?
- [ ] Colunas de `funnel_stages` compatíveis com CRM (sem `slug`, `is_system`)?

---

## Conclusao

O projeto Master esta **funcionando parcialmente**, mas **NAO esta enviando webhooks assinados** conforme a arquitetura documentada. Isso pode causar:

1. Dessincronizacao entre Master e CRM
2. Falhas silenciosas de provisionamento
3. AI Engine nao atualizado no CRM quando alterado no Master

Recomendo implementar as correcoes na ordem de prioridade indicada.

