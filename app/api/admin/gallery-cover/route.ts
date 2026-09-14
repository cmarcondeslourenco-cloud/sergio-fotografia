import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const session = await createSupabaseServerClient();
  if (!session) return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 500 });
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  const { data: profile } = await session.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'editor'].includes(profile.role)) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { galleryId?: string; photoId?: string };
  if (!body.galleryId || !body.photoId) return NextResponse.json({ error: 'Galeria e foto são obrigatórias.' }, { status: 400 });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 500 });
  const { data: photo } = await admin.from('photos').select('id').eq('id', body.photoId).eq('gallery_id', body.galleryId).eq('processing_status', 'done').maybeSingle();
  if (!photo) return NextResponse.json({ error: 'Foto não encontrada ou ainda não processada.' }, { status: 404 });
  const { error: clearError } = await admin.from('photos').update({ is_cover: false }).eq('gallery_id', body.galleryId);
  if (clearError) return NextResponse.json({ error: clearError.message }, { status: 500 });
  const { error } = await admin.from('photos').update({ is_cover: true }).eq('id', body.photoId).eq('gallery_id', body.galleryId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
