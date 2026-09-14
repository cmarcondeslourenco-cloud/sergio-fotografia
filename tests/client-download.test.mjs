import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('download do cliente preserva o original e protege o lote', async () => {
  const route = await readFile('app/api/client-download/route.ts', 'utf8');
  const gallery = await readFile('app/c/[token]/page.tsx', 'utf8');
  assert.match(route, /storage_path/);
  assert.match(route, /download_enabled/);
  assert.match(route, /download_resolution/);
  assert.match(route, /gallery_id/);
  assert.match(route, /session_token/);
  assert.match(route, /level: 0/);
  assert.match(route, /new Uint8Array/);
  assert.doesNotMatch(gallery, /createSignedUrl\(photo\.storage_path/);
});
