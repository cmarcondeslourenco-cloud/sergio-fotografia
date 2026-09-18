import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readSmallJson } from '@/lib/http';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { pixConfig } from '@/lib/pix';

const schema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), photoIds: z.array(z.string().uuid()).min(1).max(100) });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await readSmallJson(request));
  if (!parsed.success) return NextResponse.json({ error: 'Carrinho inválido.' }, { status: 400 });
  const pix = pixConfig();
  if (!pix) return NextResponse.json({ error: 'Dependência externa necessária para ativação: dados Pix do fotógrafo.' }, { status: 503 });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: 'Serviço indisponível.' }, { status: 503 });
  const { data, error } = await admin.rpc('create_photo_order', { p_hash: createHash('sha256').update(parsed.data.token).digest('hex'), p_photos: parsed.data.photoIds, p_pix: pix });
  if (error || !data) return NextResponse.json({ error: 'Não foi possível gerar o pedido. Uma foto pode estar indisponível.' }, { status: 409 });
  return NextResponse.json({ path: `/pedido/${parsed.data.token}` }, { headers: { 'Cache-Control': 'no-store' } });
}
