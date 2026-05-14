## UÔPA ARENA — visão final

### 1. O que é

Uôpa Arena é o **lobby vivo do Command**: uma tela onde a empresa inteira aparece como um complexo esportivo iluminado e cada divisão de agentes joga uma modalidade própria. Não substitui o Cockpit (que é tático, denso em números) — é a **camada cinematográfica** que fica ligada na TV o dia inteiro e responde, em silêncio coreografado, a tudo que acontece no banco de dados.

A diferença para um dashboard: aqui, *informação é jogo*. Você não lê "3 missões em execução" — você vê três quadras com partidas em andamento, ritmo, placar e tensão corporal do atleta. O cérebro humano lê estado emocional de um corpo em movimento muito mais rápido do que lê números. Esse é o truque.

Sensação alvo: **Apple Park às 22h vendo um Grand Slam noturno** — silencioso, premium, hipnótico, com um zumbido elétrico de "algo está sempre acontecendo".

### 2. Arquitetura de experiência

Uôpa Arena vive em **dois modos da mesma tela**:

- **Wallboard (TV / `/command/arena?tv=1`)** — fullscreen, sem chrome, sem cliques. Câmera automática viaja entre quadras conforme intensidade. Auto-foco na arena com missão crítica.
- **Interactivo (desktop)** — mesma cena, mas com cursor: hover na arena revela atletas (agentes) e placar; click abre o **Painel de Bastidores** (sheet lateral) com missão atual, últimas jogadas, evidências, botões de intervenção (pausar, reatribuir, abrir MissionDetail).

Entrada: novo item "**Arena**" na sidebar, logo abaixo do Cockpit. Rota `/command/arena`.

Estrutura espacial (uma única cena, sem abas):

```
┌──────────── Skybox · pulso global · relógio ────────────┐
│  [Quadra Dev]   [Quadra QA]   [Quadra Comercial]        │
│  [Quadra CS]    [Quadra Mkt]  [Quadra Ops]              │
│  [Quadra Fin]   [Quadra Prod] [Quadra Observabilidade]  │
└──────── Faixa de eventos (ticker) · KPIs sutis ─────────┘
```

3×3 grid de **arenas-cartão** numa única viewport. Sem scroll. Cabe em 1080p e em 4K. Sem missão ativa, atletas treinam — a tela nunca fica morta.

### 3. Mapeamento esporte → divisão

Critério: o esporte tem que **traduzir o ritmo de trabalho** da divisão (contínuo vs. explosivo, individual vs. equipe, defensivo vs. ofensivo).

| Divisão | Esporte | Por quê |
|---|---|---|
| **Dev / Engenharia** | **Tênis** | Rali longo, ponto a ponto = commits/PRs. Falha = ace contra. |
| **QA / Tester** | **Boxe** | Cada round = playbook. Falha = soco encaixado no produto. |
| **Comercial / Vendas** | **Fórmula 1** | Pit stop = call. Volta rápida = deal fechado. Pista = funil. |
| **Marketing / Conteúdo** | **Surf** | Espera a onda (trend), drop, manobra, nota. Conteúdo viral = onda gigante. |
| **Customer Success** | **Vôlei de praia** | Dois agentes, recepção/levantada/ataque = ticket recebido → resolvido. |
| **Operações** | **Remo (8+)** | Sincronia coletiva. Desacelera quando alguém perde o tempo. |
| **Financeiro** | **Esgrima** | Precisão, pouca movimentação, golpes decisivos = fechamentos. |
| **Produto** | **Xadrez de bullet** | Pensamento + relógio. Cada jogada = decisão de roadmap. |
| **Observabilidade / Infra** | **Goleiro de hóquei no gelo** | Defende 24/7, disco vem a 160 km/h = alerta. Defesa = SLO mantido. |
| **Suporte humano** *(se entrar)* | **Triathlon** | Multi-modal e cansativo: chat → call → handoff. |

Strategos (chefe) aparece como **árbitro central** caminhando entre quadras quando uma missão multi-divisão é planejada.

### 4. Sistema de estados visuais

Sete estados, mesmos sete em todas as arenas — vocabulário consistente:

| Estado | Linguagem corporal | Cor de borda | Som (opcional, mute por padrão) |
|---|---|---|---|
| **Standby** | atleta aquecendo, loop calmo | cinza-frio | ambiente de público distante |
| **Ativa** | partida corrente, ritmo médio | branco-quente | pulso baixo |
| **Alto desempenho** | sequência de pontos, câmera lenta no acerto | jade | aplauso curto |
| **Atenção** | adversário pressiona, suor visível | âmbar | murmúrio |
| **Crítico** | match point contra, tela treme sutil | magenta uôpa | sirene curta |
| **Recuperação** | virada, atleta respira, replay rápido | jade pulsante | "yes" da torcida |
| **Fila acumulando** | bolas extras na lateral, ball boy correndo | âmbar ciclando | — |

Padrão sistêmico: **borda da arena + intensidade do skybox**. O fundo da cena inteira escurece quando algo está crítico em qualquer quadra — a Arena tem clima coletivo.

### 5. Dinâmica em tempo real

Eventos do Postgres viram **jogadas**:

- `missions.insert` → atleta entra em quadra, juiz apita início.
- `agent_runs.update status=acting` → rali começa.
- `decisions.insert kind=approval` → tempo técnico, atleta olha pro banco (você).
- `qa_runs.failed` → soco encaixado, replay em loop 2s.
- `tool_executions risk=destructive` → árbitro saca cartão.
- `missions.completed` → ponto, placar incrementa, atleta levanta o braço, câmera vai pra ela 4s.
- `command_log alert` → cartaz luminoso na borda da arena.

Camera director: algoritmo simples — pontua cada arena por (urgência × novidade × tempo desde última visita) e o "olho" da TV faz zoom-in na líder por 6–10 s, depois volta pro grid. Em modo interativo, cursor cancela a câmera automática.

Ticker inferior: últimas 6 jogadas do dia em texto curto ("Tênis · ponto · deploy v2.4 ok"), some sozinho em 8 s.

### 6. Direção de arte

**Estética**: realismo abstrato. Pense **Monument Valley + transmissão esportiva da Apple TV+ + UI do Severance**. Nada de mascotes cartoon. Nada de Lottie genérico.

- **Render**: 2.5D — sprites/SVG vetoriais com paralaxe leve, sombras longas, partículas finas. WebGL só onde compensa (skybox + pós-processo bloom). Resto Canvas2D ou DOM/SVG animado com Motion. Custo de GPU baixo, roda em TV barata.
- **Paleta**: canvas grafite `#0A0B0F`, ink `#E8E8EE`, jade `#3CCB7F` (verde de quadra), magenta uôpa `#E5306C` (crítico), âmbar `#F2A93B` (atenção). Quadras têm tons próprios saturados que só acendem quando a divisão está ativa — quando dorme, vira monocromático azulado.
- **Luz**: spotlight cenital em cada arena, intensidade ligada ao estado. Sombras de atleta sempre visíveis (dá peso).
- **Tipografia**: display **Söhne** ou **NB International** para placar e nomes; mono **JetBrains Mono** para tickers e IDs. Números do placar enormes, tabular-nums, com transição flip mecânico.
- **Movimento**: spring-based, ease elegante (≈ Apple). Nada de bounce caricato. Frame budget: tudo a 60 fps em laptop M-class; degrada graciosamente pra 30 fps.
- **Áudio**: silêncio por padrão. Toggle "sound on" libera ambiente de torcida + cues curtos por evento.

### 7. Componentes (catálogo)

- `<ArenaShell>` — skybox + grid 3×3 + camera director.
- `<ArenaCard variant="tennis|boxing|f1|...">` — cena específica + atleta + placar + borda de estado.
- `<Athlete agentId>` — sprite/rig do agente (cor da divisão, iniciais no peito).
- `<Scoreboard>` — placar grande, flip transition.
- `<EventTicker>` — faixa inferior.
- `<GlobalPulse>` — cabeçalho com hora, nº de missões vivas, custo de IA do dia, % de SLOs verdes.
- `<BackstageSheet>` — drawer lateral por arena: missão atual, últimas 5 jogadas, evidências, ações.
- `<TVChrome>` — esconde sidebar/header, ativa câmera automática, oculta cursor após 3 s.
- `<DivisionSpotlight>` — overlay fullscreen quando o usuário pede foco numa divisão.
- `<ArbiterStrategos>` — atravessa o grid quando há missão multi-divisão.

### 8. Modelo de dados

Tudo já existe em `command_ai`. A Arena consome via uma **view materializada leve** atualizada por triggers + Realtime:

```text
arena_state(division_slug) =
  status        ← max severity de (missions ativas, qa_runs falhas recentes, alerts open)
  intensity     ← runs ativos / capacidade da divisão
  current_mission_id  ← missão mais quente
  last_event    ← último command_log relevante (≤ 30 s)
  score_today   ← missões concluídas hoje
  streak        ← dias consecutivos sem crítico
```

Frontend assina `command_ai.command_log`, `missions`, `agent_runs`, `qa_runs`, `decisions` via Supabase Realtime; reduz no cliente para `arena_state`. Edge fn `arena-snapshot` serve o estado inicial em uma chamada (bom pra TV em cold start). Sem schema novo na primeira fase — só uma view e um channel.

### 9. Estratégia de implementação (3 ondas, não 5)

**Onda A — Esqueleto vivo (≈ 1 dia)**
Rota `/command/arena`, `<ArenaShell>` com 9 cards estáticos, estado mockado, ticker mockado, modo TV (`?tv=1`) com câmera automática. Já é demonstrável.

**Onda B — Esportes-âncora (≈ 2 dias)**
Implementa de verdade 3 arenas que comunicam o conceito: **Tênis (Dev)**, **Boxe (QA)**, **F1 (Comercial)**. Outras 6 ficam num placeholder estilizado consistente (ainda bonito). Conecta `arena_state` real via Realtime.

**Onda C — Polimento + resto do roster (≈ 2 dias)**
Implementa as 6 arenas restantes, BackstageSheet, áudio opcional, ArbiterStrategos, transições de câmera com bloom, snapshot oficial pra TV.

Pular as fases "wireframe" e "mockup estático" — o esqueleto vivo já é o wireframe e custa o mesmo.

### 10. Onde a ideia ganha músculo (e onde cuidar)

**Forte**: a metáfora esportiva resolve o problema mais difícil de um wallboard — *ler estado em 0,5 s a 4 m de distância*. Linguagem corporal > gráfico de barra. E o conceito é **proprietário** — ninguém mais tem isso. Vira marca.

**Risco real 1 — virar enfeite**. Mitigação: cada animação tem que ser *causada* por um evento. Proibido loop decorativo sem fonte de dado. Se uma arena não tem dado, ela treina (estado standby explicitamente honesto), não inventa pontos.

**Risco real 2 — ruído visual**. Mitigação: regra dos *três focos máximos* — só três arenas podem estar acima de "ativa" ao mesmo tempo na cena; o resto é forçado a "standby visual" (mantém o estado real, mas reduz brilho). O olho precisa de descanso.

**Risco real 3 — performance em TV barata**. Mitigação: WebGL opt-in, fallback DOM/SVG, prefers-reduced-motion respeitado, tudo em 60→30 fps gracioso.

**Risco real 4 — utilidade vs espetáculo**. Mitigação: o BackstageSheet existe pra que a Arena também *responda a clique*. Você não só admira — você intervém. Toda jogada vira link pra missão real.

**Bônus que recomendo embutir desde a Onda A:**

- **Replay de 30 s**: aperta `R` e a câmera reproduz os últimos 30 s daquela arena com timestamps. Vira ferramenta de debrief.
- **Modo "calmaria forçada"**: sexta 18 h, a Arena vira modo "after-hours" com luzes baixas e só o goleiro de Observabilidade acordado. Comunica cultura.
- **Placar do mês fixado no skybox** (missões concluídas, SLO verde, churn evitado) — dá narrativa de longo prazo, não só de instante.

### Veredito

Uôpa Arena não é um dashboard reskin. É a **identidade visual da operação Uôpa virando produto**. Construída com disciplina (causalidade real, três focos, render leve), ela vira a coisa que clientes, candidatos e investidores vão lembrar antes de qualquer feature da plataforma.

Pronto pra construir quando você der o sinal.
