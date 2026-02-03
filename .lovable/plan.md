
# Plano: Correção dos Erros do Dashboard Master

## Diagnóstico

### Erro 1: "Erro ao carregar zonas de crédito"
**Causa**: O PostgREST não consegue fazer join de `tenant_usage` → `tenant_features` porque não existe uma Foreign Key entre essas tabelas. O código atual usa a sintaxe:

```typescript
.select(`
  tenant_id,
  ai_credits_used,
  tenants:tenant_id (id, name),
  tenant_features:tenant_id (credits_per_user)  // ❌ Join inválido!
`)
```

**Solução**: Separar as queries - buscar `tenant_usage` + `tenants`, depois buscar `tenant_features` separadamente e combinar no JavaScript.

### Erro 2: "Erro ao carregar dados" 
**Causa**: Também relacionado à Edge Function `master-analytics` ou chamadas internas que podem ter problemas similares.

### Por que só 3 tenants no SQL?
O SQL que você executou (`ai_agent_config`) mostra apenas os tenants que têm configuração de IA habilitada - os outros 4 tenants existem mas não têm registro em `ai_agent_config`. O dashboard mostra todos os tenants corretamente.

---

## Implementação

### Arquivo: `src/components/dashboard/CreditZonesWidget.tsx`

Refatorar para fazer queries separadas:

```text
ANTES (incorreto):
tenant_usage → tenants + tenant_features (join direto)

DEPOIS (correto):
1. Query tenant_usage com join apenas para tenants
2. Query separada de tenant_features para os tenant_ids
3. Query separada de profiles para contagem de usuários
4. Combinar os dados no JavaScript
```

### Lógica Corrigida

```typescript
// 1. Buscar tenant_usage com join apenas para tenants
const { data: tenantUsages } = await supabase
  .from('tenant_usage')
  .select(`
    tenant_id,
    ai_credits_used,
    tenants:tenant_id (id, name)
  `)
  .lte('period_start', today)
  .gte('period_end', today);

// 2. Buscar tenant_features separadamente
const tenantIds = tenantUsages.map(u => u.tenant_id);
const { data: features } = await supabase
  .from('tenant_features')
  .select('tenant_id, credits_per_user')
  .in('tenant_id', tenantIds);

// 3. Criar mapa de features por tenant
const featuresMap = features.reduce((acc, f) => {
  acc[f.tenant_id] = f;
  return acc;
}, {});

// 4. Buscar contagem de usuários
const { data: profiles } = await supabase
  .from('profiles')
  .select('tenant_id')
  .in('tenant_id', tenantIds);

// 5. Agregar usuários
const usersPerTenant = profiles.reduce((acc, p) => {
  acc[p.tenant_id] = (acc[p.tenant_id] || 0) + 1;
  return acc;
}, {});

// 6. Calcular zonas usando o mapa de features
tenantUsages.forEach((usage) => {
  const features = featuresMap[usage.tenant_id];
  const creditsPerUser = features?.credits_per_user || 500;
  const usersCount = usersPerTenant[usage.tenant_id] || 1;
  const creditsLimit = creditsPerUser * Math.max(usersCount, 1);
  // ...
});
```

---

## Resumo das Mudanças

| Arquivo | Alteração |
|---------|-----------|
| `src/components/dashboard/CreditZonesWidget.tsx` | Separar query de tenant_features para evitar erro de join |

## Resultado Esperado

- Widget "Saúde dos Créditos" carrega sem erros
- Todas as zonas (Verde/Amarelo/Vermelho) calculadas corretamente
- Tenants sem registro em tenant_features usam valor padrão (500 créditos/usuário)
- O erro "column tenants_1.credits_per_user does not exist" é eliminado
