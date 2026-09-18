import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { portfolioGallerySlugs, portfolioMaxFeaturedPhotos } from '@/lib/portfolio/config';

export async function POST(request: Request) {
  const session = await createSupabaseServerClient();
  if (!session) return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 });
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  const { data: profile } = await session.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'editor'].includes(profile.role)) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  const body = await request.json().catch(() => null) as { galleryId?: unknown; photoId?: unknown; featured?: unknown } | null;
  if (!body || typeof body.galleryId !== 'string' || typeof body.photoId !== 'string' || typeof body.featured !== 'boolean') return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 });
  const { data: gallery } = await admin.from('galleries').select('id,slug').eq('id', body.galleryId).maybeSingle();
  if (!gallery || !portfolioGallerySlugs.includes(gallery.slug as typeof portfolioGallerySlugs[number])) return NextResponse.json({ error: 'Galeria de portfólio não encontrada.' }, { status: 404 });
  const { data: photo } = await admin.from('photos').select('id').eq('id', body.photoId).eq('gallery_id', body.galleryId).eq('processing_status', 'done').maybeSingle();
  if (!photo) return NextResponse.json({ error: 'Foto não encontrada ou ainda não processada.' }, { status: 404 });
  if (body.featured) {
    const { count } = await admin.from('photos').select('id', { count: 'exact', head: true }).eq('gallery_id', body.galleryId).eq('is_featured', true);
    if ((count ?? 0) >= portfolioMaxFeaturedPhotos) return NextResponse.json({ error: `O looping permite no máximo ${portfolioMaxFeaturedPhotos} fotos.` }, { status: 409 });
  }
  const { error } = await admin.from('photos').update({ is_featured: body.featured }).eq('id', body.photoId).eq('gallery_id', body.galleryId);
  if (error) return NextResponse.json({ error: 'Não foi possível atualizar o looping.' }, { status: 502 });
  return NextResponse.json({ ok: true });
}