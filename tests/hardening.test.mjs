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

test('ativos editoriais existem e imagens do equipamento saíram da pasta pública', async () => {
  await Promise.all([
    access('public/editorial/casamento-hero.webp'),
    access('public/editorial/evento.webp'),
    access('public/editorial/ensaio.webp'),
    access('public/editorial/astrofotografia.webp'),
  ]);
  await assert.rejects(access('public/demo/01.webp'));
});

test('lightbox restaura foco e impede rolagem ao abrir', async () => {
  const source = await readFile('components/lightbox/Lightbox.tsx', 'utf8');
  assert.match(source, /previousFocus/);
  assert.match(source, /document\.body\.style\.overflow = 'hidden'/);
  assert.match(source, /event\.key === 'Tab'/);
});
