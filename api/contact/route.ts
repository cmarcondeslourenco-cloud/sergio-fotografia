import { NextResponse } from 'next/server';
import { contactSchema } from '@/lib/contact/schema';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 3;
const requestsByAddress = new Map<string, number[]>();

function isRateLimited(address: string) {
  const now = Date.now();
  const active = (requestsByAddress.get(address) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (active.length >= MAX_REQUESTS) return true;
  requestsByAddress.set(address, [...active, now]);
  return false;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > 16_000) {
    return NextResponse.json({ error: 'Mensagem muito grande.' }, { status: 413 });
  }

  const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Revise os campos.' }, { status: 400 });
  }
  if (isRateLimited(address)) {
    return NextResponse.json({ error: 'Limite de mensagens atingido. Tente novamente mais tarde.' }, { status: 429 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Canal de contato temporariamente indisponível.' }, { status: 503 });
  }

  const { name, whatsapp, email, workType, eventDate, city, message } = parsed.data;
  const { error } = await admin.from('messages').insert({
    name,
    whatsapp,
    email: email || null,
    work_type: workType,
    event_date: eventDate || null,
    city: city || null,
    body: message,
  });

  if (error) {
    console.error('Falha ao registrar contato', { code: error.code });
    return NextResponse.json({ error: 'Não foi possível registrar sua mensagem agora.' }, { status: 502 });
  }

  console.info('Novo contato recebido para o fotógrafo', { name, workType, email: email || undefined });

  return NextResponse.json({ ok: true }, { status: 201 });
}
