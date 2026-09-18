import Link from 'next/link';
import { SelectionNotice } from '@/components/admin/SelectionNotice';
import { GalleryDeleteButton } from '@/components/admin/GalleryDeleteButton';
import { NewGalleryForm } from '@/components/admin/NewGalleryForm';
import { PortfolioGalleriesSetup } from '@/components/admin/PortfolioGalleriesSetup';
import { portfolioGallerySlugs } from '@/lib/portfolio/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Gallery = { id: string; title: string; slug: string; visibility: 'private' | 'unlisted' | 'public'; created_at: string; download_enabled: boolean };
const visibilityLabels = { private: 'Privada', unlisted: 'Não listada', public: 'Pública' };
const visibilityClasses = { private: 'border-amber-300/25 bg-amber-300/10 text-amber-200', unlisted: 'border-sky-300/25 bg-sky-300/10 text-sky-200', public: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200' };

function formatDate(date: string) { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(date)); }

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

async function getGalleries() {
  const client = await createSupabaseServerClient();
  if (!client) return { galleries: [] as Gallery[], photoCountByGallery: new Map<string, number>(), error: null };
  const { data, error } = await client.from('galleries').select('id,title,slug,visibility,created_at,download_enabled').order('created_at', { ascending: false });
  const galleries = (data ?? []) as Gallery[];
  const { data: photos } = galleries.length ? await client.from('photos').select('gallery_id').in('gallery_id', galleries.map((gallery) => gallery.id)) : { data: null };
  const photoCountByGallery = new Map<string, number>();
  photos?.forEach((photo) => photoCountByGallery.set(photo.gallery_id, (photoCountByGallery.get(photo.gallery_id) ?? 0) + 1));
  return { galleries, photoCountByGallery, error };
}

async function getUnreadMessages() {
  const client = await createSupabaseServerClient();
  if (!client) return [] as Array<{ id: string; name: string; work_type: string | null; body: string; created_at: string }>;
  const { data } = await client.from('messages').select('id,name,work_type,body,created_at').eq('read', false).order('created_at', { ascending: false }).limit(5);
  return data ?? [];
}

export default async function AdminPage() {
  const [counts, galleryData, unreadMessages] = await Promise.all([getCounts(), getGalleries(), getUnreadMessages()]);
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

        <SelectionNotice />
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

        <PortfolioGalleriesSetup missingCount={portfolioGallerySlugs.filter((slug) => !galleryData.galleries.some((gallery) => gallery.slug === slug)).length} />

        {unreadMessages.length > 0 && <section className="mt-12 border border-gold/40 bg-gold/[0.06] p-6 md:p-8" aria-labelledby="new-contact-alert"><p className="eyebrow">Alerta para o fotógrafo</p><h2 id="new-contact-alert" className="mt-2 font-display text-3xl text-linen">{unreadMessages.length} contato{unreadMessages.length === 1 ? '' : 's'} aguardando resposta</h2><div className="mt-6 grid gap-3">{unreadMessages.map((message) => <article key={message.id} className="border border-white/10 bg-black/20 p-4"><div className="flex flex-wrap justify-between gap-3"><strong className="text-linen">{message.name}</strong><span className="text-xs text-zinc-500">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(message.created_at))}</span></div><p className="mt-1 text-xs uppercase tracking-[0.12em] text-gold">{message.work_type || 'Contato'}</p><p className="mt-3 text-sm leading-6 text-zinc-300">{message.body}</p></article>)}</div><Link href="/contato" className="button-secondary mt-6 inline-flex">Abrir contato</Link></section>}

        <section className="mt-16" aria-labelledby="admin-all-galleries">
          <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Catálogo completo</p>
              <h2 id="admin-all-galleries" className="mt-2 font-display text-3xl text-linen">Todas as galerias</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Inclui as galerias de clientes, portfólio e página inicial. Abra qualquer item para editar a galeria e administrar seus arquivos.</p>
            </div>
            <Link href="/admin/galerias" className="button-secondary shrink-0 text-center">Visão detalhada</Link>
          </div>

          {galleryData.error ? <div className="mt-6 border border-red-400/30 bg-red-950/20 p-6 text-sm text-red-200">Não foi possível carregar as galerias. Verifique a conexão com o Supabase e tente novamente.</div> : galleryData.galleries.length ? <div className="mt-6 overflow-hidden border border-white/10"><div className="hidden grid-cols-[minmax(0,1fr)_8rem_6rem_8rem_7rem] gap-4 border-b border-white/10 bg-white/[0.03] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 md:grid"><span>Galeria</span><span>Visibilidade</span><span>Fotos</span><span>Criada em</span><span>Ações</span></div><div className="divide-y divide-white/10">{galleryData.galleries.map((gallery) => { const photoCount = galleryData.photoCountByGallery.get(gallery.id) ?? 0; return <div key={gallery.id} className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1fr)_8rem_6rem_8rem_7rem] md:items-center md:px-6"><Link href={`/admin/galerias/${gallery.slug}`} className="group min-w-0"><div className="flex items-center gap-3"><h3 className="truncate font-display text-xl text-linen">{gallery.title}</h3><span aria-hidden="true" className="text-gold transition-transform group-hover:translate-x-1">→</span></div><p className="mt-1 truncate text-xs text-zinc-500">/{gallery.slug}{gallery.download_enabled ? ' · downloads ativos' : ''}</p></Link><span className={`w-fit border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${visibilityClasses[gallery.visibility]}`}>{visibilityLabels[gallery.visibility]}</span><span className="text-sm text-zinc-300">{photoCount}</span><span className="text-sm text-zinc-400">{formatDate(gallery.created_at)}</span><GalleryDeleteButton galleryId={gallery.id} galleryTitle={gallery.title} /></div>; })}</div></div> : <div className="mt-6 border border-dashed border-white/15 p-10 text-center"><p className="font-display text-2xl text-linen">Nenhuma galeria criada ainda.</p><p className="mt-2 text-sm text-zinc-500">Crie a primeira galeria abaixo.</p></div>}
        </section>

        <section id="nova-galeria" className="mt-16 scroll-mt-28" aria-labelledby="admin-new-gallery"><p className="eyebrow">Nova galeria</p><h2 id="admin-new-gallery" className="mt-2 font-display text-3xl text-linen">Adicionar galeria</h2><div className="mt-6"><NewGalleryForm /></div></section>
      </div>
    </main>
  );
}
