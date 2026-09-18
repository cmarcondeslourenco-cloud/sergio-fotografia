'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { portfolioLoopIntervalMs } from '@/lib/portfolio/config';

type Slide = { id: string; url: string; alt: string };

export function PublicPortfolioCarousel({ photos, className = '' }: { photos: Slide[]; className?: string }) {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    setActive((current) => Math.min(current, Math.max(photos.length - 1, 0)));
    if (photos.length < 2 || reduceMotion) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % photos.length), portfolioLoopIntervalMs);
    return () => window.clearInterval(timer);
  }, [photos.length, reduceMotion]);
  if (!photos.length) return null;
  const photo = photos[Math.min(active, photos.length - 1)];
  return <div className={`relative aspect-[4/3] overflow-hidden bg-surface sm:aspect-[16/9] ${className}`}>
    <Image src={photo.url} alt="" aria-hidden="true" fill sizes="(min-width: 1024px) 72rem, 100vw" className="scale-110 object-cover blur-2xl" unoptimized />
    <Image key={photo.id} src={photo.url} alt={photo.alt} fill sizes="(min-width: 1024px) 72rem, 100vw" className="object-contain transition-opacity duration-500" unoptimized priority />
    <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent pb-5 pt-12">{photos.map((item, index) => <button key={item.id} type="button" aria-label={`Mostrar imagem ${index + 1}`} aria-current={index === active ? 'true' : undefined} onClick={() => setActive(index)} className={`h-2.5 w-2.5 rounded-full border border-white/70 transition-colors ${index === active ? 'bg-gold' : 'bg-black/30 hover:bg-white/60'}`} />)}</div>
  </div>;
}
