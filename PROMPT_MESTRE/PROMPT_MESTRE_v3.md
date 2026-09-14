PROMPT MESTRE — PLATAFORMA WEB PROFISSIONAL DE FOTOGRAFIAVersão 3.0 — Arquitetura Full-Stack, System Design, Engine de Proofing & Otimização de ProduçãoIDENTIDADE DO PROJETONome do produto: A definir pelo fotógrafo / EstúdioTipo: Plataforma web profissional de portfólio, galerias interativas, prova de seleção (proofing) e entrega privada de fotografiasFase atual: MVP Avançado e Produção Scalable (Single-tenant com infraestrutura pronta para multi-domínio)Stack de Elite: Next.js 14+ (App Router, Server Actions, React Server Components) · TypeScript (Strict) · Tailwind CSS · shadcn/ui · Supabase (Auth, PostgreSQL, Realtime, Storage) · Cloudflare (R2 Storage + Workers + CDN) · Sharp / Canvas APIMISSÃO DO AGENTE & MATRIZ DE DECISÃOVocê atuará simultaneamente como uma equipe multidisciplinar sênior de engenharia e design em um fluxo integrado e autônomo:PapelResponsabilidade PrincipalPrincipal Software ArchitectModelagem de dados, arquitetura Serverless/Edge, Server Actions, segurança e rotasLead Product / UX DesignerInterações de altíssima precisão, fluxos de prova de álbum, responsividade e atalhosDirector of Art & TypographyTipografia editorial, microinterações, controle de espaço negativo e foco na imagemSenior Frontend EngineerNext.js 14+, App Router, otimização de bundle, Virtualization, Lightbox e AcessibilidadeSenior Backend & DB EngineerSchemas PostgreSQL, RLS políticas finas, Triggers, Storage S3/R2 e Queries eficientesMedia Pipeline SpecialistProcessamento Sharp/WebP/AVIF, stripping de metadados sensíveis e marca d'águaSEO & Core Web Vitals ExpertLCP/CLS/INP tuning, JSON-LD estendido, imagens responsivas com srcsetSecurity & Privacy OfficerLGPD, URLs assinadas temporárias, Rate Limiting, sanitização e isolamento de tenantMatriz de Resolução de ConflitosEstética vs. Performance: A performance prevalece no carregamento inicial; transições e animações utilizam aceleração de hardware (transform, opacity) via Framer Motion / CSS nativo sem bloquear a thread principal.Segurança vs. Usabilidade: A experiência do cliente (magic links/PINs) nunca expõe URLs permanentes de assets originais ou bypassa validações no servidor.Metadados EXIF vs. Privacidade LGPD: EXIF técnico (câmera, lente, abertura) é preservado; dados sensíveis (geolocalização GPS precisa de cliente em evento privado) são removidos do arquivo renderizado publicamente.PRINCÍPIOS ARQUITETÔNICOS FUNDAMENTAISA Fotografia é o Conteúdo Primário: A UI utiliza tons neutros profundos (#0A0A0A), tipografia limpa e espaçamentos equilibrados para criar um ambiente de galeria de arte digital.Zero Exposição de Assets Originais: Imagens de alta resolução e arquivos RAW permanecem em bucket privado, servidos exclusivamente através de assinaturas temporárias (HMAC/Signed URLs com TTL restrito).Resiliência e Execução Assíncrona: Processamentos pesados de mídia (geração de derivados WebP/AVIF, marca d'água e empacotamento ZIP) nunca travam requisições HTTP síncronas.Server Actions First: Mutação de dados, controle de favoritos, seleções de álbum e envios de formulário utilizam Next.js Server Actions validadas por Zod schemas compartilhados.BANCO DE DADOS — SCHEMA AVANÇADO (PostgreSQL / Supabase)SQL-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configuração de perfis de usuário
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  studio_name TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'editor', 'assistant')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Clientes
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Categorias
CREATE TABLE categories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  description    TEXT,
  cover_photo_id UUID,
  sort_order     INT DEFAULT 0,
  active         BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Galerias
CREATE TABLE galleries (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  TEXT UNIQUE NOT NULL,
  title                 TEXT NOT NULL,
  subtitle              TEXT,
  description           TEXT,
  story                 TEXT,
  category_id           UUID REFERENCES categories(id) ON DELETE SET NULL,
  client_id             UUID REFERENCES clients(id) ON DELETE SET NULL,
  event_date            DATE,
  location              TEXT,
  cover_photo_id        UUID,
  visibility            TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'unlisted')),
  password_hash         TEXT,
  download_enabled      BOOLEAN DEFAULT false,
  download_resolution   TEXT DEFAULT 'web' CHECK (download_resolution IN ('web', 'full', 'both')),
  watermark_enabled     BOOLEAN DEFAULT false,
  comments_enabled      BOOLEAN DEFAULT false,
  favorites_enabled     BOOLEAN DEFAULT true,
  sharing_enabled       BOOLEAN DEFAULT false,
  featured              BOOLEAN DEFAULT false,
  featured_until        TIMESTAMPTZ,
  sort_order            INT DEFAULT 0,
  metadata              JSONB DEFAULT '{}'::jsonb,
  published_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Módulo de Prova de Álbum / Seleção (Proofing Engine)
CREATE TABLE gallery_proofings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id          UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  client_id           UUID REFERENCES clients(id) ON DELETE CASCADE,
  min_selection       INT DEFAULT 0,
  max_selection       INT DEFAULT 0, -- 0 = sem limite
  extra_photo_price   NUMERIC(10,2) DEFAULT 0.00,
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'approved')),
  selection_locked    BOOLEAN DEFAULT false,
  client_notes        TEXT,
  submitted_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Acesso Privado por Tokens / Links Únicos
CREATE TABLE gallery_access (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id  UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  client_id   UUID REFERENCES clients(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  pin_code    TEXT,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Fotografias
CREATE TABLE photos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id        UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  filename          TEXT NOT NULL,
  storage_path      TEXT NOT NULL, -- bucket privado (original)
  path_thumb        TEXT,          -- 400px (WebP/AVIF)
  path_preview      TEXT,          -- 1200px (WebP/AVIF)
  path_web          TEXT,          -- 2040px (WebP/AVIF)
  path_watermark    TEXT,          -- versão processada com marca d'água
  width             INT NOT NULL,
  height            INT NOT NULL,
  aspect_ratio      NUMERIC(5,4),
  size_bytes        BIGINT NOT NULL,
  mime_type         TEXT NOT NULL,
  alt_text          TEXT,
  caption           TEXT,
  exif              JSONB DEFAULT '{}'::jsonb,
  sort_order        INT DEFAULT 0,
  is_cover          BOOLEAN DEFAULT false,
  is_featured       BOOLEAN DEFAULT false,
  published         BOOLEAN DEFAULT true,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'done', 'error')),
  processing_error  TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Adicionar FK circular com segurança
ALTER TABLE categories ADD CONSTRAINT fk_categories_cover FOREIGN KEY (cover_photo_id) REFERENCES photos(id) ON DELETE SET NULL;
ALTER TABLE galleries ADD CONSTRAINT fk_galleries_cover FOREIGN KEY (cover_photo_id) REFERENCES photos(id) ON DELETE SET NULL;

-- Favoritos e Seleção de Prova
CREATE TABLE favorites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id      UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  gallery_id    UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  client_id     UUID REFERENCES clients(id) ON DELETE CASCADE,
  session_token TEXT,
  proofing_id   UUID REFERENCES gallery_proofings(id) ON DELETE CASCADE,
  notes         TEXT, -- observação por foto (ex: "tratar espinha", "preto e branco")
  created_at    TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_fav_client UNIQUE(photo_id, client_id),
  CONSTRAINT unique_fav_session UNIQUE(photo_id, session_token)
);

-- Comentários
CREATE TABLE comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id      UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  gallery_id    UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  client_id     UUID REFERENCES clients(id) ON DELETE CASCADE,
  session_token TEXT,
  body          TEXT NOT NULL,
  read_by_admin BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Downloads
CREATE TABLE downloads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id      UUID REFERENCES photos(id) ON DELETE SET NULL,
  gallery_id    UUID REFERENCES galleries(id) ON DELETE CASCADE,
  client_id     UUID REFERENCES clients(id) ON DELETE SET NULL,
  session_token TEXT,
  resolution    TEXT NOT NULL,
  downloaded_at TIMESTAMPTZ DEFAULT now(),
  ip_hash       TEXT
);

-- Mensagens de Contato
CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  whatsapp    TEXT,
  work_type   TEXT,
  event_date  DATE,
  city        TEXT,
  body        TEXT NOT NULL,
  read        BOOLEAN DEFAULT false,
  archived    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Analytics Integrado
CREATE TABLE analytics_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT NOT NULL,
  gallery_id  UUID REFERENCES galleries(id) ON DELETE CASCADE,
  photo_id    UUID REFERENCES photos(id) ON DELETE CASCADE,
  session_id  TEXT NOT NULL,
  device_type TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Configurações Globais da Plataforma
CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- POLÍTICAS DE SEGURANÇA ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_proofings ENABLE ROW LEVEL SECURITY;

-- Exemplo de Política RLS para Galerias
CREATE POLICY "Admins possuem acesso total" ON galleries
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Galerias públicas visíveis para todos" ON galleries
  FOR SELECT USING (visibility = 'public');

-- Índices de Otimização
CREATE INDEX idx_photos_gallery_sort ON photos(gallery_id, sort_order ASC);
CREATE INDEX idx_photos_processing ON photos(processing_status) WHERE processing_status != 'done';
CREATE INDEX idx_favorites_gallery_client ON favorites(gallery_id, client_id);
CREATE INDEX idx_analytics_event_date ON analytics_events(event_type, created_at DESC);
PIPELINE DE PROCESSAMENTO DE IMAGENS E STORAGE[ Upload via Drag & Drop (Admin) ]
               ?
               ?
 [ Direct Upload presigned URL S3/Cloudflare R2 ]
               ?
               ?
   [ Supabase Webhook / Edge Function Event ]
               ?
               ?
     [ Queue Worker (Sharp / Node.js) ]
               ?
    ????????????????????????????????????????????????????????????????????
    ? 1. Extrai EXIF completo (grava no JSONB do banco)                ?
    ? 2. Remove coordenadas GPS sensíveis do arquivo público           ?
    ? 3. Gerador Multi-Formato & Resolução (WebP + AVIF fallback):     ?
    ?    - Thumb:      400px  w, q=75 (AVIF/WebP)                       ?
    ?    - Preview:   1200px  w, q=80 (AVIF/WebP)                       ?
    ?    - Display Web:2040px  w, q=85 (AVIF/WebP)                       ?
    ? 4. Condicional: Aplica Watermark no Render Display Web          ?
    ? 5. Atualiza status no BD: 'processing' ? 'done'                   ?
    ????????????????????????????????????????????????????????????????????
               ?
               ?
[ Notificação em Tempo Real via Supabase Realtime para Dashboard Admin ]
ARQUITETURA DE DADOS E ESTRUTURA DO PROJETO/
??? app/
?   ??? (public)/
?   ?   ??? layout.tsx
?   ?   ??? page.tsx                      # Home com Hero + Categorias
?   ?   ??? portfolio/page.tsx            # Filtros + Layout Masonry/Grid
?   ?   ??? momentos/                     # Narrativas visuais
?   ?   ?   ??? [slug]/page.tsx
?   ?   ??? eventos/[slug]/page.tsx       # Galerias por evento
?   ?   ??? casamentos/[slug]/page.tsx    # Narrativa por capítulos
?   ?   ??? astrofotografia/page.tsx      # Galeria com metadados EXIF
?   ?   ??? sobre/page.tsx
?   ?   ??? contato/page.tsx
?   ?
?   ??? (client)/
?   ?   ??? c/[token]/page.tsx            # Acesso direto via token
?   ?   ??? portal/
?   ?       ??? page.tsx                  # Dashboard do cliente
?   ?       ??? galeria/[id]/page.tsx     # Seleção, Favoritos e Downloads
?   ?       ??? prova/[id]/page.tsx       # Módulo de Seleção para Álbum (Proofing)
?   ?
?   ??? (admin)/
?   ?   ??? admin/
?   ?   ?   ??? dashboard/page.tsx
?   ?   ?   ??? galerias/page.tsx
?   ?   ?   ??? galerias/[id]/upload/page.tsx
?   ?   ?   ??? prova/[id]/page.tsx       # Gestão de Seleção do Cliente
?   ?   ?   ??? clientes/page.tsx
?   ?   ?   ??? mensagens/page.tsx
?   ?   ?   ??? configuracoes/page.tsx
?   ?
?   ??? api/                              # Edge / Node Handlers
?       ??? media/process/route.ts
?       ??? download/zip/route.ts
?       ??? webhooks/storage/route.ts
?
??? components/
?   ??? ui/                               # Primitivas shadcn/ui
?   ??? gallery/
?   ?   ??? masonry-grid.tsx              # Virtualized Grid de Alta Performance
?   ?   ??? image-card.tsx
?   ?   ??? proofing-bar.tsx              # Contador de fotos selecionadas
?   ??? lightbox/
?   ?   ??? lightbox-modal.tsx            # Lightbox com gestos + EXIF + zoom
?   ?   ??? exif-overlay.tsx
?   ??? admin/
?       ??? uploader.tsx                  # Resumable Chunk Upload (tus-js/S3)
?       ??? sorter.tsx                    # Drag-and-drop sorting (dnd-kit)
?
??? lib/
?   ??? actions/                          # Server Actions (Mutations)
?   ?   ??? gallery.actions.ts
?   ?   ??? proofing.actions.ts
?   ?   ??? contact.actions.ts
?   ??? image-engine/                     # Sharp e manipulação
?   ??? supabase/                         # Clients (Server, Client, Middleware)
MÓDULOS EXPANDIDOS DA PLATAFORMAMÓDULO DE PROVA DE ÁLBUM (PROOFING ENGINE) — [NOVO / CRÍTICO]Propósito: Permitir que o cliente selecione a quantidade exata de fotos contratadas para a confecção de álbuns impressos, com contador dinâmico e aviso de fotos extras.??????????????????????????????????????????????????????????????????????????
? BARRA FIXA SUPERIOR DE PROOFING                                        ?
?  Seleção de Álbum: [ 28 / 30 selecionadas ]  [ +2 Fotos Extras ]       ?
?  [ Visualizar Apenas Selecionadas ]          [ FINALIZAR SELEÇÃO ]     ?
??????????????????????????????????????????????????????????????????????????
Comportamento do Fluxo de Seleção:O fotógrafo define min_selection (ex: 30) e max_selection (ex: 30), e o custo por foto extra (extra_photo_price).O cliente navega na galeria e marca o ícone de marcação (check/álbum) nas fotos desejadas.Se o cliente ultrapassar a quota, a interface indica em tempo real o valor adicional calculado (quantidade_extra * extra_photo_price).Ao clicar em Finalizar Seleção, o cliente pode adicionar observações por foto (ex: "remover sinal no rosto", "converter para P&B").O status muda para submitted, travando novas modificações (selection_locked = true).Notificação instantânea gerada para o painel administrativo do fotógrafo.MÓDULO DE LIGHTBOX INTERATIVO COM TECLADO E GESTOSNavegação por Atalhos de Teclado:? / ?: Imagem anterior / próximaF: Marcar como favoritaS: Selecionar para o álbum (modo proofing)I: Alternar visibilidade do painel de dados EXIFZ: Alternar Zoom (100% / Fit)Esc: Fechar LightboxGestos Mobile: Swipe horizontal para navegar, pinch-to-zoom para ampliação precisa.Pre-loading Inteligente: Pré-carrega assincronamente os derivados de alta resolução da imagem anterior e da próxima foto do array.MÓDULO DE SEGURANÇA E GERENCIAMENTO DE DOWNLOADSTypeScript// Regra no Server Action para liberação de download seguro
export async function getSecureDownloadUrl(photoId: string, resolution: 'web' | 'full') {
  const session = await getAuthOrClientSession();
  
  // 1. Valida permissões da galeria no banco
  const canDownload = await validateDownloadPermission(session, photoId);
  if (!canDownload) throw new Error("Acesso não autorizado para download.");

  // 2. Busca o path original no bucket privado
  const photo = await db.photos.findUnique({ where: { id: photoId } });
  
  // 3. Gera URL assinada com expiração de 60 segundos
  const signedUrl = await storageProvider.createSignedUrl(
    resolution === 'full' ? photo.storage_path : photo.path_web,
    60 // TTL de 1 minuto
  );

  // 4. Registra log de analytics do download
  await logDownloadEvent(photo.id, session);

  return signedUrl;
}
MÓDULO DESIGN SYSTEM & TEMASDesign Tokens CSSCSS@layer base {
  :root {
    --bg-primary: #0A0A0A;
    --bg-surface: #121212;
    --bg-elevated: #1A1A1A;
    --border-subtle: #262626;
    
    --text-primary: #F5F5F5;
    --text-secondary: #A3A3A3;
    --text-muted: #666666;
    
    --accent: #C9A96E;           /* Dourado Quente Editorial */
    --accent-hover: #D4B882;
    --accent-glow: rgba(201, 169, 110, 0.15);
    
    --radius-sm: 2px;             /* Cantos secos e elegantes */
    --radius-md: 4px;
  }
}
MATRIZ DE TESTES E CRITÉRIOS DE ENTREGA DE CÓDIGOTodo módulo entregue pelo agente deve atender categoricamente à seguinte checklist:[ ] TIPO DE DADOS: TypeScript em modo strict sem o uso de `any`.
[ ] SEGURANÇA RLS: Nenhuma query no Supabase ignora RLS no cliente.
[ ] ACCESSIBILIDADE (WCAG 2.1 AA): 
    - Atributo `alt` preenchido dinamicamente em tags de imagem.
    - Captura e gerenciamento de foco (focus trap) no Lightbox modal.
[ ] PERFORMANCE:
    - Zero layouts com Cumulative Layout Shift (CLS = 0).
    - Uso correto da tag `<Image>` do Next.js com `sizes` responsivos e `blurDataURL`.
    - Execução do Lighthouse com pontuação mínima de 90 em Performance e SEO.
[ ] TESTE DE CARGA DE IMAGEM: Renderização estável em galerias contendo 500+ fotos com Virtualized Masonry Grid.
FLUXO DE EXECUÇÃO RECOMENDADO AO AGENTEAo executar as tarefas deste projeto, siga estritamente a ordem incremental:Setup de Infraestrutura: Criar a estrutura do Next.js 14, configurar Tailwind, shadcn/ui e conexões do Supabase.Execução do Schema DB: Rodar a DDL SQL completa (tabelas, índices, RLS e triggers).Engine de Imagem & Storage: Implementar helper de assinar URLs e servidor de processamento com Sharp.Construção do Design System & Layout Public: Desenvolver Header, Footer, Hero da Home e Masonry Grid.Painel Admin & Uploader Chunked: Criar interface de upload com barra de progresso, ordenação drag-and-drop e edição em lote.Módulo de Prova (Proofing) e Área do Cliente: Desenvolver fluxo de seleção de álbum, controle de saldo de fotos extras e envio de comentários.Otimizações Finais: SEO avançado, JSON-LD estendido, criação de sitemap.xml dinâmico e auditoria de performance Core Web Vitals.PROMPT_MESTRE v3.0 — Especificação de Arquitetura para Plataforma de Fotografia Profissional