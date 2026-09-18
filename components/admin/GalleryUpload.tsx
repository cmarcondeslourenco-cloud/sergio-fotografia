'use client';

import { useState } from 'react';
import { validateImageInput } from '@/lib/image/validation';
import { originalObjectPath } from '@/lib/storage/paths';
import { createSupabaseBrowserClient } from '@/lib/supabase/config';

export function GalleryUpload({ galleryId, maxPhotos, initialPhotoCount = 0 }: { galleryId: string; maxPhotos?: number; initialPhotoCount?: number }) {
  const [files, setFiles] = useState<File[]>([]);
  const [inputKey, setInputKey] = useState(0);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'progress'>('progress');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  function chooseFiles(chosen: File[]) {
    try {
      const availableSlots = maxPhotos === undefined ? Infinity : Math.max(0, maxPhotos - initialPhotoCount);
      if (chosen.length > availableSlots) throw new Error(`Esta galeria permite no máximo ${maxPhotos} imagens. Restam ${availableSlots} vaga(s).`);
      chosen.forEach((file) => validateImageInput({ mime: file.type, size: file.size, filename: file.name }));
      if (new Set(chosen.map(file => file.name.toLowerCase())).size !== chosen.length) throw new Error('Existem nomes de arquivos repetidos na seleção.');
      setFiles(chosen);
      setStatus('');
      setProgress(0);
    } catch (error) {
      setFiles([]);
      setInputKey((current) => current + 1);
      setStatusType('error');
      setStatus(error instanceof Error ? error.message : 'Um dos arquivos não é válido.');
    }
  }

  async function upload() {
    const client = createSupabaseBrowserClient();
    if (!client || !files.length) {
      setStatusType('error');
      setStatus(client ? 'Selecione pelo menos uma imagem.' : 'Supabase não configurado.');
      return;
    }

    setBusy(true);
    setProgress(0);
    setStatusType('progress');
    let uploadedCount = 0;

    try {
      const existing = await client.from('photos').select('filename').eq('gallery_id', galleryId).in('filename', files.map(file => file.name));
      if (existing.error) throw new Error('Não foi possível verificar arquivos duplicados.');
      if (existing.data?.length) throw new Error('Um arquivo com este nome já existe na galeria. Renomeie antes de enviar.');
      const existingCover = await client.from('photos').select('id').eq('gallery_id', galleryId).eq('is_cover', true).limit(1);
      const existingFeatured = await client.from('photos').select('id').eq('gallery_id', galleryId).eq('is_featured', true).limit(5);
      let needsCover = !existingCover.data?.length;
      let featuredSlots = Math.max(0, 5 - (existingFeatured.data?.length ?? 0));

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setStatus(`Enviando ${index + 1} de ${files.length}: ${file.name}`);
        const photoId = crypto.randomUUID();
        const path = originalObjectPath(galleryId, photoId, file.name);
        const uploaded = await client.storage.from('photos-private').upload(path, file, {
          contentType: file.type,
          upsert: false,
          cacheControl: '3600',
        });
        if (uploaded.error) throw new Error(`Falha ao enviar ${file.name}.`);

        const inserted = await client.from('photos').insert({
          id: photoId,
          gallery_id: galleryId,
          filename: file.name,
          storage_path: path,
          size_bytes: file.size,
          format: file.type.replace('image/', ''),
          processing_status: 'pending',
          is_cover: needsCover,
          is_featured: featuredSlots > 0,
          sort_order: index,
        });
        if (inserted.error) {
          const cleanup = await client.storage.from('photos-private').remove([path]);
          throw new Error(cleanup.error ? `O arquivo ${file.name} não pôde ser cadastrado e permanece no Storage para conferência.` : `Não foi possível cadastrar ${file.name}; envio desfeito.`);
        }

        needsCover = false;
        featuredSlots = Math.max(0, featuredSlots - 1);
        uploadedCount += 1;
        setProgress(Math.round((uploadedCount / files.length) * 100));
      }

      setStatusType('success');
      setStatus(`${uploadedCount} ${uploadedCount === 1 ? 'arquivo enviado' : 'arquivos enviados'}. Agora processe as variantes.`);
      setFiles([]);
      setInputKey((current) => current + 1);
    } catch (error) {
      setStatusType('error');
      setStatus(error instanceof Error ? error.message : 'Falha durante o upload.');
    } finally {
      setBusy(false);
    }
  }

  async function process() {
    setBusy(true);
    setStatusType('progress');
    setStatus('Processando variantes otimizadas…');
    try {
      const response = await fetch('/api/process-gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ galleryId }),
      });
      const result = await response.json().catch(() => ({})) as { processed?: number; total?: number; failed?: number; error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Não foi possível processar as fotos.');
      setStatusType(result.failed ? 'error' : 'success');
      setStatus(`${result.processed ?? 0} de ${result.total ?? 0} foto(s) processada(s)${result.failed ? `; ${result.failed} com erro` : ''}.`);
      window.location.reload();
    } catch (error) {
      setStatusType('error');
      setStatus(error instanceof Error ? error.message : 'Falha no processamento.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border border-white/10 bg-surface p-6 md:p-9">
      <p className="eyebrow">Upload privado</p>
      <h2 className="mt-3 font-display text-3xl text-linen">Adicionar fotografias</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">JPEG, PNG ou WebP, até 150 MB por arquivo. Os originais permanecem privados e as versões de visualização são geradas separadamente.</p>
      <input
        key={inputKey}
        multiple
        accept="image/jpeg,image/png,image/webp"
        type="file"
        disabled={maxPhotos !== undefined && initialPhotoCount >= maxPhotos}
        onChange={(event) => chooseFiles(Array.from(event.target.files ?? []))}
        className="mt-7 block w-full border border-dashed border-white/15 p-4 text-sm text-zinc-400 file:mr-4 file:border-0 file:bg-gold file:px-4 file:py-3 file:text-xs file:font-semibold file:uppercase file:tracking-[0.12em] file:text-ink"
      />
      <div className="mt-4 flex items-center justify-between gap-4 text-sm text-zinc-400">
        <span>{files.length ? `${files.length} arquivo(s) selecionado(s)` : 'Nenhum arquivo selecionado'}</span>
        {progress > 0 && <span>{progress}%</span>}
      </div>
      {progress > 0 && <div className="mt-2 h-1 overflow-hidden bg-white/10"><div className="h-full bg-gold transition-[width]" style={{ width: `${progress}%` }} /></div>}
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" disabled={!files.length || busy} onClick={upload} className="button-primary">{busy ? 'Aguarde…' : 'Enviar para galeria'}</button>
        <button type="button" disabled={busy} onClick={process} className="button-secondary">Processar pendentes</button>
      </div>
      {status && <p role="status" aria-live="polite" className={`mt-5 text-sm ${statusType === 'error' ? 'text-red-300' : statusType === 'success' ? 'text-emerald-300' : 'text-gold'}`}>{status}</p>}
    </section>
  );
}
