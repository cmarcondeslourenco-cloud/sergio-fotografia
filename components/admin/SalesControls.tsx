'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function SalesControls({ photoId, price, orderId }: { photoId?: string; price?: number | null; orderId?: string }) {
  const [value, setValue] = useState(price ? (price / 100).toFixed(2) : '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  async function save(action: 'price' | 'paid' | 'cancelled') {
    if (action === 'paid' && !window.confirm('Confirme somente após conferir o recebimento no banco. Liberar os originais deste pedido?')) return;
    if (action === 'cancelled' && !window.confirm('Cancelar este pedido pendente?')) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/admin/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action === 'price' ? { action, photoId, cents: value ? Math.round(Number(value.replace(',', '.')) * 100) : null } : { action, orderId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage('Salvo.'); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha ao salvar.'); }
    finally { setBusy(false); }
  }
  return <div className="mt-3"><div className="flex flex-wrap gap-3">{photoId ? <><label className="text-sm">Preço (R$)<input className="field mt-1 max-w-40" inputMode="decimal" value={value} onChange={event => setValue(event.target.value)} placeholder="Sem venda" /></label><button disabled={busy} className="button-secondary" onClick={() => save('price')}>Salvar preço</button></> : <><button disabled={busy} className="button-primary" onClick={() => save('paid')}>Confirmar recebimento</button><button disabled={busy} className="button-secondary" onClick={() => save('cancelled')}>Cancelar pedido</button></>}</div><p role="status" className="mt-2 text-sm">{message}</p></div>;
}
