import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { portfolioGalleries, portfolioLoopIntervalMs, portfolioMaxFeaturedPhotos, portfolioMaxGalleryPhotos } from '@/lib/portfolio/config';

export async function POST() {
  const session = await createSupabaseServerClient();
  if (!session) return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 });
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  const { data: profile } = await session.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'editor'].includes(profile.role)) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: 'A configuração segura do Supabase não está disponível.' }, { status: 503 });
  const now = new Date().toISOString();
  const { error } = await admin.from('galleries').upsert(portfolioGalleries.map((gallery) => ({
    ...gallery,
    visibility: 'public',
    published_at: now,
    metadata: { placement: 'portfolio', max_photos: portfolioMaxGalleryPhotos, featured_photos: portfolioMaxFeaturedPhotos, loop_interval_ms: portfolioLoopIntervalMs },
  })), { onConflict: 'slug', ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: 'Não foi possível preparar as galerias do portfólio.' }, { status: 502 });
  return NextResponse.json({ ok: true });
}
