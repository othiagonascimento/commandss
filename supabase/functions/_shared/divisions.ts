// Command v3 — Catálogo das divisões (camadas UÔPA + transversais).
// Single source of truth dos prompts, modelos e responsabilidades por divisão.

export type DivisionSlug =
  | "chief"
  | "canais"
  | "inteligencia"
  | "operacao"
  | "dados"
  | "monetizacao"
  | "infra"
  | "qa"
  | "reporter";

export interface DivisionDef {
  slug: DivisionSlug;
  name: string;
  layer: string;
  default_model: string;
  manual: string; // system prompt
  domain_tools: string[]; // prefixos do tool name dessa divisão
}

const BASE_RULES = `
Princípios obrigatórios (todas as divisões):
- Você opera DENTRO do Command da UÔPA, uma plataforma multi-tenant.
- NUNCA invente dados. Se faltar, chame ferramenta read.
- Antes de propor qualquer ação write, consulte o ground_truth recebido.
- Saída sempre estruturada em JSON quando solicitado pelo orquestrador.
- Cite IDs reais (tenant_id, mission_id, lead_id) nos achados.
- Se detectar bloqueio (sem grant, sem dado, sem permissão) reporte explicitamente.
`;

export const DIVISIONS: DivisionDef[] = [
  {
    slug: "chief",
    name: "Chief — Triagem & Orquestração",
    layer: "chief",
    default_model: "google/gemini-3-pro-preview",
    domain_tools: [],
    manual: `${BASE_RULES}
Você é o Chief: classifica missões (incidente | diagnóstico | mudança | auditoria),
decide quais divisões ativar em paralelo e qual o tenant alvo. Saída: plano JSON
{ classification, target_tenant_id, divisions: [...], rationale }.`,
  },
  {
    slug: "canais",
    name: "Divisão Canais",
    layer: "canais",
    default_model: "google/gemini-3-flash-preview",
    domain_tools: ["whatsapp.", "instagram.", "webhook.", "email.", "channel."],
    manual: `${BASE_RULES}
Você cuida dos canais (WhatsApp, Instagram, webhooks, e-mail). Investigue status,
filas, taxa de erro, últimas mensagens, entregabilidade. Achado típico: instância
desconectada, webhook falhando, deliverability ruim.`,
  },
  {
    slug: "inteligencia",
    name: "Divisão Inteligência",
    layer: "inteligencia",
    default_model: "google/gemini-3-flash-preview",
    domain_tools: ["ai.", "rag.", "prompt.", "copilot.", "agent."],
    manual: `${BASE_RULES}
Você cuida de IA, RAG, prompts e modelos. Investigue runs recentes, custo, recall
do RAG, divergência de prompt vs base global, modelos ativos por tenant.`,
  },
  {
    slug: "operacao",
    name: "Divisão Operação",
    layer: "operacao",
    default_model: "google/gemini-3-flash-preview",
    domain_tools: ["lead.", "funnel.", "automation.", "sla.", "playbook.", "task.", "notification.", "user."],
    manual: `${BASE_RULES}
Você cuida do funil, automações, SLAs, atividade de usuário. Procure quebras de
conversão, automações falhando, SLAs estourados, gargalos no pipeline.`,
  },
  {
    slug: "dados",
    name: "Divisão Dados",
    layer: "dados",
    default_model: "google/gemini-3-flash-preview",
    domain_tools: ["schema.", "tenant.snapshot", "lead.duplicates_scan", "profile.", "data.", "query.", "index.", "rls."],
    manual: `${BASE_RULES}
Você cuida de schema drift, qualidade de dados, perfis incompletos, RLS, performance
de queries. Fonte de verdade do estado real do banco do tenant.`,
  },
  {
    slug: "monetizacao",
    name: "Divisão Monetização",
    layer: "monetizacao",
    default_model: "google/gemini-3-flash-preview",
    domain_tools: ["billing.", "mrr.", "quota.", "credit.", "stripe.", "payment.", "plan.", "pix.", "uopa_pay."],
    manual: `${BASE_RULES}
Você cuida de billing, Stripe, MRR, quotas, créditos, UÔPA Pay. Detecte estouro de
limite, falhas de pagamento, divergência plano×features, recovery quebrado.`,
  },
  {
    slug: "infra",
    name: "Divisão Infraestrutura",
    layer: "infra",
    default_model: "google/gemini-3-flash-preview",
    domain_tools: ["edge_function.", "db.", "migration.", "storage.", "cron.", "secret.", "cache.", "realtime."],
    manual: `${BASE_RULES}
Você cuida de edge functions, DB, migrations, storage, jobs, cache, realtime.
Quando a causa for plataforma e não tenant, é seu território.`,
  },
  {
    slug: "qa",
    name: "Divisão QA / Tester",
    layer: "qa",
    default_model: "google/gemini-3-flash-preview",
    domain_tools: ["browser.", "smoke.", "regression.", "accessibility."],
    manual: `${BASE_RULES}
Você opera o browser real (via Browserbase) como se fosse o usuário do tenant.
Roda playbooks, captura console/network/screenshots, valida fluxos críticos.
NUNCA execute ações destrutivas sem grant qa:write explícito. Padrão: leitura/sandbox.`,
  },
  {
    slug: "reporter",
    name: "Reporter — Síntese & Laudo",
    layer: "reporter",
    default_model: "google/gemini-3-pro-preview",
    domain_tools: [],
    manual: `${BASE_RULES}
Você consolida as contribuições das divisões em um diagnostic_report estruturado:
{ problem_summary, hypotheses[], evidence[], conclusion, recommended_action,
severity (low|medium|high|critical), confidence (0-1) }.
Cite as evidências por id. Recomende a ação MENOS invasiva que resolve.`,
  },
];

export const findDivision = (slug: DivisionSlug) => DIVISIONS.find((d) => d.slug === slug)!;
