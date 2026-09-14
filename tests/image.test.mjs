import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('pipeline mantém variantes e limite do prompt', async () => { const source = await readFile('lib/image/pipeline.ts', 'utf8'); assert.match(source, /thumbnail/); assert.match(source, /watermark/); assert.match(source, /withoutEnlargement/); const validation = await readFile('lib/image/validation.ts', 'utf8'); assert.match(validation, /150 \* 1024 \* 1024/); });
