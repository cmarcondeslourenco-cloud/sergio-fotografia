import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SalesControls } from '@/components/admin/SalesControls';
export const metadata = { robots: { index: false, follow: false } };
export default async function SalesPage() {
  const client = await createSupabaseServerClient();
  const [orders, photos, selections] = client ? await Promise.all([
    client.from('photo_orders').select('id,status,total_cents,created_at,expires_at,photo_order_items(filename)').order('created_at', { ascending: false }).limit(200),
    client.from('photos').select('id,filename,caption,published,price_cents,galleries!inner(title,visibility,slug)').eq('galleries.visibility', 'public').eq('processing_status','done').order('created_at',{ascending:false}).limit(500),
    client.from('gallery_selections').select('id,client_name,photo_ids,finalized_at,galleries(title,slug)').order('finalized_at', { ascending: false }).limit(200),
  ]) : [null,null,null];
  const selectedIds = [...new Set((selections?.data ?? []).flatMap(selection => selection.photo_ids as string[]))];
  const selectedPhotos = client && selectedIds.length ? await client.from('photos').select('id,filename').in('id',selectedIds) : null;
  const filenames = new Map((selectedPhotos?.data ?? []).map(photo => [photo.id,photo.filename]));
  return <main id="conteudo-principal" className="min-h-screen px-6 pb-24 pt-40"><div className="mx-auto max-w-5xl"><h1 className="font-display text-5xl">Vendas e seleções</h1><div className="my-6 flex flex-wrap gap-3"><Link className="button-secondary" href="/loja">Abrir loja</Link><Link className="button-secondary" href="/admin/galerias/astrofotografia">Administrar vitrine da Home</Link></div><p className="mb-8 max-w-3xl text-sm leading-6 text-zinc-400">A vitrine da Home reutiliza a galeria Astrofotografia: mantenha nela até cinco fotos ativas, destacadas e com preço para o looping comercial. Originais continuam privados; a loja usa apenas previews assinados.</p>
    <h2 className="my-6 font-display text-3xl">Seleções finalizadas</h2>
    {selections?.error ? <p>Seleções indisponíveis. Verifique a migração do banco.</p> : selections?.data?.length ? selections.data.map(selection => { const gallery = selection.galleries as unknown as { title: string; slug: string }; return <article className="mb-4 border border-gold/30 p-5" key={selection.id}><h3>{selection.client_name} · {gallery?.title}</h3><p>{selection.photo_ids.length} favoritas · {new Date(selection.finalized_at).toLocaleString('pt-BR')}</p><Link className="text-gold" href={`/admin/galerias/${gallery?.slug}`}>Abrir galeria</Link><ul className="mt-3 text-xs text-zinc-400">{selection.photo_ids.map((id: string) => <li key={id}>{filenames.get(id) ?? id}</li>)}</ul></article>; }) : <p>Nenhuma seleção finalizada.</p>}
    <h2 className="my-6 font-display text-3xl">Pedidos</h2>
    {orders?.error ? <p>Pedidos indisponíveis. Verifique a migração do banco.</p> : orders?.data?.length ? orders.data.map(order => <article className="mb-4 border border-white/10 p-5" key={order.id}><h3>Pedido {order.id.slice(0,8)} · {({pending:'Aguardando pagamento',paid:'Pago',cancelled:'Cancelado'} as Record<string,string>)[order.status]}</h3><p>{(order.total_cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} · {new Date(order.created_at).toLocaleString('pt-BR')}</p><p className="my-2 text-sm">{order.photo_order_items.map(item => item.filename).join(', ')}</p>{order.status === 'pending' && <SalesControls orderId={order.id} />}</article>) : <p>Nenhum pedido.</p>}
    <h2 className="my-6 font-display text-3xl">Fotografias à venda</h2><p className="mb-5 text-sm text-zinc-400">Defina um preço para disponibilizar uma foto pública na loja. Apague o preço para retirar da venda.</p>
    {photos?.error ? <p>Preços indisponíveis. Verifique a migração do banco.</p> : photos?.data?.map(photo => <article key={photo.id} className="mb-4 border border-white/10 p-5"><h3>{photo.filename} · {photo.id.slice(0,8)}</h3><SalesControls photoId={photo.id} price={photo.price_cents} caption={photo.caption} published={photo.published} /></article>)}
  </div></main>;
}
