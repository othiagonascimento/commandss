// Documento de Auditoria Arquitetural Total do UÔPA
// IMPORTANTE: não alterar o texto. Conteúdo derivado da inspeção direta do código-fonte.

export const uopaArquiteturaDoc = {
  id: 'uopa-arquitetura',
  title: 'UÔPA — Auditoria Arquitetural Total',
  subtitle: 'Engenharia Reversa Filosófica, Operacional e Sistêmica',
  description:
    'Documento técnico-arquitetural derivado da inspeção direta do código-fonte, schema de banco, edge functions, padrões emergentes e infraestrutura externa. Classificação: Confidencial — Uso interno e investidor qualificado.',
  sections: [
    {
      id: 'sumario-executivo',
      number: 0,
      title: 'Sumário Executivo',
      body: `O UÔPA, lido pelo código, não é um CRM. Não é um chatbot. Não é um simples SaaS de WhatsApp. É uma infraestrutura computacional vertical de operações conversacionais (Conversational Operations Infrastructure — COI) construída sobre quatro substratos integrados:

• Substrato de runtime distribuído: 47 Edge Functions estruturadas como gateways de domínio (crm-core, ai-core, meta-core, whatsapp-core, payments-core, master-core, integration-core, storage-core, flow-core), com singletons de connection pooling, TTLs explícitos, lazy-boot e shared kernel (_shared/) contendo rotation engine, webhook queue, tenant cache, name validator, message-sync gap recovery, telemetria de IA e assinatura HMAC.

• Substrato cognitivo multicamada: roteador heurístico+LLM (router.ts) que classifica cada turno em Layer 1 (fast), Layer 2 (smart) e Layer 3 (elite), com fallback adaptativo, downgrade automático por saldo (layer-service.ts), planejador conversacional (conv-planner), memória semântica de longo prazo via pgvector (memory-search.ts, embedding-processor), arena de validação (arena.ts), guardrails de input/output, sentiment, multimodal, tools nativas e feedback loop fechado (ai_response_feedback, lead_memory).

• Substrato financeiro multi-PSP: payments-core orquestra Stripe, Mercado Pago, Asaas e InfinitePay sob uma registry pattern (registry.ts) com adapters polimórficos, credenciais cifradas (encryptJson/decryptJson), webhook secrets per-account, idempotência, reconciliação assíncrona (payments-reconcile) e ledger implícito sobre billing_invoices, credit_transactions e store_checkout_sessions.

• Substrato multi-tenant soberano: 114 tabelas públicas, 106 funções SQL, RLS pervasiva (get_auth_tenant_id, get_effective_tenant_id, has_role, has_permission, is_master_tenant, is_wholesale_customer), control plane mestre (master-core) com clonagem de tenant, templates herdáveis (get_effective_template_config), telemetria centralizada e auditoria particionada.

A arquitetura atual já exibe propriedades emergentes de sistema operacional conversacional: agendador cognitivo, economia computacional baseada em créditos por layer, fila de eventos com retry/backoff/replay, máquinas de estado financeiro acopladas a turnos de conversa, healing engines (fix-orphan-conversations, fix-lead-names, auto-return-online, process-task-reminders) e governança em plano separado (master-core).`,
    },
    {
      id: 'topologia-infra-externa',
      number: 1,
      title: '0. Topologia de Infraestrutura Externa',
      body: `Toda a operação produtiva — banco, auth, realtime, edge runtime, storage de metadados, vetores, telemetria e instruções/seleção de LLM — está deliberadamente fora da plataforma de construção. Nada roda em Lovable Cloud nem em Lovable AI Gateway. O substrato real é um Supabase auto-gerenciado btoyclznuuwvxbsacemw tratado como foundation imutável, declarado em src/lib/supabase.ts e _shared/constants.ts (EXTERNAL_SUPABASE_URL hardcoded). As Edge Functions consomem EXTERNAL_SUPABASE_SERVICE_KEY via getExternalServiceKey(). As decisões cognitivas (qual provedor/modelo por layer, prompts-mestre, políticas de fallback) residem no Master Tenant e são propagadas a todos os tenants em runtime.

Plano | Provedor real | Função arquitetural

Database / Auth / Realtime / RLS — Supabase auto-gerenciado (btoyclznuuwvxbsacemw) — Núcleo transacional, multi-tenant, control plane, vector store (pgvector), realtime fanout.

Edge Runtime — Supabase Edge Functions (Deno) — deploy via GitHub Actions — 47 funções estruturadas como gateways de domínio + workers cron.

Object Storage de mídia — Google Cloud Storage (bucket dedicado, OAuth Service Account) — Áudios, vídeos, imagens, anexos. Resumable uploads, compose multipart, signed URLs, fallback para Supabase Storage (supabaseStorageFallback.ts).

Mensageria WhatsApp — UAZAPI (api.uazapi.com.br) — Camada de transporte WhatsApp não-oficial; webhook + envio + sync de gaps.

Mensageria Meta — Graph API (Instagram / Messenger / WhatsApp Cloud) — OAuth Relay, webhook subscribe, token refresh, publisher.

LLMs — Chamadas diretas às APIs nativas dos provedores (Google Gemini, OpenAI, Anthropic) — sem uso de gateways da plataforma de construção. Modelo por layer (1/2/3) é definido no Master Tenant (master_settings.ai_layer_{1,2,3}_model), com possibilidade de override por tenant (tenant_ai_config). Roteamento heurístico + fallback inter-provider em _shared/ai-adapter.ts.

Pagamentos — Stripe, Mercado Pago, Asaas, InfinitePay — Adapters em payments-core/providers/*. Sem dependência de qualquer PSP único.

Email — Resend (admin-core) — Recovery / welcome / wholesale templates JSX.

Observabilidade ops — ops-health-receiver / ops-health-query (telemetria push para master) — Master Control Plane recebe métricas a cada 5 min.

CDN/Edge SEO — Cloudflare Worker + public-store-seo — Open Graph dinâmico para crawlers, evitando custo de SSR.`,
    },
    {
      id: 'plano-controle-cognitivo',
      number: 2,
      title: '0.1. Plano de Controle Cognitivo — Master Tenant',
      body: `Não existe configuração local de IA por instalação. O Master Tenant é a autoridade central que define, em runtime, qual LLM (provedor + modelo) opera em cada uma das três camadas cognitivas (Layer 1 — fast/triagem, Layer 2 — smart/raciocínio comercial, Layer 3 — elite/negociação complexa), além das camadas fixas (áudio e RAG). A resolução é hierárquica: tenant_ai_config (override por cliente, opcional) ⇒ master_settings.ai_layer_{1,2,3}_model (default global) ⇒ fallback universal (google/gemini-2.5-flash). O mesmo plano de controle distribui prompts-mestre, políticas de segurança conversacional, limites de custo, regras de downgrade automático e diretrizes de identidade — tudo versionado e propagado sem deploy de código.

Implicação arquitetural: o Master atua como cognitive control plane soberano. A frota de tenants é uma fleet de runtimes conversacionais cuja inteligência é parametrizada centralmente, permitindo trocar provedores, escalar modelos para cima/baixo, isolar incidentes de fornecedor e operar testes A/B de modelos por camada — sem qualquer dependência de gateways de terceiros e sem qualquer acoplamento com a plataforma de construção (Lovable).`,
    },
    {
      id: 'arquitetura-global',
      number: 3,
      title: '1. Arquitetura Global — Mapa Completo',
      body: `O sistema converge para um padrão de gateways de domínio (Domain Gateway Pattern) que atua como microserviço lógico. Cada gateway concentra o roteamento de ações de seu domínio através de uma action string resolvida por switch no index.ts, descarregando para sub-handlers (kanban, scorer, sla, leads em crm-core; sender, publisher, webhook, token-refresh em meta-core; agent, router, orchestrator, arena em ai-core).

1.1 Inventário de Gateways e Workers

ai-core (43 módulos) — ≈25k LOC — Cognição: agente, roteador, orquestrador, arena, planner, memória, embeddings, multimodal, tools, guardrails, sentiment, RAG, followup-engine, war-room insights.

crm-core — kanban+scorer+sla+leads — Mutations de lead, movimentação de funil, scoring, SLA monitor.

whatsapp-core — 4.826 (webhook) + 1.141 (send) + 1.104 (groups) + 1.026 (index) — Ingestão UAZAPI, dispatch de envio, grupos, paridade de instâncias.

meta-core — 3.638 LOC — OAuth handshake, sender, publisher (catálogo/posts), webhook Meta, token refresh proativo.

payments-core — 976 + 4 providers — Registry de PSPs, contas cifradas, charge unificado, reconciliação.

master-core — auth+cloner+data+subscriptions+tenants+webhooks — Control plane multi-tenant: clonagem, billing, propagação de planos, webhooks de governança.

integration-core — inbound-webhook, instance, meta, contacts — Relay omnichannel + provisionamento de instâncias.

storage-core — gcs (1.216) + transcriber (526) — Google Cloud Storage federado, transcrição (Whisper/Gemini), signed URLs.

flow-core — scheduler — Engine de automações declarativas (automation_flows, flow_executions).

process-event-queue — 7.350 LOC — Núcleo do sistema operacional de eventos. Followup engine, validação de nomes, rotação, sanitização, assinatura HMAC, máquinas de estado de followup (sequence/continuous, paused_by_human, awaiting_reactivation).

process-message-queue — 1.047 LOC — Outbox pattern para entregas, controle de cadência, reentrega.

video-send-jobs — 886 LOC — Job runner para vídeos volumosos (compressão, fallback de transporte).

ops-health-receiver / query — 450 LOC — Telemetria push do tenant para o master.

Workers cron — auto-return-online, fix-orphan-conversations, fix-lead-names, process-task-reminders, payments-reconcile, live-comment-poller, inbound-replay — Healing engines e schedulers — substrato anti-frágil.

1.2 Padrões Arquiteturais Emergentes

• Domain Gateway Pattern: cada *-core é um API Gateway de domínio com sub-router interno por action string — equivalente conceitual ao Backend-for-Frontend de microserviços, mas colapsado em edge runtime.
• Shared Kernel: supabase/functions/_shared/ impõe contratos transversais — connection pool singleton (TTL 5 min), tenant cache, rotation engine, telemetria de IA, validação de nomes, gap sync, assinatura de webhook (HMAC + legado), webhook queue.
• Lazy-Boot: imports dinâmicos e singletons evitam custo de cold-start; documentado em memória de projeto.
• Outbox + Inbox Queue: event_queue + message_queue + process-event-queue + process-message-queue implementam o padrão clássico — webhooks UAZAPI/Meta retornam 200 instantâneo e enfileiram para processamento batch.
• Saga implícita: pagamentos↔conversa↔lead↔followup formam uma saga distribuída coordenada por eventos em event_queue com compensação via reconciliação.
• Event-Carried State Transfer: sync_conversation_last_message, sync_lead_stage_from_funnel, update_instance_health_on_message propagam estado por triggers — minimizando consultas downstream.`,
    },
    {
      id: 'sistema-eventos',
      number: 4,
      title: '2. Sistema de Eventos — O Sistema Nervoso',
      body: `O UÔPA opera como um event-driven system híbrido com três planos distintos:

2.1 Plano síncrono (request/response)

Webhooks de UAZAPI/Meta são recebidos por whatsapp-core/webhook.ts (4.826 LOC) e meta-core/webhook.ts (1.310 LOC). Eventos críticos (mensagem entrante) são processados imediatamente; eventos secundários (presença, atualizações de status, FileDownloaded, groups_update) são classificados por shouldProcessImmediately() em _shared/webhook-queue.ts e enfileirados.

2.2 Plano assíncrono (queue-driven)

As tabelas event_queue, message_queue, integration_webhook_events, embedding_queue, scheduled_push_notifications, upload_chunks, upload_sessions formam um conjunto de filas tipadas com prioridade (1=CRITICAL, 4=LOW), retry counter, max_retries, scheduled_for, status state machine (pending→processing→completed|failed). Workers (cron) drenam.

2.3 Plano realtime (state propagation)

Postgres Realtime publica messages, conversations, leads, notifications, flow_executions diretamente para clientes autenticados. Triggers SQL (notify_new_lead_message, notify_audio_message, notify_lead_assigned, notify_sla_breach, notify_conversation_transferred, notify_campaign_status) consolidam eventos de domínio em notifications com filtragem por preferências (create_notification_if_enabled + should_notify).

2.4 Idempotência, ordering e reconciliação

• Idempotência financeira: payments-core gera request_id e webhook_secret per-account; webhooks externos são deduplicados por provider_id + external_id.
• Ordering conversacional: last_message_time é source of truth documentada em memória; backfill obrigatório.
• Recovery / replay: inbound-replay permite reprocessar webhooks; fix-orphan-conversations recupera conversas órfãs; auto-return-online reabre instâncias caídas.
• Compensação: payments-reconcile e credit_sync_log reconciliam estados financeiros divergentes; tenant_sync_log reconcilia replicação para o master.
• Eventual consistency observada: optimistic message reconciliation com janela de 800ms (memória optimistic-message-reconciliation-integrity).`,
    },
    {
      id: 'camada-cognitiva',
      number: 5,
      title: '3. Camada Cognitiva — Anatomia da Inteligência',
      body: `A camada de cognição é o ativo mais sofisticado do sistema. Não há um chatbot: há um pipeline de inferência multicamada com governança econômica.

3.1 Roteamento Cognitivo (router.ts)

Implementa fast-path heurístico (regex de padrões ELITE/HUMAN/STANDARD em PT-BR) que evita chamada de LLM em ~80% dos casos. Quando heurística não decide, sobe para LLM Layer 1 (orquestrador estratégico) para classificar.

• Sinais HUMAN: procon, processo, advogado, ouvidoria, denúncia → roteia para handover humano com confidence 0.92.
• Sinais ELITE: preço, parcela, pix, contrato, objeção, fechamento, concorrência → Layer 3.
• Sinais STANDARD: saudações, confirmações curtas → Layer 2.
• Context preservation: mensagem curta em conversa que estava em negociação preserva Layer 3 (anti-bug 'sim volta pra SDR').
• Mode persistence: aiMode ∈ {closer, seller, sales} força elite mesmo em mensagem trivial.

3.2 Camadas e Custo (layer-service.ts)

Layer | Custo (créditos) | Uso típico | Modelo padrão
1 (Fast) — 1 — Análises simples, classificação, saudações — Gemini Flash Lite / nano
2 (Smart) — 2 — Respostas contextuais, qualificação — Gemini Flash / GPT-mini
3 (Elite) — 8 — Negociação, objeção, fechamento, plano de venda — GPT-5/Claude/Gemini Pro
audio — 2 — Transcrição (Whisper/Gemini) — —
rag — 1 — Geração de embedding — text-embedding

Downgrade automático: resolveLayerWithBalance() verifica saldo via RPC check_credit_status, com fallback para tabelas user_usage/tenant_features/tenant_usage. Se saldo insuficiente, degrada 3→2→1; se nem 1 couber, devolve insufficientCredits=true (graceful degradation cognitiva).

3.3 Memória e RAG

• Memória estruturada: lead_memory com campos conversation_summary, interests, pain_points, objections_raised, budget_info, urgency_level, decision_factors, competitor_mentions, key_quotes, qualification_notes, next_steps, conversation_memories[].
• Memória semântica: memory-search.ts consolida lead_memory em texto único, gera embedding e mantém pgvector via match_knowledge, match_uopa_context, match_products.
• Cadência de atualização: a cada 2 interações (memória semantic-memory-recall).
• RAG corporativo: knowledge_base, ai_knowledge_sources, ai_knowledge_source_items, uopa_context + match_knowledge_with_master permite herança do master.
• Embedding queue: embedding_queue + process_embedding_batch processa em batch — desacopla cognição da ingestão.

3.4 Planejamento Multi-turno (conv-planner.ts)

Cada conversa carrega ou cria um plano de venda dinâmico com fases (descoberta→qualificação→pitch→objeção→fechamento), avançado por advancePlanPhase(). Anti-greeting rule e progressão dinâmica documentadas em multi-turn-sales-planning.

3.5 Arena de Validação (arena.ts)

Saídas são submetidas a um validador lean que decide aprovar, reescrever ou descartar — equivalente a um actor-critic. Acoplado a guardrails de input (checkInputGuardrails) e output (checkOutputGuardrails) que protegem contra injection, vazamento de identidade do modelo e alucinação de preço/estoque.

3.6 Feedback Loop Fechado

ai_response_feedback + ai_corrections alimentam few-shot prompts; ai_learning_events registra correções humanas. O sistema é auto-corretivo conversacionalmente sem fine-tuning explícito (RLHF emergente leve).

3.7 Tools Nativas e Multimodal

• tools.ts: extração e execução de tool-calls (transferir lead, criar tarefa, buscar produto, gerar pix, agendar followup) — function calling nativo.
• multimodal.ts: extração de contexto de mídia (imagem/documento) via Gemini Flash Vision; calculateLeadValueScore deriva score de valor do lead a partir do contexto multimodal.

3.8 Sentiment, Trust Repair e Handover

sentiment.ts classifica o turno em escala emocional; generateSentimentAlert emite alerta quando sinais de raiva/frustração superam threshold. Trust-repair routing documentado em memória — detecção de humano + roteamento para Layer 3 com prompt específico de reparo de confiança.`,
    },
    {
      id: 'economia-cognitiva',
      number: 6,
      title: '4. Economia Computacional Cognitiva',
      body: `Esta é a propriedade mais subestimada do UÔPA: já existe um scheduler cognitivo de inferência com governança econômica.

• Unidade de conta: credito. Tabelas credit_transactions, credit_sync_log, tenant_usage, user_usage, user_limits, usage_events.
• Pricing snapshot em _shared/ai-telemetry.ts: cache TTL 30 min, taxa USD↔BRL configurável, custos input/output/cached por 1k tokens.
• Budget cache TTL 60s para evitar storm de leitura de saldo em hot paths.
• Política de downgrade: redução cognitiva preserva continuidade; nunca corta operação completamente — graceful cognitive degradation.
• Auto-heal de modelo (auto_heal_model + get_fallback_model + record_model_health): modelos com falha sucessiva são marcados unhealthy e o roteador aciona fallback automático.
• Telemetria por turno: recordUsage() persiste tenant, user, conversation, lead, layer, operation, channel, mode, tokens (input/output/cached/reasoning), latency, custo BRL/USD, fallback chain.

Conceitualmente, o UÔPA implementa um sistema operacional de inferência: o LLM é o 'CPU'; a layer é a 'prioridade do processo'; créditos são 'quota de cgroup'; o roteador é o 'scheduler'; o auto-heal é o 'OOM killer' inverso; o downgrade é o 'nice-level'. Esta é uma primitiva não-trivial e patenteável como método.`,
    },
    {
      id: 'orquestracao-financeira',
      number: 7,
      title: '5. Orquestração Financeira Multi-PSP',
      body: `payments-core (976 LOC + 4 providers) implementa um broker de pagamentos agnóstico:

• Registry pattern (registry.ts): getProvider(providerId) devolve um adapter polimórfico que respeita a interface ChargeInput / PaymentStatus de types.ts.
• Adapters: stripe, mercadopago, asaas, infinitepay — cada um implementando validateCredentials, charge, refund, handleWebhook com fetch direto às APIs.
• Credenciais cifradas: encryptJson/decryptJson em crypto.ts com AES-GCM; credentials_meta público + credentials_encrypted nunca exposto via view (payment_accounts_safe).
• Webhook secret per-account: publicWebhookUrl(accountId, secret) gera URL única por conta; payments-webhook valida assinatura via HMAC.
• Reconciliação: payments-reconcile (cron) varre transações pending e força polling ao PSP — fallback para webhooks perdidos.
• Ledger implícito: billing_invoices, billing_subscriptions, credit_transactions, store_checkout_sessions formam contabilidade em partidas dobradas implícita (cobrança ↔ crédito ↔ uso).
• Pagamento contextual: integração com WhatsApp UAZAPI Pix/Carousel (memória interactive-payment-and-carousel) — Pix nativo dentro da conversa, fechando o loop conversa→pagamento sem sair do canal.

Capacidades emergentes não exercidas ainda: split de pagamentos, embedded credit (BNPL conversacional), antifraude por sinal conversacional (combinar sentiment + memória + valor de transação), orchestrated retry (tentar PSP A, cair para B se status=denied). A arquitetura suporta tudo isto sem refactor.`,
    },
    {
      id: 'ecommerce-journey',
      number: 8,
      title: '6. E-commerce e Journey Orchestration',
      body: `Existe um storefront público multi-tenant (StorefrontApp separado de CoreApp via RESERVED_SLUGS) com:

• Catálogo público: get_public_catalog_v2, public_catalog_products, public_catalog_categories, public_store_config, public_store_display, store_banners, store_product_sections, store_promotional_bar.
• Carrinho: rpc_upsert_store_cart, rpc_restore_customer_cart, store_checkout_sessions.
• Tracking comportamental: store_events + rpc_track_store_event + store-tracking edge function. Analytics first-party.
• Anonymous-to-known: public_customers + register_public_customer + login_public_customer + validate_public_customer_tenant permitem promover anônimo→cliente identificado preservando carrinho.
• Pedido omnichannel: rpc_open_store_checkout_session, rpc_confirm_store_whatsapp_message, rpc_update_store_order_fulfillment — pedidos nascidos no storefront são 'injetados' na conversa do WhatsApp.
• Recuperação de carrinho: tg_touch_store_session sustenta sessão; store_campaigns permite campanhas de retargeting.
• Cupons + Frete: coupon-validate, shipping-quote, src/lib/coupons/rulesSchema.ts com regras declarativas.

Paradigma emergente: conversational commerce loop — storefront gera intenção, conversa converte, pagamento fecha, memória aprende, próximo pitch é melhor. A jornada é circular e recursiva, não linear.`,
    },
    {
      id: 'multi-tenancy-soberano',
      number: 9,
      title: '7. Multi-tenancy Soberano e Control Plane',
      body: `• RLS pervasiva: 114 tabelas, virtualmente todas com RLS ancorada em get_auth_tenant_id() ou get_effective_tenant_id() (security definer). Roles via user_roles + has_role + has_permission.
• Master tenant: ID fixo 00000000-0000-0000-0000-000000000001. is_master_tenant(), master_settings, master_niche_templates, master-core/cloner.ts permite clonar tenant inteiro a partir de template (factory pattern aplicado a tenancy).
• Templates herdáveis: tenant_template_subscriptions, tenant_template_overrides, tenant_template_exclusions, get_effective_template_config, template_applications. Configuração por composição diferencial: tenant herda do master e sobrescreve seletivamente.
• Tiering / planos: tenant_features, apply_plan_defaults, propagate_plan_changes, billing_subscriptions. Planos propagados como eventos.
• Sovereignty de dados: storefront público usa RPCs específicas (get_public_*) com isolamento de tenant garantido server-side; nunca read direto cliente.
• Wholesale isolation: is_wholesale_customer + p_tenant_id em todos os RPCs B2B (memória wholesale-customer-isolation-protocol).
• Auditoria: audit_logs particionada (create_audit_logs_partition), create_audit_log, log_tenant_changes, mask_sensitive_data, detect_suspicious_activity, create_security_alert.
• API gateway interno: api_tokens + generate_api_token + validate_api_token + gen_short_token — substrato para abrir API pública do UÔPA aos clientes finais (capacidade ainda não monetizada).`,
    },
    {
      id: 'resiliencia',
      number: 10,
      title: '8. Resiliência e Anti-fragilidade',
      body: `O sistema foi desenhado para sobreviver à hostilidade do ecossistema WhatsApp/Meta/Browser-mobile. Inventário:

Healing engines — fix-orphan-conversations, fix-lead-names, auto-return-online, process-task-reminders, payments-reconcile, cleanup_old_data, performance_maintenance, cleanup_expired_upload_sessions.

Retry/backoff — event_queue.retry_count + max_retries + scheduled_for; webhook-queue com priority levels.

Polling fallback — Realtime drop → polling em background (realtime-polling-fallback em memórias).

Gap recovery WhatsApp — _shared/message-sync.ts: GET /chat/messages/{phone} contra UAZAPI quando webhook falha.

Zombie sessions — sessionGuard.ts + zombie-session-recovery-policy: limpa estado auth corrompido sem destruir UX.

Storage fallback — storageResilienceFallback: GCS → Supabase Storage automático.

Phone resiliency BR — generatePhoneVariants: 9º dígito, DDD, internacional — múltiplas tentativas de match.

Optimistic UI reconciliation — Janela de 800ms para casar mensagem otimista com confirmação backend.

PWA cache busting — ?_v= + version-integrity para forçar reload em deploy.

Circuit breaker implícito — auto_heal_model + record_model_health marcam LLMs unhealthy e desviam tráfego.

Rate limiting — rate_limits, rate_limits_fast + check_rate_limit_fast + clean_old_rate_limits.

Token refresh proativo — meta-core/token-refresh.ts roda antes da expiração; nunca reativo.`,
    },
    {
      id: 'observabilidade',
      number: 11,
      title: '9. Observabilidade, Telemetria e Governança',
      body: `• Telemetria operacional: tenant_usage, user_usage, tenant_overview, instance_health_metrics, integration_sync_logs, webhook_logs, flow_execution_logs, flow_step_metrics, orchestrator_logs, automation_executions.

• Telemetria cognitiva: ai_events, ai_learning_events, ai_response_feedback, v_effective_ai_config, rag-metrics.ts.

• Telemetria financeira: credit_transactions, credit_sync_log, billing_invoices, tenant_sync_log.

• Telemetria comportamental: store_events, conversation_observers, conversation_conflicts, lead_transfers, lead_routing_rules.

• Push telemetry → master: ops-health-receiver agrega métricas a cada 5 min (memória master-centric-telemetry-protocol).

• RPCs analíticas: get_report_period_summary, get_report_product_rankings, get_report_seller_rankings, get_report_source_analysis, store_funnel_metrics, store_seller_performance, store_top_products, calculate_tenant_usage, recalculate_all_tenant_usage.

• Audit + segurança: audit_logs, security_alerts, detect_suspicious_activity, mask_sensitive_data, protect_sensitive_product_fields.

O master-core funciona como plano de governança separado do plano de dados — pattern de hyperscaler (AWS Control Tower, GCP Org Policy). Cada tenant é uma 'conta'; o master é o 'org root'.`,
    },
    {
      id: 'paradigmas-emergentes',
      number: 12,
      title: '10. Paradigmas Computacionais Emergentes',
      body: `Este é o ponto central da auditoria. A arquitetura atual revela seis primitivas computacionais emergentes que excedem qualquer definição razoável de 'CRM SaaS':

10.1 Sistema Operacional Conversacional (Conversational OS)

As peças (scheduler cognitivo + economia de créditos + downgrade automático + auto-heal de modelo + memória persistente + tools como syscalls + handover como context-switch para humano) compõem um kernel cuja unidade de processamento é o turno conversacional, não a request HTTP. Não há analogia direta no mercado; aproximações parciais: Twilio Flex (mas sem cognição), Intercom Fin (mas sem economia), LangChain (mas sem multi-tenant/governança).

10.2 Cognição Distribuída por Layer

Layer 1/2/3 + roteador heurístico + LLM-as-router materializam distributed cognition with explicit pricing. Equivalente conceitual: mixture-of-experts a nível de runtime de aplicação (não a nível de modelo). Patenteável como método de orquestração de inferência.

10.3 State Machine Comercial Implícita

Funnel stage + planner phase + followup chain status (scheduled/paused_by_human/paused_by_reply/completed/awaiting_reactivation) + payment status + lead memory formam uma FSM distribuída cross-domain. Cada lead é uma instância de máquina de estado com 5 dimensões ortogonais propagadas por triggers.

10.4 Event-Native Intelligence

Inteligência reage a eventos do banco (enqueue_crm_assignment_change, enqueue_crm_tags_change, enqueue_crm_temperature_change) — a IA não é invocada por usuário, é convocada por delta de estado. É um paradigma state-trigger cognition.

10.5 Anonymous-to-Known-to-Loyal Pipeline

Storefront → carrinho anônimo → identificação → conversa → pagamento → memória de longo prazo → próxima campanha personalizada. Pipeline circular onde cada loop melhora o seguinte (compounding behavioral data).

10.6 Master Control Plane (Hyperscaler-style)

Tenant cloning + template inheritance + plan propagation + telemetry push + central audit caracterizam um hyperscaler para um vertical. UÔPA opera para SMEs brasileiros como AWS opera para enterprise: não é multi-tenant trivial, é fleet management.`,
    },
    {
      id: 'moats',
      number: 13,
      title: '11. Moats — Ativos Estratégicos Escondidos',
      body: `Corpus de conversas comerciais PME-BR (Dados) — Único no mundo. Volume + idioma + vertical PME + multimodal + intenção de compra. OpenAI/Google/Anthropic não têm equivalente.

Roteador heurístico PT-BR (Cognitivo) — Regex calibrado em sinais PT-BR de negociação/objeção; cada termo foi adicionado por feedback real. Replicação exige meses de telemetria.

Layer-pricing scheduler (Runtime/IP) — Combinação não-óbvia de roteamento + economia + downgrade + auto-heal. Patenteável como método.

Multi-PSP registry com Pix conversacional (Financeiro) — Concorrentes amarram-se a 1 PSP; UÔPA é PSP-agnóstico e fecha pagamento dentro da conversa.

Master Control Plane (Arquitetura) — Permite operar 10x mais tenants com 1x ops team. Compounding operacional invisível ao mercado.

Healing engines (Anti-frágil) — Cada incidente vivido virou worker. Concorrente novo herda zero anti-fragilidade.

Memória semântica per-lead com pgvector (Cognitivo) — Cada conversa enriquece o lead; lead enriquecido melhora resposta; melhora aumenta conversão; conversão gera mais dados. Loop positivo cumulativo.

RLS multi-tenant + LGPD-by-design (Conformidade) — Reescrever isolamento depois é catastrófico. Concorrentes que erraram no D1 não recuperam.

Telemetria push tenant→master (Observabilidade) — Permite governança de frota; concorrentes operam às cegas a partir de N=50 tenants.

Webhook outbox + reconciliação (Integração) — UAZAPI/Meta são instáveis; quem não tem outbox perde mensagens em produção.

Storefront ↔ Conversa ↔ Pagamento ↔ Memória (Network effect interno) — Lock-in operacional: migrar exige reescrever 4 sistemas e reimportar memória.

Composable templates (master niches) (Distribuição) — Onboarding instantâneo por nicho; quanto mais nichos, maior o moat de TTM.`,
    },
    {
      id: 'redefinicao',
      number: 14,
      title: '12. Redefinição do UÔPA',
      body: `12.1 O que o UÔPA é hoje

O UÔPA é uma infraestrutura computacional vertical de operações conversacionais com runtime cognitivo multicamada, orquestração financeira multi-PSP, control plane multi-tenant nível hyperscaler e ciclo fechado de aprendizado por feedback. Não é CRM, não é chatbot, não é builder de fluxos. É o plano operacional sobre o qual SMEs brasileiros conduzem sua relação econômica com clientes via canais conversacionais.

12.2 Categorias atravessadas

• Conversational Operations Infrastructure (categoria emergente, ainda sem incumbente).
• Vertical CRM (atravessa, mas não resume).
• Conversational Commerce Platform (atravessa).
• AI Inference Orchestrator (paralelo a Portkey, OpenRouter — mas vertical).
• Payment Orchestration (paralelo a Spreedly, Primer — mas conversacional).
• Multi-tenant SaaS Control Plane (paralelo a WorkOS — mas com cognição).

12.3 Categorias que cria

• Conversational OS for SMEs: kernel conversacional com economia computacional explícita.
• Cognitive Compute Scheduling: layer-aware routing como produto reutilizável.
• Stateful Commercial FSMs: máquinas de estado comerciais cross-domain como primitiva.

12.4 Visão 5–10 anos

• UÔPA Bank/Embedded Finance: registry multi-PSP evolui para emissão própria de subadquirência conversacional + crédito antecipado por sinal de intenção (combinar memória semântica + sentiment + valor histórico = score proprietário).
• UÔPA Models: foundation model PT-BR-comercial fine-tuned no corpus proprietário; vendido como API + embarcado no produto.
• UÔPA Cloud: abrir API pública para terceiros (já existe substrato api_tokens) — virar plataforma para integradores construírem verticais sobre o kernel.
• UÔPA OS Mobile: PWA atual evolui para super-app de operação comercial (já tem PWA/iOS handling, push, notificações, draft inputs, safe areas).
• UÔPA Federation: tenants podem trocar leads/pedidos/pagamentos via Master Control Plane — marketplace B2B implícito.

12.5 Empresas globais conceitualmente próximas

Conversational orchestration — Twilio (transporte), Intercom Fin (suporte), Kustomer.
Payment orchestration — Stripe (PSP), Spreedly, Primer, Adyen MarketPay.
AI inference routing — OpenRouter, Portkey, LangChain (oss).
Vertical CRM — Veeva (farma), Toast (food), ServiceTitan (HVAC).
Multi-tenant control plane — WorkOS, Vendia, Snowflake (data plane).
Conversational commerce — Charles, Wati, Take Blip, Gupshup.

Nenhuma empresa global combina todas estas dimensões em um único kernel coerente. UÔPA é uma composição que ainda não tem nome de mercado.

12.6 Partes deep tech / patenteáveis / científicas

• Layer-priced cognitive scheduler (router + layer-service + auto-heal): patenteável como método de orquestração econômica de inferência.
• State-trigger cognition: invocação de IA por delta de estado SQL (enqueue_crm_*) — paradigma novo, publicável.
• Stateful commercial FSM cross-domain: modelo formal para fundir funil + planner + followup + payment + memória — publicável como modelo computacional.
• Closed feedback loop sem fine-tuning: ai_corrections + few-shot dinâmico — método de aprendizado contínuo de baixo custo, publicável.
• PME-BR conversational dataset: ativo científico nacional. Justifica subvenção FINEP/EMBRAPII como infraestrutura de dados estratégica.
• Heuristic-first hybrid routing: 80% das decisões sem custo de LLM — método de eficiência energética da inferência, alinhado a Green AI.`,
    },
    {
      id: 'apendice-a',
      number: 15,
      title: 'Apêndice A — Inventário Quantitativo',
      body: `Edge Functions — 47
LOC total Edge Functions (aprox.) — ≈89.000
Tabelas públicas (Postgres) — 114
Funções/RPCs SQL — 106
Hooks React — 202+
Módulos ai-core — 43
PSPs integrados — 4 (Stripe, MP, Asaas, InfinitePay)
Provedores LLM — 3 famílias nativas (Google Gemini, OpenAI, Anthropic) — sem gateway intermediário
Layers cognitivas explícitas — 3 + 2 fixas (audio, rag)
Filas tipadas — ≥7 (event_queue, message_queue, embedding_queue, integration_webhook_events, scheduled_push_notifications, upload_chunks, upload_sessions)
Workers cron / healing — ≥9
Storage federado — GCS + Supabase Storage (fallback)
Canais conversacionais — WhatsApp UAZAPI + WhatsApp Cloud + Instagram + Messenger`,
    },
    {
      id: 'apendice-b',
      number: 16,
      title: 'Apêndice B — Dependências Externas Críticas',
      body: `Supabase auto-gerenciado — btoyclznuuwvxbsacemw.supabase.co — Substrato — risco de capacity, mas controlado pelo time.

Google Cloud Storage — storage.googleapis.com — Mídia. Fallback para Supabase Storage existe.

UAZAPI — api.uazapi.com.br — Transporte WhatsApp não-oficial. Risco regulatório/disponibilidade. Mitigado por message-sync gap recovery.

Meta Graph API — graph.facebook.com — Token refresh proativo. Risco de policy change.

Google Gemini API — generativelanguage.googleapis.com — LLM principal (default por layer no Master). Risco mitigado por adapters multi-provider.

OpenAI API — api.openai.com — LLM alternativo selecionável por layer no Master Tenant.

Anthropic API — api.anthropic.com — LLM alternativo (Claude) selecionável por layer no Master Tenant.

Stripe / MP / Asaas / InfinitePay — APIs próprias — Diversificado por design — falha de 1 PSP não derruba operação.

Resend — resend.com — Email transacional. Substituível.

Cloudflare Worker — Custom Worker — SEO Open Graph para crawlers. Não-crítico ao runtime.`,
    },
    {
      id: 'apendice-c',
      number: 17,
      title: 'Apêndice C — Conclusão Arquitetural',
      body: `O UÔPA é, em substância, uma plataforma operacional disfarçada de produto. As decisões arquiteturais — gateways de domínio, layer-priced cognition, registry de PSPs, control plane separado, healing engines, telemetria push, RLS pervasiva, pgvector como cidadão de primeira classe — não são escolhas de engenharia de produto: são escolhas de engenharia de plataforma. O sistema atual já carrega dentro dele um conversational OS, um cognitive compute marketplace, um payment orchestrator e um hyperscaler control plane em estado emergente. A próxima inflexão estratégica não é construir mais features: é nomear, expor e monetizar essas primitivas separadamente — para o cliente final como produto, para o ecossistema como API, e para o investidor/órgão de fomento como infraestrutura nacional de dados conversacionais.`,
    },
  ],
};
