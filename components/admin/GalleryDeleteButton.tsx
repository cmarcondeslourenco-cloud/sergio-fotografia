'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function GalleryDeleteButton({ galleryId, galleryTitle }: { galleryId: string; galleryTitle: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function deleteGallery() {
    if (!window.confirm(`Excluir a galeria "${galleryTitle}"? Esta ação apaga as fotos, os links de acesso e não pode ser desfeita.`)) return;
    setDeleting(true);
    setError('');
    try {
      const response = await fetch('/api/admin/gallery', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ galleryId }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? 'Não foi possível excluir a galeria.');
        return;
      }
      router.refresh();
    } catch {
      setError('Falha de conexão. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="md:col-span-4">
      <button type="button" onClick={deleteGallery} disabled={deleting} className="text-xs font-semibold uppercase tracking-[0.12em] text-red-300 transition-colors hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60">
        {deleting ? 'Excluindo…' : 'Excluir galeria'}
      </button>
      {error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}
