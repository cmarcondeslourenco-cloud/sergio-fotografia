'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SalesControls({
  photoId,
  price,
  caption,
  published = true,
  orderId,
}: {
  photoId?: string;
  price?: number | null;
  caption?: string | null;
  published?: boolean;
  orderId?: string;
}) {
  const [value, setValue] = useState(price ? (price / 100).toFixed(2) : '');
  const [title, setTitle] = useState(caption ?? '');
  const [isPublished, setIsPublished] = useState(published);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  async function save(action: 'photo' | 'paid' | 'cancelled') {
    if (action === 'paid' && !window.confirm('Confirme somente após conferir o recebimento no banco. Liberar os originais deste pedido?')) return;
    if (action === 'cancelled' && !window.confirm('Cancelar este pedido pendente?')) return;

    const normalized = value.trim().replace(',', '.');
    const numericPrice = normalized ? Number(normalized) : null;
    const cents = numericPrice === null ? null : Math.round(numericPrice * 100);
    if (action === 'photo' && numericPrice !== null && (!Number.isFinite(numericPrice) || cents === null || cents < 1)) {
      setMessage('Informe um preço válido ou deixe o campo vazio para retirar da venda.');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          action === 'photo'
            ? { action, photoId, cents, caption: title.trim() || null, published: isPublished }
            : { action, orderId },
        ),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage('Salvo.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao salvar.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="mt-3">
    <div className="flex flex-wrap gap-3">
      {photoId ? <>
        <label className="min-w-[16rem] flex-1 text-sm">
          Título da fotografia
          <input className="field mt-1 w-full" value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} placeholder="Usa o nome do arquivo quando vazio" />
        </label>
        <label className="text-sm">
          Preço (R$)
          <input className="field mt-1 max-w-40" inputMode="decimal" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Sem venda" />
        </label>
        <label className="flex items-center gap-2 self-end pb-3 text-sm">
          <input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} className="h-4 w-4 accent-[#cba96b]" />
          Disponível publicamente
        </label>
        <button disabled={busy} className="button-secondary self-end" onClick={() => save('photo')}>Salvar fotografia</button>
      </> : <>
        <button disabled={busy} className="button-primary" onClick={() => save('paid')}>Confirmar recebimento</button>
        <button disabled={busy} className="button-secondary" onClick={() => save('cancelled')}>Cancelar pedido</button>
      </>}
    </div>
    <p role="status" className="mt-2 text-sm">{message}</p>
  </div>;
}
