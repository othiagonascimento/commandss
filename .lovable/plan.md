
# Plano Elite de Telemetria Operacional do Master

## O Problema Real (Resumo da Auditoria)

O Master Panel atualmente sofre de 5 falhas estruturais graves:

1. **ZERO visibilidade operacional** -- O CRM envia `ops_health_sync` a cada 5 min, mas o Master ignora completamente (nao existe receiver)
2. **Dados fabricados** -- `new_leads_7d` usa `Math.round(totalLeads * 0.12)` (linha 77 do master-analytics), cohort retention usa `Math.random()` (linhas 599-604), churn risk usa `risk_score: Math.floor(Math.random() * 30) + 60` (linha 544)
3. **Health score simplista** -- Formula fixa `50 + 20 + 15 + 15` sem dados reais do CRM (linhas 425-428 do master-analytics)
4. **Zero alertas automaticos** -- Nenhum dos 8 tipos de alerta existe
5. **Sem visibilidade por usuario** -- Nao existe drill-down de usuario especifico em tenant especifico

---

## Arquitetura do Plano (6 Fases)

### FASE 1: Fundacao (Banco de Dados + Receptor)

**1.1 Novo SQL: `docs/sql/ops_health_tables.sql`**

Tabelas no Supabase externo (btoyclznuuwvxbsacemw):

- `ops_health_snapshots` -- armazena cada payload recebido do CRM
  - `id` UUID PK
  - `tenant_id` UUID (nullable, para snapshots globais vs por-tenant)
  - `snapshot_type` TEXT ('global' | 'tenant' | 'user')
  - `snapshot_data` JSONB
  - `source` TEXT
  - `created_at` TIMESTAMPTZ (indice)
  - Retencao: 7 dias via cleanup

- `master_alerts` -- sistema de alertas persistentes
  - `id` UUID PK
  - `alert_type` TEXT (queue_overload, channel_down, ai_leak, trial_expiring, limit_reached, cron_failure, security_alert, user_inconsistency)
  - `severity` TEXT (info, warning, critical)
  - `title` TEXT
  - `description` TEXT
  - `metadata` JSONB (tenant_id, user_id, valores, thresholds)
  - `tenant_id` UUID (nullable)
  - `user_id` UUID (nullable)
  - `is_resolved` BOOLEAN default false
  - `resolved_at` TIMESTAMPTZ
  - `resolved_by` UUID
  - `created_at` TIMESTAMPTZ
  - Indice composto em (is_resolved, severity, created_at)

- `ops_health_history` -- metricas agregadas por hora para graficos historicos
  - `id` UUID PK
  - `tenant_id` UUID (nullable)
  - `hour` TIMESTAMPTZ
  - `metrics` JSONB (event_queue, message_queue, channels, ai_performance, cron_health)
  - `created_at` TIMESTAMPTZ
  - Indice em (tenant_id, hour)
  - Retencao: 30 dias

RPCs:
- `get_latest_snapshot(p_tenant_id)` -- ultimo snapshot, global ou por tenant
- `get_snapshot_history(p_tenant_id, p_hours)` -- ultimas N horas agregadas
- `get_active_alerts(p_tenant_id, p_severity)` -- alertas nao resolvidos com filtros
- `resolve_alert(p_alert_id, p_user_id)` -- marca alerta como resolvido
- `get_alert_stats()` -- contagem por tipo e severidade

**1.2 Nova Edge Function: `ops-health-receiver`**

- POST autenticado via `MASTER_WEBHOOK_SECRET` (usa `_shared/webhookSignature.ts` existente)
- Aceita payloads do CRM com os 16+ tipos de metricas
- Insere em `ops_health_snapshots`
- Agrega dados em `ops_health_history` (por hora)
- Executa logica de deteccao de alertas (8 tipos):
  - `queue_overload`: event_queue pending > 200 OU message_queue pending > 50
  - `channel_down`: canal ativo sem conversas por 2h
  - `ai_leak`: qualquer leak detectado (contagem > 0)
  - `trial_expiring`: trial < 3 dias sem conversao
  - `limit_reached`: usage > 90% de qualquer limite
  - `cron_failure`: job sem execucao por 2x o intervalo esperado
  - `security_alert`: severity=high nao resolvido
  - `user_inconsistency`: profile sem role ou sem usage
- Auto-resolve alertas quando condicao normaliza
- Responde 200/400/401

**1.3 Nova Edge Function: `ops-health-query`**

- GET autenticado via JWT (master user)
- Actions:
  - `latest` -- ultimo snapshot (global ou por tenant_id)
  - `history` -- serie temporal de metricas (ultimas 24h/7d)
  - `alerts` -- alertas ativos com filtros (tenant_id, severity, type)
  - `alert-stats` -- resumo de alertas (contagem por tipo/severidade)
  - `resolve` (POST) -- resolve um alerta
  - `tenant-ops` -- metricas operacionais especificas de um tenant (filas, canais, IA, cron)
  - `user-ops` -- metricas de um usuario especifico em um tenant (ai_tokens, messages, storage, atividade)

**1.4 Atualizacao: `supabase/config.toml`**

Registrar `ops-health-receiver` e `ops-health-query` com `verify_jwt = false`

---

### FASE 2: Camada de API Frontend

**2.1 Atualizacao: `src/services/masterApi.ts`**

Novos namespaces:

```text
opsHealthApi:
  getLatest(tenantId?)           --> ops-health-query?action=latest
  getHistory(tenantId?, hours?)  --> ops-health-query?action=history
  getTenantOps(tenantId)         --> ops-health-query?action=tenant-ops
  getUserOps(tenantId, userId)   --> ops-health-query?action=user-ops

alertsApi:
  getActive(tenantId?, severity?) --> ops-health-query?action=alerts
  getStats()                      --> ops-health-query?action=alert-stats
  resolve(alertId)                --> ops-health-query?action=resolve (POST)
```

Novas interfaces TypeScript:

```text
OpsHealthSnapshot:
  event_queue: { pending, processing, failed, by_type: Record<string, number> }
  message_queue: { pending, sent, failed }
  channels: { whatsapp: [...], meta: [...] }
  ai_performance: { latency_avg, fallback_rate, leak_count, escalation_rate, by_layer }
  cron_health: { jobs: [{ name, last_success, lag_seconds, consecutive_failures }] }
  billing: { trials_expiring, tenants_near_limit }
  security: { open_alerts, high_severity_count }
  user_consistency: { profiles_without_role, users_without_usage }
  conversations: { active, unassigned, avg_response_time, sla_breached }
  flows: { running, waiting, failed, avg_execution_time }
  push: { subscriptions_active, sent_24h, failed_24h }
  storage: { total_bytes, by_tenant: Record<string, number> }

MasterAlert:
  id, alert_type, severity, title, description, metadata
  tenant_id?, user_id?, is_resolved, resolved_at, created_at

TenantOpsDetail:
  tenant_id, tenant_name
  queues, channels, ai_metrics, users_health, storage, conversations

UserOpsDetail:
  user_id, tenant_id, full_name, role
  ai_tokens_used, ai_tokens_limit, messages_sent, storage_bytes
  last_activity, conversations_active, deals_won, deals_lost
```

**2.2 Novo Hook: `src/hooks/useOpsHealth.ts`**

- Polling a cada 60s do ultimo snapshot
- Auto-refetch quando janela ganha foco
- Expoe: `snapshot`, `alerts`, `alertCount`, `isLoading`, `refetch`

**2.3 Novo Hook: `src/hooks/useAlerts.ts`**

- Query de alertas ativos com filtros
- Mutation para resolver alertas
- Badge count reativo para sidebar

---

### FASE 3: Dashboard de Operacoes (Nova Pagina)

**3.1 Nova Pagina: `src/pages/Operations.tsx`**

Pagina completa com 6 secoes em tabs:

**Tab "Visao Geral":**
- 4 stat cards no topo: Alertas Ativos (com badge por severidade), Filas (pending total), Canais (conectados/total), Uptime de Cron
- Grafico de area: metricas das ultimas 24h (event_queue pending, message_queue pending, ai_latency)
- Lista de alertas ativos (ultimos 10) com botao "Resolver"

**Tab "Filas":**
- event_queue: tabela com os 16 tipos de evento, contagem pending/processing/failed por tipo
- message_queue: pending, sent, failed
- Grafico de barras: volume por tipo de evento nas ultimas 24h

**Tab "Canais":**
- Status de cada instancia WhatsApp (connected/disconnected, ultimo heartbeat)
- Status de cada canal Meta (token expiry, ultimo envio)
- Distribuicao de conversas por canal (pie chart)

**Tab "IA":**
- Latencia media por layer (L1/L2/L3) -- grafico de barras
- Taxa de fallback, leak, escalacao -- gauges
- Breakdown de ai_events por tipo (response_sent, blocked, fallback_used, leak_detected, escalated)
- Comandos executados por tipo (QUALIFIED, TRANSFER, etc.)

**Tab "Cron Jobs":**
- Tabela com cada cron job: nome, schedule esperado, ultimo sucesso, lag, falhas consecutivas
- Indicador visual: verde (OK), amarelo (atrasado), vermelho (falhou)

**Tab "Seguranca":**
- Security alerts abertos (tabela com severidade, descricao, tenant)
- Audit logs suspeitos (login_failed > 5 em 15min)
- User inconsistencies (profiles sem role, sem usage)

**3.2 Rota e Sidebar**

- Nova rota `/operations` no `App.tsx`
- Novo item "Centro de Operacoes" no grupo "Visao Geral" da sidebar com icone `Radio` e badge dinamico de alertas ativos

---

### FASE 4: Drill-Down Multi-Tenant (Tenant + Usuario)

**4.1 Nova Aba no TenantDetail: "Operacoes"**

Adicionar aba ao `TENANT_TABS` em `TenantDetail.tsx`:
- `{ value: 'operations', label: 'Operacoes', icon: Radio }`

Conteudo da aba:
- Status dos canais DESTE tenant (WhatsApp instances + Meta channels)
- Metricas de IA DESTE tenant (latencia, fallback, escalacoes, comandos)
- Filas: eventos pending/failed deste tenant
- Flows: automacoes running/waiting/failed deste tenant
- Conversas: ativas, sem atribuicao, SLA breached
- Alertas ativos deste tenant

**4.2 Drill-Down de Usuario em Tenant**

Na aba "Usuarios" do TenantDetail, ao clicar em um usuario, modal/drawer com:
- Consumo individual: ai_tokens_used vs limit, messages_sent, storage_bytes
- Atividade: ultima acao, conversas ativas, deals (win/loss)
- Historico de uso (grafico sparkline ultimos 7 dias)
- Alertas especificos (limite atingido, inatividade)
- Overrides de limites ativos

Isso usa o endpoint `user-ops` do `ops-health-query`.

---

### FASE 5: Correcao de Dados Fabricados

**5.1 `supabase/functions/master-analytics/index.ts`**

Correcoes pontuais (sem reescrever o arquivo inteiro):

- **Linha 77**: `new_leads_7d: Math.round(totalLeads * 0.12)` --> Query real contando leads com `created_at > 7 dias` no CRM, ou consumir do snapshot ops_health
- **Linhas 544-549**: `risk_score: Math.floor(Math.random())` e `days_since_login: Math.floor(Math.random())` --> Calcular com base em `updated_at` real do tenant_usage e atividade recente
- **Linhas 599-604**: Cohort retention com `Math.random()` --> Calcular com base em tenants que permaneceram ativos (nao cancelaram nem ficaram blocked) vs total do cohort
- **Linha 633**: `cac: 350` hardcoded --> Manter como parametro configuravel, mas marcar como "estimado" na UI
- **Linha 621**: `estimatedLtv = avgMrr * 24` --> Calcular lifetime real a partir de `billing_subscriptions.created_at` ate cancelamento

**5.2 Health Score Real no `getTenantHealthData()`**

Substituir a formula simplista (linhas 425-428) por score baseado em dados reais do snapshot:

```text
healthScore = 0
+ 25 pontos se canais conectados (do snapshot)
+ 25 pontos se atividade recente < 24h (messages ou leads)
+ 20 pontos se filas OK (pending < 50, failed = 0)
+ 15 pontos se SLA respeitado (avg_response_time < threshold)
+ 15 pontos se usage < 80% dos limites
```

Se nao houver snapshot disponivel para o tenant, usar formula local simplificada mas marcar como "score estimado" na resposta.

---

### FASE 6: Widget de Alertas no Dashboard Principal

**6.1 Novo Componente: `src/components/dashboard/OpsAlertsWidget.tsx`**

Substitui ou complementa o `UsageAlertsWidget` existente no `Index.tsx`:
- Mostra os 5 alertas mais recentes/graves
- Badge com contagem por severidade (critical em vermelho, warning em amarelo)
- Link "Ver todos" que navega para `/operations`

**6.2 Mini Status Bar no Dashboard**

Barra horizontal no topo do dashboard com indicadores semaforo:
- Filas: verde/amarelo/vermelho
- Canais: verde/amarelo/vermelho
- Cron: verde/amarelo/vermelho
- IA: verde/amarelo/vermelho

Clicavel, leva a `/operations`.

---

## Arquivos Criados (8 novos)

| Arquivo | Descricao |
|---------|-----------|
| `docs/sql/ops_health_tables.sql` | Tabelas + RPCs + indices |
| `supabase/functions/ops-health-receiver/index.ts` | Webhook receptor com deteccao de alertas |
| `supabase/functions/ops-health-query/index.ts` | API de consulta com 7 actions |
| `src/pages/Operations.tsx` | Dashboard operacional com 6 tabs |
| `src/hooks/useOpsHealth.ts` | Hook de polling do snapshot |
| `src/hooks/useAlerts.ts` | Hook de alertas com mutations |
| `src/components/dashboard/OpsAlertsWidget.tsx` | Widget de alertas para dashboard |
| `src/components/dashboard/OpsStatusBar.tsx` | Barra de status semaforo |

## Arquivos Editados (6 existentes)

| Arquivo | Mudanca |
|---------|---------|
| `supabase/config.toml` | +2 functions (ops-health-receiver, ops-health-query) |
| `src/services/masterApi.ts` | +opsHealthApi, +alertsApi, +interfaces |
| `src/App.tsx` | +rota /operations |
| `src/components/layout/AppSidebar.tsx` | +item "Centro de Operacoes" com badge |
| `src/pages/Index.tsx` | +OpsAlertsWidget, +OpsStatusBar |
| `src/pages/TenantDetail.tsx` | +aba "Operacoes" com metricas do CRM |
| `supabase/functions/master-analytics/index.ts` | Correcao de dados fabricados (5 pontos) |

## Pre-requisitos (acao do usuario)

1. Executar o SQL de `docs/sql/ops_health_tables.sql` no Supabase externo
2. Configurar no CRM o endpoint `ops-health-receiver` como destino do `ops_health_sync`
3. Expandir o `collectOpsHealth()` do CRM com as 10 metricas faltantes (secao 16 da auditoria)
4. `NOTIFY pgrst, 'reload schema'` apos executar SQLs

## O que NAO sera alterado (zero risco de regressao)

- Nenhuma tabela existente e modificada
- Nenhuma Edge Function existente e deletada
- `webhookSignature.ts` e reutilizado sem modificacao
- Todas as rotas e componentes existentes permanecem inalterados
- O `master-analytics` recebe apenas correcoes pontuais em linhas especificas (sem reescrita)

## Ordem de Implementacao

1. SQL das tabelas (usuario executa no Supabase)
2. Edge Functions (ops-health-receiver + ops-health-query)
3. API frontend (masterApi.ts + hooks)
4. Pagina Operations (com todas as 6 tabs)
5. Integracao no Dashboard (widget + status bar)
6. Aba Operacoes no TenantDetail
7. Correcao de dados fabricados no master-analytics
