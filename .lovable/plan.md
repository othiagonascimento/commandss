
# Plano: Corrigir CreditZonesWidget para usar estrutura correta de limites

## Problema Identificado

O erro `column tenants_1.limit_ai_credits_monthly does not exist` ocorre porque o `CreditZonesWidget` está tentando buscar uma coluna inexistente diretamente da tabela `tenants`.

### Query Atual (Incorreta)
```typescript
.select(`
  tenant_id,
  ai_credits_used,
  tenants:tenant_id (
    id,
    name,
    limit_ai_credits_monthly  // ❌ NÃO EXISTE!
  )
`)
```

### Estrutura Correta do Sistema
- **Limites de créditos** estão na tabela `tenant_features` (campo `credits_per_user`)
- O limite total é **calculado**: `credits_per_user × número de usuários ativos`
- Esta é a mesma lógica usada pela Edge Function `master-usage`

---

## Solução

### Arquivo: `src/components/dashboard/CreditZonesWidget.tsx`

1. **Corrigir a query** para buscar dados de `tenant_features` junto com `tenants`
2. **Buscar contagem de usuários** por tenant para calcular limite total
3. **Aplicar a fórmula correta**: `limite = credits_per_user × users_count`

### Nova Query

```text
SELECT tenant_usage:
  - tenant_id
  - ai_credits_used

JOIN tenants:
  - id
  - name

JOIN tenant_features:
  - credits_per_user
```

### Lógica de Cálculo

```text
Para cada tenant:
  creditsUsed = tenant_usage.ai_credits_used
  creditsPerUser = tenant_features.credits_per_user || 500 (default)
  usersCount = (buscar contagem de profiles do tenant)
  creditsLimit = creditsPerUser × max(usersCount, 1)
  usagePercent = (creditsUsed / creditsLimit) × 100
```

---

## Implementação Detalhada

### Passo 1: Corrigir a query do widget

A query precisa fazer join com `tenant_features` em vez de buscar campo inexistente de `tenants`:

```typescript
const { data: tenantUsages } = await supabase
  .from('tenant_usage')
  .select(`
    tenant_id,
    ai_credits_used,
    tenants:tenant_id (
      id,
      name
    ),
    tenant_features:tenant_id (
      credits_per_user
    )
  `)
  .lte('period_start', today)
  .gte('period_end', today);
```

### Passo 2: Buscar contagem de usuários

Como o limite depende de usuários ativos, precisamos buscar a contagem:

```typescript
// Buscar contagem de usuários por tenant
const tenantIds = tenantUsages.map(u => u.tenant_id);
const { data: userCounts } = await supabase
  .from('profiles')
  .select('tenant_id')
  .in('tenant_id', tenantIds);

// Agregar por tenant
const usersPerTenant = userCounts.reduce((acc, p) => {
  acc[p.tenant_id] = (acc[p.tenant_id] || 0) + 1;
  return acc;
}, {});
```

### Passo 3: Calcular limite corretamente

```typescript
tenantUsages.forEach((usage) => {
  const tenant = usage.tenants;
  const features = usage.tenant_features;
  
  const creditsUsed = usage.ai_credits_used || 0;
  const creditsPerUser = features?.credits_per_user || 500;
  const usersCount = usersPerTenant[usage.tenant_id] || 1;
  const creditsLimit = creditsPerUser * usersCount;
  const usagePercent = creditsLimit > 0 ? (creditsUsed / creditsLimit) * 100 : 0;
  
  // ... resto da lógica de zones
});
```

---

## Resumo das Mudanças

| Arquivo | Alteração |
|---------|-----------|
| `src/components/dashboard/CreditZonesWidget.tsx` | Corrigir query para usar `tenant_features.credits_per_user` + contagem de usuários |

---

## Resultado Esperado

- Widget "Saúde dos Créditos" carrega sem erros
- Zonas (Verde/Amarelo/Vermelho) calculadas corretamente baseadas em `credits_per_user × users`
- Tenants em modo degradado (>115%) mostrados corretamente
- Consistência com a lógica da Edge Function `master-usage`
