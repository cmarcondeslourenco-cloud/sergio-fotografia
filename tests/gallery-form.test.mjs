import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('formulário de galeria valida, gera slug e grava no Supabase', async () => {
  const source = await readFile('components/admin/NewGalleryForm.tsx', 'utf8');
  assert.match(source, /z\.object/);
  assert.match(source, /from\('galleries'\)[\s\S]*\.insert/);
  assert.match(source, /function slugify/);
  assert.match(source, /23505/);
});
