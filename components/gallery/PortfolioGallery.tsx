import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { portfolioMaxFeaturedPhotos, portfolioMaxGalleryPhotos } from '@/lib/portfolio/config';
import { unstable_noStore as noStore } from 'next/cache';
import type { ReactNode } from 'react';
import { PublicPortfolioCarousel } from './PublicPortfolioCarousel';
import { PublicPortfolioPhotos } from './PublicPortfolioPhotos';

export async function PortfolioGallery({ slug, fallback, showAllPhotos = false }: { slug: string; fallback: ReactNode; showAllPhotos?: boolean }) {
  noStore();
  const admin = createSupabaseAdminClient();
  if (!admin) return <>{fallback}</>;
  const { data: gallery } = await admin.from('galleries').select('*').eq('slug', slug).eq('visibility', 'public').lte('published_at', new Date().toISOString()).maybeSingle();
  if (!gallery || gallery.active === false) return <>{fallback}</>;
  const { data: photos } = await admin.from('photos').select('id,filename,path_preview,is_featured').eq('gallery_id', gallery.id).eq('processing_status', 'done').order('sort_order').limit(portfolioMaxGalleryPhotos);
  const materialized = await Promise.all((photos ?? []).map(async (photo) => {
    if (!photo.path_preview) return null;
    const signed = await admin.storage.from('photos-private').createSignedUrl(photo.path_preview, 3600);
    return signed.data?.signedUrl ? { id: photo.id, url: signed.data.signedUrl, alt: photo.filename, is_featured: photo.is_featured } : null;
  }));
  const allPhotos = materialized.filter((photo): photo is NonNullable<typeof photo> => photo !== null);
  const featuredPhotos = allPhotos.filter((photo) => photo.is_featured).slice(0, portfolioMaxFeaturedPhotos);
  if (!allPhotos.length) return <>{fallback}</>;
  return <div className={showAllPhotos ? 'grid gap-12' : 'h-full'}><div className={showAllPhotos ? undefined : 'h-full'}>{featuredPhotos.length ? <PublicPortfolioCarousel photos={featuredPhotos} className={showAllPhotos ? undefined : 'h-full aspect-auto'} /> : <p className="border border-dashed border-white/15 p-8 text-center text-sm text-zinc-500">Nenhuma foto foi selecionada para o looping.</p>}</div>{showAllPhotos && <section aria-label="Fotos da galeria"><div className="mb-6 flex items-end justify-between gap-4 border-b border-white/10 pb-4"><div><p className="eyebrow">Galeria completa</p><h2 className="mt-2 font-display text-3xl text-linen">Todas as fotografias</h2></div><span className="text-xs uppercase tracking-[0.14em] text-zinc-500">{allPhotos.length} fotos</span></div><PublicPortfolioPhotos photos={allPhotos} /></section>}</div>;
}
