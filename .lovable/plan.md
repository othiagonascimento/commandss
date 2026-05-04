# PWA Instalável + Experiência Mobile Elite

## Abordagem

Vou usar a abordagem **manifest-only** (sem service worker), que é a recomendação oficial para apps Lovable. Isso evita problemas conhecidos de cache stale no preview/iframe e ainda entrega:

- Instalação no Home Screen (iOS e Android)
- Tela cheia sem barra do navegador (`display: standalone`)
- Splash screen, ícones e theme color nativos
- Status bar integrada ao tema do app

> Observação: Sem service worker o app **não funciona offline**, mas continua 100% instalável e com aparência nativa. Para um painel admin que depende de dados em tempo real do CRM externo, offline não faria sentido mesmo.

---

## O que será feito

### 1. Manifest Web App (`public/manifest.webmanifest`)
- `name`: "Uôpa Master"
- `short_name`: "Uôpa"
- `display: "standalone"`, `orientation: "portrait"`
- `theme_color` e `background_color` alinhados ao tema dark do app (`#0F172A` / canvas)
- `start_url: "/"`, `scope: "/"`
- Ícones 192px, 512px e 512px maskable (gerados a partir do símbolo Uôpa já hospedado no GCS)
- `shortcuts` para atalhos rápidos: Tenants, Operations, IA Diagnostics

### 2. Meta tags mobile no `index.html`
- `<link rel="manifest" href="/manifest.webmanifest">`
- `<meta name="theme-color">` (suporte a light + dark via `media`)
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- `<meta name="apple-mobile-web-app-title" content="Uôpa">`
- `<link rel="apple-touch-icon">` (180px)
- `<meta name="mobile-web-app-capable" content="yes">`
- `viewport` atualizado com `viewport-fit=cover` para suportar safe areas (notch)

### 3. Ícones PWA
Criar em `public/icons/`:
- `icon-192.png`
- `icon-512.png`
- `icon-512-maskable.png` (com padding seguro de 20%)
- `apple-touch-icon.png` (180x180, fundo sólido — iOS não respeita transparência)

Vou gerar a partir do símbolo Uôpa já usado no favicon (`Uôpa CRM símbolo 2.0.png`) com ImageMagick em `code--exec`.

### 4. Refinamentos mobile elite
- **Safe areas iOS**: adicionar utilitários `pt-safe`, `pb-safe`, `pl-safe`, `pr-safe` no `tailwind.config.ts` usando `env(safe-area-inset-*)`
- **BottomNav** (`src/components/layout/BottomNav.tsx`): aplicar `pb-safe` para não ficar atrás do home indicator do iPhone
- **Header/topo**: respeitar safe-area-inset-top quando rodando standalone
- **Overscroll**: `overscroll-behavior-y: none` no body para evitar bounce branco
- **Tap highlight**: remover `-webkit-tap-highlight-color` para feel nativo
- **User-select**: desabilitar em elementos de UI (mantém em campos de texto)
- **Standalone detector**: adicionar pequeno hook `useStandaloneMode()` que aplica classe `standalone` no `<html>` quando rodando como PWA, permitindo ajustes finos (ex.: esconder banners "instale o app")

### 5. Página `/install` (opcional mas recomendado)
Tela dedicada com:
- Detecção de plataforma (iOS Safari vs Android Chrome)
- Instruções visuais passo a passo ("Compartilhar → Adicionar à Tela de Início" no iOS)
- Botão `beforeinstallprompt` no Android/Chrome desktop
- Link no menu "Mais" (BottomNav) para acesso fácil

---

## Arquivos afetados

```text
public/
  manifest.webmanifest          (novo)
  icons/
    icon-192.png                (novo)
    icon-512.png                (novo)
    icon-512-maskable.png       (novo)
    apple-touch-icon.png        (novo)
index.html                       (meta tags)
tailwind.config.ts               (safe-area utilities)
src/index.css                    (overscroll, tap-highlight, safe-area base)
src/components/layout/BottomNav.tsx  (pb-safe)
src/components/layout/DashboardLayout.tsx  (pt-safe no header)
src/hooks/useStandaloneMode.ts   (novo)
src/pages/Install.tsx            (novo)
src/App.tsx                      (rota /install)
```

## O que NÃO será feito (e por quê)

- **Sem `vite-plugin-pwa` / service worker** — causa cache stale no preview do Lovable e quebra hot-reload. Para o caso de uso (painel admin sempre online), não traz benefício.
- **Sem cache offline** — dados são sempre frescos do CRM externo.
- **Sem push notifications** — exigiria service worker + backend dedicado; pode ser adicionado depois se necessário.

## Resultado esperado

Ao acessar `master.uopacrm.com` no iPhone/Android, o usuário pode:
1. Tocar em Compartilhar → Adicionar à Tela de Início (iOS) ou ver prompt automático (Android)
2. Abrir o app pelo ícone como se fosse nativo — sem barra de URL, splash screen Uôpa, status bar dark integrada
3. Navegar com BottomNav que respeita o home indicator, sem bounce branco, sem highlights estranhos de toque
