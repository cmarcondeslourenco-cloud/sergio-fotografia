'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';

type LightboxPhoto = { src: string; alt: string; caption?: string; width?: number; height?: number };
type Props = {
  photo: LightboxPhoto | null;
  index?: number;
  total?: number;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
};

export function Lightbox({ photo, index = 0, total = 1, onClose, onPrevious, onNext }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!photo) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onPrevious?.();
      if (event.key === 'ArrowRight') onNext?.();

      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [photo, onClose, onPrevious, onNext]);

  if (!photo) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Visualização da fotografia"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm md:p-10"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="absolute left-5 top-5 text-[10px] uppercase tracking-[0.18em] text-white/60">{index + 1} / {total}</div>
      <button ref={closeRef} type="button" aria-label="Fechar visualização" className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center border border-white/20 text-2xl text-white transition hover:border-gold hover:text-gold" onClick={onClose}>×</button>
      {total > 1 && <button type="button" aria-label="Fotografia anterior" className="absolute bottom-5 left-5 z-10 flex h-11 w-11 items-center justify-center border border-white/20 text-3xl text-white transition hover:border-gold hover:text-gold md:bottom-auto md:top-1/2 md:-translate-y-1/2" onClick={onPrevious}>‹</button>}
      <figure className="flex max-h-full max-w-6xl flex-col items-center">
        <Image
          src={photo.src}
          alt={photo.alt}
          width={photo.width ?? 1600}
          height={photo.height ?? 1200}
          priority
          sizes="95vw"
          className="max-h-[78vh] w-auto max-w-full object-contain shadow-glow"
        />
        {photo.caption && <figcaption className="mt-5 text-center font-display text-lg text-zinc-300">{photo.caption}</figcaption>}
      </figure>
      {total > 1 && <button type="button" aria-label="Próxima fotografia" className="absolute bottom-5 right-5 z-10 flex h-11 w-11 items-center justify-center border border-white/20 text-3xl text-white transition hover:border-gold hover:text-gold md:bottom-auto md:top-1/2 md:-translate-y-1/2" onClick={onNext}>›</button>}
    </div>
  );
}
