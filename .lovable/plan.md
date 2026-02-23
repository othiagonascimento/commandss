
# Plano Elite de Telemetria Operacional do Master

## Status de Implementação

| Fase | Status | Descrição |
|------|--------|-----------|
| Fase 1 | ✅ CONCLUÍDA | SQL + Edge Functions (receiver + query) |
| Fase 2 | ✅ CONCLUÍDA | API frontend (masterApi.ts + hooks useOpsHealth + useAlerts) |
| Fase 3 | ✅ CONCLUÍDA | Página /operations com 6 tabs |
| Fase 4 | ✅ CONCLUÍDA | Aba Operações no TenantDetail |
| Fase 5 | ✅ CONCLUÍDA | Correção de dados fabricados no master-analytics |
| Fase 6 | ✅ CONCLUÍDA | OpsAlertsWidget + OpsStatusBar no Dashboard |

## Pré-requisitos do Usuário

- [x] Executar SQL de `docs/sql/ops_health_tables.sql` no Supabase externo
- [ ] Configurar no CRM o endpoint `ops-health-receiver` como destino do `ops_health_sync`
- [ ] Expandir o `collectOpsHealth()` do CRM com as 10 métricas faltantes (seção 16 da auditoria)

## Dados Fabricados Corrigidos (Fase 5)

| Métrica | Antes | Depois |
|---------|-------|--------|
| `new_leads_7d` | `Math.round(totalLeads * 0.12)` | Leitura real do snapshot CRM via `ops_health_snapshots` |
| `risk_score` | `Math.floor(Math.random() * 30) + 60` | Calculado com base em dias de inatividade real |
| `days_since_login` | `Math.floor(Math.random() * 20) + 7` | Calculado com base em `updated_at` do `tenant_usage` |
| Cohort retention | `95 - Math.random() * 10` etc. | Retenção real: tenants ativos vs cancelados/bloqueados por cohort |
| `estimatedLtv` | `avgMrr * 24` (fixo) | Lifetime real calculado de `billing_subscriptions.created_at` até cancelamento |
| `cac` | `350` hardcoded | Mantido como 350 mas marcado com `cac_source: 'estimated'` |
| Health Score | `50 + 20 + 15 + 15` fixo | Score ponderado 100pts: canais(25) + atividade(25) + filas(20) + SLA(15) + usage(15) |

## Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `docs/sql/ops_health_tables.sql` | Tabelas + RPCs + índices |
| `supabase/functions/ops-health-receiver/index.ts` | Webhook receptor com detecção de 8 alertas |
| `supabase/functions/ops-health-query/index.ts` | API de consulta com 7 actions |
| `src/pages/Operations.tsx` | Dashboard operacional com 6 tabs |
| `src/hooks/useOpsHealth.ts` | Hook de polling do snapshot (60s) |
| `src/hooks/useAlerts.ts` | Hook de alertas com mutations |
| `src/components/dashboard/OpsAlertsWidget.tsx` | Widget de alertas para dashboard |
| `src/components/dashboard/OpsStatusBar.tsx` | Barra de status semáforo |

## Arquivos Editados

| Arquivo | Mudança |
|---------|---------|
| `supabase/config.toml` | +2 functions |
| `src/services/masterApi.ts` | +opsHealthApi, +alertsApi, +interfaces |
| `src/App.tsx` | +rota /operations |
| `src/components/layout/AppSidebar.tsx` | +item Centro de Operações com badge |
| `src/pages/Index.tsx` | +OpsAlertsWidget, +OpsStatusBar |
| `src/pages/TenantDetail.tsx` | +aba Operações |
| `supabase/functions/master-analytics/index.ts` | 5 correções de dados fabricados + health score real |
