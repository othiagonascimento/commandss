

# Plano: Sincronização de IDs Master → CRM via Webhook

## Problema Identificado

Na edge function `sync-tenant-to-crm` (linhas 124-144), ao criar um tenant no CRM, o código **não inclui o campo `id`**:

```typescript
const { data: newCrmTenant, error: createError } = await crmSupabase
  .from('tenants')
  .insert({
    // ❌ FALTA: id: masterTenant.id
    name: masterTenant.name,
    subdomain: masterTenant.subdomain,
    ...
  })
```

Isso faz com que o Supabase do CRM gere um **novo UUID**, criando a dessincronização.

## Solução

### Mudança 1: Corrigir `sync-tenant-to-crm` para Passar o Mesmo ID

Modificar o INSERT para incluir `id: masterTenant.id`:

```typescript
.insert({
  id: masterTenant.id,  // ← ADICIONAR
  name: masterTenant.name,
  subdomain: masterTenant.subdomain,
  ...
})
```

### Mudança 2: Usar `masterTenant.id` nas Tabelas Satélite

Atualmente o código usa `crmTenantId` (que vem do retorno do INSERT). Após a correção, garantir consistência:

| Linha | Tabela | Antes | Depois |
|-------|--------|-------|--------|
| 166 | `tenant_branding` | `tenant_id: crmTenantId` | `tenant_id: masterTenant.id` |
| 188 | `tenant_features` | `tenant_id: crmTenantId` | `tenant_id: masterTenant.id` |
| 221 | `ai_agent_config` | `tenant_id: crmTenantId` | `tenant_id: masterTenant.id` |
| 242 | `tenant_usage` | `tenant_id: crmTenantId` | `tenant_id: masterTenant.id` |

### Mudança 3: Adicionar Chamada ao Webhook `tenant.provision` (Opcional/Alternativo)

O CRM agora tem um endpoint para provisionamento via webhook. Podemos adicionar uma chamada adicional como backup:

```typescript
// Após sync bem-sucedido, notificar via webhook
const MASTER_WEBHOOK_SECRET = Deno.env.get('MASTER_WEBHOOK_SECRET');
if (MASTER_WEBHOOK_SECRET) {
  const payload = JSON.stringify({
    event: 'tenant.provision',
    data: {
      id: masterTenant.id,
      name: masterTenant.name,
      subdomain: masterTenant.subdomain,
      plan_type: masterTenant.plan_type,
      owner_email: masterTenant.contact_email
    }
  });
  
  const signature = btoa(MASTER_WEBHOOK_SECRET + payload.substring(0, 32));
  
  await fetch('https://btoyclznuuwvxbsacemw.supabase.co/functions/v1/master-core', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-signature': signature,
      'x-webhook-action': 'webhooks'
    },
    body: payload
  });
}
```

## Fluxo Corrigido

```text
┌─────────────────────────────────────────────────────────────────┐
│                     MASTER PANEL                                 │
│  1. POST /master-tenants → cria tenant (id: ABC-123)             │
│  2. Chama sync-tenant-to-crm                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  sync-tenant-to-crm                              │
│  3. INSERT no CRM com id: ABC-123 (MESMO ID!)                   │
│  4. Cria tabelas satélite com tenant_id: ABC-123                │
│  5. (Opcional) Chama webhook tenant.provision                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CRM EXTERNO                                  │
│  Tenant criado com ID ABC-123                                   │
│  Usuário faz cadastro → metadata.tenant_id: ABC-123             │
│  Trigger handle_new_user → profile vinculado ao tenant correto  │
└─────────────────────────────────────────────────────────────────┘
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/sync-tenant-to-crm/index.ts` | Adicionar `id: masterTenant.id` no INSERT e usar `masterTenant.id` nas tabelas satélite |

## Configuração Necessária

A secret `MASTER_WEBHOOK_SECRET` **não está configurada** atualmente. Se quiser usar o webhook como backup, será necessário adicionar a secret.

**Secrets existentes:**
- `REMOTE_SUPABASE_URL` ✅
- `REMOTE_SUPABASE_SERVICE_ROLE_KEY` ✅
- `MASTER_WEBHOOK_SECRET` ❌ (não existe)

## Seção Técnica

### Código Atual (Problemático)

```typescript
// Linha 124-144 de sync-tenant-to-crm/index.ts
const { data: newCrmTenant, error: createError } = await crmSupabase
  .from('tenants')
  .insert({
    name: masterTenant.name,           // ❌ Falta id
    subdomain: masterTenant.subdomain,
    contact_email: masterTenant.contact_email,
    // ... outros campos
  })
  .select()
  .single();

crmTenantId = newCrmTenant.id;  // ← ID gerado pelo CRM (ERRADO!)
```

### Código Corrigido

```typescript
const { data: newCrmTenant, error: createError } = await crmSupabase
  .from('tenants')
  .insert({
    id: masterTenant.id,  // ← FORÇAR MESMO ID DO MASTER
    name: masterTenant.name,
    subdomain: masterTenant.subdomain,
    contact_email: masterTenant.contact_email,
    // ... outros campos
  })
  .select()
  .single();

// Usar masterTenant.id em vez de crmTenantId para consistência
const syncTenantId = masterTenant.id;
```

### Mudanças Adicionais nas Tabelas Satélite

```typescript
// Linha 163-174: tenant_branding
await crmSupabase
  .from('tenant_branding')
  .upsert({
    tenant_id: masterTenant.id,  // ← ANTES: crmTenantId
    company_name: masterBranding.company_name,
    // ...
  });

// Linha 185-206: tenant_features
await crmSupabase
  .from('tenant_features')
  .upsert({
    tenant_id: masterTenant.id,  // ← ANTES: crmTenantId
    // ...
  });

// Linha 218-226: ai_agent_config
await crmSupabase
  .from('ai_agent_config')
  .upsert({
    tenant_id: masterTenant.id,  // ← ANTES: crmTenantId
    // ...
  });

// Linha 239-253: tenant_usage
await crmSupabase
  .from('tenant_usage')
  .upsert({
    tenant_id: masterTenant.id,  // ← ANTES: crmTenantId
    // ...
  });
```

## Impacto

Após esta mudança:
- Tenants criados no Master terão **exatamente o mesmo ID** no CRM
- O trigger `handle_new_user` no CRM conseguirá encontrar o tenant pelo `tenant_id` do metadata
- Profiles e roles serão vinculados corretamente
- Fim da dessincronização de IDs

