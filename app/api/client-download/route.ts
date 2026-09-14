import { createHash } from 'node:crypto';
import { PassThrough } from 'node:stream';
import { NextResponse } from 'next/server';
import * as archiverModule from 'archiver';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ArchiveBuilder = {
  pipe: (destination: PassThrough) => unknown;
  append: (source: Buffer, data: { name: string }) => unknown;
  finalize: () => Promise<void>;
};

const createArchive = ((archiverModule as unknown as { default?: unknown }).default ?? archiverModule) as (
  format: string,
  options: { zlib: { level: number } },
) => ArchiveBuilder;

const tokenPattern = /^[a-zA-Z0-9_-]{16,128}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safeFilename(value: string, fallback: string) {
  const cleaned = value.replace(/[\\/\r\n\0"]/g, '_').trim();
  return cleaned || fallback;
}

function attachmentHeader(filename: string) {
  const ascii = safeFilename(filename, 'fotografias').replace(/[^\x20-\x7E]/g, '_');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > 32_000) return NextResponse.json({ error: 'Requisição muito grande.' }, { status: 413 });

  const body = await request.json().catch(() => null) as { token?: unknown; photoIds?: unknown } | null;
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
    .select('id,title,download_enabled,download_resolution')
    .eq('id', access.gallery_id)
    .single();
  if (galleryError || !gallery) return NextResponse.json({ error: 'Galeria não encontrada.' }, { status: 404 });
  if (!gallery.download_enabled) return NextResponse.json({ error: 'Downloads não estão habilitados para esta galeria.' }, { status: 403 });
  if (!['full', 'both'].includes(gallery.download_resolution)) {
    return NextResponse.json({ error: 'Esta galeria não permite download em alta resolução.' }, { status: 403 });
  }

  let query = admin
    .from('photos')
    .select('id,filename,storage_path')
    .eq('gallery_id', gallery.id)
    .eq('published', true)
    .eq('processing_status', 'done')
    .order('sort_order')
    .limit(200);
  if (photoIds) query = query.in('id', photoIds);

  const { data: photos, error: photosError } = await query;
  if (photosError) return NextResponse.json({ error: 'Não foi possível consultar as fotografias.' }, { status: 502 });
  if (!photos?.length) return NextResponse.json({ error: 'Nenhuma foto disponível.' }, { status: 404 });
  if (photoIds && photos.length !== photoIds.length) {
    return NextResponse.json({ error: 'Uma ou mais fotos não pertencem a esta galeria.' }, { status: 404 });
  }

  const downloaded: { id: string; filename: string; bytes: Buffer }[] = [];
  for (const [index, photo] of photos.entries()) {
    const file = await admin.storage.from('photos-private').download(photo.storage_path);
    if (file.error) continue;
    downloaded.push({
      id: photo.id,
      filename: safeFilename(photo.filename, `foto-${index + 1}.jpg`),
      bytes: Buffer.from(await file.data.arrayBuffer()),
    });
  }
  if (!downloaded.length) return NextResponse.json({ error: 'Não foi possível ler os arquivos originais.' }, { status: 502 });

  const sessionTokenHash = createHash('sha256').update(body.token).digest('hex');
  const { error: logError } = await admin.from('downloads').insert(downloaded.map((photo) => ({
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

  if (downloaded.length === 1) {
    const photo = downloaded[0];
    return new Response(new Uint8Array(photo.bytes), {
      status: 200,
      headers: {
        ...commonHeaders,
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(photo.bytes.length),
        'Content-Disposition': attachmentHeader(photo.filename),
      },
    });
  }

  const archive = new PassThrough();
  const zip = createArchive('zip', { zlib: { level: 0 } });
  zip.pipe(archive);
  for (const [index, photo] of downloaded.entries()) {
    zip.append(photo.bytes, { name: `${String(index + 1).padStart(3, '0')}-${photo.filename}` });
  }
  await zip.finalize();
  const chunks: Uint8Array[] = [];
  for await (const chunk of archive) chunks.push(chunk);
  const result = Buffer.concat(chunks);
  const safeTitle = safeFilename(gallery.title.replace(/[^a-z0-9-_ ]/gi, ''), 'galeria').replace(/\s+/g, '-');

  return new Response(result, {
    status: 200,
    headers: {
      ...commonHeaders,
      'Content-Type': 'application/zip',
      'Content-Length': String(result.length),
      'Content-Disposition': attachmentHeader(`${safeTitle}.zip`),
    },
  });
}
