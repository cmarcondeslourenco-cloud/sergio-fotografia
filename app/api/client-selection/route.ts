import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readSmallJson } from '@/lib/http';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const schema = z.object({ token: z.string().regex(/^[a-zA-Z0-9_-]{16,128}$/), photoIds: z.array(z.string().uuid()).max(200), name: z.string().trim().max(120).default(''), finalize: z.boolean().default(false) });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await readSmallJson(request));
  if (!parsed.success || (parsed.data.finalize && (parsed.data.name.length < 2 || !parsed.data.photoIds.length))) return NextResponse.json({ error: 'Informe seu nome e selecione ao menos uma foto.' }, { status: 400 });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: 'Serviço indisponível.' }, { status: 503 });
  const { error } = await admin.rpc('save_client_selection', { p_token: parsed.data.token, p_photos: parsed.data.photoIds, p_name: parsed.data.name, p_finalize: parsed.data.finalize });
  if (error) return NextResponse.json({ error: 'Não foi possível salvar. Verifique seu acesso e tente novamente.' }, { status: 403 });
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
