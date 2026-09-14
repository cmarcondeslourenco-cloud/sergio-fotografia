import { notFound } from 'next/navigation';
import { RealClientGallery } from '@/components/client/RealClientGallery';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PrivateGalleryPage({ params }: { params: { token: string } }) {
  if (!/^[a-zA-Z0-9_-]{16,128}$/.test(params.token)) notFound();

  const admin = createSupabaseAdminClient();
  if (!admin) return notFound();

  const { data: access, error: accessError } = await admin
    .from('gallery_access')
    .select('gallery_id,expires_at')
    .eq('token', params.token)
    .maybeSingle();
  if (accessError || !access || (access.expires_at && new Date(access.expires_at) <= new Date())) notFound();

  const { data: gallery, error: galleryError } = await admin
    .from('galleries')
    .select('title,download_enabled,download_resolution')
    .eq('id', access.gallery_id)
    .single();
  if (galleryError || !gallery) notFound();

  const { data: photos, error: photosError } = await admin
    .from('photos')
    .select('id,filename,alt_text,path_preview')
    .eq('gallery_id', access.gallery_id)
    .eq('published', true)
    .eq('processing_status', 'done')
    .order('sort_order')
    .limit(200);
  if (photosError) notFound();

  const mapped = (await Promise.all((photos ?? []).map(async (photo) => {
    if (!photo.path_preview) return null;
    const preview = await admin.storage.from('photos-private').createSignedUrl(photo.path_preview, 3600);
    if (preview.error || !preview.data?.signedUrl) return null;
    return { id: photo.id, alt: photo.alt_text || photo.filename, previewUrl: preview.data.signedUrl };
  }))).filter((photo): photo is NonNullable<typeof photo> => photo !== null);

  const downloadsEnabled = gallery.download_enabled === true;
  const allowOriginalDownload = gallery.download_resolution === 'full' || gallery.download_resolution === 'both';

  return (
    <main id="conteudo-principal" className="min-h-screen px-6 pb-24 pt-32 md:px-10 md:pt-40">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow">Entrega exclusiva</p>
        <h1 className="mt-4 max-w-4xl font-display text-5xl leading-none text-linen md:text-7xl">{gallery.title}</h1>
        <p className="mt-6 max-w-xl leading-7 text-zinc-400">Uma galeria privada para rever, selecionar e guardar suas fotografias.</p>
        <section className="mt-12">
          <RealClientGallery photos={mapped} token={params.token} downloadsEnabled={downloadsEnabled} allowOriginalDownload={allowOriginalDownload} />
        </section>
      </div>
    </main>
  );
}
