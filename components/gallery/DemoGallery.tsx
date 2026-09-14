'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Lightbox } from '@/components/lightbox/Lightbox';
import { demoPhotos, type DemoPhoto } from '@/lib/demo-photos';

export function DemoGallery({ photos = demoPhotos }: { photos?: DemoPhoto[] }) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {photos.map((photo, index) => (
          <button
            key={`${photo.src}-${photo.category}`}
            type="button"
            className="group relative mb-4 block w-full break-inside-avoid overflow-hidden bg-surface text-left"
            onClick={() => setSelected(index)}
            aria-label={`Ampliar: ${photo.caption}`}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              priority={index === 0}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="h-auto w-full transition duration-700 ease-out group-hover:scale-[1.025]"
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-5 pb-5 pt-14 opacity-100 transition duration-300 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-visible:translate-y-0 sm:group-focus-visible:opacity-100">
              <span className="block text-[10px] uppercase tracking-[0.18em] text-gold">{photo.category}</span>
              <span className="mt-1 block font-display text-xl text-white">{photo.caption}</span>
            </span>
          </button>
        ))}
      </div>
      <Lightbox
        photo={selected === null ? null : photos[selected]}
        index={selected ?? 0}
        total={photos.length}
        onClose={() => setSelected(null)}
        onPrevious={() => setSelected((current) => current === null ? null : (current + photos.length - 1) % photos.length)}
        onNext={() => setSelected((current) => current === null ? null : (current + 1) % photos.length)}
      />
    </>
  );
}
