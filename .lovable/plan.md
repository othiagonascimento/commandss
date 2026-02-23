
# Auditoria de Segurança de Dados: Proteção contra `.filter is not a function`

## Problema Atual

O erro `(healthData || []).filter is not a function` persiste na pagina **Tenant Health** porque a API `master-analytics` retorna um **objeto** em vez de um **array**. A correção anterior (linha 219) tenta extrair o array, mas se nenhuma das chaves (`tenants`, `data`) existir com um array, o resultado ainda sera um objeto, e o `|| []` nao protege porque o objeto e "truthy".

O mesmo padrao vulneravel existe em **pelo menos 7 outras paginas**.

---

## Paginas Vulneraveis Identificadas

| Pagina | Arquivo | Risco |
|--------|---------|-------|
| **Tenant Health** | `TenantHealth.tsx:219-256` | ATIVO - erro em producao agora |
| **Activity Logs** | `ActivityLogs.tsx:120` | `return data as AuditLog[]` - sem validacao |
| **Analytics** | `Analytics.tsx:242` | `return data` - sem validacao, confia que sub-chaves serao arrays |
| **Feature Flags** | `FeatureFlags.tsx:63` | `return data.flags as FeatureFlag[]` - crash se `data.flags` nao existir |
| **Invite Links** | `InviteLinks.tsx:81` | `return data.links as InviteLink[]` - crash se `data.links` nao existir |
| **Comunicados** | `Comunicados.tsx:92` | `return data.broadcasts as Broadcast[]` - crash se `data.broadcasts` nao existir |
| **Admin Cadastros** | `AdminCadastros.tsx:142` | `return response.data?.data as OnboardingSubmission[]` - menos risco, tem `?.` |
| **Create Tenant** | `CreateTenant.tsx:102,115` | `return data?.data as Plan[]` - menos risco, tem `?.` |

---

## Solucao

Criar uma funcao utilitaria `safeArray<T>()` e aplica-la em todos os pontos vulneraveis.

### 1. Criar helper `safeArray` em `src/lib/utils.ts`

```typescript
export function safeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    // Tenta extrair de chaves comuns retornadas pelas Edge Functions
    const obj = value as Record<string, unknown>;
    for (const key of ['data', 'tenants', 'logs', 'flags', 'links', 'broadcasts', 'items', 'results']) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }
  return [];
}
```

### 2. Corrigir cada pagina

**TenantHealth.tsx** (linhas 219 e 225, 252-256):
- Usar `safeArray<TenantHealthData>(data)` no queryFn
- A linha 225 ja funciona com `(healthData || [])` desde que o queryFn retorne array

**ActivityLogs.tsx** (linha 120):
- `return safeArray<AuditLog>(data);`

**Analytics.tsx** (linha 242):
- Validar que `data` e um objeto e que suas sub-chaves sao arrays:
  ```typescript
  const raw = data || {};
  return {
    cohort: safeArray(raw.cohort),
    churn_risk: safeArray(raw.churn_risk),
    revenue_breakdown: {
      by_plan: safeArray(raw.revenue_breakdown?.by_plan),
      by_period: safeArray(raw.revenue_breakdown?.by_period),
      by_sales_rep: safeArray(raw.revenue_breakdown?.by_sales_rep),
    },
    metrics: raw.metrics || { ltv:0, cac:0, ltv_cac_ratio:0, churn_rate:0, expansion_revenue:0, net_revenue_retention:0 },
  };
  ```

**FeatureFlags.tsx** (linha 63):
- `return safeArray<FeatureFlag>(data?.flags ?? data);`

**InviteLinks.tsx** (linha 81):
- `return safeArray<InviteLink>(data?.links ?? data);`

**Comunicados.tsx** (linha 92):
- `return safeArray<Broadcast>(data?.broadcasts ?? data);`

**AdminCadastros.tsx** (linha 142):
- `return safeArray<OnboardingSubmission>(response.data?.data ?? response.data);`

**CreateTenant.tsx** (linhas 102, 115):
- `return safeArray<Plan>(data?.data ?? data);`
- `return safeArray<NicheTemplate>(data?.data ?? data);`

### 3. Resumo de arquivos alterados

- `src/lib/utils.ts` — adicionar `safeArray`
- `src/pages/TenantHealth.tsx` — corrigir queryFn
- `src/pages/ActivityLogs.tsx` — corrigir queryFn
- `src/pages/Analytics.tsx` — corrigir queryFn com validacao profunda
- `src/pages/FeatureFlags.tsx` — corrigir queryFn
- `src/pages/InviteLinks.tsx` — corrigir queryFn
- `src/pages/Comunicados.tsx` — corrigir queryFn
- `src/pages/AdminCadastros.tsx` — corrigir queryFn
- `src/pages/CreateTenant.tsx` — corrigir queryFn (2 queries)

Total: **9 arquivos**, todos com alteracoes pequenas e cirurgicas.
