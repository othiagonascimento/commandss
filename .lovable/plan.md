
Objetivo
- Fazer o Dashboard e os cards/widgets de consumo (Créditos, R$, Chamadas, Tokens) voltarem a carregar em tempo real a partir do Supabase externo (btoyclznuuwvxbsacemw), de forma robusta, com auditoria e mensagens de erro claras.

O que eu encontrei (auditoria já feita no front)
- O navegador está chamando as RPCs no Supabase externo, mas elas estão falhando com HTTP 400.
- Erro retornado pelo PostgREST (confirmado em network):
  - code: 42702
  - message: column reference "period_start" is ambiguous
  - details: It could refer to either a PL/pgSQL variable or a table column.
- Isso explica “Erro ao carregar dados” e/ou “ficar no escuro”: o front-end hoje trata erro de RPC como “sem consumo”, sem mostrar a falha real.

Causa raiz
- As funções RPC que criamos no SQL usam variáveis locais com o mesmo nome de colunas das tabelas (ex.: period_start), e o PostgreSQL considera ambíguo ao executar.
- Como o SQL “cria” a função com sucesso, a falha só aparece quando o app chama a RPC.

Entregáveis (o que será implementado após sua aprovação deste plano)
1) Patch SQL definitivo (Supabase externo) – corrigir RPCs
- Substituir as 3 RPCs por versões que:
  - Renomeiam variáveis locais para v_period_start / v_p_start / v_p_end
  - Usam DROP FUNCTION IF EXISTS antes de recriar (garante que o código antigo não fique ativo)
  - Opcionalmente disparam reload de schema para PostgREST (NOTIFY pgrst, 'reload schema')
- Resultado esperado: as chamadas para
  - /rest/v1/rpc/get_global_credits_summary
  - /rest/v1/rpc/get_top_credit_consumers
  - /rest/v1/rpc/get_tenant_credits_summary
  passam a retornar 200 com dados (mesmo que zeros quando não houver consumo).

SQL que vamos aplicar (executar no SQL Editor do projeto externo)
- Script “idempotente” (pode rodar mais de uma vez) com:
  - DROP FUNCTION IF EXISTS public.get_global_credits_summary();
  - DROP FUNCTION IF EXISTS public.get_top_credit_consumers(integer);
  - DROP FUNCTION IF EXISTS public.get_tenant_credits_summary(uuid);
  - CREATE OR REPLACE FUNCTION ... com variáveis v_*
  - GRANT EXECUTE ... TO authenticated;
  - NOTIFY pgrst, 'reload schema';

2) Atualizações no projeto Lovable (UI) – mostrar erros de forma explícita e auditável
Hoje, quando a RPC quebra, o usuário vê “Nenhum consumo registrado” (falso) ou só “Erro ao carregar dados” (sem detalhes). Vamos corrigir isso.

Mudanças planejadas:
- src/components/dashboard/APICostsWidget.tsx
  - Passar a ler e exibir estados de erro dos 2 useQuery (summary e topConsumers):
    - Mostrar um bloco “Falha ao carregar consumo” com o erro real (ex.: 42702 / ambíguo).
    - Botão “Tentar novamente”.
    - Mensagem orientativa: “RPC no Supabase externo com erro; rode o SQL corrigido”.
- src/hooks/useGlobalCredits.ts
  - Manter a query, mas padronizar retorno/uso de error e expor na UI (Index).
- src/pages/Index.tsx
  - No card “Créditos Consumidos”, se a query de créditos falhar:
    - Mostrar “Erro”/“-” com um Badge “Falha de dados” e tooltip com o texto do erro.
    - Isso evita o cenário “continua tudo zero e eu continuo no escuro”.
- src/hooks/useTenantCredits.ts + src/pages/TenantDetail.tsx (opcional, mas recomendado)
  - Exibir erro ao carregar resumo de créditos do tenant (em vez de silently failing).

3) Auditoria robusta (end-to-end) para confirmar “tem dados de consumo real?”
Mesmo com RPC funcionando, pode acontecer de voltar tudo 0 se o pipeline de logging não estiver sendo alimentado. Vamos deixar isso verificável.

Auditoria em 2 fases:

Fase A – confirmar RPC funcionando (sem depender de dados)
- No Supabase SQL Editor:
  - SELECT * FROM public.get_global_credits_summary();
  - SELECT * FROM public.get_top_credit_consumers(5);
  - SELECT * FROM public.get_tenant_credits_summary('<TENANT_UUID>');
- No app:
  - Abrir Dashboard: os requests devem voltar 200, sem 400.

Fase B – confirmar que existe consumo gravado (dados reais)
- Rodar verificações no SQL Editor (externo):
  - SELECT COUNT(*) FROM public.api_usage_logs;
  - SELECT COUNT(*) FROM public.tenant_usage;
  - SELECT COUNT(*) FROM public.user_usage;
  - SELECT MAX(created_at) FROM public.api_usage_logs;
  - SELECT tenant_id, period_start, credits_consumed, estimated_cost_brl, api_calls
    FROM public.tenant_usage
    ORDER BY period_start DESC
    LIMIT 20;
- Se essas tabelas estiverem vazias ou não atualizando:
  - O problema não é dashboard: é o pipeline (ex.: CRM não está chamando log-api-usage; custo_config ausente; falha de integração).

4) (Opcional, mas forte para “perfeito e funcional”) Ferramenta interna de “Health Check de Consumo”
Para você nunca mais ficar no escuro, vamos adicionar um pequeno painel (por exemplo em /ai-diagnostics ou /settings) que:
- Executa uma checagem e mostra em verde/vermelho:
  - RPC get_global_credits_summary: OK/ERRO + tempo
  - RPC get_top_credit_consumers: OK/ERRO
  - Último log em api_usage_logs (via Edge Function ou query segura)
  - Data/hora do último consumo e total do mês
- Isso transforma o problema em “status visível” e reduz dependência de DevTools.

Sequência de implementação
1) Atualizar o arquivo de referência do repositório (docs/sql/credits_rpc_functions.sql) com o SQL corrigido (v_period_start etc.), para não voltarmos a colar a versão com bug.
2) Implementar melhorias de UI (erros explícitos) no APICostsWidget, Index e hooks.
3) Fornecer o script SQL final (corrigido) para você rodar no Supabase externo (btoyclznuuwvxbsacemw).
4) Validar no preview:
   - Network sem 400/42702
   - Cards renderizando
   - Se 0: seguir auditoria Fase B para confirmar se há tráfego real chegando ao log-api-usage.
5) (Opcional) Implementar Health Check.

Riscos / “não vai quebrar nada?”
- A troca das RPCs é segura porque:
  - Mantém os nomes das funções (o front continua chamando igual)
  - Mantém os campos principais retornados (total_credits_consumed, total_cost_brl, total_api_calls, etc.)
  - Apenas corrige ambiguidade de nomes
- As mudanças de UI são aditivas:
  - Só adicionam estados de erro e transparência
  - Não mudam regras de negócio nem gravam dados

Critérios de aceite (o que significa “perfeitamente funcional” aqui)
- Dashboard e widget de consumo deixam de retornar 400 e passam a mostrar números (ou 0 com justificativa real).
- Em caso de erro de backend (RPC, permissão, etc.), a UI mostra o erro real (não “Nenhum consumo”).
- Você consegue, em minutos, responder:
  - Créditos por tenant (e R$) no mês
  - Créditos por usuário (via user_usage e/ou telas existentes como Rankings/UserUsageCard)
  - Tokens (via master-usage/ai-diagnostics) e correlação com créditos

Observação importante sobre “GCS, IA, etc.”
- Créditos/R$ e Tokens de IA já estão no escopo e são rastreáveis via:
  - api_usage_logs, user_usage, tenant_usage e Edge Function log-api-usage
  - master-usage e master-ai-diagnostics (para tokens/diagnóstico)
- Consumo de storage (GCS) depende do seu pipeline de atualização de storage_bytes/user_usage. Vamos validar na auditoria Fase B se isso está sendo alimentado; se não estiver, abrimos um segundo ajuste específico para storage (sem misturar com o bug atual das RPCs).

Arquivos que serão alterados no projeto (Lovable)
- docs/sql/credits_rpc_functions.sql (corrigir SQL para não ter ambiguidade)
- src/components/dashboard/APICostsWidget.tsx (exibir erro corretamente)
- src/hooks/useGlobalCredits.ts (padronizar/propagar erro)
- src/pages/Index.tsx (mostrar erro no card de créditos quando a RPC falhar)
- (opcional) src/hooks/useTenantCredits.ts + src/pages/TenantDetail.tsx (exibir erro de resumo do tenant)
- (opcional) novo componente/página de Health Check (a definir localização)

Próxima ação imediata após aprovar este plano
- Implementar as mudanças no front e atualizar o SQL de referência; em seguida, te entregar o “SQL final corrigido” para colar no Supabase externo e validar (sem DevTools).
