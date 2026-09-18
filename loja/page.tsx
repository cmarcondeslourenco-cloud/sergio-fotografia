import { PhotoShop } from '@/components/client/PhotoShop';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export default async function ShopPage() {
  const admin = createSupabaseAdminClient();
  const result = admin ? await admin.from('photos').select('id,filename,caption,path_preview,price_cents,galleries!inner(active,visibility,published_at)').gt('price_cents', 0).eq('published', true).eq('processing_status', 'done').eq('galleries.active', true).eq('galleries.visibility', 'public').lte('galleries.published_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(500) : null;
  const photos = (await Promise.all((result?.data ?? []).map(async photo => {
    if (!photo.path_preview) return null;
    const signed = await admin!.storage.from('photos-private').createSignedUrl(photo.path_preview, 3600);
    return signed.data ? { id: photo.id, title: photo.caption || photo.filename, url: signed.data.signedUrl, price: photo.price_cents } : null;
  }))).filter((photo): photo is NonNullable<typeof photo> => photo !== null);
  return <main id="conteudo-principal" className="min-h-screen px-6 pb-24 pt-40"><div className="mx-auto max-w-7xl"><p className="eyebrow">Fotografias digitais</p><h1 className="mt-4 font-display text-5xl">Escolha suas fotografias.</h1><p className="mt-6 text-zinc-400">Original liberado após a confirmação do pagamento pelo fotógrafo.</p>{!result || result.error ? <p className="mt-8">Loja temporariamente indisponível.</p> : <PhotoShop photos={photos} />}</div></main>;
}
