import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const moduleUrl = text => `data:text/javascript;base64,${Buffer.from(text).toString('base64')}`;
const compile = text => ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const httpUrl = moduleUrl(compile(await readFile('lib/http.ts','utf8')));
async function loadRoute(path) {
  let text = compile(await readFile(path,'utf8'));
  text = text.replace(/import \{ createSupabaseAdminClient \} from '[^']+';/, 'const createSupabaseAdminClient = () => globalThis.__routeTestAdmin;');
  text = text.replace(/from 'next\/server'/g, `from '${import.meta.resolve('next/server.js')}'`)
    .replace(/from 'zod'/g, `from '${import.meta.resolve('zod')}'`)
    .replace(/from '@\/lib\/http'/g, `from '${httpUrl}'`)
    .replace(/from '@\/lib\/storage\/archive.mjs'/g, `from '${new URL('../lib/storage/archive.mjs',import.meta.url).href}'`);
  return import(moduleUrl(text));
}
const clientRoute = await loadRoute('app/api/client-download/route.ts');
const orderRoute = await loadRoute('app/api/order-download/route.ts');
function database(tables) {
  let reads = 0;
  return {
    get reads() { return reads; },
    from(table) {
      let rows = [...(tables[table] ?? [])];
      const chain = {
        select() { return chain; }, eq(key,value) { rows=rows.filter(row=>row[key]===value);return chain; },
        in(key,values) { rows=rows.filter(row=>values.includes(row[key]));return chain; },
        order() { return chain; }, range(from,to) { rows=rows.slice(from,to+1);return chain; },
        limit(n) { rows=rows.slice(0,n);return chain; },
        single() { return Promise.resolve({data:rows[0] ?? null,error:null}); },
        maybeSingle() { return chain.single(); }, insert() { return Promise.resolve({error:null}); },
        then(resolve,reject) { return Promise.resolve({data:rows,error:null}).then(resolve,reject); },
      }; return chain;
    },
    storage: { from() { return { async createSignedUrl() { reads++;return {data:{signedUrl:'https://unit.invalid/original'},error:null}; } }; } },
  };
}
const token = 'a'.repeat(64);
const p1='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const p2='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const request = body => new Request('http://localhost/api/download',{method:'POST',body:JSON.stringify(body)});
test('private download blocks expired access, disabled gallery and foreign photo IDs before Storage',async()=>{
  for(const scenario of ['expired','disabled','foreign']) {
    const db=database({gallery_access:[{token,gallery_id:'g',expires_at:scenario==='expired'?'2000-01-01':null}],galleries:[{id:'g',title:'Test',active:true,download_enabled:scenario!=='disabled',download_resolution:'full'}],photos:[{id:p1,gallery_id:'g',filename:'a.jpg',storage_path:'a',published:true,processing_status:'done'}]});
    globalThis.__routeTestAdmin=db;
    const response=await clientRoute.POST(request({token,photoIds:[scenario==='foreign'?p2:p1]}));
    assert.ok([403,404].includes(response.status));assert.equal(db.reads,0);
  }
});
test('orders deny pending, expired, unknown and foreign-photo requests',async()=>{
  const { createHash }=await import('node:crypto');
  for(const scenario of ['pending','expired','unknown','foreign']) {
    const db=database({photo_orders:scenario==='unknown'?[]:[{id:'o',token_hash:createHash('sha256').update(token).digest('hex'),status:scenario==='pending'?'pending':'paid',expires_at:scenario==='expired'?'2000-01-01':'2099-01-01'}],photo_order_items:[{order_id:'o',photo_id:p1,filename:'original.jpg',storage_path:'private/original'}]});
    globalThis.__routeTestAdmin=db;
    const response=await orderRoute.POST(request({token,photoIds:[scenario==='foreign'?p2:p1]}));
    assert.equal(response.status,403);assert.equal(db.reads,0);
  }
});
test('full gallery ZIP includes more than 200 originals with byte preservation',async()=>{
  const photos=Array.from({length:201},(_,i)=>({id:`photo-${i}`,gallery_id:'g',filename:`original-${i}.jpg`,storage_path:`private/${i}`,published:true,processing_status:'done'}));
  const db=database({gallery_access:[{token,gallery_id:'g',expires_at:null}],galleries:[{id:'g',title:'Galeria',active:true,download_enabled:true,download_resolution:'full'}],photos});
  globalThis.__routeTestAdmin=db;
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async()=>new Response(new Uint8Array([255,216,255,217]));
  try {
    const response=await clientRoute.POST(request({token}));
    assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'application/zip');
    const bytes=Buffer.from(await response.arrayBuffer());
    assert.ok(bytes.includes(Buffer.from('original-200.jpg')));assert.equal(db.reads,201);
    assert.ok(bytes.includes(Buffer.from([255,216,255,217])));
  } finally {globalThis.fetch=originalFetch;}
});
test('body limits reject chunked oversized JSON and malformed requests',async()=>{
  const {readSmallJson}=await import(httpUrl);
  assert.equal(await readSmallJson(new Request('http://localhost',{method:'POST',body:'x'.repeat(33000)})),null);
  const response=await orderRoute.POST(new Request('http://localhost',{method:'POST',body:'{'}));
  assert.equal(response.status,400);
});
