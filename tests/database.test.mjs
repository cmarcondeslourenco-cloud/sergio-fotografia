import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('migration: RLS, tokens, favorites, atomic orders and ownership boundaries', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create schema storage; create table storage.buckets(id text primary key,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema public,auth to anon,authenticated,service_role;
      -- pgcrypto is not bundled in WASM. Only this test substitutes the random-byte source.
      create function public.gen_random_bytes(n int) returns bytea language sql as $$ select decode(repeat(replace(gen_random_uuid()::text,'-',''),8),'hex') $$;`);
    const initial = (await readFile('supabase/migrations/0001_initial_schema.sql', 'utf8')).replace('create extension if not exists pgcrypto;', '');
    await db.exec(initial);
    await db.exec(await readFile('supabase/migrations/0002_admin_policies.sql','utf8'));
    await db.exec(`grant all on all tables in schema public to service_role,authenticated,anon;`);
    await db.exec(await readFile('supabase/migrations/20260918072335_finalize_delivery_and_sales.sql','utf8'));
    const g1 = '11111111-1111-4111-8111-111111111111';
    const g2 = '22222222-2222-4222-8222-222222222222';
    const p1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const p2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    await db.query(`insert into galleries(id,slug,title,visibility,published_at) values($1,'one','One','private',now()),($2,'two','Two','public',now())`,[g1,g2]);
    await db.query(`insert into photos(id,gallery_id,filename,storage_path,path_preview,processing_status,price_cents) values($1,$2,'a.jpg','private/a.jpg','preview/a.webp','done',1234),($3,$4,'b.jpg','private/b.jpg','preview/b.webp','done',2500)`,[p1,g1,p2,g2]);
    const token = (await db.query('select token from gallery_access where gallery_id=$1',[g1])).rows[0].token;
    assert.ok(token.length >= 48);
    await db.query('select save_client_selection($1,$2,$3,true)',[token,[p1],'Cliente teste']);
    assert.equal((await db.query('select count(*)::int as n from favorites')).rows[0].n,1);
    assert.equal((await db.query('select count(*)::int as n from gallery_selections')).rows[0].n,1);
    await assert.rejects(db.query('select save_client_selection($1,$2,$3,true)',[token,[p2],'Cliente teste']), /Invalid selection/);
    assert.equal((await db.query('select count(*)::int as n from favorites')).rows[0].n,1);
    await db.query('update gallery_access set expires_at=now()-interval \'1 second\' where token=$1',[token]);
    await assert.rejects(db.query('select save_client_selection($1,$2,$3,true)',[token,[p1],'Cliente teste']), /Invalid access/);
    const newToken = (await db.query('select rotate_gallery_access($1,null,true) as token',[g1])).rows[0].token;
    assert.notEqual(newToken,token);
    assert.equal((await db.query('select count(*)::int as n from gallery_access where token=$1',[token])).rows[0].n,0);
    await db.query('update galleries set active=false where id=$1',[g1]);
    await assert.rejects(db.query('select save_client_selection($1,$2,$3,true)',[newToken,[p1],'Cliente teste']), /Unavailable gallery/);
    const pix = {key:'test@example.com',name:'TESTE',city:'SAO PAULO'};
    await assert.rejects(db.query('select create_photo_order($1,$2,$3)', ['hash-private',[p1],pix]), /Unavailable photo/);
    const order = (await db.query('select * from create_photo_order($1,$2,$3)', ['hash-public',[p2],pix])).rows[0];
    assert.equal(order.status,'pending'); assert.equal(order.total_cents,2500);
    const retried = (await db.query('select * from create_photo_order($1,$2,$3)', ['hash-public',[p2],pix])).rows[0];
    assert.equal(retried.id,order.id);
    await assert.rejects(db.query('delete from photos where id=$1',[p2]), /foreign key/);
    await db.exec('set role anon');
    await assert.rejects(db.query('select * from photo_orders'), /permission denied/);
    await assert.rejects(db.query('select * from gallery_selections'), /permission denied/);
    await assert.rejects(db.query('select create_photo_order($1,$2,$3)', ['forbidden',[p2],pix]), /permission denied/);
    assert.equal((await db.query('select count(*)::int as n from gallery_access')).rows[0].n,0);
    await db.exec('reset role; set role authenticated');
    await assert.rejects(db.query("insert into profiles(id,role) values(gen_random_uuid(),'admin')"), /permission denied/);
    assert.equal((await db.query('select count(*)::int as n from photo_orders')).rows[0].n,0);
  } finally { await db.close(); }
});
