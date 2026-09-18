'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

type Photo = { id: string; filename: string; url?: string; is_cover: boolean; is_featured: boolean; processing_status: string };

export function GalleryPhotos({ galleryId, photos: initialPhotos, isPortfolioGallery = false, maxFeaturedPhotos = 5 }: { galleryId: string; photos: Photo[]; isPortfolioGallery?: boolean; maxFeaturedPhotos?: number }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const selectedCount = selected.length;
  const allSelected = photos.length > 0 && selectedCount === photos.length;
  const selectedNames = useMemo(() => photos.filter((photo) => selected.includes(photo.id)).map((photo) => photo.filename), [photos, selected]);
  const featuredCount = photos.filter((photo) => photo.is_featured).length;

  async function toggleFeatured(photo: Photo) {
    if (!photo.is_featured && featuredCount >= maxFeaturedPhotos) {
      setStatus(`O looping permite no máximo ${maxFeaturedPhotos} fotos selecionadas.`);
      return;
    }
    setBusy(photo.id); setStatus('');
    const response = await fetch('/api/admin/gallery-featured', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ galleryId, photoId: photo.id, featured: !photo.is_featured }) });
    const result = await response.json().catch(() => ({}));
    if (response.ok) { setPhotos((current) => current.map((item) => item.id === photo.id ? { ...item, is_featured: !photo.is_featured } : item)); setStatus(photo.is_featured ? 'Foto removida do looping.' : 'Foto adicionada ao looping.'); }
    else setStatus(`Erro: ${result.error ?? 'Não foi possível atualizar os destaques.'}`);
    setBusy(null);
  }

  async function setCover(photoId: string) {
    setBusy(photoId); setStatus('');
    const response = await fetch('/api/admin/gallery-cover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ galleryId, photoId }) });
    const result = await response.json().catch(() => ({}));
    if (response.ok) { setPhotos((current) => current.map((photo) => ({ ...photo, is_cover: photo.id === photoId }))); setStatus('Capa da galeria atualizada.'); }
    else setStatus(`Erro: ${result.error ?? 'Não foi possível atualizar a capa.'}`);
    setBusy(null);
  }

  function toggle(photoId: string) { setSelected((current) => current.includes(photoId) ? current.filter((id) => id !== photoId) : [...current, photoId]); }
  function toggleAll() { setSelected(allSelected ? [] : photos.map((photo) => photo.id)); }

  async function deletePhotos(photoIds: string[]) {
    if (!photoIds.length) return;
    const label = photoIds.length === 1 ? `a foto "${selectedNames[0] ?? 'selecionada'}"` : `${photoIds.length} fotos selecionadas`;
    if (!window.confirm(`Excluir ${label}? Os originais e versões de visualização serão apagados permanentemente.`)) return;
    setBusy('delete'); setStatus('');
    try {
      const response = await fetch('/api/admin/gallery-photos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ galleryId, photoIds }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setStatus(`Erro: ${result.error ?? 'Não foi possível excluir as fotos.'}`); return; }
      setPhotos((current) => current.filter((photo) => !photoIds.includes(photo.id)));
      setSelected([]);
      setStatus(`${result.deleted ?? photoIds.length} ${photoIds.length === 1 ? 'foto excluída' : 'fotos excluídas'} permanentemente.`);
    } catch { setStatus('Erro: falha de conexão. Tente novamente.'); }
    finally { setBusy(null); }
  }

  return <section className="mt-10" aria-labelledby="gallery-photos-heading">
    <div className="flex flex-col gap-5 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-gold">Fotos carregadas</p><h2 id="gallery-photos-heading" className="mt-3 font-display text-3xl">{photos.length} {photos.length === 1 ? 'fotografia' : 'fotografias'} na galeria</h2></div>{photos.length > 0 && <div className="flex flex-wrap items-center gap-3"><label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-[#cba96b]" />Selecionar todas</label><button type="button" disabled={!selectedCount || busy !== null} onClick={() => deletePhotos(selected)} className="border border-red-400/50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-300 disabled:cursor-not-allowed disabled:opacity-40">{busy === 'delete' ? 'Excluindo…' : `Excluir seleção${selectedCount ? ` (${selectedCount})` : ''}`}</button></div>}</div>
    {status && <p role="status" className={`mt-4 text-sm ${status.startsWith('Erro:') ? 'text-red-300' : 'text-emerald-300'}`}>{status}</p>}
    {photos.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{photos.map((photo) => <figure key={photo.id} className={`border bg-surface p-3 transition-colors ${selected.includes(photo.id) ? 'border-gold' : 'border-white/10'}`}><div className="flex items-center justify-between gap-3"><label className="flex cursor-pointer items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-zinc-400"><input type="checkbox" checked={selected.includes(photo.id)} onChange={() => toggle(photo.id)} className="h-4 w-4 accent-[#cba96b]" />Selecionar</label><div className="flex gap-2">{photo.is_cover && <span className="text-[10px] uppercase tracking-[0.12em] text-gold">Capa</span>}{isPortfolioGallery && photo.is_featured && <span className="text-[10px] uppercase tracking-[0.12em] text-emerald-300">Looping</span>}</div></div>{photo.url && <Image src={photo.url} alt={photo.filename} width={800} height={600} className="mt-3 aspect-[4/3] w-full object-cover" unoptimized />}<figcaption className="pt-3 text-xs text-zinc-400"><p className="truncate">{photo.filename}</p><div className="mt-3 flex flex-wrap gap-2">{isPortfolioGallery && photo.processing_status === 'done' && <button type="button" onClick={() => toggleFeatured(photo)} disabled={busy !== null} className="border border-emerald-300/50 px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-emerald-300 disabled:opacity-40">{busy === photo.id ? 'Salvando…' : photo.is_featured ? 'Remover do looping' : 'Usar no looping'}</button>}{photo.processing_status === 'done' && !photo.is_cover && <button type="button" onClick={() => setCover(photo.id)} disabled={busy !== null} className="border border-gold px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-gold disabled:opacity-40">{busy === photo.id ? 'Salvando…' : 'Usar como capa'}</button>}<button type="button" onClick={() => { setSelected([photo.id]); deletePhotos([photo.id]); }} disabled={busy !== null} className="border border-red-400/50 px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-red-300 disabled:opacity-40">Excluir</button></div></figcaption></figure>)}</div> : <p className="mt-6 border border-dashed border-white/15 p-8 text-center text-sm text-zinc-500">Nenhuma foto nesta galeria.</p>}
  </section>;
}
