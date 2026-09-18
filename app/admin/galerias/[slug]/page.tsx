import { notFound } from 'next/navigation';
import { GalleryDeliverySettings } from '@/components/admin/GalleryDeliverySettings';
import { GalleryPhotos } from '@/components/admin/GalleryPhotos';
import { GallerySettings } from '@/components/admin/GallerySettings';
import { GalleryUpload } from '@/components/admin/GalleryUpload';
import { portfolioGallerySlugs, portfolioMaxFeaturedPhotos, portfolioMaxGalleryPhotos } from '@/lib/portfolio/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function GalleryManagementPage({ params: promisedParams }: { params: Promise<{ slug: string }> }) {
  const params = await promisedParams;
  const client = await createSupabaseServerClient();
  if (!client) return <main className="min-h-screen px-6 pt-32"><p>Supabase não configurado.</p></main>;
  const { data: gallery, error } = await client.from('galleries').select('*').eq('slug', params.slug).single();
  if (error) { if (error.code === 'PGRST116') notFound(); return <main className="min-h-screen px-6 pb-24 pt-32 md:px-10"><div className="mx-auto max-w-5xl border border-red-400/30 bg-red-950/20 p-8"><p className="text-xs uppercase tracking-[0.25em] text-red-300">Falha de conexão</p><h1 className="mt-4 font-display text-4xl">Não foi possível carregar a galeria.</h1><p className="mt-4 text-zinc-300">Verifique a conexão com o Supabase e tente novamente.</p></div></main>; }
  if (!gallery) notFound();
  const isPortfolioGallery = portfolioGallerySlugs.includes(gallery.slug as typeof portfolioGallerySlugs[number]);
  const access = await client.from('gallery_access').select('token').eq('gallery_id', gallery.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  const { data: photos } = await client.from('photos').select('id,filename,is_cover,is_featured,processing_status,path_preview,published,sort_order').eq('gallery_id', gallery.id).order('sort_order');
  const materialized = await Promise.all((photos ?? []).map(async (photo) => { const signed = photo.path_preview ? await client.storage.from('photos-private').createSignedUrl(photo.path_preview, 3600) : { data: null }; return { ...photo, url: signed.data?.signedUrl }; }));
  return <main id="conteudo-principal" className="min-h-screen px-6 pb-24 pt-32 md:px-10"><div className="mx-auto max-w-5xl"><p className="text-xs uppercase tracking-[0.35em] text-gold">Admin · Galeria</p><h1 className="mt-4 font-display text-5xl md:text-7xl">{gallery.title}</h1><p className="mt-5 text-zinc-400">Slug: {gallery.slug} · Visibilidade: {gallery.visibility}</p>{isPortfolioGallery && <p className="mt-4 border border-gold/30 bg-gold/[0.06] p-4 text-sm text-gold">Galeria pública do portfólio: até {portfolioMaxGalleryPhotos} imagens para visitação. Selecione até {portfolioMaxFeaturedPhotos} destaques para o looping de 4 segundos.</p>}<GallerySettings galleryId={gallery.id} initialTitle={gallery.title} initialSlug={gallery.slug} initialVisibility={gallery.visibility} /><div className="mt-12"><GalleryUpload galleryId={gallery.id} maxPhotos={isPortfolioGallery ? portfolioMaxGalleryPhotos : undefined} initialPhotoCount={materialized.length} /></div><GalleryPhotos galleryId={gallery.id} photos={materialized} isPortfolioGallery={isPortfolioGallery} maxFeaturedPhotos={portfolioMaxFeaturedPhotos} /><GalleryDeliverySettings galleryId={gallery.id} initialActive={gallery.active} initialEnabled={gallery.download_enabled} initialResolution={gallery.download_resolution} initialToken={access.data?.token} /></div></main>;
}
