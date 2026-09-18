'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Lightbox } from '@/components/lightbox/Lightbox';

type Photo = { id: string; url: string; alt: string };

export function PublicPortfolioPhotos({ photos }: { photos: Photo[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  return <>
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
      {photos.map((photo, index) => <button key={photo.id} type="button" className="group relative mb-4 block w-full break-inside-avoid overflow-hidden bg-surface text-left" onClick={() => setSelected(index)} aria-label={`Ampliar: ${photo.alt}`}><Image src={photo.url} alt={photo.alt} width={1600} height={1200} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="h-auto w-full" unoptimized /><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-5 pb-5 pt-14 text-[10px] uppercase tracking-[0.18em] text-gold opacity-100 transition sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">Ver fotografia</span></button>)}
    </div>
    <Lightbox photo={selected === null ? null : { src: photos[selected].url, alt: photos[selected].alt }} index={selected ?? 0} total={photos.length} onClose={() => setSelected(null)} onPrevious={() => setSelected((current) => current === null ? null : (current + photos.length - 1) % photos.length)} onNext={() => setSelected((current) => current === null ? null : (current + 1) % photos.length)} />
  </>;
}