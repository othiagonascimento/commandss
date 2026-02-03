
# Plano: Corrigir Dashboard para usar Supabase Externo

## Diagnóstico Definitivo

### ❌ Problema Principal
O `CreditZonesWidget` (e possivelmente outros widgets) está fazendo **query DIRETA** ao Supabase local:

```typescript
// CreditZonesWidget.tsx - Linha 2
import { supabase } from '@/integrations/supabase/client';

// Fazendo query nas tabelas LOCAIS (que estão VAZIAS):
supabase.from('tenant_usage')
supabase.from('tenant_features')
supabase.from('profiles')
```

O `supabase client` aponta para o projeto Lovable, onde as tabelas estão **vazias**. Os dados reais estão no **Supabase externo** (btoyclznuuwvxbsacemw).

### ✅ Padrão Correto (já existe no sistema)
As Edge Functions como `master-usage` e `master-analytics` já buscam do lugar certo:
- Usam `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` para o banco Master
- Usam `REMOTE_SUPABASE_URL` + `REMOTE_SUPABASE_ANON_KEY` para dados do CRM

O hook `useGlobalCredits` usa RPC corretamente, mas **depende das funções SQL estarem instaladas** no banco Master.

---

## Resumo dos Problemas

| Widget | Problema | Solução |
|--------|----------|---------|
| `CreditZonesWidget` | Query direta em tabelas locais vazias | Usar Edge Function `master-usage/zones` |
| `useGlobalCredits` | RPC no banco certo, mas pode falhar se RPC não existe | Adicionar fallback para Edge Function |
| `useMasterDashboard` | Usa Edge Functions ✅ | OK, já correto |

---

## Implementação

### Fase 1: Adicionar endpoint `/zones` na Edge Function `master-usage`

**Arquivo**: `supabase/functions/master-usage/index.ts`

Criar novo endpoint que:
1. Busca `tenant_usage` do banco Master
2. Busca `tenant_features` para limites
3. Conta usuários por tenant
4. Calcula zonas (Verde/Amarelo/Vermelho) corretamente
5. Retorna dados agregados

```text
GET /master-usage/zones

Response:
{
  zones: {
    green: 5,    // 0-100%
    yellow: 1,   // 100-115%
    red: 1       // >115% (degradados)
  },
  degradedTenants: [
    { tenant_id, tenant_name, usage_percent, is_degraded }
  ],
  totalTenants: 7
}
```

### Fase 2: Refatorar CreditZonesWidget para usar Edge Function

**Arquivo**: `src/components/dashboard/CreditZonesWidget.tsx`

Mudar de:
```typescript
// ❌ Query direta (errada)
const { data } = await supabase.from('tenant_usage').select(...)
```

Para:
```typescript
// ✅ Via Edge Function (correto)
const { data } = await supabase.functions.invoke('master-usage', {
  headers: { 'x-path-suffix': 'zones' }
});
```

### Fase 3: Adicionar fallback no useGlobalCredits

**Arquivo**: `src/hooks/useGlobalCredits.ts`

Se a RPC falhar, tentar buscar via Edge Function como fallback:
```typescript
try {
  // Tenta RPC primeiro
  const { data, error } = await supabase.rpc('get_global_credits_summary', {...});
  if (error) throw error;
  return data;
} catch (e) {
  // Fallback: Edge Function
  console.warn('[useGlobalCredits] RPC failed, trying edge function...');
  const { data } = await supabase.functions.invoke('master-usage', {
    headers: { 'x-path-suffix': 'global-summary' },
    body: { periodStart, periodEnd }
  });
  return data;
}
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/master-usage/index.ts` | Adicionar endpoint `GET /zones` e `GET /global-summary` |
| `src/components/dashboard/CreditZonesWidget.tsx` | Usar Edge Function em vez de query direta |
| `src/hooks/useGlobalCredits.ts` | Adicionar fallback para Edge Function |
| `src/services/masterApi.ts` | Adicionar métodos `getZones()` e `getGlobalSummary()` na usageApi |

---

## Resultado Esperado

- Dashboard carrega todos os dados do Supabase externo corretamente
- Widget "Saúde dos Créditos" mostra zonas Verde/Amarelo/Vermelho reais
- Métricas de créditos consumidos refletem dados reais do CRM
- Todos os tenants, usuários e dados de uso são buscados corretamente
- Sistema híbrido de filtros funcionando (granularidade por período)

---

## Fluxo de Dados Corrigido

```text
Frontend (Lovable)
       │
       ▼
Edge Functions (Supabase do Lovable)
       │
       ├──► Master DB (btoyclznuuwvxbsacemw)
       │    - tenants
       │    - tenant_usage
       │    - tenant_features
       │    - profiles
       │
       └──► Remote CRM (REMOTE_SUPABASE_URL)
            - user_usage
            - api_usage_logs
            - ai_orchestration_logs
```
