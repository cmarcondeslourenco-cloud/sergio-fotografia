import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFile } from 'node:fs/promises';
const source = ts.transpileModule(await readFile('lib/pix.ts','utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { pixPayload } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
test('Pix: BRL amount, merchant fields and independently verified CRC', () => {
  const payload = pixPayload({key:'teste@example.com',name:'Sérgio',city:'São Paulo'},1234,'abc-123');
  assert.ok(payload.includes('540512.34'));
  assert.ok(payload.includes('5906SERGIO'));
  assert.ok(payload.includes('6009SAO PAULO'));
  assert.ok(payload.includes('br.gov.bcb.pix'));
  let remainder = 0xffff;
  for (const byte of Buffer.from(payload.slice(0,-4))) {
    for (let shift=7;shift>=0;shift--) {
      const xor = ((remainder >> 15) & 1) ^ ((byte >> shift) & 1);
      remainder = (remainder << 1) & 65535;
      if (xor) remainder ^= 0x1021;
    }
  }
  assert.equal(payload.slice(-4),remainder.toString(16).toUpperCase().padStart(4,'0'));
  assert.throws(() => pixPayload({key:'x',name:'x',city:'x'},0,'x'));
});
