
# Command AI — OS Cognitivo Executivo (execução)

Tudo no Supabase externo **btoyclznuuwvxbsacemw** (CRM), schema novo `command_ai.*`. RLS travada no UUID master. Acesso só seu.

## Onda 1 — Fundação (esta entrega)

**Migration `command_ai.*` no Supabase externo:**
- `workspaces`, `brand_books`, `agents`, `agent_runs` (com `steps jsonb` para timeline de raciocínio), `missions`, `mission_nodes`, `content_items`, `content_variants`, `campaigns`, `decisions`, `automations`, `scheduled_jobs`, `connections_meta`, `insights_cache`, `command_log`
- Função `command_ai.is_owner()` (security definer) → checa UUID master hardcoded
- RLS em todas as tabelas via `is_owner()`
- Bucket privado `command_ai_assets` + policies
- Seed: 1 workspace "Uôpa" + 8 agentes (Strategos, Scribe, Atelier, Curator, Publisher, Analyst, Closer, Ops) com prompts, modelos e descrições

**Helper compartilhado:**
- `supabase/functions/_shared/command-ai.ts` — `createLovableAiGatewayProvider`, client Supabase com service role, guard `assertMaster(req)`, logger de Run

**Shell visual `/command`:**
- Layout próprio (não usa `DashboardLayout`)
- Boot sequence cinematográfico (1.2s, skipável, uma vez por sessão)
- Topbar com workspace switcher (⌘1/⌘2/⌘3)
- Live Ops Dock à direita (vazio por enquanto, estrutura pronta pra Realtime)
- ⌘K Command Bar full-screen blur (UI pronta, sem roteamento ainda)
- Cockpit com Pulse editorial (números reais via Realtime quando dados existirem)
- Rotas placeholder: `/command/agents`, `/missions`, `/content`, `/calendar`, `/campaigns`, `/brand`, `/commercial`, `/automations`, `/intel`, `/inbox`
- Guard de acesso: redireciona se não for o UUID master

**Guardrails de design:**
- Tipografia editorial (display + mono), gradientes da marca só como acentos
- Hairlines, glassmorphism só em overlays, dark default, microinterações com framer-motion
- Tudo usando tokens semânticos do `index.css`

## Próximas ondas (não nesta entrega)

2. Cockpit Pulse + Live Ops conectados a Realtime real
3. Página de cada agente + edge `command-agent-run` + timeline
4. Missions + constelação interativa + plan/execute
5. Studio de Conteúdo + Brand lock + edges generate/image
6. Inbox de Decisão (J/K/L, atalhos, lógica)
7. **[pede secrets Meta]** Instagram real (publish, schedule cron, insights)
8. Calendário + Campanhas + Replay + Intel + Comercial + Automações
9. Polimento: sons opcionais, mobile, performance, easter eggs

## Detalhes técnicos

- **DB**: schema isolado `command_ai` no projeto externo, sem tocar em tabelas existentes do CRM
- **RLS**: única política — `command_ai.is_owner()` retorna true só pro UUID master (mesma constante já usada em `MasterOnlyGuard` / `AuthContext`)
- **IA**: Vercel AI SDK + `@ai-sdk/openai-compatible` + Lovable AI Gateway. Default `google/gemini-3-flash-preview`. Strategos/Analyst em `gemini-3.1-pro-preview`. Imagens em `gemini-3.1-flash-image-preview`.
- **Runs**: cada execução de agente = 1 row em `agent_runs` com array `steps` (raciocínio + tools + outputs), custo, duração
- **Realtime**: subscriptions em `agent_runs`, `decisions`, `content_items` pra Live Ops Dock
- **Cron** (entra na onda 7): `pg_cron` + `pg_net` no projeto externo

## O que vou pedir mais tarde

- Onda 7: `META_APP_ID`, `META_APP_SECRET`, `META_GRAPH_VERSION`, `INSTAGRAM_LONG_LIVED_TOKEN` (com escopos `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`, `pages_show_list`, `instagram_manage_insights`)

Aprovando, eu envio a migration `command_ai.*` agora e começo o shell visual em paralelo.
