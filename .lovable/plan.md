
# PLANO: CONSUMO DE CRÉDITOS GLOBAL, POR TENANT E POR USUÁRIO

## PROBLEMA IDENTIFICADO

O sistema **armazena corretamente** os créditos consumidos em 3 níveis:
1. **api_usage_logs.credits_consumed** → cada chamada individual
2. **user_usage.credits_consumed_month** → agregado por usuário
3. **tenant_usage.credits_consumed** → agregado por tenant

**Porém, o Dashboard (Index.tsx) e Analytics NÃO exibem esses dados:**
- O `APICostsWidget` calcula créditos como `totalCostBrl * 100` a partir de logs brutos (row-limit de 100)
- Não existe agregação SQL real (RPC functions) que contorne o limite de linhas
- O Dashboard não mostra créditos globais em nenhum card

---

## QUESTÃO 1: DEPLOY VIA SQL?

**Não é possível fazer deploy de Edge Functions via SQL.**

Alternativas para fazer o deploy da Edge Function `master-data`:

### Opção A: Via Supabase Dashboard (recomendado)
1. Acesse: https://supabase.com/dashboard/project/btoyclznuuwvxbsacemw/functions
2. Encontre a função `master-data`
3. Clique em "Redeploy" ou atualize manualmente o código

### Opção B: Via CLI local
```bash
npx supabase functions deploy master-data --project-ref btoyclznuuwvxbsacemw
```

### Opção C: Via GitHub Actions (se configurado)
Se você tem CI/CD configurado, faça push das alterações e o deploy será automático.

---

## QUESTÃO 2: IMPLEMENTAR CONSUMO DE CRÉDITOS VISÍVEL

### Solução: Criar RPC Functions no Supabase para Agregação Real

Estas funções SQL retornam agregados diretamente do banco, sem limite de linhas.

### 2.1 Função SQL: Créditos Globais

```sql
CREATE OR REPLACE FUNCTION get_global_credits_summary()
RETURNS TABLE (
  total_credits_consumed BIGINT,
  total_cost_brl NUMERIC,
  total_api_calls BIGINT,
  total_tenants_with_usage BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(credits_consumed), 0)::BIGINT as total_credits_consumed,
    COALESCE(SUM(estimated_cost_brl), 0) as total_cost_brl,
    COALESCE(SUM(api_calls), 0)::BIGINT as total_api_calls,
    COUNT(DISTINCT tenant_id)::BIGINT as total_tenants_with_usage
  FROM tenant_usage
  WHERE period_start >= date_trunc('month', current_date);
$$;
```

### 2.2 Função SQL: Créditos por Tenant

```sql
CREATE OR REPLACE FUNCTION get_tenant_credits_summary(tenant_id_param UUID)
RETURNS TABLE (
  total_credits_consumed BIGINT,
  total_cost_brl NUMERIC,
  total_api_calls BIGINT,
  users_with_usage BIGINT,
  period_start DATE,
  period_end DATE
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(credits_consumed, 0)::BIGINT,
    COALESCE(estimated_cost_brl, 0),
    COALESCE(api_calls, 0)::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM user_usage WHERE user_usage.tenant_id = tenant_id_param)::BIGINT,
    period_start,
    period_end
  FROM tenant_usage
  WHERE tenant_id = tenant_id_param
    AND period_start >= date_trunc('month', current_date)
  ORDER BY period_start DESC
  LIMIT 1;
$$;
```

### 2.3 Função SQL: Créditos por Usuário

```sql
CREATE OR REPLACE FUNCTION get_user_credits_summary(user_id_param UUID)
RETURNS TABLE (
  total_credits_consumed BIGINT,
  total_api_calls BIGINT,
  total_tokens BIGINT,
  billing_period_start TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(credits_consumed_month, 0)::BIGINT,
    COALESCE(api_calls_month, 0)::BIGINT,
    COALESCE(ai_tokens_month, 0)::BIGINT,
    billing_period_start
  FROM user_usage
  WHERE user_id = user_id_param
  ORDER BY last_updated_at DESC
  LIMIT 1;
$$;
```

### 2.4 Função SQL: Top Consumidores (Tenants)

```sql
CREATE OR REPLACE FUNCTION get_top_credit_consumers(limit_count INT DEFAULT 10)
RETURNS TABLE (
  tenant_id UUID,
  tenant_name TEXT,
  credits_consumed BIGINT,
  cost_brl NUMERIC,
  api_calls BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    tu.tenant_id,
    t.name,
    COALESCE(tu.credits_consumed, 0)::BIGINT,
    COALESCE(tu.estimated_cost_brl, 0),
    COALESCE(tu.api_calls, 0)::BIGINT
  FROM tenant_usage tu
  JOIN tenants t ON t.id = tu.tenant_id
  WHERE tu.period_start >= date_trunc('month', current_date)
  ORDER BY tu.credits_consumed DESC NULLS LAST
  LIMIT limit_count;
$$;
```

---

## ARQUIVOS A MODIFICAR NO FRONTEND

### 1. Dashboard (Index.tsx) - Adicionar Card de Créditos Globais

Adicionar um novo `StatCard` que mostre:
- Total de créditos consumidos globalmente
- Custo estimado em R$
- Top consumidores (link para detalhes)

### 2. APICostsWidget.tsx - Usar RPC ao invés de logs brutos

Substituir a query atual que busca logs individuais por:
```typescript
const { data } = await supabase.rpc('get_global_credits_summary');
const { data: topConsumers } = await supabase.rpc('get_top_credit_consumers', { limit_count: 5 });
```

### 3. TenantDetail.tsx - Exibir créditos do tenant

Na tab Overview ou em card dedicado:
```typescript
const { data: credits } = await supabase.rpc('get_tenant_credits_summary', { tenant_id_param: tenantId });
```

### 4. UserUsageCard.tsx - Já funciona, mas pode usar RPC

Otimizar para usar a nova função:
```typescript
const { data: userCredits } = await supabase.rpc('get_user_credits_summary', { user_id_param: userId });
```

---

## RESUMO DE AÇÕES

### Ações no Supabase (SQL)
1. Criar função `get_global_credits_summary`
2. Criar função `get_tenant_credits_summary`
3. Criar função `get_user_credits_summary`
4. Criar função `get_top_credit_consumers`

### Ações no Frontend (Código)
1. Atualizar `APICostsWidget.tsx` para usar RPC
2. Adicionar card de créditos globais no `Index.tsx`
3. Adicionar seção de créditos no `TenantDetail.tsx`
4. Garantir que `TenantUsageProgress.tsx` mostre os créditos corretamente (já faz)

### Ação de Deploy
1. Fazer redeploy manual da Edge Function `master-data` via Supabase Dashboard

---

## COMO APLICAR AS FUNÇÕES SQL

1. Acesse: https://supabase.com/dashboard/project/btoyclznuuwvxbsacemw/sql
2. Cole cada função SQL e execute
3. Teste chamando: `SELECT * FROM get_global_credits_summary();`

Ou eu posso criar uma migration SQL que será aplicada automaticamente.
