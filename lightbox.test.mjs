import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('lightbox possui contratos básicos de acessibilidade e teclado', async () => { const source = await readFile('components/lightbox/Lightbox.tsx', 'utf8'); assert.match(source, /role="dialog"/); assert.match(source, /aria-modal="true"/); assert.match(source, /Escape/); assert.match(source, /ArrowLeft/); assert.match(source, /ArrowRight/); });
