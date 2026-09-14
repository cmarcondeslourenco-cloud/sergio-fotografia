import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('fundação contém configuração sem secrets', async () => { const env = await readFile('.env.example', 'utf8'); assert.match(env, /NEXT_PUBLIC_SUPABASE_URL=/); assert.match(env, /SUPABASE_SERVICE_ROLE_KEY=/); assert.ok(!env.includes('eyJ')); });
test('home e portfolio existem', async () => { await readFile('app/page.tsx'); await readFile('app/portfolio/page.tsx'); });
