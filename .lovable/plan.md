
## Plano final — FinOps funcional + honesto

### Diagnóstico confirmado por SQL

- `master-analytics` no CRM **não implementa** `finops-pricing-list/create` nem `finops-budgets-list/update` → 400 "Unknown endpoint".
- RLS de `ai_model_pricing_history` e `ai_output_token_budgets` libera `SELECT` para `is_master_tenant()` autenticado → dá pra ler direto do front com `supabase-js`.
- `platform_cost_allocations` tem dados só até abril/2026 (5 linhas, último `billing_month = 2026-04-01`). Maio = vazio. Por isso `official_gcp_total_brl`, `infra_overhead_brl`, `media_billing_brl`, `ai_billing_brl` retornam 0 do `finops-overview`.
- `api_usage_logs` tem **1 linha no mês** (R$ 0,0014). A telemetria de IA quase não está sendo emitida pelo CRM — não é cache nem RLS, é ingestão.
- A lentidão tem 2 causas: cada página chama um endpoint diferente que executa o mesmo `loadFinOpsDataset` pesado; e `useFinOpsAnomaliesCount` faz polling em todo navegação fora de `/finops`.

### Mudanças neste projeto (Master)

**1. Pricing/Budgets — leitura direta da DB externa**

`src/services/finopsApi.ts`
- Trocar `pricingList`/`budgetsList` por `supabase.from('ai_model_pricing_history').select('*').order('effective_from',{ascending:false})` e `supabase.from('ai_output_token_budgets').select('*').order('layer',{nullsFirst:false}).order('operation')`.
- Manter `pricingCreate`/`budgetsUpdate` na API mas marcar `unsupported: true` no retorno (UI mostra aviso em vez de tentar gravar).

`src/pages/finops/FinOpsPricingSettingsPage.tsx` e `FinOpsBudgetSettingsPage.tsx`
- Renderizar tabela com os dados reais (17 e 9 linhas hoje).
- Remover formulários de edição; substituir por banner: "Edição via API ainda não disponível. Configure por SQL no CRM" + link ao SQL Editor.

**2. Cache compartilhado + parar polling global**

`src/hooks/finops/useFinOps.ts`
- `queryKey` de `useFinOpsOverview` baseado só em `month` (não no objeto inteiro de filtros) → Overview, Investor, AIPage reutilizam.
- `staleTime: 120_000`, `refetchOnWindowFocus: false` em todas as queries pesadas.
- `useFinOpsAnomaliesCount`: `enabled` controlado por `pathname.startsWith('/finops')`.

`src/components/layout/AppSidebar.tsx`
- Mover badge de anomalias pra dentro do escopo `/finops` (não polla em `/dashboard`, `/tenants` etc).

**3. UI honesta sobre dado faltante**

`src/components/finops/FinOpsShell.tsx`
- Banner âmbar quando `totals.official_gcp_total_brl === 0` e mês atual: "Faturas de cloud do mês ainda não importadas para `platform_cost_allocations` (última: abril/2026). Custos de infra, mídia e billing de IA aparecerão como R$ 0 até a próxima ingestão."
- Banner vermelho quando `totals.api_logs < 10`: "Telemetria de IA com baixíssimo volume (X chamadas no período). Verifique se `_shared/ai-telemetry.ts` no CRM está logando em `api_usage_logs.cost_brl`."

`src/components/finops/KPICard.tsx`
- Quando `value === 0` e `confidence === 'low'`, renderizar "—" em texto secundário com tooltip "Sem dados ingeridos" em vez de "R$ 0,00".

`src/components/finops/EmptyFinOpsState.tsx`
- Variantes: `no-telemetry`, `no-billing`, `error`, com CTA específico (link para Supabase SQL Editor / Edge Logs).

**4. Resiliência da chamada**

`src/services/finopsApi.ts`
- `AbortController` com timeout 30s, mensagem "Tempo esgotado — backend lento" em vez de spinner infinito.

**5. Warning React do DataTable**

`src/components/finops/DataTable.tsx`
- Converter wrapper externo para `React.forwardRef<HTMLDivElement, Props<T>>`.

### Para você levar ao Antigravity (CRM, fora deste projeto)

Sem isso, "Custos GCP" continua zero e Settings continua read-only:

1. Adicionar 4 `case` no `master-analytics`: `finops-pricing-list/create`, `finops-budgets-list/update` (prompt completo já enviado em mensagem anterior).
2. Implementar/agendar ingestão mensal em `platform_cost_allocations` — última linha é de abril, estamos em maio.
3. Auditar por que `api_usage_logs` só recebeu 1 linha o mês inteiro. Provavelmente `_shared/ai-telemetry.ts` não está sendo invocado em todas as chamadas de IA do CRM ou está falhando silenciosamente.

### Arquivos alterados neste projeto

- `src/services/finopsApi.ts`
- `src/hooks/finops/useFinOps.ts`
- `src/pages/finops/FinOpsPricingSettingsPage.tsx`
- `src/pages/finops/FinOpsBudgetSettingsPage.tsx`
- `src/components/finops/FinOpsShell.tsx`
- `src/components/finops/EmptyFinOpsState.tsx`
- `src/components/finops/KPICard.tsx`
- `src/components/finops/DataTable.tsx`
- `src/components/layout/AppSidebar.tsx`

### Resultado esperado

- Acaba o erro 400 "Unknown endpoint".
- Pricing (17 linhas) e Budgets (9 linhas) carregam normalmente, read-only.
- FinOps fica visivelmente mais rápido (uma chamada de overview serve várias páginas; sem polling fora de `/finops`).
- Onde os dados não foram ingeridos, a UI explica em vez de mentir R$ 0,00.
- Warning do DataTable sumido.
