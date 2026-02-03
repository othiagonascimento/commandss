
# Plano: Corrigir Dashboard de Consumo de Créditos

## Diagnóstico Completo

### Problema Identificado
O dashboard mostra `0` em todos os campos de consumo porque:

1. **As funções RPC não existem no banco de dados**:
   - `get_global_credits_summary` - não foi criada
   - `get_top_credit_consumers` - não foi criada
   - `get_tenant_credits_summary` - não foi criada

2. **A infraestrutura existe mas não está sendo usada**:
   - Tabela `tenant_usage` existe e tem campos corretos (`credits_consumed`, `ai_tokens_used`, `estimated_cost_brl`)
   - Tabela `api_usage_logs` existe e tem campos corretos (`credits_consumed`, `cost_brl`, `cost_usd`)
   - Tabela `user_usage` existe com campo `credits_consumed_month`
   - Edge Function `log-api-usage` calcula e grava créditos corretamente

3. **O fluxo de dados esperado**:
   - CRM principal chama `log-api-usage` quando IA é usada
   - `log-api-usage` calcula `credits_consumed = cost_brl * 100`
   - Grava em `api_usage_logs`, `user_usage` e `tenant_usage`
   - Dashboard chama RPCs para agregar e exibir

---

## Solução: Criar Funções RPC de Agregação

### 1. Migration SQL para criar as 3 funções RPC

```sql
-- get_global_credits_summary: Resume consumo global de todos os tenants
CREATE OR REPLACE FUNCTION public.get_global_credits_summary()
RETURNS TABLE (
  total_credits_consumed BIGINT,
  total_cost_brl NUMERIC,
  total_api_calls BIGINT,
  total_tenants_with_usage BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  period_start DATE := date_trunc('month', CURRENT_DATE)::DATE;
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(tu.credits_consumed), 0)::BIGINT,
    COALESCE(SUM(tu.estimated_cost_brl), 0.00)::NUMERIC,
    COALESCE(SUM(tu.api_calls), 0)::BIGINT,
    COUNT(DISTINCT tu.tenant_id)::BIGINT
  FROM public.tenant_usage tu
  WHERE tu.period_start >= period_start;
END;
$$;

-- get_top_credit_consumers: Top N tenants por consumo
CREATE OR REPLACE FUNCTION public.get_top_credit_consumers(
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  tenant_id UUID,
  tenant_name TEXT,
  credits_consumed BIGINT,
  cost_brl NUMERIC,
  api_calls BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  period_start DATE := date_trunc('month', CURRENT_DATE)::DATE;
BEGIN
  RETURN QUERY
  SELECT 
    tu.tenant_id,
    COALESCE(t.name, 'Desconhecido')::TEXT,
    COALESCE(tu.credits_consumed, 0)::BIGINT,
    COALESCE(tu.estimated_cost_brl, 0.00)::NUMERIC,
    COALESCE(tu.api_calls, 0)::BIGINT
  FROM public.tenant_usage tu
  LEFT JOIN public.tenants t ON t.id = tu.tenant_id
  WHERE tu.period_start >= period_start
  ORDER BY tu.credits_consumed DESC NULLS LAST
  LIMIT limit_count;
END;
$$;

-- get_tenant_credits_summary: Resume consumo de um tenant específico
CREATE OR REPLACE FUNCTION public.get_tenant_credits_summary(
  tenant_id_param UUID
)
RETURNS TABLE (
  total_credits_consumed BIGINT,
  total_cost_brl NUMERIC,
  total_api_calls BIGINT,
  users_with_usage BIGINT,
  period_start DATE,
  period_end DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  p_start DATE := date_trunc('month', CURRENT_DATE)::DATE;
  p_end DATE := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(tu.credits_consumed), 0)::BIGINT,
    COALESCE(SUM(tu.estimated_cost_brl), 0.00)::NUMERIC,
    COALESCE(SUM(tu.api_calls), 0)::BIGINT,
    (SELECT COUNT(DISTINCT uu.user_id) 
     FROM public.user_usage uu 
     WHERE uu.tenant_id = tenant_id_param 
     AND uu.credits_consumed_month > 0)::BIGINT,
    p_start,
    p_end
  FROM public.tenant_usage tu
  WHERE tu.tenant_id = tenant_id_param
  AND tu.period_start >= p_start;
END;
$$;

-- Permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_global_credits_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_credit_consumers(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_credits_summary(UUID) TO authenticated;
```

---

## Arquivos a Modificar/Criar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/migrations/YYYYMMDD_credits_rpc_functions.sql` | Criar | Migration com as 3 funções RPC |
| `src/integrations/supabase/types.ts` | Atualizar | Regenerar types após migration (automático) |

---

## Por que os dados estão zerados?

O problema não é só a falta das funções RPC. Mesmo que elas existam, **os dados só serão populados quando**:

1. O CRM principal chamar a Edge Function `log-api-usage` após cada uso de IA
2. A integração entre Master Panel e CRM estiver configurada

### Verificação necessária

Para ter dados reais de consumo, você precisa verificar:

1. **O CRM está chamando `log-api-usage`?** - Verifique nos logs do Supabase
2. **Há dados em `api_usage_logs`?** - Execute: `SELECT * FROM api_usage_logs LIMIT 10`
3. **Há dados em `tenant_usage`?** - Execute: `SELECT * FROM tenant_usage LIMIT 10`

---

## Métricas que serão exibidas

Após implementar as funções RPC:

| Métrica | Origem | Cálculo |
|---------|--------|---------|
| Créditos Consumidos | `tenant_usage.credits_consumed` | `cost_brl * 100` |
| Custo em R$ | `tenant_usage.estimated_cost_brl` | Soma dos custos |
| Chamadas de API | `tenant_usage.api_calls` | Contador incremental |
| Tokens de IA | `tenant_usage.ai_tokens_used` | Soma de tokens |

---

## Conversão Créditos/Tokens/R$

| Unidade | Relação |
|---------|---------|
| 1 Crédito | R$ 0,01 |
| 100 Créditos | R$ 1,00 |
| Custo USD | `tokens * custo_por_token` |
| Custo BRL | `custo_usd * 5.50` (taxa) |
| Créditos | `custo_brl * 100` |

---

## Resultado Esperado

Após criar as funções RPC no Supabase externo:

1. Dashboard mostrará "Créditos Consumidos" com valor real
2. Widget APICostsWidget mostrará top consumidores
3. Página de diagnóstico AI mostrará tokens e custos por modelo
4. Cada tenant terá seu consumo detalhado

---

## Próximos Passos após Aprovação

1. Criar a migration SQL com as 3 funções RPC
2. Você executa o SQL no Supabase Dashboard (SQL Editor) do projeto externo
3. Testar se o dashboard carrega os dados
4. Se ainda zero, verificar se há dados nas tabelas base
