'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function PixPayment({ code }: { code: string }) {
  const [message, setMessage] = useState('');
  const router = useRouter();
  return <div className="max-w-xl"><label className="block">Pix Copia e Cola<textarea readOnly value={code} className="field mt-3 h-32 text-xs" /></label><div className="mt-4 flex flex-wrap gap-3"><button className="button-primary" onClick={async () => { try { await navigator.clipboard.writeText(code); setMessage('Código copiado.'); } catch { setMessage('Selecione e copie o código acima.'); } }}>Copiar Pix</button><button className="button-secondary" onClick={() => router.refresh()}>Verificar confirmação</button></div><p role="status" className="mt-3">{message}</p><p className="mt-4 text-sm text-zinc-400">A confirmação é manual. Guarde o link desta página para acompanhar seu pedido e baixar os originais.</p></div>;
}
