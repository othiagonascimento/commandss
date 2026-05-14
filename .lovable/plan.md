
# Reorganização do Command — visão "empresa inteira numa tela"

## Diagnóstico do estado atual

A topbar tem **13 abas** chapadas no mesmo nível (Cockpit, Agentes, Timeline, Missões, Conteúdo, Calendário, Campanhas, Brand, Comercial, Automações, Intel, Inbox, Grants). Não há hierarquia, não há vínculo com as 6 camadas do UÔPA, e várias telas (Calendar, Campaigns, BrandIntel, Content, Automations) são placeholders ou ficam órfãs do ciclo missão→diagnóstico→ação que o sistema agora suporta.

Com a Onda 3A (9 divisões + 64 ferramentas + orquestrador + ground truth) o Command virou uma **empresa cognitiva**, mas a UI ainda fala a linguagem antiga de "squad de agentes".

## Nova arquitetura de navegação

Sidebar colapsável (substitui a topbar de 13 abas) com 8 áreas espelhando o organograma real:

```text
┌─ COCKPIT          (home — sala de guerra ao vivo)
├─ MISSÕES          (criar, acompanhar, revisar laudos)
│
├─ CAMADAS UÔPA
│  ├─ Canais       (WhatsApp, Instagram, webhooks, e-mail)
│  ├─ Inteligência (IA, RAG, prompts, modelos, copilot)
│  ├─ Operação     (funil, automações, SLAs, atividade)
│  ├─ Dados        (schema, qualidade, RLS, performance)
│  ├─ Monetização  (billing, MRR, quotas, Stripe, Pay)
│  └─ Infra        (edge fns, DB, jobs, storage, cache)
│
└─ AJUSTES
   ├─ Divisões     (manuais dos 9 agentes + modelos)
   ├─ Ferramentas  (catálogo das 64 tools + risk levels)
   ├─ Grants       (autorizações temporárias)
   └─ QA / Tester  (playbooks + runs do browser)
```

Cada **camada** abre uma página única com 3 partes verticais:
1. **Health agora** — métricas vivas do ground truth (mesma fonte usada pelo orquestrador).
2. **Divisão responsável** — manual + últimas contribuições da divisão dessa camada em missões recentes.
3. **Ferramentas disponíveis** — chips das tools do `tool_catalog` filtradas por `domain`, executáveis dali (read-only por padrão; write pede confirmação).

## Cockpit ao vivo (home `/command`)

Layout em 3 faixas:

```text
┌─────────────────────────────────────────────────────────┐
│ FAIXA 1 — Pulso das 6 camadas                           │
│  [Canais] [Intel] [Op] [Dados] [Monet] [Infra]          │
│  cada card: status dot + 1 KPI + tendência              │
├─────────────────────────────────────────────────────────┤
│ FAIXA 2 — Missões em andamento (swimlanes)              │
│  Mission #123 · "WhatsApp caiu no tenant X"             │
│   Chief ▓▓▓ · Canais ▓▓ · Infra ▓ · Reporter ░          │
├─────────────────────────────────────────────────────────┤
│ FAIXA 3 — Briefing do Chief (top 3 problemas + ações)   │
└─────────────────────────────────────────────────────────┘
```

Atualização realtime via subscription em `command_ai.missions` e `qa_runs`.

## Mapa de consolidação (antes → depois)

| Rota atual | Destino | Ação |
|---|---|---|
| `/command` Cockpit | `/command` | Refeito (faixas acima) |
| `/command/missions` + `/missions/:id` | `/command/missions` | Mantido, timeline ganha swimlanes por divisão + evidências |
| `/command/agents` | `/command/divisions` | Renomeado e re-modelado: lista 9 divisões com manual editável |
| `/command/timeline` | absorvido pela MissionDetail | Removido como rota top-level |
| `/command/inbox` | `/command/layers/canais` (aba) | Movido para dentro da camada Canais |
| `/command/content`, `/content/:id` | `/command/layers/inteligencia` (aba Conteúdo) | Movido |
| `/command/automations` | `/command/layers/operacao` (aba Automações) | Movido |
| `/command/calendar` | `/command/layers/operacao` (aba Calendário) | Movido |
| `/command/campaigns` | `/command/layers/canais` (aba Campanhas) | Movido |
| `/command/brand`, `/intel` | `/command/layers/inteligencia` (aba Brand Intel) | Unificado |
| `/command/commercial` | `/command/layers/monetizacao` (aba Comercial) | Movido |
| `/command/grants` | `/command/settings/grants` | Movido para Ajustes |
| `:module` placeholder | removido | — |

Resultado: **8 rotas top-level** no lugar de 13, e cada tela órfã passa a viver dentro da camada certa, com contexto.

## Novas telas a criar

1. `src/pages/command/Layer.tsx` — página única parametrizada por slug de camada (`canais`, `inteligencia`, `operacao`, `dados`, `monetizacao`, `infra`). Renderiza Health + Divisão + Tools + abas legadas (Inbox, Conteúdo, etc.).
2. `src/pages/command/Divisions.tsx` — lista as 9 divisões com manual (editável), modelo padrão, métricas das últimas 50 missões.
3. `src/pages/command/ToolCatalog.tsx` — catálogo das 64 tools com filtro por domínio/risco, schema de input, último uso.
4. `src/pages/command/QA.tsx` — playbooks + histórico de `qa_runs` + viewer de evidências (screenshots/HAR/console) do bucket `command-evidence`.
5. `src/components/command/CommandSidebar.tsx` — sidebar colapsável (shadcn) substitui Topbar.

## Telas existentes a refatorar

- `CommandShell.tsx`: troca Topbar por Sidebar + header fino com WorkspaceSwitcher + ⌘K + breadcrumb.
- `MissionDetail.tsx`: timeline ganha **swimlanes por divisão** + painel lateral de evidências do `evidence_bundles`.
- `Cockpit.tsx`: reescrito conforme layout das 3 faixas.

## Detalhes técnicos

- Sidebar usa `shadcn/sidebar` com `collapsible="icon"` (preserva mini-strip ao colapsar).
- Cada camada lê o `ground_truth` via novo edge function `command-layer-snapshot` (reaproveita `_shared/groundTruth.ts` filtrando pelo domínio da camada).
- Tools são executadas via novo edge `command-tool-invoke` (`tool_name` + `input`), que valida `risk_level`, exige grant ativo para `write_*`, registra em `tool_executions` e anexa evidência se aplicável.
- Realtime cockpit: `supabase.channel('command_missions').on('postgres_changes', ...)` em `command_ai.missions` e `qa_runs`.
- Roteamento: `/command/layers/:slug` com `Layer.tsx` e abas internas (`?tab=inbox`).
- Mantém `CommandGuard` e `BootSequence`.

## Ordem de execução

1. Sidebar nova + reorganização de rotas (sem quebrar o que já existe — todas as telas antigas continuam acessíveis durante a migração).
2. Página `Layer.tsx` genérica + edge `command-layer-snapshot`.
3. `Divisions.tsx` + `ToolCatalog.tsx` (lê das tabelas semeadas hoje).
4. Cockpit reescrito com as 3 faixas.
5. MissionDetail com swimlanes + evidências.
6. `QA.tsx` (Onda 3B começa aqui — fica como casca preparada se Browserbase não estiver pronto).
7. Mover Inbox/Content/Automations/Calendar/Campaigns/Brand/Commercial para abas dentro das camadas e remover rotas top-level.

Cada passo é mergeável sozinho. Posso começar pelo passo 1+2 nesta resposta após sua aprovação.
