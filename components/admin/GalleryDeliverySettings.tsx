'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/config';

type Resolution = 'web' | 'full' | 'both';

export function GalleryDeliverySettings({
  galleryId,
  initialEnabled,
  initialResolution,
  initialToken,
}: {
  galleryId: string;
  initialEnabled: boolean;
  initialResolution: Resolution;
  initialToken?: string;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [resolution, setResolution] = useState(initialResolution);
  const [token, setToken] = useState(initialToken || '');
  const [origin, setOrigin] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');
  const [busy, setBusy] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);
  const link = token && origin ? `${origin}/c/${token}` : '';

  async function save() {
    const client = createSupabaseBrowserClient();
    if (!client) { setStatusType('error'); setStatus('Supabase não configurado.'); return; }
    setBusy(true);
    setStatus('');
    try {
      const { error } = await client.from('galleries').update({ download_enabled: enabled, download_resolution: resolution }).eq('id', galleryId);
      setStatusType(error ? 'error' : 'success');
      setStatus(error ? 'Não foi possível salvar as configurações.' : 'Configurações salvas.');
    } catch {
      setStatusType('error');
      setStatus('Falha de conexão ao salvar.');
    } finally {
      setBusy(false);
    }
  }

  async function generate(action: 'create' | 'regenerate' = 'create') {
    setBusy(true);
    setStatus('');
    try {
      const response = await fetch('/api/admin/gallery-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ galleryId, action }),
      });
      const data = await response.json().catch(() => ({})) as { token?: string; error?: string };
      if (!response.ok || !data.token) throw new Error(data.error ?? 'Não foi possível gerar o acesso.');
      setToken(data.token);
      setRevealed(false);
      setStatusType('success');
      setStatus(action === 'regenerate' ? 'Acesso anterior revogado e novo acesso gerado.' : 'Novo acesso privado gerado.');
    } catch (error) {
      setStatusType('error');
      setStatus(error instanceof Error ? error.message : 'Não foi possível gerar o acesso.');
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (!window.confirm('Revogar o acesso desta galeria? O link atual deixará de funcionar.')) return;
    setBusy(true);
    setStatus('');
    try {
      const response = await fetch('/api/admin/gallery-access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ galleryId, action: 'revoke' }) });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'Não foi possível revogar o acesso.');
      setToken('');
      setRevealed(false);
      setStatusType('success');
      setStatus('Acesso revogado.');
    } catch (error) {
      setStatusType('error');
      setStatus(error instanceof Error ? error.message : 'Não foi possível revogar o acesso.');
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setStatusType('success');
      setStatus('Link privado copiado.');
    } catch {
      setStatusType('error');
      setStatus('O navegador não permitiu copiar. Revele e copie o link manualmente.');
    }
  }

  return (
    <section className="mt-10 border border-gold/30 bg-surface p-6 md:p-9">
      <p className="eyebrow">Entrega ao cliente</p>
      <h2 className="mt-3 font-display text-3xl text-linen">Downloads e acesso privado</h2>
      <div className="mt-7 grid gap-6 md:grid-cols-2">
        <label className="flex min-h-12 items-center gap-3 border border-white/10 px-4 text-sm text-zinc-300">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="h-4 w-4 accent-[#d0ad72]" />
          Permitir downloads
        </label>
        <label className="text-sm text-zinc-300">
          Qualidade disponível
          <select value={resolution} onChange={(event) => setResolution(event.target.value as Resolution)} className="field mt-2">
            <option value="web">Somente Web</option>
            <option value="full">Somente original</option>
            <option value="both">Web e original</option>
          </select>
        </label>
      </div>
      <button type="button" disabled={busy} onClick={save} className="button-primary mt-6">Salvar configurações</button>

      <div className="mt-9 border-t border-white/10 pt-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-300">Link privado</p>
            <p className="mt-1 text-xs text-zinc-500">Trate este endereço como uma credencial de acesso.</p>
          </div>
          <button type="button" disabled={busy} onClick={() => generate(token ? 'regenerate' : 'create')} className="button-secondary">
            {token ? 'Regenerar acesso' : 'Criar acesso'}
          </button>
        </div>
        {token && (
          <div className="mt-5 border border-white/10 bg-black/20 p-4">
            <p className="break-all font-mono text-xs text-zinc-300">{revealed ? link : '••••••••••••••••••••••••'}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => setRevealed((current) => !current)} className="button-secondary">
                {revealed ? 'Ocultar link' : 'Revelar link'}
              </button>
              <button type="button" onClick={copyLink} className="button-primary">Copiar link</button>
              <button type="button" disabled={busy} onClick={revoke} className="button-secondary">Revogar acesso</button>
            </div>
          </div>
        )}
      </div>
      {status && <p role="status" aria-live="polite" className={`mt-5 text-sm ${statusType === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>{status}</p>}
    </section>
  );
}
