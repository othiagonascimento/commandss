
# Command v3 — "Empresa Cognitiva Operando Dentro de uma Tela"

Reescrita completa do plano. Sai o "squad de agentes". Entra uma **empresa inteira** com divisões espelhando as 6 camadas do UÔPA (Canais, Inteligência, Operação, Dados, Monetização, Infraestrutura) + um **Browser Tester real** que navega, abre console, clica, faz login com impersonate e devolve evidências.

Objetivo final: você manda "Tenant X reclamou que o checkout trava" → Command abre o tenant, faz login como ele, replica o fluxo no browser real, coleta logs/console/network, cruza com banco/edge functions/RAG/billing, gera laudo estruturado, propõe correção (com diff quando código), e espera aprovação humana.

---

## 1. Estrutura: 6 Divisões + 3 Funções Transversais

Cada divisão = conjunto de agentes especializados + toolbelt próprio + manual (system prompt) + métricas de qualidade.

```text
                    ┌─────────────────────────────────┐
                    │   CHIEF (Orchestrator + Triage) │
                    └──────────────┬──────────────────┘
                                   │ delega missão
   ┌──────────┬──────────┬─────────┼─────────┬──────────┬──────────┐
   ▼          ▼          ▼         ▼         ▼          ▼          ▼
 CANAIS  INTELIGÊNCIA OPERAÇÃO   DADOS  MONETIZAÇÃO INFRA      QA/TESTER
(WhatsApp (RAG, AI    (Funil,   (Schema (Billing,  (Edge fns,  (Browser
 Insta,   prompts,    auto-     drift,  Stripe,    DB, jobs,   real +
 Webhook) modelos)    mações)   leads,  planos,    locks,      console
                                profiles)quotas)   migrations) +network)
                                   │
                    ┌──────────────┴──────────────────┐
                    │  REPORTER (laudo + recomendação)│
                    └──────────────┬──────────────────┘
                                   ▼
                            DECISIONS (humano aprova)
```

**Transversais (não são divisões, são serviços):**
- **Ground Truth Collector** — roda determinístico ANTES de qualquer LLM (snapshot, health, últimas execuções, status de canais)
- **Memory** — toda missão indexada por `tenant_id + tema + sintoma`; reclamação repetida vira contexto automático
- **Replay** — re-rodar missão com modelo/seed diferente para calibrar custo×qualidade

---

## 2. A Peça Nova: QA/Tester (Browser Real)

É o que faltava. Hoje o agente "fala sobre" o tenant. O Tester **entra** no tenant.

**Capacidades:**
- Sessão de browser headless persistente (Playwright em Edge runtime via serviço externo OU Browserbase/Browserless API)
- Abre URL do tenant (`subdomain.uopacrm.com`)
- Faz login via `impersonate` (JWT 15min, escopo `qa:browser`, sempre logado)
- Navega rotas, clica, preenche formulários conforme `playbook`
- Captura: console logs, network requests (status, latência, payload), screenshots por etapa, erros JS, tempo de carregamento, Core Web Vitals
- Roda **smoke-tests por módulo** (TS puro em `_shared/playbooks/`):
  - `checkout.flow` — abre produto, adiciona carrinho, vai pro Pix, valida QR
  - `whatsapp.send` — testa envio de mensagem de teste
  - `ai.copilot` — pergunta padrão, valida resposta + latência + custo
  - `onboarding.signup` — cria conta fake, valida etapas
  - `lead.create` — cria lead, valida pipeline + automação
  - `rag.query` — pergunta com ground truth conhecido, mede recall
  - ~20 playbooks no total (1 por funcionalidade crítica)
- Devolve: `evidence_bundle` (screenshots + HAR + console) anexado ao laudo

**Importante:** Tester nunca executa ação destrutiva sem grant `qa:write`. Padrão é tudo em **modo leitura/sandbox** (cria lead com prefixo `[QA-TEST]`, depois marca para limpeza).

---

## 3. Cobertura Total — Toolbelt por Divisão

Cada divisão expõe ferramentas no `_shared/commandTools.ts` (categorizadas por `domain`).

### Canais (8 tools)
`whatsapp.status`, `whatsapp.last_messages`, `whatsapp.send_test`, `instagram.status`, `webhook.recent_events`, `webhook.replay`, `email.deliverability`, `channel.error_rate`

### Inteligência (10 tools)
`ai.last_runs`, `ai.cost_breakdown`, `ai.model_health`, `rag.query_test`, `rag.recall_score`, `rag.docs_index_status`, `prompt.diff_vs_global`, `prompt.simulate`, `copilot.replay_session`, `agent.config_audit`

### Operação (9 tools)
`lead.timeline`, `funnel.conversion_drill`, `automation.last_executions`, `automation.test_dry_run`, `sla.breaches`, `playbook.coverage`, `task.queue_depth`, `notification.history`, `user.activity_trace`

### Dados (8 tools)
`schema.diff_vs_canonical`, `tenant.snapshot`, `lead.duplicates_scan`, `profile.completeness`, `data.drift_report`, `query.explain`, `index.usage`, `rls.coverage_check`

### Monetização (9 tools)
`billing.tenant_health`, `mrr.attribution`, `quota.usage_vs_limit`, `credit.consumption_drill`, `stripe.subscription_diag`, `payment.failed_recent`, `plan.feature_access`, `pix.transaction_trace`, `uopa_pay.flow_check`

### Infraestrutura (10 tools)
`edge_function.invoke_log`, `edge_function.error_recent`, `db.slow_queries`, `db.lock_check`, `migration.status`, `storage.bucket_health`, `cron.last_runs`, `secret.rotation_status`, `cache.hit_rate`, `realtime.subscription_count`

### QA/Tester (6 tools)
`browser.run_playbook`, `browser.free_navigate`, `browser.collect_evidence`, `smoke.run_suite`, `regression.compare_baseline`, `accessibility.audit`

**Total: ~60 tools.** Hoje temos 4. Salto de 15x.

Classificação: `read` (auto), `write_low` (auto se grant), `write_high` (sempre decision), `destructive` (decision + 2FA pin master).

---

## 4. Schema (mínimo, sem reinventar)

Tudo vai em `command_ai.*` no Supabase externo (seguindo a regra do projeto).

- `command_ai.divisions` — catálogo das 6 divisões + QA, com manual/prompt + métricas
- `command_ai.agents` (já existe) — adiciona `division_id`, `specialty`, `playbook_refs[]`
- `command_ai.playbooks` — TS-only no código, mas registro mínimo (id, name, domain, last_run_at, success_rate) para UI
- `command_ai.evidence_bundles` — `{mission_id, kind: screenshot|har|console|log, storage_path, captured_at}`
- `command_ai.diagnostic_reports` — laudo estruturado (já planejado), agora com `evidence_bundle_ids[]` e `division_contributions jsonb`
- `command_ai.mission_memory` — `(tenant_id, theme, symptom_hash) → últimos N reports`, busca vetorial opcional v2
- `command_ai.tool_catalog` — espelho dos tools com `domain`, `risk_level`, `requires_scopes[]`, `description` (alimenta UI de Grants)
- `command_ai.qa_runs` — histórico de runs do tester com baseline para regressão

Storage bucket: `command-evidence` (private, RLS por owner master).

---

## 5. Orquestração (substitui mission-execute monolítico)

`command-mission-orchestrator` (state machine):

```text
RECEIVED → TRIAGE (Chief classifica: incidente | diagnóstico | mudança | auditoria)
        → GROUND_TRUTH (collector determinístico, sem LLM)
        → PLAN (Chief decide quais divisões + tester ativar, em paralelo)
        → DISPATCH (executa divisões em paralelo, cada uma com seu loop tool-call)
        → SYNTHESIZE (Reporter consolida em diagnostic_report)
        → DECIDE (cria decisions.pending para ações write_high)
        → AWAIT_APPROVAL → EXECUTE → POST_MORTEM (atualiza memória + métricas)
```

Cada transição emite evento em `mission_events` (já tem) → UI timeline ao vivo.

Cancelamento, retry por divisão, timeout por etapa, custo por etapa, modelo por etapa.

---

## 6. Camada de Código (Etapa final, mas planejada agora)

Para o "humano valida correção em código" do futuro:
- `code.repo.read_file`, `code.repo.search`, `code.repo.list_recent_commits` — read-only via GitHub API
- `code.diff.propose_patch` — gera patch unified diff → vira `decision` com preview lado a lado
- `code.ci.dry_run` — roda lint/typecheck no patch antes da decision
- Merge **nunca** automático. Sempre PR no GitHub com label `command-proposed` + você aprova.

Isso fecha o loop: Tester acha bug → Reporter localiza no código → propõe patch → você aprova → vira PR.

---

## 7. UI (4 telas novas + evolução das existentes)

- **`/command/divisions`** — overview das 6 divisões + QA: saúde, missões ativas, custo 24h, top tools usados
- **`/command/missions/:id`** — timeline ao vivo com swimlanes por divisão, custo/latência, evidências (screenshots clicáveis), botão "replay"
- **`/command/qa`** — catálogo de playbooks, última execução por tenant, matriz de cobertura (módulo × tenant), regressões detectadas
- **`/command/memory`** — busca em laudos passados por tenant/tema; "esse problema já aconteceu"
- Inbox/Decisions/Grants já existem → recebem campos novos (divisão de origem, evidências anexadas, risk_level)

---

## 8. Governança Reforçada

- `tenant_grants` ganha `purpose enum('ops','diagnostics','qa_browser','fix_review')` + `auto_expire_minutes`
- Kill-switch global `command_ai.system_settings.autonomy_paused`
- 2FA pin master para `destructive` e `code.merge`
- Rate limit por divisão (no orquestrador, em memória + persistido por janela)
- Auditoria: toda invocação de tool grava em `tool_executions` com `division`, `mission_id`, `cost`, `latency`, `evidence_refs`

---

## 9. Ondas de Entrega

**Onda 3A — Fundação Empresa (1 bloco):**
Schema (divisions, evidence_bundles, qa_runs, mission_memory, tool_catalog) + `command-mission-orchestrator` substituindo o execute monolítico + Ground Truth Collector + 6 divisões cadastradas com prompts iniciais + expansão do toolbelt para ~40 tools (todas read-only de Canais/Inteligência/Operação/Dados/Monetização/Infra reusando edge functions existentes: `ops-health-query`, `master-ai-diagnostics`, `rag-metrics-query`, `master-tenants`, `master-billing`, `master-usage`).

**Onda 3B — QA/Tester real:**
Integração Browserbase (ou Browserless) via novo `command-browser-tester` edge function + 8 playbooks iniciais (checkout, whatsapp, ai, onboarding, lead, rag, login, dashboard) + bucket evidence + UI `/command/qa`.

**Onda 3C — Reporter + Memória + UI Missões:**
Reporter agent com schema obrigatório de laudo + indexação em mission_memory + tela `/command/missions/:id` com swimlanes/evidências + tela `/command/divisions`.

**Onda 3D — Governança fina + Replay:**
Purpose nos grants, 2FA pin destructive, rate-limit por divisão, replay com modelo alternativo, métricas custo×qualidade.

**Onda 3E — Camada Código (read + propose):**
GitHub read tools + propose_patch → decision com diff visual. Merge fica fora.

**Recomendação: aprovar 3A + 3B juntos.** É o que destrava o caso "tenant reclamou, eu mando, ele entra e me prova o que tá quebrado". 3C-E entram em sequência sem retrabalho.

---

## 10. Decisões Técnicas

- Browser real: **Browserbase** (API simples, gratuito até X sessões, pago previsível) — alternativa: rodar Playwright em VPS própria. Precisa secret `BROWSERBASE_API_KEY`.
- Vetorização da memória: usar pgvector já presente no Supabase externo (se não tiver, ativa via migration).
- LLM por divisão: Chief usa modelo forte (gemini-3-pro), divisões usam flash, Reporter usa pro. Custo cai 4x vs tudo no pro.
- Reuso máximo de edge functions existentes — tools são wrappers finos, não reimplementação.

---

## 11. Fora de escopo agora

- Auto-merge de PR
- Multi-região / failover
- Fine-tuning de modelo próprio
- Tester rodando em produção do cliente sem grant explícito por execução

---

**Próximo passo:** confirmar Onda 3A + 3B como bloco inicial, e me dizer se prefere Browserbase ou Playwright self-hosted para o Tester. Qualquer ajuste em divisões/tools antes de eu começar é agora.
