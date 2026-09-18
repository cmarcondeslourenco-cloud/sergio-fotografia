import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const schema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('photo'),
    photoId: z.string().uuid(),
    cents: z.number().int().min(1).max(10000000).nullable(),
    caption: z.string().trim().max(160).nullable(),
    published: z.boolean(),
  }),
  z.object({ action: z.enum(['paid', 'cancelled']), orderId: z.string().uuid() }),
]);

export async function POST(request: Request) {
  const session = await createSupabaseServerClient();
  const { data: { user } } = session ? await session.auth.getUser() : { data: { user: null } };
  if (!user || !session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const { data: profile } = await session.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'editor'].includes(profile.role)) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: 'Serviço indisponível.' }, { status: 503 });

  const body = parsed.data;
  if (body.action === 'photo') {
    const { data, error } = await admin
      .from('photos')
      .update({
        price_cents: body.cents,
        caption: body.caption || null,
        published: body.published,
      })
      .eq('id', body.photoId)
      .select('id')
      .single();

    if (error || !data) return NextResponse.json({ error: 'Não foi possível salvar os dados comerciais da fotografia.' }, { status: 409 });
  } else {
    const { data, error } = await admin
      .from('photo_orders')
      .update({
        status: body.action,
        ...(body.action === 'paid'
          ? {
              paid_at: new Date().toISOString(),
              confirmed_by: user.id,
              expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
            }
          : {}),
      })
      .eq('id', body.orderId)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (error || !data) return NextResponse.json({ error: 'Pedido já alterado ou indisponível. Atualize a página.' }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
