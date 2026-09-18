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

  const body = await request.json().catch(() => null) as { galleryId?: unknown; photoIds?: unknown } | null;
  if (!body || typeof body.galleryId !== 'string' || !uuidPattern.test(body.galleryId) || !Array.isArray(body.photoIds) || !body.photoIds.length || body.photoIds.some((id) => typeof id !== 'string' || !uuidPattern.test(id))) {
    return NextResponse.json({ error: 'Seleção de fotos inválida.' }, { status: 400 });
  }
  const photoIds = [...new Set(body.photoIds as string[])];
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 });
  const { data: photos, error: photosError } = await admin.from('photos').select('id,storage_path,path_thumbnail,path_preview,path_web,path_watermark').eq('gallery_id', body.galleryId).in('id', photoIds);
  if (photosError || !photos || photos.length !== photoIds.length) return NextResponse.json({ error: 'Uma ou mais fotos não pertencem a esta galeria.' }, { status: 404 });

  // The FK to order items rejects deletion of purchased originals before Storage is touched.
  const { error: deleteError } = await admin.from('photos').delete().eq('gallery_id', body.galleryId).in('id', photoIds);
  if (deleteError) return NextResponse.json({ error: 'Não foi possível excluir. Fotos vinculadas a pedidos devem ser preservadas.' }, { status: 409 });

  const paths = [...new Set(photos.flatMap((photo) => [photo.storage_path, photo.path_thumbnail, photo.path_preview, photo.path_web, photo.path_watermark]).filter((path): path is string => Boolean(path)))];
  if (paths.length) {
    const { error: storageError } = await admin.storage.from('photos-private').remove(paths);
    if (storageError) return NextResponse.json({ error: 'Registros removidos; arquivos privados remanescentes precisam de limpeza no Storage.' }, { status: 502 });
  }

  const { data: remaining } = await admin.from('photos').select('id,is_cover,processing_status').eq('gallery_id', body.galleryId).order('sort_order').limit(1);
  if (remaining?.length && !remaining.some((photo) => photo.is_cover)) {
    await admin.from('photos').update({ is_cover: true }).eq('id', remaining[0].id).eq('gallery_id', body.galleryId);
  }
  return NextResponse.json({ deleted: photoIds.length });
}


export async function PATCH(request: Request) {
  const session = await createSupabaseServerClient();
  if (!session) return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 });
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  const { data: profile } = await session.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'editor'].includes(profile.role)) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const body = await request.json().catch(() => null) as
    | { galleryId?: unknown; photoId?: unknown; published?: unknown }
    | { galleryId?: unknown; orderedPhotoIds?: unknown }
    | null;

  if (!body || typeof body.galleryId !== 'string' || !uuidPattern.test(body.galleryId)) {
    return NextResponse.json({ error: 'Galeria inválida.' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 });

  if ('orderedPhotoIds' in body) {
    if (!Array.isArray(body.orderedPhotoIds) || body.orderedPhotoIds.length > 500 || body.orderedPhotoIds.some((id) => typeof id !== 'string' || !uuidPattern.test(id))) {
      return NextResponse.json({ error: 'Ordem inválida.' }, { status: 400 });
    }
    const orderedPhotoIds = [...new Set(body.orderedPhotoIds as string[])];
    if (orderedPhotoIds.length !== body.orderedPhotoIds.length) return NextResponse.json({ error: 'A ordem contém fotos duplicadas.' }, { status: 400 });
    const { data: existing, error: existingError } = await admin.from('photos').select('id').eq('gallery_id', body.galleryId);
    if (existingError || !existing || existing.length !== orderedPhotoIds.length) return NextResponse.json({ error: 'A lista deve conter todas as fotos da galeria.' }, { status: 409 });
    const existingIds = new Set(existing.map((photo) => photo.id));
    if (orderedPhotoIds.some((id) => !existingIds.has(id))) return NextResponse.json({ error: 'A ordem contém foto de outra galeria.' }, { status: 409 });
    for (let index = 0; index < orderedPhotoIds.length; index += 1) {
      const { error } = await admin.from('photos').update({ sort_order: index }).eq('id', orderedPhotoIds[index]).eq('gallery_id', body.galleryId);
      if (error) return NextResponse.json({ error: 'Não foi possível concluir a alteração de ordem.' }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  }

  if (!('photoId' in body) || typeof body.photoId !== 'string' || !uuidPattern.test(body.photoId) || typeof body.published !== 'boolean') {
    return NextResponse.json({ error: 'Dados da fotografia inválidos.' }, { status: 400 });
  }

  const { data, error } = await admin.from('photos').update({ published: body.published, ...(body.published ? {} : { is_featured: false }) }).eq('id', body.photoId).eq('gallery_id', body.galleryId).select('id').maybeSingle();
  if (error || !data) return NextResponse.json({ error: 'Não foi possível alterar a disponibilidade da fotografia.' }, { status: 409 });
  return NextResponse.json({ ok: true });
}
