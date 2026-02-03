
# Plano: Sistema de Créditos Sincronizado e Automatizado

## Diagnóstico Completo

### Problemas Identificados

| # | Problema | Impacto |
|---|----------|---------|
| 1 | **RPC usa período errado** | `get_global_credits_summary` filtra por `period_start >= 2026-02-01` mas o registro atual tem `period_start = 2026-01-01` |
| 2 | **Dados existem mas não aparecem** | `tenant_usage` tem `ai_credits_used = 749` mas RPC retorna 0 |
| 3 | **CreditZonesWidget usa período fixo** | Também filtra por `period_start = primeiro dia do mês atual` |
| 4 | **Sem agregação por usuário visível** | Tabela `user_usage` tem dados mas não há dashboard para visualizar |
| 5 | **Nomenclatura inconsistente** | `credits_consumed` vs `ai_credits_used` em diferentes tabelas |

### Arquitetura Atual

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE DADOS DE CRÉDITOS                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   CRM (Origem)                     Supabase Externo                          │
│   ┌─────────────┐                  ┌─────────────────────────────────────┐   │
│   │ Mensagem IA │─────────────────▶│ Edge Function: log-api-usage        │   │
│   │ Transcrição │                  │  ├─ Calcula créditos por layer      │   │
│   │ Copiloto    │                  │  ├─ Insere em api_usage_logs        │   │
│   └─────────────┘                  │  ├─ Atualiza user_usage             │   │
│                                    │  └─ Atualiza tenant_usage           │   │
│                                    └─────────────────────────────────────┘   │
│                                              │                               │
│                                              ▼                               │
│                                    ┌─────────────────────────────────────┐   │
│                                    │ Tabelas                              │   │
│                                    │  ├─ api_usage_logs (log individual)  │   │
│                                    │  ├─ user_usage (agregado por user)   │   │
│                                    │  └─ tenant_usage (agregado mensal)   │   │
│                                    └─────────────────────────────────────┘   │
│                                              │                               │
│   Master Panel                               ▼                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Dashboard                                                            │   │
│   │  ├─ useGlobalCredits() → RPC get_global_credits_summary             │   │
│   │  ├─ CreditZonesWidget → Query direta tenant_usage                   │   │
│   │  └─ TenantDetail → useTenantCredits() → RPC get_tenant_credits_summary│  │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Solução Proposta

### 1. Corrigir SQL das RPCs (Período Flexível)

**Problema**: A RPC filtra por `period_start >= primeiro dia do mês atual`, mas o registro de janeiro tem `period_start = 2026-01-01`.

**Solução**: Usar lógica que considera o período vigente do billing cycle.

```sql
-- Antes (errado):
WHERE tu.period_start >= date_trunc('month', CURRENT_DATE)

-- Depois (correto):
WHERE (
  tu.period_start <= CURRENT_DATE 
  AND tu.period_end >= CURRENT_DATE
)
OR tu.period_start = date_trunc('month', CURRENT_DATE)::DATE
```

### 2. Criar RPC para Agregação por Usuário

Nova RPC `get_tenant_user_credits` que retorna consumo detalhado por usuário:

```sql
CREATE FUNCTION get_tenant_user_credits(p_tenant_id UUID)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_role TEXT,
  credits_consumed BIGINT,
  ai_tokens BIGINT,
  api_calls BIGINT,
  transcription_minutes BIGINT
)
```

### 3. Atualizar CreditZonesWidget

Usar lógica de período flexível igual às RPCs.

### 4. Criar Dashboard de Consumo por Usuário

Novo componente `TenantUserCreditsTable` mostrando:
- Lista de usuários do tenant
- Créditos consumidos por cada um
- Tokens de IA usados
- Chamadas de API
- Minutos de transcrição

### 5. Padronizar Nomenclatura

| Tabela | Campo Atual | Ação |
|--------|-------------|------|
| `user_usage` | `credits_consumed_month` | Manter (é o campo correto) |
| `tenant_usage` | `ai_credits_used` | Manter (é o campo correto) |
| `tenant_usage` | `credits_consumed` | Depreciar (não usar mais) |
| `api_usage_logs` | `credits_consumed` | Manter (log individual) |

---

## Detalhamento Técnico

### Arquivo 1: SQL Atualizado para RPCs

```sql
-- docs/sql/credits_rpc_functions.sql (v4 - Período Flexível)

-- 1. get_global_credits_summary: Considera período vigente
CREATE OR REPLACE FUNCTION get_global_credits_summary()
RETURNS TABLE (
  total_credits_consumed BIGINT,
  total_cost_brl NUMERIC,
  total_api_calls BIGINT,
  total_tenants_with_usage BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(tu.ai_credits_used), 0)::BIGINT,
    COALESCE(SUM(tu.estimated_cost_brl), 0.00)::NUMERIC,
    COALESCE(SUM(tu.api_calls), 0)::BIGINT,
    COUNT(DISTINCT tu.tenant_id)::BIGINT
  FROM tenant_usage tu
  WHERE (
    tu.period_start <= CURRENT_DATE 
    AND tu.period_end >= CURRENT_DATE
  )
  OR tu.period_start = date_trunc('month', CURRENT_DATE)::DATE;
END;
$$;

-- 2. get_top_credit_consumers: Top N tenants
CREATE OR REPLACE FUNCTION get_top_credit_consumers(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  tenant_id UUID,
  tenant_name TEXT,
  credits_consumed BIGINT,
  cost_brl NUMERIC,
  api_calls BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tu.tenant_id,
    COALESCE(t.name, 'Desconhecido')::TEXT,
    COALESCE(tu.ai_credits_used, 0)::BIGINT,
    COALESCE(tu.estimated_cost_brl, 0.00)::NUMERIC,
    COALESCE(tu.api_calls, 0)::BIGINT
  FROM tenant_usage tu
  LEFT JOIN tenants t ON t.id = tu.tenant_id
  WHERE (
    tu.period_start <= CURRENT_DATE 
    AND tu.period_end >= CURRENT_DATE
  )
  OR tu.period_start = date_trunc('month', CURRENT_DATE)::DATE
  ORDER BY tu.ai_credits_used DESC NULLS LAST
  LIMIT limit_count;
END;
$$;

-- 3. get_tenant_credits_summary: Resumo de um tenant
CREATE OR REPLACE FUNCTION get_tenant_credits_summary(p_tenant_id UUID)
RETURNS TABLE (
  total_credits_consumed BIGINT,
  total_cost_brl NUMERIC,
  total_api_calls BIGINT,
  users_with_usage BIGINT,
  period_start DATE,
  period_end DATE
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(tu.ai_credits_used), 0)::BIGINT,
    COALESCE(SUM(tu.estimated_cost_brl), 0.00)::NUMERIC,
    COALESCE(SUM(tu.api_calls), 0)::BIGINT,
    (SELECT COUNT(DISTINCT uu.user_id) 
     FROM user_usage uu 
     WHERE uu.tenant_id = p_tenant_id 
     AND uu.credits_consumed_month > 0)::BIGINT,
    tu.period_start,
    tu.period_end
  FROM tenant_usage tu
  WHERE tu.tenant_id = p_tenant_id
  AND (
    (tu.period_start <= CURRENT_DATE AND tu.period_end >= CURRENT_DATE)
    OR tu.period_start = date_trunc('month', CURRENT_DATE)::DATE
  )
  GROUP BY tu.period_start, tu.period_end
  LIMIT 1;
END;
$$;

-- 4. NOVA: get_tenant_user_credits - Consumo por usuário
CREATE OR REPLACE FUNCTION get_tenant_user_credits(p_tenant_id UUID)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_role TEXT,
  credits_consumed BIGINT,
  ai_tokens BIGINT,
  api_calls BIGINT,
  transcription_minutes BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uu.user_id,
    COALESCE(p.full_name, 'Usuário')::TEXT,
    COALESCE(p.role, 'seller')::TEXT,
    COALESCE(uu.credits_consumed_month, 0)::BIGINT,
    COALESCE(uu.ai_tokens_month, 0)::BIGINT,
    COALESCE(uu.api_calls_month, 0)::BIGINT,
    COALESCE(uu.transcription_seconds_month / 60, 0)::BIGINT
  FROM user_usage uu
  LEFT JOIN profiles p ON p.id = uu.user_id
  WHERE uu.tenant_id = p_tenant_id
  AND uu.credits_consumed_month > 0
  ORDER BY uu.credits_consumed_month DESC;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION get_global_credits_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_credit_consumers(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_credits_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_user_credits(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
```

### Arquivo 2: CreditZonesWidget Corrigido

Atualizar query para usar período flexível:

```typescript
// Antes:
.eq('period_start', periodStart)

// Depois:
.or(`period_start.lte.${today},period_end.gte.${today}`)
```

### Arquivo 3: Novo Hook useUserCredits

```typescript
// src/hooks/useUserCredits.ts
export function useUserCredits(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['tenant-user-credits', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase.rpc('get_tenant_user_credits', { 
        p_tenant_id: tenantId 
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });
}
```

### Arquivo 4: Componente TenantUserCreditsTable

Tabela mostrando consumo por usuário com:
- Avatar e nome
- Role (Administrador/Gerente/Vendedor)
- Créditos consumidos (com barra de progresso)
- Tokens de IA
- Chamadas de API
- Minutos de transcrição

### Arquivo 5: Integrar na TenantDetail

Adicionar nova aba "Consumo por Usuário" no detalhe do tenant.

---

## Arquivos a Modificar/Criar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `docs/sql/credits_rpc_functions.sql` | **ATUALIZAR** | Corrigir filtro de período + nova RPC |
| `src/components/dashboard/CreditZonesWidget.tsx` | **ATUALIZAR** | Usar período flexível |
| `src/hooks/useUserCredits.ts` | **CRIAR** | Hook para consumo por usuário |
| `src/components/tenant/TenantUserCreditsTable.tsx` | **CRIAR** | Tabela de consumo por usuário |
| `src/pages/TenantDetail.tsx` | **ATUALIZAR** | Adicionar aba de consumo |

---

## SQL de Correção Imediata

Execute este SQL AGORA para corrigir as RPCs:

```sql
-- CORREÇÃO IMEDIATA: Atualizar RPCs com período flexível

DROP FUNCTION IF EXISTS get_global_credits_summary();
DROP FUNCTION IF EXISTS get_top_credit_consumers(INTEGER);
DROP FUNCTION IF EXISTS get_tenant_credits_summary(UUID);

-- 1. get_global_credits_summary
CREATE OR REPLACE FUNCTION get_global_credits_summary()
RETURNS TABLE (
  total_credits_consumed BIGINT,
  total_cost_brl NUMERIC,
  total_api_calls BIGINT,
  total_tenants_with_usage BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(tu.ai_credits_used), 0)::BIGINT,
    COALESCE(SUM(tu.estimated_cost_brl), 0.00)::NUMERIC,
    COALESCE(SUM(tu.api_calls), 0)::BIGINT,
    COUNT(DISTINCT tu.tenant_id)::BIGINT
  FROM tenant_usage tu
  WHERE tu.period_start <= CURRENT_DATE 
    AND tu.period_end >= CURRENT_DATE;
END;
$$;

-- 2. get_top_credit_consumers
CREATE OR REPLACE FUNCTION get_top_credit_consumers(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  tenant_id UUID,
  tenant_name TEXT,
  credits_consumed BIGINT,
  cost_brl NUMERIC,
  api_calls BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tu.tenant_id,
    COALESCE(t.name, 'Desconhecido')::TEXT,
    COALESCE(tu.ai_credits_used, 0)::BIGINT,
    COALESCE(tu.estimated_cost_brl, 0.00)::NUMERIC,
    COALESCE(tu.api_calls, 0)::BIGINT
  FROM tenant_usage tu
  LEFT JOIN tenants t ON t.id = tu.tenant_id
  WHERE tu.period_start <= CURRENT_DATE 
    AND tu.period_end >= CURRENT_DATE
  ORDER BY tu.ai_credits_used DESC NULLS LAST
  LIMIT limit_count;
END;
$$;

-- 3. get_tenant_credits_summary
CREATE OR REPLACE FUNCTION get_tenant_credits_summary(p_tenant_id UUID)
RETURNS TABLE (
  total_credits_consumed BIGINT,
  total_cost_brl NUMERIC,
  total_api_calls BIGINT,
  users_with_usage BIGINT,
  period_start DATE,
  period_end DATE
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(tu.ai_credits_used, 0)::BIGINT,
    COALESCE(tu.estimated_cost_brl, 0.00)::NUMERIC,
    COALESCE(tu.api_calls, 0)::BIGINT,
    (SELECT COUNT(DISTINCT uu.user_id) 
     FROM user_usage uu 
     WHERE uu.tenant_id = p_tenant_id 
     AND uu.credits_consumed_month > 0)::BIGINT,
    tu.period_start,
    tu.period_end
  FROM tenant_usage tu
  WHERE tu.tenant_id = p_tenant_id
    AND tu.period_start <= CURRENT_DATE 
    AND tu.period_end >= CURRENT_DATE
  LIMIT 1;
END;
$$;

-- 4. NOVA: get_tenant_user_credits
CREATE OR REPLACE FUNCTION get_tenant_user_credits(p_tenant_id UUID)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_role TEXT,
  credits_consumed BIGINT,
  ai_tokens BIGINT,
  api_calls BIGINT,
  transcription_minutes BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uu.user_id,
    COALESCE(p.full_name, 'Usuário')::TEXT,
    COALESCE(p.role, 'seller')::TEXT,
    COALESCE(uu.credits_consumed_month, 0)::BIGINT,
    COALESCE(uu.ai_tokens_month, 0)::BIGINT,
    COALESCE(uu.api_calls_month, 0)::BIGINT,
    COALESCE(uu.transcription_seconds_month / 60, 0)::BIGINT
  FROM user_usage uu
  LEFT JOIN profiles p ON p.id = uu.user_id
  WHERE uu.tenant_id = p_tenant_id
    AND uu.credits_consumed_month > 0
  ORDER BY uu.credits_consumed_month DESC;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION get_global_credits_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_credit_consumers(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_credits_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_user_credits(UUID) TO authenticated;

-- Reload PostgREST
NOTIFY pgrst, 'reload schema';
```

---

## Verificação Pós-Execução

Após executar o SQL, teste com:

```sql
-- Deve retornar 749 créditos
SELECT * FROM get_global_credits_summary();

-- Deve mostrar o tenant Master
SELECT * FROM get_top_credit_consumers(5);

-- Deve retornar dados do Master
SELECT * FROM get_tenant_credits_summary('00000000-0000-0000-0000-000000000001');

-- Deve mostrar usuários com consumo
SELECT * FROM get_tenant_user_credits('00000000-0000-0000-0000-000000000001');
```
