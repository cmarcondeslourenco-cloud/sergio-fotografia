import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function getCounts() {
  const client = await createSupabaseServerClient();
  if (!client) return null;
  const [galleries, photos, clients, messages] = await Promise.all([
    client.from('galleries').select('*', { count: 'exact', head: true }),
    client.from('photos').select('*', { count: 'exact', head: true }),
    client.from('clients').select('*', { count: 'exact', head: true }),
    client.from('messages').select('*', { count: 'exact', head: true }).eq('read', false),
  ]);
  return {
    galleries: galleries.count ?? 0,
    photos: photos.count ?? 0,
    clients: clients.count ?? 0,
    messages: messages.count ?? 0,
  };
}

export default async function AdminPage() {
  const counts = await getCounts();
  const cards = [
    ['Galerias', counts?.galleries ?? '—', 'Trabalhos organizados'],
    ['Fotos', counts?.photos ?? '—', 'Arquivos cadastrados'],
    ['Clientes', counts?.clients ?? '—', 'Pessoas atendidas'],
    ['Mensagens', counts?.messages ?? '—', 'Contatos não lidos'],
  ];

  return (
    <main id="conteudo-principal" className="min-h-screen px-6 pb-24 pt-32 md:px-10 md:pt-40">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Admin · Visão geral</p>
            <h1 className="mt-4 font-display text-5xl text-linen md:text-7xl">Seu estúdio digital.</h1>
            <p className="mt-5 max-w-xl leading-7 text-zinc-400">Organize galerias, acompanhe entregas e cuide das histórias dos seus clientes.</p>
          </div>
          <span className="w-fit border border-emerald-400/30 px-4 py-2 text-xs uppercase tracking-[0.15em] text-emerald-300">Sessão autenticada</span>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, value, description]) => (
            <article key={label} className="border border-white/10 bg-surface p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p>
              <p className="mt-5 font-display text-5xl text-gold">{value}</p>
              <p className="mt-3 text-sm text-zinc-500">{description}</p>
            </article>
          ))}
        </div>

        <section className="mt-12 grid gap-4 lg:grid-cols-3">
          <Link href="/admin/galerias" className="group border border-gold bg-gold p-7 text-ink transition-colors hover:bg-transparent hover:text-gold">
            <p className="text-xs uppercase tracking-[0.2em]">Ação principal</p>
            <h2 className="mt-4 font-display text-3xl">Criar galeria <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span></h2>
            <p className="mt-3 text-sm opacity-75">Comece uma nova entrega para um cliente.</p>
          </Link>
          <div className="border border-white/10 p-7 lg:col-span-2">
            <p className="eyebrow">Fluxo recomendado</p>
            <ol className="mt-5 grid gap-3 text-sm text-zinc-400 sm:grid-cols-3">
              <li><span className="text-gold">01.</span> Crie a galeria</li>
              <li><span className="text-gold">02.</span> Envie e processe</li>
              <li><span className="text-gold">03.</span> Configure e entregue</li>
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}
