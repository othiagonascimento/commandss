

# Centro de Operacoes - Nivel CEO BigTech

## Problema Atual

O alerta mostra "Inconsistencia de usuarios detectada" com `users_without_usage: 6`, mas:
- Nao diz **quais** sao os 6 usuarios
- Nao diz de **qual tenant** sao
- Nao explica **o que fazer** para resolver
- Nao ha **historico** de alertas ja resolvidos
- O botao "Resolver" nao pede **notas** sobre o que foi feito

## Solucao Proposta

### 1. Alertas com Contexto Acionavel

Cada tipo de alerta tera um painel expandivel com informacoes especificas:

| Tipo de Alerta | Informacoes Mostradas |
|---|---|
| `user_inconsistency` | Lista dos usuarios sem role/usage, com links para o tenant |
| `queue_overload` | Quais tipos de evento estao acumulando, grafico de tendencia |
| `channel_down` | Qual instancia, de qual tenant, ha quanto tempo offline |
| `trial_expiring` | Nome do tenant, dias restantes, link para detalhe |
| `limit_reached` | Tenant, tipo de limite, percentual, link para ajustar |
| `cron_failure` | Nome do job, ultimo sucesso, quantas falhas consecutivas |
| `ai_leak` | Contexto do vazamento, tenant afetado |
| `security_alert` | Descricao detalhada, severidade, tenant |

Cada card de alerta tera um botao "Ver Detalhes" que expande um painel inline mostrando os dados relevantes extraidos do `metadata` do alerta.

### 2. Resolucao com Notas Obrigatorias

O dialog de resolucao passara a incluir:
- Campo de texto **obrigatorio** para descrever a acao tomada (ex: "Atribuido role 'agent' aos 6 usuarios via Supabase")
- Opcao de selecionar um motivo padrao (Corrigido manualmente, Falso positivo, Resolvido automaticamente, Escalado)
- Nome do operador (usuario logado) registrado automaticamente

### 3. Historico de Alertas Resolvidos

Nova aba **"Historico"** dentro da pagina Operations com:
- Tabela paginada de alertas resolvidos
- Colunas: Tipo, Titulo, Tenant, Severidade, Criado em, Resolvido em, Resolvido por, Notas
- Filtros por periodo, tipo, severidade e tenant
- Tempo medio de resolucao (MTTR) exibido como metrica

### 4. Acoes Rapidas por Tipo de Alerta

Botoes de acao contextual por tipo:
- `user_inconsistency` → "Ir para Usuarios do Tenant"
- `channel_down` → "Ir para Detalhe do Tenant"  
- `trial_expiring` → "Ir para Subscricoes"
- `limit_reached` → "Ir para Limites do Tenant"
- Genericos → "Copiar ID" para investigacao

### 5. Severidade Visual Aprimorada

- Alertas **criticos** com borda vermelha pulsante e icone animado
- Alertas **warning** com borda amarela
- Alertas **info** com estilo sutil
- Som/vibracao opcional para criticos (futuro)

---

## Detalhes Tecnicos

### Alteracoes no Backend (SQL a executar)

Adicionar colunas `resolved_by`, `resolved_notes` e `resolution_reason` na tabela `master_alerts`:

```sql
ALTER TABLE master_alerts 
ADD COLUMN IF NOT EXISTS resolved_by UUID,
ADD COLUMN IF NOT EXISTS resolved_notes TEXT,
ADD COLUMN IF NOT EXISTS resolution_reason TEXT 
  CHECK (resolution_reason IN ('manual_fix', 'false_positive', 'auto_resolved', 'escalated'));
```

Criar RPC para historico de alertas resolvidos:

```sql
CREATE OR REPLACE FUNCTION get_resolved_alerts(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_tenant_id UUID DEFAULT NULL,
  p_alert_type TEXT DEFAULT NULL
)
RETURNS TABLE(...) ...
```

Atualizar a funcao `resolve_master_alert` para aceitar notas e motivo.

### Alteracoes no Frontend

**Arquivos modificados:**

1. **`src/pages/Operations.tsx`** - Reestruturacao completa:
   - Nova aba "Historico" com tabela paginada
   - Cards de alerta expandiveis com contexto acionavel
   - Botoes de acao rapida por tipo
   - Severidade visual aprimorada (borda pulsante para criticos)
   - Dialog de resolucao com campo de notas e motivo

2. **`src/components/dashboard/OpsAlertsWidget.tsx`** - Ajustes para consistencia visual

3. **`src/hooks/useAlerts.ts`** - Adicionar:
   - Query para historico de resolvidos
   - Mutation de resolve atualizada com `notes` e `reason`

4. **`src/services/masterApi.ts`** - Adicionar:
   - `alertsApi.getResolved(limit, offset, tenantId, alertType)`
   - `alertsApi.resolve(alertId, notes, reason)` com parametros extras

5. **`supabase/functions/ops-health-query/index.ts`** - Adicionar:
   - Handler `resolved-alerts` para consulta paginada
   - Atualizar handler `resolve` para salvar notas/motivo/usuario

### Fluxo de Resolucao Atualizado

```text
Usuario clica "Resolver"
        |
        v
Dialog abre com resumo do alerta
        |
        v
Usuario seleciona motivo (dropdown)
        |
        v
Usuario escreve notas sobre a acao tomada
        |
        v
Clica "Confirmar Resolucao"
        |
        v
API grava resolved_at, resolved_by, resolved_notes, resolution_reason
        |
        v
Alerta sai da lista ativa e aparece no Historico
```

