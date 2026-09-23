'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.12,
      staggerChildren: 0.12,
    },
  },
};

const revealItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.64, ease: [0.22, 1, 0.36, 1] },
  },
};

export function AnimatedHero() {
  const heroRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, isDesktop ? 112 : 28]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateViewport = () => setIsDesktop(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  return (
    <section ref={heroRef} className="relative flex min-h-[100svh] items-end overflow-hidden px-6 pb-16 pt-32 md:px-10 md:pb-24">
      <motion.div
        aria-hidden="true"
        className="absolute -inset-x-[8%] -inset-y-[7%]"
        style={{ y: reduceMotion ? 0 : imageY }}
      >
        <Image
          src="/editorial/casamento-hero.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[82%_center] sm:object-[72%_center] md:object-[62%_center]"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-black/20" />

      <motion.div
        className="relative mx-auto w-full max-w-7xl"
        variants={staggerContainer}
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
      >
        <div className="max-w-3xl">
          <motion.div variants={revealItem} className="mb-7 w-[min(100%,34rem)]">
            <Image
              src="/logo-sergio-pagliarini.png"
              alt="Sergio Pagliarini Fotografo"
              priority
              className="block h-auto w-full"
              width={1248}
              height={832}
              sizes="(min-width: 768px) 34rem, calc(100vw - 3rem)"
            />
          </motion.div>
          <motion.p variants={revealItem} className="eyebrow">Fotografia · Memórias · Momentos</motion.p>
          <motion.h1 variants={revealItem} className="mt-5 font-display text-5xl leading-[0.96] text-linen sm:text-6xl md:text-8xl lg:text-9xl">
            O instante passa.
            <span className="block italic text-gold">A história fica.</span>
          </motion.h1>
          <motion.p variants={revealItem} className="mt-7 max-w-xl text-base leading-7 text-zinc-200 md:text-lg">
            Fotografia sensível para celebrar pessoas, encontros e tudo aquilo que merece ser lembrado.
          </motion.p>
          <motion.div variants={revealItem} className="mt-9 flex flex-wrap gap-3">
            <Link className="button-primary" href="/contato">Contato</Link>
            <Link className="button-secondary bg-black/20 backdrop-blur-sm" href="/cliente">Área do cliente</Link>
          </motion.div>
          <motion.a variants={revealItem} href="https://www.instagram.com/sergiopagliarinifotografia/" target="_blank" rel="noreferrer" className="mt-6 inline-flex text-xs uppercase tracking-[0.16em] text-white/70 transition hover:text-gold">
            Instagram · @sergiopagliarinifotografia
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
}
