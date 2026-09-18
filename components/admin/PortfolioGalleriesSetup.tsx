'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function PortfolioGalleriesSetup({ missingCount }: { missingCount: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!missingCount) return null;
  async function createGalleries() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/portfolio-galleries', { method: 'POST' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setError(result.error ?? 'Não foi possível preparar as galerias.'); return; }
      router.refresh();
    } catch { setError('Falha de conexão. Tente novamente.'); }
    finally { setBusy(false); }
  }
  return <section className="mt-10 border border-gold/40 bg-gold/[0.06] p-6 md:p-8"><p className="eyebrow">Portfólio e página inicial</p><h2 className="mt-3 font-display text-3xl text-linen">Prepare as galerias públicas do site</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">Faltam {missingCount} das quatro galerias padrão. Ao preparar, Casamentos, Ensaios, Eventos e Astrofotografia entrarão no painel para receber até 25 imagens, com até cinco destaques no looping.</p><button type="button" onClick={createGalleries} disabled={busy} className="button-primary mt-6">{busy ? 'Preparando…' : 'Preparar galerias públicas'}</button>{error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}</section>;
}
