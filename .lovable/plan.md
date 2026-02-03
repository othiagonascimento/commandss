
# Plano: Adicionar Filtro de Período ao Dashboard Master

## Status Atual

As RPCs de créditos foram validadas com sucesso e estão funcionando:
- `get_global_credits_summary('2026-01-01', '2026-01-31')` retorna 749 créditos ✅
- `get_tenant_credits_summary(uuid, date, date)` funcionando ✅
- O componente `TenantUserCreditsTable` já possui o `PeriodFilter` integrado ✅

## O que falta

O **Dashboard Master** (`Index.tsx`) chama `useGlobalCredits()` **sem filtros**, dependendo do comportamento padrão das RPCs. Para dar controle completo ao admin, precisamos adicionar o seletor de período.

---

## Implementação

### 1. Adicionar PeriodFilter ao Dashboard (Index.tsx)

Criar um estado para armazenar o período selecionado e passar para o hook:

```text
Arquivo: src/pages/Index.tsx

Mudanças:
- Importar PeriodFilter e getDefaultPeriod
- Criar estado: const [period, setPeriod] = useState(getDefaultPeriod())
- Passar filtros para useGlobalCredits: useGlobalCredits({ periodStart: period.periodStart, periodEnd: period.periodEnd })
- Adicionar componente PeriodFilter na seção de cards de créditos
```

### 2. Melhorar exibição do período no StatCard

Mostrar o período selecionado no card de "Créditos Consumidos" para que o usuário saiba qual intervalo está visualizando.

### 3. Atualizar doc SQL com versão final

O arquivo `docs/sql/credits_rpc_functions.sql` já contém a versão v5 correta. Apenas adicionar um comentário indicando que foi validado.

---

## Resumo Visual

```text
┌────────────────────────────────────────────────────────────┐
│  Dashboard Master                                          │
│                                          [Período: ▾ Fev]  │
├────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Tenants  │ │ Usuários │ │  Leads   │ │   MRR    │       │
│  │   12     │ │   156    │ │  2.340   │ │ R$ 15k   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───┐ │
│  │Créditos  │ │Mensagens │ │ Assin.   │ │New Tenant│ │...│ │
│  │  749     │ │  22.781  │ │   8      │ │    2     │ │   │ │
│  │R$ 7,49   │ │          │ │ 3 trial  │ │          │ │   │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └───┘ │
└────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Index.tsx` | Adicionar estado de período + PeriodFilter + passar para useGlobalCredits |
| `docs/sql/credits_rpc_functions.sql` | Adicionar nota de validação |

## Resultado Esperado

- Dashboard Master mostra seletor de mês no topo da seção de créditos
- Ao mudar o mês, os dados de créditos/custo são atualizados automaticamente
- Usuário consegue visualizar consumo de meses anteriores diretamente no dashboard
