
## Reentendimento

Você tem razão — o plano anterior ignorava o ativo mais importante do projeto: a **AI Engine multi-layer já existente no CRM (Supabase externo)**.

Hoje a engine tem três camadas configuráveis (`ai_layer_1_model/instructions`, `ai_layer_2_*`, `ai_layer_3_*`), com modelos vindos de `ai_available_models` (categorias `router`, `standard`, `elite`):

- **Layer 1 (Router)** — Gemini, **multimodal** (texto + áudio + imagem). Roteador rápido e barato.
- **Layer 2 (Standard)** — Modelo balanceado para a maioria das conversas.
- **Layer 3 (Elite)** — Modelo avançado para casos complexos / análises profundas.

Cada layer tem provedor, custo, latência, instruções globais, overrides por nicho e por tenant — tudo isso já é gerenciado pelo Master. O copilot atual ignora completamente essa engine e chama OpenAI/Anthropic/Google diretamente, o que é inconsistente, gasta secret keys que deveriam estar centralizadas, e não aproveita a multimodalidade da Layer 1.

**Princípio de não-quebra**: nada da engine do CRM (que serve mensagens dos clientes finais) pode ser alterado. O Master vai apenas **consumir** a engine via uma rota nova e isolada de "copiloto interno", reusando as configurações de layer mas com um `system context` próprio (admin Master, não atendente comercial).

## Visão alvo — "Alexa do Master" rodando nas layers

Um copiloto interno que:

1. **Conversa por voz e texto** com você (admin Master).
2. **Roteia automaticamente entre as 3 layers** conforme a complexidade da pergunta.
3. **Usa Layer 1 (Gemini multimodal) como entrada universal**: texto, áudio gravado e imagens (screenshots, prints) entram direto, sem precisar de STT separado para casos simples.
4. **Tem ferramentas reais** para consultar tenants, MRR, custos, alertas, consumo, RAG.
5. **Tem base de conhecimento (RAG)** sobre o CRM para tirar dúvidas técnicas.
6. **Persiste conversas**, suporta markdown, streaming, modo expandido e atalho `Cmd+J`.

## Arquitetura proposta

```text
┌────────────────────────────────────────────────────────────┐
│  AICopilot UI (texto + mic + anexos + markdown + stream)   │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
            master-copilot (NOVO, no Master)
            ├── carrega ai_layer_*_model + instructions do CRM
            │   (read-only, via master-settings já existente)
            ├── carrega ai_available_models (provedor + base_url + api key map)
            ├── ROTEADOR (heurística + Layer 1 router):
            │     simples ─► Layer 1
            │     padrão  ─► Layer 2
            │     análise ─► Layer 3
            │     áudio/imagem ─► Layer 1 (multimodal) sempre
            ├── LOOP de tool-calling com a layer escolhida:
            │     ├─ get_tenant_overview(id|nome)
            │     ├─ list_tenants_at_risk(criterios)
            │     ├─ get_mrr_breakdown(periodo)
            │     ├─ get_api_costs(periodo, provider?)
            │     ├─ get_ops_alerts(severidade?)
            │     ├─ get_user_consumption(tenant_id)
            │     ├─ search_knowledge_base(query)   ─► copilot_chunks
            │     ├─ impersonate_link(tenant_id)
            │     └─ escalate_to_layer_3(reason)    ─► reexecuta na Elite
            ├── Streaming SSE token-a-token
            └── Persiste em copilot_conversations / copilot_messages

         ┌────────────────────────────────────────────┐
         │  Provedores reais (mesmas chaves do CRM)    │
         │  Gemini / OpenAI / Anthropic / outros       │
         │  Endpoints lidos de ai_available_models     │
         └────────────────────────────────────────────┘
```

### Por que isso é "robusto e usa as layers"

- **Mesma fonte de verdade**: o Master lê `ai_layer_1_model`, `ai_layer_2_model`, `ai_layer_3_model` da tabela de settings do CRM (já espelhada/exposta por `master-settings`). Se você trocar o modelo da Layer 2 amanhã, o copilot acompanha automaticamente.
- **Mesmas chaves**: provedores e suas API keys vivem nas variáveis do CRM. O Master chama via um endpoint passthrough (`master-llm-proxy`, novo) que recebe `{ layer, messages, tools, stream }`, resolve modelo+chave do CRM e dispara o request — nada é alterado no CRM, é apenas leitura + execução server-to-server.
- **Roteamento dinâmico**: heurística rápida (length, presence de keywords como "analise", "compare", "por que", anexos) escolhe a layer inicial. A própria Layer 1, quando insegura, pode chamar a tool `escalate_to_layer_3`.
- **Multimodal natural**: áudio gravado e imagens vão como parts no payload Gemini da Layer 1 — não precisamos de STT separado para o caso simples ("ei, qual o MRR de junho?"). Só usamos STT dedicado se o usuário escolher um modelo Layer 2/3 não-multimodal.
- **Zero alteração no CRM**: nenhum schema, nenhuma RLS, nenhuma função do CRM muda. Só leituras já existentes (`ai_settings`, `ai_available_models`) e chamadas externas aos provedores.

## Tabelas novas (Supabase Master apenas)

```sql
copilot_conversations(id, user_id, title, route_context, created_at, updated_at)
copilot_messages(id, conversation_id, role, content, parts jsonb, tool_calls jsonb,
                 layer_used text, model_used text, tokens_in int, tokens_out int,
                 latency_ms int, created_at)
copilot_documents(id, title, source, mime, size_bytes, uploaded_by, status, created_at)
copilot_chunks(id, document_id, chunk_index, content, embedding vector(768))
```

RLS: tudo restrito a `auth.uid() = user_id` + check `is_master_admin()` (mesmo padrão do `MasterOnlyGuard`).

## Edge functions novas (Master)

- `master-copilot` — orquestrador (chat + tools + streaming + persistência + roteamento de layer).
- `master-llm-proxy` — resolve `{layer}` → modelo+provedor+chave (lendo `ai_settings` e `ai_available_models` do CRM via service-role read-only) → executa chamada ao provedor com streaming. Isolado para não vazar chaves e para centralizar telemetria.
- `master-copilot-ingest` — upload + chunking + embeddings (Gemini embeddings via Layer 1) → grava em `copilot_chunks`.
- `master-copilot-search` — similarity search no pgvector, top-K com score.
- `master-copilot-transcribe` — fallback de STT (só usado se a Layer 1 atual não for multimodal); por padrão delega à própria Layer 1.

`master-ai-insights` continua existindo para os widgets do dashboard, sem mudanças (não quebra nada).

## UI nova `AICopilot.tsx`

- Botão flutuante + atalho `Cmd+J` + modo expandido (Sheet 80% da tela com sidebar de conversas).
- Render Markdown (`react-markdown` + `remark-gfm`).
- Streaming token-a-token com indicador "🔧 executando `get_mrr_breakdown`…", "🧠 escalando para Layer 3…".
- Badge mostrando qual layer/modelo respondeu cada turno (transparência).
- Botão de microfone (MediaRecorder) → envia o blob de áudio direto como parte multimodal para Layer 1.
- Botão de anexar imagem → mesmo caminho.
- Sugestões dinâmicas por rota (em `/tenants` sugere "tenants em risco esta semana", em `/finops/anomalies` sugere "explique a anomalia de hoje").
- Citações clicáveis quando vem de RAG.

## Garantias de não-quebra do CRM

- Apenas **leituras** em tabelas existentes do CRM (`ai_settings`, `ai_available_models`); nunca writes.
- Nenhuma migração no banco do CRM.
- Nenhuma função do CRM editada.
- O `master-llm-proxy` usa as chaves de provedor já configuradas como secrets do Master (espelho das chaves do CRM, conforme padrão atual). Se uma chave estiver faltando, o copilot degrada com mensagem clara — sem afetar o CRM.
- Adicionamos uma feature flag `copilot.enabled` no Master (default ON) para desligar instantaneamente caso algo aconteça.
- Telemetria do copilot vai para tabela própria do Master (`copilot_messages`), não polui `ai_advanced` do CRM.

## Fases de entrega

**Fase 1 — Engine + chat texto (sem voz, sem RAG)**
- Migração: `copilot_conversations`, `copilot_messages` + RLS.
- Edge functions: `master-llm-proxy` (resolve layer→modelo+chave do CRM), `master-copilot` (orquestrador com 4 tools iniciais: tenant_overview, tenants_at_risk, mrr_breakdown, api_costs).
- Roteador de layer (heurística) + escalate tool.
- UI nova: streaming, markdown, sidebar de conversas, modo expandido, `Cmd+J`, badge de layer, sugestões por rota.

**Fase 2 — Multimodal (voz + imagem) via Layer 1**
- Botão de mic (MediaRecorder, webm/opus) → envia como `inline_data` para Gemini Layer 1.
- Botão de anexar imagem (drag-drop também).
- Modo hands-free com VAD simples.
- TTS via Web Speech API (grátis, zero secret).
- Fallback `master-copilot-transcribe` apenas se a Layer 1 ativa não suportar áudio.

**Fase 3 — Base de conhecimento (RAG)**
- Habilitar `pgvector` no Master.
- `copilot_documents` + `copilot_chunks`.
- Página `Settings → Base de Conhecimento do Copilot` com upload, listagem, reindex, exclusão.
- `master-copilot-ingest` + `master-copilot-search`.
- Tool `search_knowledge_base` plugada + citações na UI.
- Opção de ingerir automaticamente os `docs/` deste repositório como base inicial.

**Fase 4 — Polimento e observabilidade**
- Tools extras: `get_ops_alerts`, `get_user_consumption`, `impersonate_link`.
- Auto-roteamento mais inteligente (Layer 1 router decide layer final).
- Página em AI Diagnostics mostrando uso do copilot por layer, latência, custo, top tools chamadas.

## Decisões pendentes (1 minuto)

1. **TTS (resposta falada)**: Web Speech API nativa do navegador (zero secret, qualidade ok) ou ElevenLabs (qualidade premium, exige `ELEVENLABS_API_KEY`)?
2. **STT fallback**: ok delegar tudo para a Layer 1 multimodal e só implementar fallback se você trocar a Layer 1 para um modelo não-multimodal?
3. **Base de conhecimento inicial**: já ingerir automaticamente `docs/` do repo do Master + do CRM, ou começar só com upload manual?
4. **Escopo do início**: faço Fase 1 + Fase 2 juntas no próximo loop (recomendado, é o coração da experiência), ou prefere ver Fase 1 primeiro?

Sugestão padrão (responda "manda ver" se concorda): TTS Web Speech, STT delegado à Layer 1, ingestão automática de `docs/` do Master, **Fases 1+2 juntas** no próximo loop.
