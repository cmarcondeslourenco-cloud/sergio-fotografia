import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { originalZip, safeFilename } from '../lib/storage/archive.mjs';
test('ZIP preserva bytes e nomes e transmite acima do tamanho do buffer', async () => {
  const bytes = Buffer.alloc(1024 * 1024, 65);
  const stream = originalZip([{ id: 'a', filename: 'original.jpg' }, { id: 'b', filename: 'outra.png' }], async () => Readable.from([bytes]));
  const result = Buffer.from(await new Response(stream).arrayBuffer());
  assert.equal(result.readUInt32LE(), 0x04034b50);
  assert.ok(result.includes(Buffer.from('original.jpg')));
  assert.ok(result.includes(Buffer.from('outra.png')));
  assert.ok(result.includes(bytes));
  assert.ok(result.length > bytes.length * 2);
});
test('ZIP falha quando um original falta', async () => {
  const stream = originalZip([{ id: 'a', filename: 'a.jpg' }], async () => { throw new Error('missing'); });
  await assert.rejects(new Response(stream).arrayBuffer(), /missing/);
});
test('nome não permite caminhos ou injeção de cabeçalhos', () => {
  assert.equal(safeFilename('../a\r\n.jpg'), '.._a__.jpg');
});
