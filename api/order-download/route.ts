import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readSmallJson } from '@/lib/http';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { originalZip, attachmentHeader } from '@/lib/storage/archive.mjs';
export const runtime = 'nodejs';
const schema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), photoIds: z.array(z.string().uuid()).min(1).max(100).optional() });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await readSmallJson(request));
  if (!parsed.success) return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: 'Serviço indisponível.' }, { status: 503 });
  const { data: order } = await admin.from('photo_orders').select('id,status,expires_at').eq('token_hash', createHash('sha256').update(parsed.data.token).digest('hex')).maybeSingle();
  if (!order || order.status !== 'paid' || new Date(order.expires_at) <= new Date()) return NextResponse.json({ error: 'Download não autorizado.' }, { status: 403 });
  const { data: items, error } = await admin.from('photo_order_items').select('photo_id,filename,storage_path').eq('order_id', order.id);
  if (error || !items?.length) return NextResponse.json({ error: 'Arquivos indisponíveis.' }, { status: 502 });
  const ids = parsed.data.photoIds;
  const photos = items.filter(item => !ids || ids.includes(item.photo_id)).map(item => ({ ...item, id: item.photo_id }));
  if (ids && photos.length !== ids.length) return NextResponse.json({ error: 'Seleção não pertence ao pedido.' }, { status: 403 });
  async function open(photo: { storage_path: string }) {
    const signed = await admin!.storage.from('photos-private').createSignedUrl(photo.storage_path, 300);
    if (!signed.data || signed.error) throw new Error('Original indisponível.');
    const response = await fetch(signed.data.signedUrl, { signal: request.signal, cache: 'no-store' });
    if (!response.ok || !response.body) throw new Error('Original indisponível.');
    return Readable.fromWeb(response.body as import('node:stream/web').ReadableStream);
  }
  const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Type': photos.length === 1 ? 'application/octet-stream' : 'application/zip', 'Content-Disposition': attachmentHeader(photos.length === 1 ? photos[0].filename : 'fotografias-originais.zip') };
  if (photos.length > 1) return new Response(originalZip(photos, open, request.signal) as ReadableStream, { headers });
  try { return new Response(Readable.toWeb(await open(photos[0])) as ReadableStream, { headers }); }
  catch { return NextResponse.json({ error: 'Original indisponível.' }, { status: 502 }); }
}
