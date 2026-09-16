import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

test('SEO usa a URL configurável e não publica localhost antigo', async () => {
  const robots = await readFile('app/robots.ts', 'utf8');
  const sitemap = await readFile('app/sitemap.ts', 'utf8');
  assert.match(robots, /getSiteUrl/);
  assert.match(sitemap, /getSiteUrl/);
  assert.doesNotMatch(`${robots}\n${sitemap}`, /localhost:3001/);
});

test('download valida seleção e não registra token privado em texto puro', async () => {
  const route = await readFile('app/api/client-download/route.ts', 'utf8');
  assert.match(route, /createHash\('sha256'\)/);
  assert.match(route, /requestedIds\.length === 0/);
  assert.match(route, /photos\.length !== photoIds\.length/);
  assert.doesNotMatch(route, /session_token:\s*body\.token/);
});

test('contato possui validação, honeypot e limite de envio', async () => {
  const schema = await readFile('lib/contact/schema.ts', 'utf8');
  const route = await readFile('app/api/contact/route.ts', 'utf8');
  assert.match(schema, /company/);
  assert.match(route, /MAX_REQUESTS = 3/);
  assert.match(route, /contactSchema\.safeParse/);
});

test('acesso de galeria permite regenerar e revogar sem expor chaves', async () => {
  const route = await readFile('app/api/admin/gallery-access/route.ts', 'utf8');
  const settings = await readFile('components/admin/GalleryDeliverySettings.tsx', 'utf8');
  assert.match(route, /action === 'revoke'/);
  assert.match(route, /action === 'regenerate'/);
  assert.match(route, /gallery_access.*delete/s);
  assert.match(settings, /navigator\.clipboard\.writeText/);
  assert.doesNotMatch(route, /SUPABASE_SERVICE_ROLE_KEY/);
});

test('Home concentra os CTAs e os filtros do portfólio', async () => {
  const home = await readFile('app/page.tsx', 'utf8');
  const portfolio = await readFile('app/portfolio/page.tsx', 'utf8');
  assert.match(home, /href="\/contato"/);
  assert.match(home, /href="\/cliente"/);
  assert.match(home, /Todos/);
  assert.match(home, /Casamentos/);
  assert.match(home, /Ensaios/);
  assert.match(home, /Eventos/);
  assert.match(portfolio, /redirect\('\/#portfolio'\)/);
});

test('ativos editoriais existem e imagens do equipamento saíram da pasta pública', async () => {
  await Promise.all([
    access('public/editorial/casamento-hero.webp'),
    access('public/editorial/evento.webp'),
    access('public/editorial/ensaio.webp'),
    access('public/editorial/astrofotografia.webp'),
  ]);
  await assert.rejects(access('public/demo/01.webp'));
});

test('home e categorias usam a mesma fonte de galerias publicas', async () => {
  const home = await readFile('app/page.tsx', 'utf8');
  const landing = await readFile('components/gallery/CategoryLanding.tsx', 'utf8');
  const gallery = await readFile('components/gallery/PortfolioGallery.tsx', 'utf8');

  assert.match(home, /portfolioGalleries/);
  assert.match(home, /<PortfolioGallery slug={slug}/);
  assert.doesNotMatch(home, /demoPhotos/);
  assert.match(home, /href=\{`\/\$\{slug\}`\}/);
  assert.match(landing, /<PortfolioGallery slug={slug} showAllPhotos/);
  assert.doesNotMatch(landing, /DemoGallery|demoPhotos/);
  assert.match(gallery, /\.eq\('published', true\)/);
  assert.match(gallery, /noStore\(\)/);
});

test('lightbox restaura foco e impede rolagem ao abrir', async () => {
  const source = await readFile('components/lightbox/Lightbox.tsx', 'utf8');
  assert.match(source, /previousFocus/);
  assert.match(source, /document\.body\.style\.overflow = 'hidden'/);
  assert.match(source, /event\.key === 'Tab'/);
});
