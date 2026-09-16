import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(request: Request) {
  const session = await createSupabaseServerClient();
  if (!session) return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 });
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  const { data: profile } = await session.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'editor'].includes(profile.role)) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const body = await request.json().catch(() => null) as { galleryId?: unknown } | null;
  if (!body || typeof body.galleryId !== 'string' || !uuidPattern.test(body.galleryId)) {
    return NextResponse.json({ error: 'Galeria inválida.' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 });
  const { data: gallery } = await admin.from('galleries').select('id').eq('id', body.galleryId).maybeSingle();
  if (!gallery) return NextResponse.json({ error: 'Galeria não encontrada.' }, { status: 404 });

  const { data: photos, error: photosError } = await admin
    .from('photos')
    .select('storage_path,path_thumbnail,path_preview,path_web,path_watermark')
    .eq('gallery_id', gallery.id);
  if (photosError) return NextResponse.json({ error: 'Não foi possível preparar a exclusão das fotos.' }, { status: 502 });

  const storagePaths = [...new Set((photos ?? []).flatMap((photo) => [photo.storage_path, photo.path_thumbnail, photo.path_preview, photo.path_web, photo.path_watermark]).filter((path): path is string => Boolean(path)))];
  if (storagePaths.length) {
    const { error: storageError } = await admin.storage.from('photos-private').remove(storagePaths);
    if (storageError) return NextResponse.json({ error: 'Não foi possível remover os arquivos privados da galeria.' }, { status: 502 });
  }

  const { error: commentsError } = await admin.from('comments').delete().eq('gallery_id', gallery.id);
  if (commentsError) return NextResponse.json({ error: 'Não foi possível remover os comentários da galeria.' }, { status: 502 });
  const { error: galleryError } = await admin.from('galleries').delete().eq('id', gallery.id);
  if (galleryError) return NextResponse.json({ error: 'Não foi possível excluir a galeria.' }, { status: 502 });

  return NextResponse.json({ ok: true });
}
