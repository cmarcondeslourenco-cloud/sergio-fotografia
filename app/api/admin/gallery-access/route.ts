import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const sessionClient = await createSupabaseServerClient();
  if (!sessionClient) return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 });
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  const { data: profile } = await sessionClient.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'editor'].includes(profile.role)) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const body = await request.json().catch(() => null) as { galleryId?: unknown; action?: unknown; expiresAt?: unknown } | null;
  if (!body || typeof body.galleryId !== 'string' || !uuidPattern.test(body.galleryId)) {
    return NextResponse.json({ error: 'Galeria inválida.' }, { status: 400 });
  }

  if (!['create', 'regenerate', 'revoke'].includes(String(body.action))) return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  const expiration = body.expiresAt == null ? null : typeof body.expiresAt === 'string' ? new Date(body.expiresAt) : new Date(NaN);
  if (expiration && (!Number.isFinite(expiration.getTime()) || expiration <= new Date())) return NextResponse.json({ error: 'Informe uma expiração futura.' }, { status: 400 });

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 });
  const { data: gallery } = await admin.from('galleries').select('id').eq('id', body.galleryId).maybeSingle();
  if (!gallery) return NextResponse.json({ error: 'Galeria não encontrada.' }, { status: 404 });

  if (body.action === 'revoke') {
    const { error } = await admin.from('gallery_access').delete().eq('gallery_id', body.galleryId);
    if (error) return NextResponse.json({ error: 'Não foi possível revogar os acessos.' }, { status: 502 });
    return NextResponse.json({ ok: true });
  }

  // Replacement and revocation happen in one transaction; failure keeps the old link.
  const { data, error } = await admin.rpc('rotate_gallery_access', { p_gallery: body.galleryId, p_expires: expiration?.toISOString() ?? null, p_replace: body.action === 'regenerate' });
  if (error || !data) {
    if (error) console.error('Falha ao gerar acesso da galeria', { code: error.code });
    return NextResponse.json({ error: 'Não foi possível gerar o acesso.' }, { status: 502 });
  }
  return NextResponse.json({ token: data }, { status: 201 });
}
