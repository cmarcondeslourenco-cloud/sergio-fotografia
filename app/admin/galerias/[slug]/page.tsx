import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { GalleryUpload } from '@/components/admin/GalleryUpload';
import { GalleryDeliverySettings } from '@/components/admin/GalleryDeliverySettings';
import { GalleryPhotos } from '@/components/admin/GalleryPhotos';

export default async function GalleryManagementPage({ params }: { params: { slug: string } }) {
  const client = await createSupabaseServerClient();
  if (!client) return <main className="min-h-screen px-6 pt-32"><p>Supabase não configurado.</p></main>;
  const { data: gallery, error } = await client.from('galleries').select('id,title,slug,visibility,download_enabled,download_resolution').eq('slug', params.slug).single();
  if (error) { console.error('Falha ao carregar galeria', { slug: params.slug, code: error.code, message: error.message }); if (error.code === 'PGRST116') notFound(); return <main className="min-h-screen px-6 pb-24 pt-32 md:px-10"><div className="mx-auto max-w-5xl border border-red-400/30 bg-red-950/20 p-8"><p className="text-xs uppercase tracking-[0.25em] text-red-300">Falha de conexão</p><h1 className="mt-4 font-display text-4xl">Não foi possível carregar a galeria.</h1><p className="mt-4 text-zinc-300">O servidor local não conseguiu consultar o Supabase. Verifique a conexão e tente novamente.</p></div></main>; }
  if (!gallery) notFound();
  const access = await client.from('gallery_access').select('token').eq('gallery_id', gallery.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  const { data: photos } = await client.from('photos').select('id,filename,is_cover,processing_status,path_preview').eq('gallery_id', gallery.id).order('sort_order');
  const materialized = await Promise.all((photos ?? []).map(async photo => { const signed = photo.path_preview ? await client.storage.from('photos-private').createSignedUrl(photo.path_preview, 3600) : { data: null }; return { ...photo, url: signed.data?.signedUrl }; }));
  return <main id="conteudo-principal" className="min-h-screen px-6 pb-24 pt-32 md:px-10"><div className="mx-auto max-w-5xl"><p className="text-xs uppercase tracking-[0.35em] text-gold">Admin · Galeria</p><h1 className="mt-4 font-display text-5xl md:text-7xl">{gallery.title}</h1><p className="mt-5 text-zinc-400">Slug: {gallery.slug} · Visibilidade: {gallery.visibility}</p><div className="mt-12"><GalleryUpload galleryId={gallery.id} /></div><GalleryPhotos galleryId={gallery.id} photos={materialized} /><GalleryDeliverySettings galleryId={gallery.id} initialEnabled={gallery.download_enabled} initialResolution={gallery.download_resolution} initialToken={access.data?.token} /></div></main>;
}
