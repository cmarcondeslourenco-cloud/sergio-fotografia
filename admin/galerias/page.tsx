import Link from 'next/link';
import { GalleryDeleteButton } from '@/components/admin/GalleryDeleteButton';
import { NewGalleryForm } from '@/components/admin/NewGalleryForm';
import { PortfolioGalleriesSetup } from '@/components/admin/PortfolioGalleriesSetup';
import { portfolioGallerySlugs } from '@/lib/portfolio/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Gallery = { id: string; title: string; slug: string; visibility: 'private' | 'unlisted' | 'public'; created_at: string; download_enabled: boolean };
const visibilityLabels = { private: 'Privada', unlisted: 'Não listada', public: 'Pública' };
const visibilityClasses = { private: 'border-amber-300/25 bg-amber-300/10 text-amber-200', unlisted: 'border-sky-300/25 bg-sky-300/10 text-sky-200', public: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200' };

function formatDate(date: string) { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(date)); }

export default async function AdminGalleriesPage() {
  const client = await createSupabaseServerClient();
  const { data: galleries, error } = client ? await client.from('galleries').select('id,title,slug,visibility,created_at,download_enabled').order('created_at', { ascending: false }) : { data: null, error: null };
  const galleryList = (galleries ?? []) as Gallery[];
  const { data: photos } = client && galleryList.length ? await client.from('photos').select('gallery_id').in('gallery_id', galleryList.map((gallery) => gallery.id)) : { data: null };
  const photoCountByGallery = new Map<string, number>();
  photos?.forEach((photo) => photoCountByGallery.set(photo.gallery_id, (photoCountByGallery.get(photo.gallery_id) ?? 0) + 1));
  const missingPortfolioGalleries = portfolioGallerySlugs.filter((slug) => !galleryList.some((gallery) => gallery.slug === slug)).length;

  return <main id="conteudo-principal" className="min-h-screen px-6 pb-24 pt-32 md:px-10 md:pt-40"><div className="mx-auto max-w-6xl">
    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="eyebrow">Admin · Galerias</p><h1 className="mt-4 font-display text-5xl text-linen md:text-7xl">Gerencie suas galerias.</h1><p className="mt-6 max-w-2xl leading-7 text-zinc-400">Acompanhe todas as entregas criadas, abra uma galeria para enviar fotos, definir a capa e configurar o acesso do cliente.</p></div><Link href="#nova-galeria" className="button-primary shrink-0 text-center">Nova galeria</Link></div>
    <PortfolioGalleriesSetup missingCount={missingPortfolioGalleries} />
    <section className="mt-14" aria-labelledby="all-galleries"><div className="flex items-end justify-between gap-4 border-b border-white/10 pb-5"><div><p className="eyebrow">Catálogo completo</p><h2 id="all-galleries" className="mt-2 font-display text-3xl text-linen">Todas as galerias</h2></div><span className="text-xs uppercase tracking-[0.14em] text-zinc-500">{galleryList.length} {galleryList.length === 1 ? 'galeria' : 'galerias'}</span></div>
      {error ? <div className="mt-6 border border-red-400/30 bg-red-950/20 p-6 text-sm text-red-200">Não foi possível carregar as galerias. Verifique a conexão com o Supabase e tente novamente.</div> : galleryList.length ? <div className="mt-6 overflow-hidden border border-white/10"><div className="hidden grid-cols-[minmax(0,1fr)_8rem_6rem_8rem_7rem] gap-4 border-b border-white/10 bg-white/[0.03] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 md:grid"><span>Galeria</span><span>Visibilidade</span><span>Fotos</span><span>Criada em</span><span>Ações</span></div><div className="divide-y divide-white/10">{galleryList.map((gallery) => { const photoCount = photoCountByGallery.get(gallery.id) ?? 0; return <div key={gallery.id} className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1fr)_8rem_6rem_8rem_7rem] md:items-center md:px-6"><Link href={`/admin/galerias/${gallery.slug}`} className="group min-w-0"><div className="flex items-center gap-3"><h3 className="truncate font-display text-xl text-linen">{gallery.title}</h3><span aria-hidden="true" className="text-gold transition-transform group-hover:translate-x-1">→</span></div><p className="mt-1 truncate text-xs text-zinc-500">/{gallery.slug}{gallery.download_enabled ? ' · downloads ativos' : ''}</p></Link><span className={`w-fit border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${visibilityClasses[gallery.visibility]}`}>{visibilityLabels[gallery.visibility]}</span><span className="text-sm text-zinc-300">{photoCount}</span><span className="text-sm text-zinc-400">{formatDate(gallery.created_at)}</span><GalleryDeleteButton galleryId={gallery.id} galleryTitle={gallery.title} /></div>; })}</div></div> : <div className="mt-6 border border-dashed border-white/15 p-10 text-center"><p className="font-display text-2xl text-linen">Nenhuma galeria criada ainda.</p><p className="mt-2 text-sm text-zinc-500">Crie a primeira galeria para iniciar uma entrega.</p><Link href="#nova-galeria" className="button-primary mt-6 inline-block">Criar primeira galeria</Link></div>}
    </section>
    <section id="nova-galeria" className="mt-16 scroll-mt-28" aria-labelledby="new-gallery"><p className="eyebrow">Nova entrega</p><h2 id="new-gallery" className="mt-2 font-display text-3xl text-linen">Criar galeria</h2><p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">O padrão é privado. Depois da criação, envie as fotos e configure o link de acesso do cliente.</p><div className="mt-6"><NewGalleryForm /></div></section>
  </div></main>;
}
