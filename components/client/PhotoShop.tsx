'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lightbox } from '@/components/lightbox/Lightbox';

type Photo = { id: string; title: string; url: string; price: number };
const storageKey = 'sergio-fotografia:shop-selection';
const money = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function PhotoShop({ photos }: { photos: Photo[] }) {
  const router = useRouter();
  const [cart, setCart] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [orderToken, setOrderToken] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]');
      const available = new Set(photos.map((photo) => photo.id));
      if (Array.isArray(saved)) setCart(saved.filter((id): id is string => typeof id === 'string' && available.has(id)).slice(0, 100));
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      setHydrated(true);
    }
  }, [photos]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart, hydrated]);

  const items = useMemo(() => photos.filter((photo) => cart.includes(photo.id)), [photos, cart]);
  const allSelected = photos.length > 0 && photos.every((photo) => cart.includes(photo.id));
  const total = items.reduce((sum, item) => sum + item.price, 0);

  function change(next: string[]) {
    setCart([...new Set(next)].slice(0, 100));
    setOrderToken('');
    setMessage('');
  }

  function toggle(photoId: string) {
    change(cart.includes(photoId) ? cart.filter((id) => id !== photoId) : [...cart, photoId]);
  }

  function selectAll() {
    change(allSelected ? [] : photos.slice(0, 100).map((photo) => photo.id));
  }

  async function checkout() {
    if (!cart.length) return;
    setBusy(true);
    setMessage('');
    const token = orderToken || Array.from(crypto.getRandomValues(new Uint8Array(32)), value => value.toString(16).padStart(2, '0')).join('');
    setOrderToken(token);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, photoIds: cart }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      router.push(result.path);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao gerar pedido.');
    } finally {
      setBusy(false);
    }
  }

  return <>
    <section className="my-8 border border-white/10 bg-surface/50 p-5" aria-label="Seleção de fotografias">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Vendas e seleções</p>
          <h2 className="mt-2 font-display text-3xl">{items.length} {items.length === 1 ? 'fotografia selecionada' : 'fotografias selecionadas'}</h2>
          <p className="mt-2 text-sm text-zinc-400">Sua seleção fica salva neste navegador enquanto você navega pela loja.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={busy || !photos.length} onClick={selectAll} className="button-secondary">{allSelected ? 'Desmarcar todas' : 'Selecionar todas'}</button>
          <button type="button" disabled={busy || !items.length} onClick={() => change([])} className="button-secondary">Limpar seleção</button>
        </div>
      </div>

      {items.length > 0 && <div className="mt-6 border-t border-white/10 pt-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((photo) => <div className="flex items-center gap-4" key={photo.id}>
            <Image src={photo.url} alt="" width={56} height={56} className="h-14 w-14 object-contain" />
            <span className="min-w-0 flex-1 break-words text-sm">{photo.title} · {money(photo.price)}</span>
            <button type="button" disabled={busy} className="text-xs uppercase tracking-[0.12em] text-gold" onClick={() => toggle(photo.id)}>Remover</button>
          </div>)}
        </div>
        <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg">Total: <strong>{money(total)}</strong></p>
          <button disabled={busy || !items.length} onClick={checkout} className="button-primary">{busy ? 'Gerando…' : 'Gerar Pix'}</button>
        </div>
      </div>}
      {message && <p role="alert" className="mt-4 text-amber-200">{message}</p>}
    </section>

    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {photos.map((photo, index) => {
        const selected = cart.includes(photo.id);
        return <article key={photo.id} className={`border p-4 transition-colors ${selected ? 'border-gold bg-gold/[0.06]' : 'border-white/10'}`}>
          <button className="relative block aspect-[4/3] w-full" onClick={() => setActive(index)} aria-label={`Ampliar ${photo.title}`}>
            <Image src={photo.url} alt={photo.title} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-contain" draggable={false} onContextMenu={event => event.preventDefault()} />
          </button>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="break-words">{photo.title}</h2>
              <p className="mt-2 text-sm text-zinc-400">Arquivo digital · {photo.id.slice(0, 8)} · {money(photo.price)}</p>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
              <input type="checkbox" checked={selected} disabled={busy || (!selected && cart.length >= 100)} onChange={() => toggle(photo.id)} className="h-4 w-4 accent-[#cba96b]" />
              {selected ? 'Selecionada' : 'Selecionar'}
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => setActive(index)} className="button-secondary">Visualizar</button>
            <button type="button" disabled={busy || (!selected && cart.length >= 100)} onClick={() => toggle(photo.id)} className={selected ? 'button-secondary' : 'button-primary'}>{selected ? 'Remover da seleção' : 'Adicionar à seleção'}</button>
          </div>
        </article>;
      })}
    </div>

    {!photos.length && <p>Nenhuma fotografia à venda no momento.</p>}
    <Lightbox
      photo={active === null ? null : { src: photos[active].url, alt: photos[active].title }}
      index={active ?? 0}
      total={photos.length}
      onClose={() => setActive(null)}
      onPrevious={() => setActive(current => current === null ? null : (current + photos.length - 1) % photos.length)}
      onNext={() => setActive(current => current === null ? null : (current + 1) % photos.length)}
    />
  </>;
}
