import { NextResponse } from 'next/server';
import { createImageVariant, readImageMetadata } from '@/lib/image/pipeline';
import { validateImageInput } from '@/lib/image/validation';
import { imageObjectPath } from '@/lib/storage/paths';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const session = await createSupabaseServerClient();
  const { data: { user } } = session ? await session.auth.getUser() : { data: { user: null } };
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const { data: profile } = await session?.from('profiles').select('role').eq('id', user.id).single() ?? { data: null };
  if (!profile || !['admin', 'editor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as { galleryId?: unknown } | null;
  if (!body || typeof body.galleryId !== 'string' || !uuidPattern.test(body.galleryId)) {
    return NextResponse.json({ error: 'Galeria inválida.' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 });

  const { data: photos, error } = await admin
    .from('photos')
    .select('id,storage_path,format,size_bytes')
    .eq('gallery_id', body.galleryId)
    .in('processing_status', ['pending', 'error'])
    .order('created_at')
    .limit(20);
  if (error) return NextResponse.json({ error: 'Não foi possível consultar a fila.' }, { status: 502 });

  let processed = 0;
  let failed = 0;
  for (const photo of photos ?? []) {
    await admin.from('photos').update({ processing_status: 'processing' }).eq('id', photo.id).eq('gallery_id', body.galleryId);
    try {
      const downloaded = await admin.storage.from('photos-private').download(photo.storage_path);
      if (downloaded.error) throw new Error('download');
      validateImageInput({ mime: downloaded.data.type || `image/${photo.format}`, size: downloaded.data.size || photo.size_bytes || 0 });

      const input = Buffer.from(await downloaded.data.arrayBuffer());
      const metadata = await readImageMetadata(input);
      const paths: Record<string, string> = {};
      for (const variant of ['thumbnail', 'preview', 'web'] as const) {
        const output = await createImageVariant(input, variant);
        const path = imageObjectPath(body.galleryId, photo.id, variant);
        const uploaded = await admin.storage.from('photos-private').upload(path, output, {
          contentType: 'image/webp',
          upsert: true,
          cacheControl: '31536000',
        });
        if (uploaded.error) throw new Error('upload');
        paths[`path_${variant}`] = path;
      }

      const updated = await admin.from('photos').update({
        ...paths,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        processing_status: 'done',
      }).eq('id', photo.id).eq('gallery_id', body.galleryId);
      if (updated.error) throw new Error('database');
      processed += 1;
    } catch {
      failed += 1;
      await admin.from('photos').update({ processing_status: 'error' }).eq('id', photo.id).eq('gallery_id', body.galleryId);
    }
  }

  return NextResponse.json({ processed, failed, total: photos?.length ?? 0 });
}
