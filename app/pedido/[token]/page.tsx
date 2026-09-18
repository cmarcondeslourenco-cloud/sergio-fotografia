import { createHash } from 'node:crypto';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { pixPayload } from '@/lib/pix';
import { PixPayment } from '@/components/client/PixPayment';
import { RealClientGallery } from '@/components/client/RealClientGallery';
export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };
export default async function OrderPage({ params: promisedParams }: { params: Promise<{ token: string }> }) {
  const params = await promisedParams;
  if (!/^[a-f0-9]{64}$/.test(params.token)) notFound();
  const admin = createSupabaseAdminClient();
  if (!admin) notFound();
  const { data: order } = await admin.from('photo_orders').select('id,status,total_cents,pix_config,expires_at').eq('token_hash', createHash('sha256').update(params.token).digest('hex')).maybeSingle();
  if (!order) notFound();
  const expired = new Date(order.expires_at) <= new Date();
  const { data: items } = await admin.from('photo_order_items').select('photo_id,filename,price_cents,photos(path_preview)').eq('order_id', order.id);
  const photos = (await Promise.all((items ?? []).map(async item => {
    const photo = item.photos as unknown as { path_preview: string | null };
    if (!photo?.path_preview) return null;
    const signed = await admin.storage.from('photos-private').createSignedUrl(photo.path_preview, 3600);
    return signed.data ? { id: item.photo_id, alt: item.filename, previewUrl: signed.data.signedUrl } : null;
  }))).filter((photo): photo is NonNullable<typeof photo> => photo !== null);
  const code = order.status === 'pending' && !expired ? pixPayload(order.pix_config, order.total_cents, order.id) : null;
  const qr = code ? await QRCode.toDataURL(code, { width: 320, margin: 4, errorCorrectionLevel: 'M' }) : null;
  return <main id="conteudo-principal" className="min-h-screen px-6 pb-24 pt-40"><div className="mx-auto max-w-5xl"><p className="eyebrow">Pedido {order.id.slice(0, 8)}</p><h1 className="mt-4 font-display text-5xl">{expired ? 'Acesso expirado' : order.status === 'paid' ? 'Pagamento confirmado' : order.status === 'cancelled' ? 'Pedido cancelado' : 'Aguardando pagamento'}</h1><p className="my-6">{items?.length ?? 0} fotografias digitais · {(order.total_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p><ul className="mb-6">{items?.map(item => <li key={item.photo_id}>{item.filename} · {(item.price_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</li>)}</ul>{code && qr && <><Image className="mb-6" src={qr} alt="QR Code para pagamento Pix" width={320} height={320} unoptimized /><PixPayment code={code} /></>}{order.status === 'paid' && !expired && <RealClientGallery photos={photos} token={params.token} favoritesEnabled={false} downloadEndpoint="/api/order-download" />}</div></main>;
}
