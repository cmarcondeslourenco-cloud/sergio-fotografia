'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Lightbox } from '@/components/lightbox/Lightbox';

type Photo = { id: string; previewUrl: string; alt: string };

function downloadFilename(response: Response, fallback: string) {
  const disposition = response.headers.get('content-disposition') ?? '';
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = disposition.match(/filename="([^"]+)"/i)?.[1];
  if (encoded) {
    try { return decodeURIComponent(encoded); } catch { return fallback; }
  }
  return plain || fallback;
}

export function RealClientGallery({
  photos,
  token,
  downloadsEnabled = true,
  allowOriginalDownload = true,
}: {
  photos: Photo[];
  token: string;
  downloadsEnabled?: boolean;
  allowOriginalDownload?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [activePhoto, setActivePhoto] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'progress'>('progress');
  const allSelected = photos.length > 0 && selected.length === photos.length;
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function downloadFiles(photoIds?: string[]) {
    setDownloading(true);
    setMessageType('progress');
    setMessage('Preparando os arquivos originais…');
    try {
      const response = await fetch('/api/client-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, photoIds }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? 'Não foi possível preparar o download.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadFilename(response, photoIds?.length === 1 ? 'fotografia-original' : 'fotografias-originais.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessageType('success');
      setMessage('Download iniciado com sucesso.');
    } catch (error) {
      setMessageType('error');
      setMessage(error instanceof Error ? error.message : 'Erro ao preparar o download.');
    } finally {
      setDownloading(false);
    }
  }

  const lightboxPhoto = activePhoto === null ? null : {
    src: photos[activePhoto].previewUrl,
    alt: photos[activePhoto].alt,
    caption: photos[activePhoto].alt,
  };

  return (
    <div>
      <div className="relative z-20 mb-8 border border-white/10 bg-surface/95 p-5 shadow-glow backdrop-blur md:sticky md:top-[76px] md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">Galeria privada</p>
            <p className="mt-2 text-sm text-zinc-400">
              {photos.length} {photos.length === 1 ? 'fotografia' : 'fotografias'} · {selected.length} selecionada(s)
            </p>
          </div>
          <div className="grid gap-2 sm:flex sm:flex-wrap">
            <button type="button" onClick={() => setSelected(allSelected ? [] : photos.map((photo) => photo.id))} className="button-secondary w-full sm:w-auto">
              {allSelected ? 'Limpar seleção' : 'Selecionar todas'}
            </button>
            {allowOriginalDownload && downloadsEnabled && (
              <>
                <button type="button" disabled={!selected.length || downloading} onClick={() => downloadFiles(selected)} className="button-primary w-full sm:w-auto">
                  Baixar selecionadas ({selected.length})
                </button>
                <button type="button" disabled={!photos.length || downloading} onClick={() => downloadFiles()} className="button-secondary w-full sm:w-auto">
                  Baixar galeria
                </button>
              </>
            )}
          </div>
        </div>
        {!downloadsEnabled || !allowOriginalDownload ? (
          <p className="mt-4 text-sm text-amber-200">Os downloads em qualidade original estão desativados pelo fotógrafo para esta galeria.</p>
        ) : null}
        {message && (
          <p
            className={`mt-4 text-sm ${messageType === 'error' ? 'text-red-300' : messageType === 'success' ? 'text-emerald-300' : 'text-gold'}`}
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
        )}
      </div>

      {photos.length ? (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {photos.map((photo, index) => (
            <figure key={photo.id} className={`group relative mb-4 break-inside-avoid overflow-hidden bg-surface ${selectedSet.has(photo.id) ? 'ring-2 ring-gold ring-offset-2 ring-offset-ink' : ''}`}>
              <button type="button" className="block w-full" onClick={() => setActivePhoto(index)} aria-label={`Ampliar ${photo.alt}`}>
                <Image src={photo.previewUrl} alt={photo.alt} width={1200} height={800} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="h-auto w-full transition duration-500 group-hover:scale-[1.015]" unoptimized />
              </button>
              <button type="button" onClick={() => toggle(photo.id)} aria-pressed={selectedSet.has(photo.id)} className="absolute right-3 top-3 border border-white/20 bg-black/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur hover:border-gold hover:text-gold">
                {selectedSet.has(photo.id) ? 'Selecionada ✓' : 'Selecionar'}
              </button>
              {allowOriginalDownload && downloadsEnabled && (
                <button type="button" disabled={downloading} onClick={() => downloadFiles([photo.id])} className="absolute bottom-3 left-3 border border-white/20 bg-black/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur hover:border-gold hover:text-gold disabled:opacity-40">
                  Baixar original
                </button>
              )}
            </figure>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-white/15 px-6 py-16 text-center text-zinc-500">Nenhuma fotografia publicada nesta galeria.</div>
      )}

      <Lightbox
        photo={lightboxPhoto}
        index={activePhoto ?? 0}
        total={photos.length}
        onClose={() => setActivePhoto(null)}
        onPrevious={() => setActivePhoto((current) => current === null ? null : (current + photos.length - 1) % photos.length)}
        onNext={() => setActivePhoto((current) => current === null ? null : (current + 1) % photos.length)}
      />
    </div>
  );
}
