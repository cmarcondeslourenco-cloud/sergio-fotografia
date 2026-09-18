import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { NextResponse } from 'next/server';
import { readSmallJson } from '@/lib/http';
import { attachmentHeader, originalZip } from '@/lib/storage/archive.mjs';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const tokenPattern = /^[a-zA-Z0-9_-]{16,128}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > 32_000) return NextResponse.json({ error: 'Requisição muito grande.' }, { status: 413 });

  const body = await readSmallJson(request) as { token?: unknown; photoIds?: unknown } | null;
  if (!body || typeof body.token !== 'string' || !tokenPattern.test(body.token)) {
    return NextResponse.json({ error: 'Código de acesso inválido.' }, { status: 400 });
  }
  if (body.photoIds !== undefined && !Array.isArray(body.photoIds)) {
    return NextResponse.json({ error: 'Seleção de fotos inválida.' }, { status: 400 });
  }

  const requestedIds = body.photoIds as unknown[] | undefined;
  if (requestedIds && (requestedIds.length === 0 || requestedIds.length > 200)) {
    return NextResponse.json({ error: 'Selecione entre 1 e 200 fotos.' }, { status: 400 });
  }

  const photoIds = requestedIds
    ? Array.from(new Set(requestedIds.filter((id): id is string => typeof id === 'string' && uuidPattern.test(id))))
    : undefined;
  if (requestedIds && photoIds?.length !== requestedIds.length) {
    return NextResponse.json({ error: 'A seleção contém identificadores inválidos ou repetidos.' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: 'Serviço de galeria indisponível.' }, { status: 503 });

  const { data: access, error: accessError } = await admin
    .from('gallery_access')
    .select('gallery_id,expires_at')
    .eq('token', body.token)
    .maybeSingle();
  if (accessError) return NextResponse.json({ error: 'Não foi possível validar o acesso.' }, { status: 502 });
  if (!access || (access.expires_at && new Date(access.expires_at) <= new Date())) {
    return NextResponse.json({ error: 'Acesso expirado ou inválido.' }, { status: 403 });
  }

  const { data: gallery, error: galleryError } = await admin
    .from('galleries')
    .select('*')
    .eq('id', access.gallery_id)
    .single();
  if (galleryError || !gallery) return NextResponse.json({ error: 'Galeria não encontrada.' }, { status: 404 });
  if (gallery.active === false || !gallery.download_enabled) return NextResponse.json({ error: 'Downloads não estão habilitados para esta galeria.' }, { status: 403 });
  if (!['full', 'both'].includes(gallery.download_resolution)) {
    return NextResponse.json({ error: 'Esta galeria não permite download em alta resolução.' }, { status: 403 });
  }

  const photos: { id: string; filename: string; storage_path: string }[] = [];
  for (let offset = 0; ; offset += 200) {
  let query = admin
    .from('photos')
    .select('id,filename,storage_path')
    .eq('gallery_id', gallery.id)
    .eq('published', true)
    .eq('processing_status', 'done')
    .order('sort_order').order('id')
    .range(offset, offset + 199);
  if (photoIds) query = query.in('id', photoIds);

  const { data: batch, error: photosError } = await query;
  if (photosError) return NextResponse.json({ error: 'Não foi possível consultar as fotografias.' }, { status: 502 });
  photos.push(...(batch ?? []));
  if (photoIds || !batch || batch.length < 200) break;
  }
  if (!photos?.length) return NextResponse.json({ error: 'Nenhuma foto disponível.' }, { status: 404 });
  if (photoIds && photos.length !== photoIds.length) {
    return NextResponse.json({ error: 'Uma ou mais fotos não pertencem a esta galeria.' }, { status: 404 });
  }

  async function openOriginal(photo: { storage_path: string }) {
    const signed = await admin!.storage.from('photos-private').createSignedUrl(photo.storage_path, 300);
    if (signed.error || !signed.data) throw new Error('Original indisponível.');
    const file = await fetch(signed.data.signedUrl, { signal: request.signal, cache: 'no-store' });
    if (!file.ok || !file.body) throw new Error('Original indisponível.');
    return Readable.fromWeb(file.body as import('node:stream/web').ReadableStream);
  }

  const sessionTokenHash = createHash('sha256').update(body.token).digest('hex');
  const { error: logError } = await admin.from('downloads').insert(photos.map((photo) => ({
    gallery_id: gallery.id,
    photo_id: photo.id,
    session_token: sessionTokenHash,
    resolution: 'full',
  })));
  if (logError) console.error('Falha ao registrar download', { code: logError.code });

  const commonHeaders = {
    'Cache-Control': 'private, no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff',
  };

  if (photos.length === 1) {
    const photo = photos[0];
    let stream;
    try { stream = await openOriginal(photo); } catch { return NextResponse.json({ error: 'Original indisponível.' }, { status: 502 }); }
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      status: 200,
      headers: {
        ...commonHeaders,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': attachmentHeader(photo.filename),
      },
    });
  }

  return new Response(originalZip(photos, openOriginal, request.signal) as ReadableStream, {
    status: 200,
    headers: {
      ...commonHeaders,
      'Content-Type': 'application/zip',
      'Content-Disposition': attachmentHeader(`${gallery.title}.zip`),
    },
  });
}
