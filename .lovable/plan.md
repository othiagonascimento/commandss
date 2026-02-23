
# Planos como BigTech: Separacao Clara de Responsabilidades

## Filosofia BigTech

Empresas como Stripe, AWS e Notion seguem um principio claro: **o Plano define O QUE voce pode usar; os Recursos do Tenant definem QUANTO voce pode usar.**

- **Stripe**: Plans/Products definem features (invoicing, tax, etc). Usage limits sao configurados por conta.
- **AWS**: Service plans habilitam servicos. Quotas/limits sao configurados separadamente por conta.
- **Notion**: Plano (Free/Plus/Business) habilita modulos. Limites de storage, guests, etc sao gerenciados por workspace.

Atualmente, a pagina de Planos tem 8 campos de limites numericos que competem diretamente com o `TenantLimitsEditor`. Isso gera confusao sobre onde configurar e qual valor prevalece.

---

## O Que Muda

### Pagina de Planos (simplificada)

O plano passa a ter apenas:

| Campo | Proposito |
|-------|-----------|
| Nome, Slug, Descricao | Identidade do plano |
| Preco mensal / anual | Comercial |
| Modulos incluidos | Quais funcionalidades estao habilitadas |
| Ativo, Padrao, Ordem | Controle administrativo |

Os **8 campos de limites numericos** (max_users, max_leads, max_products, max_channels, max_storage_gb, max_ai_tokens, max_messages_month, max_automations) sao **removidos da UI** de Planos. Continuam no banco para retrocompatibilidade, mas nao aparecem mais para edicao.

A secao "Features Habilitadas" com slugs genericos (crm, leads, catalog...) e substituida pelos **mesmos 9 modulos** do `TenantModulesEditor` (module_ai_agent, module_campaigns, etc.), com os mesmos icones e categorias (IA, Comunicacao, Vendas, Integracoes, Premium).

### Cards de Plano (visual)

**Antes**: Grid com 6 metricas numericas (usuarios, leads, canais, creditos, storage, fluxos) + badges de features.

**Depois**: Preco em destaque + badges dos modulos incluidos agrupados por categoria. Visual limpo, tipo pricing page do Stripe.

### Tabela Comparativa

A tabela "Comparativo de Limites" e removida (ja que limites nao pertencem mais ao plano).

---

## Alteracoes Tecnicas

### 1. Criar `src/lib/modules.ts` (novo arquivo)

Constante compartilhada com a configuracao dos 9 modulos (key, label, description, icon, category). Fonte unica de verdade usada tanto por `Plans.tsx` quanto por `TenantModulesEditor.tsx`.

### 2. Refatorar `src/pages/Plans.tsx`

- Remover imports de icones de limites (Users, Database, MessageSquare, Cpu, HardDrive)
- Remover `availableFeatures` (slugs antigos)
- Importar `moduleConfig` de `src/lib/modules.ts`
- Remover do formulario de edicao: toda a secao "Limites" (linhas 391-461)
- Substituir a secao "Features Habilitadas" por modulos com icones e categorias, usando os mesmos slugs do `TenantModulesEditor`
- Remover do card de listagem: o grid de 6 metricas numericas (linhas 238-262)
- Substituir por badges de modulos agrupados por categoria
- Remover a tabela "Comparativo de Limites" (linhas 286-322)
- Remover do `defaultPlan`: campos de limites numericos
- Remover da interface `Plan`: campos de limites (mantendo no tipo do banco mas nao na UI)

### 3. Atualizar `src/components/tenant/TenantModulesEditor.tsx`

- Importar `moduleConfig` e `categoryColors` de `src/lib/modules.ts` em vez de definir inline
- Remover as definicoes locais de `moduleConfig` e `categoryColors`

### Resumo de arquivos

| Arquivo | Acao |
|---------|------|
| `src/lib/modules.ts` | Criar - constante compartilhada de modulos |
| `src/pages/Plans.tsx` | Refatorar - remover limites, alinhar features com modulos |
| `src/components/tenant/TenantModulesEditor.tsx` | Simplificar - importar de modules.ts |

Nenhuma alteracao no banco de dados. Os campos de limites continuam existindo na tabela `plans`, mas a fonte de verdade para limites passa a ser exclusivamente o `TenantLimitsEditor` na configuracao individual de cada tenant.
