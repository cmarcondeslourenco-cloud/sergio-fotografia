'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lightbox } from '@/components/lightbox/Lightbox';

type Photo = { id: string; title: string; url: string; price: number };
const money = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export function PhotoShop({ photos }: { photos: Photo[] }) {
  const router = useRouter();
  const [cart, setCart] = useState<string[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [orderToken, setOrderToken] = useState('');
  const items = photos.filter(photo => cart.includes(photo.id));
  function change(next: string[]) { setCart(next); setOrderToken(''); }
  async function checkout() {
    setBusy(true); setMessage('');
    const token = orderToken || Array.from(crypto.getRandomValues(new Uint8Array(32)), value => value.toString(16).padStart(2, '0')).join('');
    setOrderToken(token);
    try {
      const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, photoIds: cart }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      router.push(result.path);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha ao gerar pedido.'); }
    finally { setBusy(false); }
  }
  return <>
    <section className="my-8 border border-white/10 p-5" aria-label="Carrinho">
      <h2 className="font-display text-3xl">Carrinho · {items.length} fotos</h2>
      {items.map(photo => <div className="my-3 flex items-center gap-4" key={photo.id}><Image src={photo.url} alt="" width={56} height={56} className="h-14 w-14 object-contain" /><span className="min-w-0 flex-1 break-words">{photo.title} · {money(photo.price)}</span><button disabled={busy} className="button-secondary" onClick={() => change(cart.filter(id => id !== photo.id))}>Remover</button></div>)}
      <p className="my-4">Total: {money(items.reduce((sum, item) => sum + item.price, 0))}</p>
      <div className="flex flex-wrap gap-3"><button disabled={busy || !items.length} onClick={checkout} className="button-primary">Gerar Pix</button><button disabled={busy} onClick={() => change([])} className="button-secondary">Esvaziar carrinho</button></div>
      {message && <p role="alert" className="mt-4 text-amber-200">{message}</p>}
    </section>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{photos.map((photo, index) => <article key={photo.id} className="border border-white/10 p-4"><button className="relative block aspect-[4/3] w-full" onClick={() => setActive(index)} aria-label={`Ampliar ${photo.title}`}><Image src={photo.url} alt={photo.title} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-contain" draggable={false} onContextMenu={event => event.preventDefault()} /></button><h2 className="mt-4 break-words">{photo.title}</h2><p className="my-3 text-sm text-zinc-400">Arquivo digital · {photo.id.slice(0, 8)} · {money(photo.price)}</p><button disabled={busy || cart.includes(photo.id) || cart.length >= 100} onClick={() => change([...cart, photo.id])} className="button-primary">{cart.includes(photo.id) ? 'Adicionada' : 'Adicionar'}</button></article>)}</div>
    {!photos.length && <p>Nenhuma fotografia à venda no momento.</p>}
    <Lightbox photo={active === null ? null : { src: photos[active].url, alt: photos[active].title }} index={active ?? 0} total={photos.length} onClose={() => setActive(null)} onPrevious={() => setActive(current => current === null ? null : (current + photos.length - 1) % photos.length)} onNext={() => setActive(current => current === null ? null : (current + 1) % photos.length)} />
  </>;
}
