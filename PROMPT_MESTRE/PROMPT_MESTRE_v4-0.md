# PROMPT MESTRE — PLATAFORMA WEB PROFISSIONAL DE FOTOGRAFIA
### Versão 2.0 — Enriquecido e Otimizado

---

## IDENTIDADE DO PROJETO

**Nome do produto:** A definir pelo fotógrafo  
**Tipo:** Plataforma web profissional de portfólio, galerias e entrega de fotografias para clientes  
**Fase atual:** MVP completo — sem e-commerce, sem multi-fotógrafo  
**Stack preferencial:** Next.js 14+ (App Router) · TypeScript · Tailwind CSS · Supabase (Auth + DB + Storage) · Cloudflare CDN  

---

## MISSÃO DO AGENTE

Você atuará **simultaneamente** como os seguintes especialistas em **um único fluxo de trabalho integrado**:

| Papel | Responsabilidade principal |
|---|---|
| Arquiteto de software web sênior | Decisões de estrutura, módulos, APIs, separação de responsabilidades |
| UX/UI Designer — produtos premium | Experiência do usuário, fluxos, wireframes, design system |
| Diretor de arte — fotografia | Hierarquia visual, espaço negativo, tipografia editorial |
| Desenvolvedor full-stack | Implementação de código funcional, seguro e testável |
| Especialista em imagens & CDN | Pipeline de processamento, formatos, compressão, entrega |
| Especialista em SEO técnico | URLs, metadados, sitemap, dados estruturados, Core Web Vitals |
| Especialista em performance web | Lazy loading, pré-fetch, cache, bundle size, LCP/CLS/INP |
| Especialista em segurança & LGPD | Auth, permissões, URLs assinadas, consentimento, privacidade |

**Conflitos entre papéis:** quando houver tensão (ex.: estética vs. performance), a decisão deve ser explicitada e justificada. A performance nunca é sacrificada em favor de animações; a estética nunca compromete acessibilidade.

---

## PRINCÍPIO FUNDADOR

> A fotografia é a protagonista absoluta.  
> A interface existe apenas para servir às fotografias — nunca para competir com elas.

Toda decisão de design, de código e de UX deve ser testada contra este princípio antes de ser implementada.

---

## REFERÊNCIAS CONCEITUAIS — ANÁLISE CRÍTICA

Estudar como referência de experiência e funcionalidades (sem copiar visualmente):

- **Pixieset** — excelência na entrega para clientes, fluxo de favoritos
- **Pic-Time** — narrativa visual, slideshow emocional, apresentações
- **Format** — portfólio editorial, identidade autoral
- **SmugMug** — organização hierárquica de galerias, permissões granulares
- **Zenfolio** — fluxo de download, proteção por senha
- **Squarespace Photography** — minimalismo, tipografia, espaço negativo

**Extrair apenas:** organização, experiência do cliente, apresentação fotográfica, galerias, downloads, privacidade, navegação, responsividade e performance.

**O resultado deve ter identidade própria** — não ser confundível com nenhuma das referências.

---

## STACK TÉCNICA RECOMENDADA

### Frontend
```
Next.js 14+ (App Router, React Server Components)
TypeScript (strict mode)
Tailwind CSS
Framer Motion (animações mínimas e com propósito)
React Hook Form + Zod (formulários e validação)
Zustand (estado global leve)
TanStack Query (cache e sincronização de dados)
next/image (otimização automática de imagens)
```

### Backend / API
```
Next.js Route Handlers (API routes) OU servidor separado (Node/Hono)
Supabase (PostgreSQL gerenciado + Auth + Storage)
Sharp (processamento de imagens no servidor)
BullMQ ou Supabase Edge Functions (processamento assíncrono de uploads)
```

### Storage & CDN
```
Supabase Storage (object storage compatível com S3) OU Cloudflare R2
Cloudflare CDN (distribuição e cache de assets)
URLs assinadas para arquivos privados (expiração configurável)
```

### Autenticação
```
Supabase Auth (email/senha, magic link, OAuth)
JWT + Row Level Security (RLS) no banco
```

### Infraestrutura
```
Vercel OU Cloudflare Pages (deploy do frontend)
Supabase (banco + auth + storage)
Cloudflare R2 + Workers (storage alternativo escalável)
```

---

## BANCO DE DADOS — SCHEMA COMPLETO

```sql
-- Usuários do sistema (fotógrafo e admins)
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  role        TEXT NOT NULL DEFAULT 'admin', -- 'admin' | 'editor'
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Clientes (quem recebe as galerias)
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT,
  whatsapp    TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Categorias configuráveis
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  cover_photo_id UUID, -- FK para photos (nullable, set later)
  sort_order  INT DEFAULT 0,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Galerias (trabalhos completos)
CREATE TABLE galleries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  subtitle        TEXT,
  description     TEXT,
  story           TEXT, -- narrativa longa para seção "Momentos"
  category_id     UUID REFERENCES categories(id),
  client_id       UUID REFERENCES clients(id),
  event_date      DATE,
  location        TEXT,
  cover_photo_id  UUID, -- FK para photos (set after upload)
  visibility      TEXT NOT NULL DEFAULT 'private',
    -- 'public' | 'private' | 'unlisted'
  password_hash   TEXT, -- proteção adicional por senha/PIN
  download_enabled      BOOLEAN DEFAULT false,
  download_resolution   TEXT DEFAULT 'web', -- 'web' | 'full' | 'both'
  watermark_enabled     BOOLEAN DEFAULT false,
  comments_enabled      BOOLEAN DEFAULT false,
  favorites_enabled     BOOLEAN DEFAULT true,
  sharing_enabled       BOOLEAN DEFAULT false,
  featured        BOOLEAN DEFAULT false,
  featured_until  TIMESTAMPTZ,
  sort_order      INT DEFAULT 0,
  metadata        JSONB DEFAULT '{}', -- dados extras (equipamento, exif, etc.)
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Permissões de acesso de clientes a galerias
CREATE TABLE gallery_access (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id  UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  client_id   UUID REFERENCES clients(id),
  token       TEXT UNIQUE, -- link privado único
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Fotografias
CREATE TABLE photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id      UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  filename        TEXT NOT NULL, -- nome original
  storage_path    TEXT NOT NULL, -- path no object storage (original)
  path_thumbnail  TEXT,          -- 400px
  path_preview    TEXT,          -- 1200px WebP
  path_web        TEXT,          -- 2000px WebP
  path_watermark  TEXT,          -- versão com marca d'água
  width           INT,
  height          INT,
  size_bytes      BIGINT,
  format          TEXT,          -- 'jpeg' | 'png' | 'webp' | 'raw'
  alt_text        TEXT,
  caption         TEXT,
  exif            JSONB,         -- dados EXIF completos
  sort_order      INT DEFAULT 0,
  is_cover        BOOLEAN DEFAULT false,
  is_featured     BOOLEAN DEFAULT false,
  published       BOOLEAN DEFAULT true,
  processing_status TEXT DEFAULT 'pending',
    -- 'pending' | 'processing' | 'done' | 'error'
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Favoritos dos clientes
CREATE TABLE favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id    UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  gallery_id  UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  client_id   UUID REFERENCES clients(id),
  session_token TEXT, -- para clientes sem login (acesso por link)
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(photo_id, client_id),
  UNIQUE(photo_id, session_token)
);

-- Comentários (opcionais, por foto)
CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id    UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  gallery_id  UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  client_id   UUID REFERENCES clients(id),
  session_token TEXT,
  body        TEXT NOT NULL,
  read_by_admin BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Registro de downloads
CREATE TABLE downloads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id        UUID REFERENCES photos(id),
  gallery_id      UUID REFERENCES galleries(id),
  client_id       UUID REFERENCES clients(id),
  session_token   TEXT,
  resolution      TEXT, -- 'web' | 'full'
  downloaded_at   TIMESTAMPTZ DEFAULT now(),
  ip_hash         TEXT -- hash anonimizado para analytics
);

-- Mensagens de contato
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT,
  whatsapp        TEXT,
  work_type       TEXT, -- 'casamento' | 'evento' | 'ensaio' | etc.
  event_date      DATE,
  city            TEXT,
  body            TEXT NOT NULL,
  read            BOOLEAN DEFAULT false,
  archived        BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Configurações do site
CREATE TABLE settings (
  key     TEXT PRIMARY KEY,
  value   JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Analytics próprio (privacidade-first)
CREATE TABLE analytics_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT NOT NULL, -- 'page_view' | 'gallery_view' | 'download' | 'contact'
  gallery_id  UUID REFERENCES galleries(id),
  photo_id    UUID REFERENCES photos(id),
  session_id  TEXT, -- anônimo
  country     TEXT, -- geolocalização aproximada (país apenas)
  device      TEXT, -- 'mobile' | 'tablet' | 'desktop'
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

> **Row Level Security (RLS):** habilitar em todas as tabelas. Galerias `private` só acessíveis via token válido em `gallery_access` ou autenticação como admin.

---

## PIPELINE DE PROCESSAMENTO DE IMAGENS

```
Upload (arquivo original)
       ↓
Validação (tipo, tamanho máx 150MB, dimensões mínimas)
       ↓
Armazenamento do original (path protegido, sem URL pública)
       ↓
Fila de processamento assíncrono (BullMQ / Edge Function)
       ↓
┌──────────────────────────────────────────────────────┐
│  thumbnail   → 400px    WebP  qualidade 75  (listagem)│
│  preview     → 1200px   WebP  qualidade 82  (lightbox)│
│  web         → 2000px   WebP  qualidade 88  (download)│
│  watermark   → 2000px   WebP  + marca d'água overlay  │
└──────────────────────────────────────────────────────┘
       ↓
Extração de EXIF (preservada no banco)
       ↓
Atualização do status: 'done'
       ↓
URLs assinadas geradas sob demanda (expiração: 1h para privadas)
```

**Nunca:**
- servir o arquivo original diretamente
- armazenar imagens no banco SQL
- gerar URLs permanentes para galerias privadas

---

## ARQUITETURA DE MÓDULOS

```
/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Rotas públicas
│   │   ├── page.tsx              # Home
│   │   ├── portfolio/            # Portfólio com filtros
│   │   ├── eventos/              # Lista de eventos
│   │   ├── eventos/[slug]/       # Evento individual
│   │   ├── casamentos/[slug]/    # Casamento individual
│   │   ├── ensaios/[slug]/       # Ensaio individual
│   │   ├── momentos/             # Narrativas fotográficas
│   │   ├── astrofotografia/      # Seção astro
│   │   ├── sobre/                # Sobre o fotógrafo
│   │   ├── contato/              # Formulário de contato
│   │   └── not-found.tsx         # 404 customizado
│   │
│   ├── (client)/                 # Área do cliente
│   │   ├── c/[token]/            # Acesso por link privado
│   │   └── cliente/              # Acesso por login
│   │       ├── page.tsx          # Dashboard do cliente
│   │       └── galeria/[id]/     # Galeria individual
│   │
│   ├── admin/                    # Painel administrativo
│   │   ├── layout.tsx            # Layout admin (autenticado)
│   │   ├── page.tsx              # Dashboard
│   │   ├── galerias/             # CRUD de galerias
│   │   ├── clientes/             # Gestão de clientes
│   │   ├── mensagens/            # Caixa de mensagens
│   │   ├── configuracoes/        # Configurações do site
│   │   └── analytics/            # Métricas
│   │
│   └── api/                      # Route Handlers
│       ├── auth/                 # Login, logout, session
│       ├── galleries/            # CRUD galerias
│       ├── photos/               # Upload, processamento
│       ├── favorites/            # Favoritos
│       ├── downloads/            # Download controlado
│       ├── contact/              # Formulário de contato
│       └── analytics/            # Eventos de analytics
│
├── components/
│   ├── ui/                       # Design system base
│   ├── gallery/                  # Componentes de galeria
│   ├── lightbox/                 # Lightbox imersivo
│   ├── upload/                   # Upload com drag & drop
│   ├── admin/                    # Componentes do painel
│   └── layout/                   # Header, Footer, Nav
│
├── lib/
│   ├── supabase/                 # Cliente Supabase
│   ├── storage/                  # Helpers de upload/download
│   ├── image/                    # Processamento Sharp
│   ├── auth/                     # Helpers de autenticação
│   ├── seo/                      # Metadados e OG
│   └── analytics/                # Eventos de analytics
│
└── types/                        # TypeScript types globais
```

---

## MÓDULOS DO PRODUTO — ESPECIFICAÇÕES DETALHADAS

---

### MÓDULO 1 — HOME PAGE

**Objetivo:** impacto visual imediato. O visitante deve entender em 3 segundos quem é o fotógrafo e sentir-se atraído pelo trabalho.

#### Hero Section
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   [fotografia em tela cheia — fullscreen vh: 100]       │
│                                                         │
│                  [NOME DO FOTÓGRAFO]                    │
│           Fotografia · Histórias · Momentos             │
│                                                         │
│                 [Conheça meu trabalho]                  │
│                                                         │
│  ░░░░░░░░░░░░░  indicador de slideshow  ░░░░░░░░░░░░░   │
└─────────────────────────────────────────────────────────┘
```

**Comportamento:**
- Slideshow automático de 5–8 segundos por imagem, configurável no admin
- Transição: cross-fade suave (600ms ease-in-out) — sem zoom, sem flash
- Fotos configuráveis pelo admin (pool de até 10 imagens)
- Nome e tagline sobrepostos com gradiente escuro sutil na base
- CTA discreto — sem hover exagerado, sem sombra gritante
- `prefers-reduced-motion`: desabilitar slideshow automático, exibir imagem estática

#### Seção de Categorias
```
Logo abaixo do hero (padding-top: 0, transição direta):

EVENTOS     CASAMENTOS     ENSAIOS
FESTAS      AUTORAL        ASTROFOTOGRAFIA

Layout: grid 3×2 desktop / 2×3 tablet / 1×6 mobile
Cada card: fotografia de destaque + nome da categoria
Hover: overlay escuro sutil + nome em destaque
```

**Regras:**
- Cada categoria mostra a foto de destaque configurada no admin
- Categorias sem foto de destaque: gradient placeholder
- Ao clicar: navegar para `/portfolio?categoria=slug` ou página dedicada
- Categorias configuráveis no admin (nome, slug, ativo/inativo, sort)

---

### MÓDULO 2 — PORTFÓLIO

**URL:** `/portfolio`

#### Filtros
```
Todos | Casamentos | Ensaios | Eventos | Festas | Vida Noturna
      | Retratos | Paisagens | Astrofotografia | Autorais

Posicionamento: fixo no topo durante scroll (sticky)
Mobile: scroll horizontal dos filtros (sem quebra)
Animação de filtro: fade + reflow suave (Framer Motion layout)
```

#### Layouts disponíveis (alternável por botão)
| Layout | Descrição |
|---|---|
| **Masonry** | Colunas com alturas variáveis, preserva proporção original |
| **Grid** | Grade uniforme com crop central |
| **Editorial** | Mix de tamanhos: grande-pequeno-pequeno-grande |
| **Fullscreen** | Uma foto por vez, navegação por seta/swipe |

- Padrão: Masonry
- Layout escolhido: persistido em `localStorage`

#### Lightbox
- Abre ao clicar em qualquer foto
- Navegação: teclado (← →), swipe mobile, botões
- Zoom: scroll mouse / pinch mobile
- Tela cheia: botão dedicado
- Informações opcionais: título, local, data (configurável por galeria)
- Compartilhamento: apenas quando `sharing_enabled = true`
- Fechar: tecla Esc, clique fora, botão X
- Fundo: preto absoluto `#000000`
- Preload: foto anterior e próxima pré-carregadas em background

---

### MÓDULO 3 — MOMENTOS (Narrativa Fotográfica)

**URL:** `/momentos` e `/momentos/[slug]`

**Conceito:** não é uma galeria — é uma história contada através de fotografias.

#### Estrutura de cada Momento
```
[FOTO CAPA — fullscreen]

[TÍTULO DO TRABALHO]
Casamento de Ana & Rafael
12 de setembro de 2026 · Fazenda das Bromélias, Campo Mourão

[PEQUENA HISTÓRIA — texto narrativo, 2–4 parágrafos]

[SEQUÊNCIA FOTOGRÁFICA — layout alternado]

┌────────────────┐  ┌────┐ ┌────┐
│                │  │    │ │    │  ← horizontal + 2 verticais
│  foto grande   │  │ v  │ │ v  │
│                │  │    │ │    │
└────────────────┘  └────┘ └────┘

┌──────────────────────────────────┐
│         foto panorâmica          │  ← fullwidth
└──────────────────────────────────┘

[mosaico de 4]  [foto grande]  ...

[FINALIZAÇÃO — frase marcante ou citação]
```

**Comportamento:**
- Scroll vertical como leitura de história
- Fotos em tela cheia: aparecem com `IntersectionObserver` (fade-in ao entrar na viewport)
- Sem lightbox em modo "Momentos" — a narrativa é o produto
- Lightbox disponível para quem clicar numa foto específica (opcional)

---

### MÓDULO 4 — EVENTOS

**URL:** `/eventos` e `/eventos/[slug]`

#### Listagem
```
┌───────────────────────────────────────────────────────┐
│  [FOTO CAPA]                                          │
│                                                       │
│  Festival de Inverno                                  │
│  14 AGO 2026 · Campo Mourão                          │
│                                    [VER GALERIA]      │
└───────────────────────────────────────────────────────┘
```

**Filtros:** busca por texto · filtro por categoria · filtro por data (mês/ano) · filtro por local

**Ordenação:** mais recente primeiro (padrão) · mais antigo · alfabética

**Eventos passados:** permanecem acessíveis como portfólio histórico

#### Página do Evento
- URL amigável: `/eventos/festival-de-inverno-2026`
- Meta OG: imagem de capa, título, data, local
- Galeria de fotos do evento em layout masonry
- Possibilidade de ter galeria pública (portfólio) e galeria privada (entrega ao cliente) vinculadas ao mesmo evento

---

### MÓDULO 5 — CASAMENTOS

**URL:** `/casamentos` e `/casamentos/[slug]`

**URL amigável:** `/casamentos/ana-e-rafael`

#### Estrutura da página
```
[FOTO CAPA — fullscreen]

ANA & RAFAEL
12 de Setembro de 2026
Fazenda das Bromélias · Campo Mourão

[CAPÍTULOS — navegação por tabs ou scroll âncoras]

  Preparativos  |  Cerimônia  |  Recepção  |  Festa

[narrativa visual contínua por capítulo]
```

**Especificações:**
- Cada capítulo é uma sequência de fotos com layout editorial
- Transição entre capítulos: suave, sem page reload
- Mobile: scroll vertical contínuo, sem tabs
- Frase de abertura configurável por casal

---

### MÓDULO 6 — ENSAIOS

**URL:** `/ensaios` e `/ensaios/[slug]`

**Subcategorias:** Individual · Casal · Família · Gestante · Editorial · Retrato Profissional · Outros

---

### MÓDULO 7 — ASTROFOTOGRAFIA

**URL:** `/astrofotografia` (ou `/ceu-e-universo`)

**Identidade visual diferenciada:** fundo escuro absoluto, tipografia clara, atmosfera de observatório

**Campos EXIF especializados (opcionais):**
```
Local de observação
Data e hora (UTC)
Câmera
Lente / Telescópio
Tempo de exposição
ISO
Abertura (f/)
Stacking (número de frames)
Software de processamento
Observações do fotógrafo
```

**Subjects:** Lua · Estrelas · Via Láctea · Fenômenos astronômicos · Paisagens noturnas · Céu profundo

---

### MÓDULO 8 — ÁREA DO CLIENTE

**Acesso possível por:**
1. **Login** (email + senha cadastrados pelo fotógrafo)
2. **Link privado + PIN** — URL única `/c/[token]` com PIN de 4–6 dígitos
3. **Magic link** — enviado por email (sem senha)

#### Dashboard do cliente
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Olá, Mariana. ✨                                   │
│                                                     │
│  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │  [foto capa]        │  │  [foto capa]        │  │
│  │  Seu casamento      │  │  Ensaio gestante    │  │
│  │  12/08/2026         │  │  05/07/2026         │  │
│  │  [ABRIR GALERIA]    │  │  [ABRIR GALERIA]    │  │
│  └─────────────────────┘  └─────────────────────┘  │
│                                                     │
│  Favorites: 37 fotos selecionadas                   │
└─────────────────────────────────────────────────────┘
```

#### Dentro da galeria (visão do cliente)
- Layout: grid ou masonry (igual ao portfólio público)
- Ações disponíveis (configuráveis pelo fotógrafo por galeria):
  - ♡ **Favoritar** — com feedback visual imediato
  - 💬 **Comentar** — comentário associado à foto específica
  - ⬇️ **Baixar foto** — resolução web ou alta (conforme permissão)
  - ⬇️ **Baixar galeria** — ZIP gerado no servidor, download via link assinado
- Barra de progresso de favoritos: "37 de 230 fotos selecionadas"
- Exportar lista de favoritos: o **fotógrafo** pode exportar a lista no admin

---

### MÓDULO 9 — SISTEMA DE PRIVACIDADE E PERMISSÕES

```
┌─────────────────────────────────────────────────────┐
│  VISIBILIDADE DA GALERIA                            │
│                                                     │
│  ◉ PUBLIC    → aparece no portfólio público         │
│  ○ UNLISTED  → acessível só por link direto         │
│  ○ PRIVATE   → requer autenticação ou PIN           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  PROTEÇÃO ADICIONAL                                 │
│                                                     │
│  ○ Sem senha                                        │
│  ◉ PIN de 4 dígitos: [ _ _ _ _ ]                   │
│  ○ PIN de 6 dígitos: [ _ _ _ _ _ _ ]               │
└─────────────────────────────────────────────────────┘
```

**Regra crítica de segurança:** uma galeria `private` NUNCA pode ser acessada simplesmente descobrindo sua URL. O middleware valida a sessão **antes** de qualquer renderização, inclusive de Server Components.

**URLs assinadas:** arquivos no storage nunca têm URL pública permanente. Toda URL gerada tem TTL de 1 hora (configurável), renovada automaticamente durante sessão ativa.

---

### MÓDULO 10 — UPLOAD E GERENCIAMENTO DE FOTOS

#### Fluxo de Upload (admin)
```
1. Abrir galeria no admin
2. Área de drag & drop (ou botão "Selecionar arquivos")
3. Seleção múltipla: JPG, PNG, WEBP, RAW (mediante conversão)
4. Tamanho máximo por arquivo: 150MB
5. Upload em chunks (chunked upload) — suporte a retomada
6. Progresso: barra individual por foto + barra geral
7. Processamento assíncrono: thumbnail gerado em segundos
8. Status por foto: pending → processing → done | error
9. Ordenação por drag & drop após upload
10. Definir capa: clique em qualquer foto
```

#### Gerenciamento de fotos (admin)
- Seleção múltipla com checkbox
- Ações em lote: excluir · mover para galeria · publicar/despublicar · marcar como destaque
- Editar por foto: alt text, legenda, ordem, destaque
- **NUNCA alterar o arquivo original sem ação explícita e confirmação**

---

### MÓDULO 11 — DOWNLOAD

**Lógica de permissão (verificada no servidor a cada requisição):**
```
photógrafo configurou download?
  └─ NÃO → endpoint retorna 403
  └─ SIM → cliente tem acesso à galeria?
           └─ NÃO → 403
           └─ SIM → qual resolução foi configurada?
                   └─ WEB     → servir path_web via URL assinada (1h)
                   └─ FULL    → servir original via URL assinada (1h)
                   └─ BOTH    → cliente escolhe
```

**Download de galeria completa:**
- Gerado como ZIP no servidor (não no navegador)
- Job assíncrono: cliente vê progresso
- Link de download válido por 24h
- Registro em `downloads` para analytics

---

### MÓDULO 12 — PAINEL ADMINISTRATIVO

**URL:** `/admin` (protegida por middleware de autenticação)

#### Dashboard
```
┌──────────────────────────────────────────────────────────┐
│  VISÃO GERAL                                            │
│                                                         │
│  📁 42 galerias   📷 8.340 fotos   👥 18 clientes       │
│  💬 3 mensagens   ⬇️ 127 downloads esta semana          │
│  💾 Armazenamento: 12.4 GB / 50 GB                      │
│                                                         │
│  DESTAQUE DA SEMANA                    AÇÕES RÁPIDAS    │
│  [selecionar galeria]                  + Nova galeria   │
│                                        + Novo cliente   │
└──────────────────────────────────────────────────────────┘
```

#### Seções do admin
| Seção | Funcionalidades |
|---|---|
| **Galerias** | CRUD completo, filtros, status, link rápido para compartilhar |
| **Fotos** | Upload, gerenciamento, processamento, reordenação |
| **Clientes** | CRUD, histórico de galerias, exportar favoritos |
| **Mensagens** | Caixa de entrada do formulário de contato, marcar como lido |
| **Eventos** | Gestão de eventos públicos |
| **Destaques** | Selecionar galeria/evento para o "Destaque da Semana" |
| **Analytics** | Métricas de visitas, downloads, favoritos |
| **Configurações** | Site, marca d'água, redes sociais, SEO global, tema |
| **Armazenamento** | Uso por galeria, limpeza de arquivos órfãos |

---

### MÓDULO 13 — CONTATO

**URL:** `/contato` (ou `/vamos-conversar`)

#### Formulário
```
Nome *
WhatsApp *
E-mail
Tipo de trabalho: [Casamento] [Evento] [Ensaio] [Festa] [Corporativo] [Outro]
Data prevista
Cidade
Sua mensagem

[ENVIAR MENSAGEM]          [FALAR PELO WHATSAPP ↗]
```

**Backend:**
- Validação com Zod no servidor
- Rate limiting: máx. 3 envios por IP por hora
- HONEYPOT field para bloquear bots
- Notificação ao fotógrafo via email (Resend / Nodemailer)
- Registro em `messages` no banco
- Resposta ao remetente: confirmação automática (opcional)

---

### MÓDULO 14 — SEO TÉCNICO

**Por página/galeria pública:**
```html
<title>{título} · {nome do fotógrafo}</title>
<meta name="description" content="...">
<link rel="canonical" href="...">

<!-- Open Graph -->
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content="{URL assinada da foto capa}">
<meta property="og:url" content="...">
<meta property="og:type" content="website">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="...">
```

**Dados estruturados (JSON-LD):**
```json
{
  "@type": "Photograph",
  "@type": "Event",
  "@type": "Person" (fotógrafo),
  "@type": "ImageGallery"
}
```

**Arquivos:**
- `sitemap.xml` gerado dinamicamente (apenas galerias públicas)
- `robots.txt` bloqueando `/admin`, `/c/`, `/api/`
- `manifest.json` para PWA básico

---

### MÓDULO 15 — PERFORMANCE

**Metas Core Web Vitals:**
| Métrica | Meta |
|---|---|
| LCP (Largest Contentful Paint) | < 2.5s |
| CLS (Cumulative Layout Shift) | < 0.1 |
| INP (Interaction to Next Paint) | < 200ms |

**Estratégias obrigatórias:**
```
next/image: width, height e priority no hero
Lazy loading: todas as fotos fora do viewport
Thumbnails: sempre servir a menor versão suficiente
srcset: responsive images automáticas
Preload: foto seguinte no lightbox
Paginação: máximo 48 fotos por página (cursor-based)
Cache: headers de cache longos para assets imutáveis
CDN: todos os assets de imagem via Cloudflare
Bundle splitting: code splitting por rota (automático Next.js)
```

**Proibido:**
- Carregar originais em qualquer listagem
- Carregar mais de 48 fotos sem paginação
- Bloquear o thread principal durante upload

---

### MÓDULO 16 — DESIGN SYSTEM

**Paleta (dark mode — padrão sugerido para fotografia noturna):**
```
--color-bg:         #0A0A0A   /* preto absoluto */
--color-surface:    #141414   /* cards e painéis */
--color-surface-2:  #1E1E1E   /* elevação */
--color-border:     #2A2A2A   /* bordas sutis */
--color-text:       #F5F5F5   /* texto principal */
--color-text-muted: #888888   /* texto secundário */
--color-accent:     #C9A96E   /* dourado quente — único accent */
--color-error:      #E05C5C
--color-success:    #4CAF7A
```

**Paleta (light mode — alternativo):**
```
--color-bg:         #FAFAFA
--color-surface:    #FFFFFF
--color-border:     #E5E5E5
--color-text:       #0A0A0A
--color-text-muted: #666666
--color-accent:     #8B6914
```

**Tipografia:**
```css
/* Títulos — elegância editorial */
font-family: 'Playfair Display', Georgia, serif;

/* Interface — clareza funcional */  
font-family: 'Inter', system-ui, sans-serif;

/* Escala tipográfica */
--text-xs:    0.75rem   /* 12px — metadados */
--text-sm:    0.875rem  /* 14px — legendas */
--text-base:  1rem      /* 16px — corpo */
--text-lg:    1.125rem  /* 18px — subtítulos */
--text-xl:    1.25rem   /* 20px */
--text-2xl:   1.5rem    /* 24px */
--text-3xl:   1.875rem  /* 30px */
--text-4xl:   2.25rem   /* 36px */
--text-5xl:   3rem      /* 48px — títulos hero */
--text-6xl:   4rem      /* 64px — nome do fotógrafo */
```

**Espaçamento:** múltiplos de 4px (Tailwind padrão)

**Animações:**
```css
/* APENAS estas — nada mais */
transition-duration: 200ms; /* hover states */
transition-duration: 400ms; /* lightbox open/close */
transition-duration: 600ms; /* hero crossfade */

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
```

---

### MÓDULO 17 — TEMA

```
Admin → Configurações → Aparência

◉ Dark (padrão recomendado)
○ Light
○ Automático (segue sistema do visitante)
```

O fotógrafo escolhe o tema padrão do site público. O visitante não altera o tema (o site tem identidade definida).

---

### MÓDULO 18 — ACESSIBILIDADE

**Requisitos obrigatórios (WCAG 2.1 AA):**
- Contraste mínimo 4.5:1 para texto normal, 3:1 para texto grande
- Todos os elementos interativos acessíveis por teclado (Tab, Enter, Space, Escape)
- `alt` text em todas as imagens (preenchido pelo admin, ou gerado como fallback)
- ARIA landmarks: `<main>`, `<nav>`, `<aside>`, `<footer>`
- `aria-label` em botões sem texto visível (ex.: fechar lightbox)
- Focus ring visível: nunca `outline: none` sem alternativa
- Lightbox: foco aprisionado dentro do modal enquanto aberto (`focus-trap`)

---

### MÓDULO 19 — LGPD

**Princípios desde a arquitetura:**
- Uma foto entregue a um cliente **não pode automaticamente** aparecer no portfólio público
- Cada galeria tem um campo `visibility` explícito — padrão: `private`
- Nenhum dado de cliente é compartilhado publicamente
- Analytics: coleta mínima, sem cookies de terceiros, IP hashed
- Cookie banner: apenas se houver analytics externo (ex.: Google Analytics — preferir alternativas privacy-first como Plausible ou Umami)
- Páginas obrigatórias: Política de Privacidade · Termos de Uso

---

### MÓDULO 20 — PÁGINA 404

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   [foto artística de fundo — levemente desfocada]   │
│                                                     │
│         Parece que esse momento                     │
│         escapou da lente.                           │
│                                                     │
│         [← Voltar para o início]                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

A foto de fundo deve ser uma das fotos de destaque configuradas no hero, servida em qualidade preview.

---

### MÓDULO 21 — ANALYTICS (privacy-first)

**Dashboard admin mostrará:**
- Visitas por dia/semana/mês (gráfico simples)
- Galerias mais vistas (top 10)
- Fotos mais favoritadas (top 10)
- Downloads por período
- Mensagens recebidas por período
- País de origem aproximado (sem IP individual)
- Dispositivo: mobile / tablet / desktop

**Implementação:** eventos simples registrados em `analytics_events` — sem cookies, sem scripts externos obrigatórios.

---

### MÓDULO 22 — DESTAQUE DA SEMANA

**Admin → Destaques:**
```
Selecione uma galeria ou evento para destacar:

[buscar galeria...]     Válido até: [data] ← opcional

[DEFINIR COMO DESTAQUE]
```

Aparece na Home como banner ou seção especial após as categorias.

---

### MÓDULO 23 — BASTIDORES (arquitetura preparada, não implementada)

**Estrutura prevista no banco e nas rotas (placeholder):**
- Tabela `posts` com campos: `type` (texto/foto/vídeo), `title`, `body`, `gallery_id` (opcional), `tags`, `published`
- Rota `/bastidores` reservada no router (retorna 404 até implementação)
- Admin com seção "Bastidores" indicando "Em breve"

---

### MÓDULO 24 — REDES SOCIAIS

**Configurável no admin:**
- Instagram · WhatsApp · Facebook · YouTube · Pinterest · TikTok
- Links exibidos no footer e na página "Sobre"
- Botão WhatsApp fixo (opcional) no canto inferior direito
- Compartilhamento de galerias públicas com OG correto

---

## CRITÉRIOS DE QUALIDADE POR MÓDULO

Antes de considerar qualquer módulo concluído, verificar:

```
✓ Funciona em Chrome, Firefox e Safari (desktop)
✓ Funciona em iOS Safari e Android Chrome (mobile)
✓ Testado com galeria de 200+ fotos
✓ Testado em conexão lenta (throttle 3G no DevTools)
✓ Autenticação: sessão expirada redireciona corretamente
✓ Permissões: galeria private não vaza via URL direta
✓ Downloads: arquivo correto entregue conforme permissão
✓ Upload: interrupção e retomada funcionam
✓ Fotos verticais e horizontais renderizam sem distorção
✓ Keyboard navigation funciona em todos os componentes
✓ Lighthouse score: Performance ≥ 90, Accessibility ≥ 90
✓ Console do browser sem erros em produção
```

---

## ORDEM DE IMPLEMENTAÇÃO

```
FASE 1 — Fundação (prerequisito de tudo)
  1.1  Definir e configurar stack técnica completa
  1.2  Configurar Supabase (Auth, DB, Storage, RLS)
  1.3  Criar schema do banco de dados completo
  1.4  Configurar Cloudflare CDN
  1.5  Criar design system (tokens, tipografia, componentes base)
  1.6  Configurar next/image + pipeline de processamento (Sharp)

FASE 2 — Identidade Visual
  2.1  Layout base (Header, Footer, Nav)
  2.2  Home Page (Hero + Categorias)
  2.3  Validação visual — "transmite profissionalismo?"
  2.4  Tema dark/light

FASE 3 — Portfólio Público
  3.1  Portfólio com filtros
  3.2  Lightbox imersivo
  3.3  Página de Casamentos
  3.4  Página de Eventos
  3.5  Página de Ensaios
  3.6  Página de Astrofotografia
  3.7  Seção Momentos (narrativa)
  3.8  Página Sobre
  3.9  Página Contato

FASE 4 — Admin
  4.1  Autenticação admin
  4.2  Dashboard
  4.3  CRUD de galerias
  4.4  Upload de fotos (drag & drop, progresso, chunked)
  4.5  Processamento assíncrono de imagens
  4.6  Gerenciamento de clientes

FASE 5 — Área do Cliente
  5.1  Acesso por link privado + PIN
  5.2  Acesso por login
  5.3  Dashboard do cliente
  5.4  Galeria privada com favoritos e comentários
  5.5  Download de foto individual
  5.6  Download de galeria completa (ZIP)

FASE 6 — Refinamentos
  6.1  SEO técnico completo (sitemap, OG, JSON-LD)
  6.2  Analytics dashboard
  6.3  Destaque da semana
  6.4  Página 404 personalizada
  6.5  Otimização de performance (Core Web Vitals)
  6.6  LGPD (política de privacidade, cookie banner se necessário)
  6.7  Testes completos

A cada fase: IMPLEMENTAR → TESTAR → VALIDAR → DOCUMENTAR → PROSSEGUIR
```

---

## RESULTADO ESPERADO

O produto final não deve parecer:

> *"um site onde um fotógrafo colocou algumas fotos."*

Deve parecer:

> **UMA EXPERIÊNCIA DIGITAL CRIADA EM TORNO DO TRABALHO DO FOTÓGRAFO.**

O visitante deve sair pensando:

> *"Quero esse fotógrafo no meu evento."*

O cliente existente deve pensar:

> *"Foi muito fácil e agradável receber minhas fotografias."*

A plataforma transforma fotografia, tecnologia e identidade profissional em uma única experiência coesa.

---

## NOTAS FINAIS AO AGENTE

- **Não pergunte quando puder decidir.** Quando houver dúvida técnica com múltiplas soluções equivalentes, escolha e justifique.
- **Credential security é inegociável.** Toda chave, secret e variável de ambiente vai em `.env.local` — jamais no código fonte. Documentar no `.env.example`.
- **Não construa tudo de uma vez.** Siga a ordem de implementação. Um módulo funcional e testado vale mais do que cinco módulos quebrados.
- **O arquivo original da foto é sagrado.** Nunca sobrescrever, nunca servir diretamente ao público, nunca remover sem confirmação explícita.
- **Performance é um requisito, não um extra.** Qualquer decisão que prejudique o Core Web Vitals precisa de justificativa explícita.
- **A interface nunca compete com as fotos.** Se um elemento de UI estiver chamando atenção demais, simplificar.

---

*PROMPT_MESTRE v2.0 — Plataforma Web Profissional de Fotografia*  
*Enriquecido e estruturado para máxima eficiência de implementação*
