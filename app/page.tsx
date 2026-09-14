import Image from 'next/image';
import Link from 'next/link';
import { categorySlugs, demoPhotos } from '@/lib/demo-photos';

const principles = [
  ['01', 'Presença antes da pose', 'Direção leve para que pessoas e histórias continuem reconhecíveis nas imagens.'],
  ['02', 'Entrega sem atrito', 'Galerias privadas organizadas para selecionar, rever e baixar com tranquilidade.'],
  ['03', 'Memória em alta qualidade', 'Originais preservados e uma experiência responsiva em qualquer tela.'],
];

export default function HomePage() {
  return (
    <main id="conteudo-principal">
      <section className="relative flex min-h-[100svh] items-end overflow-hidden px-6 pb-16 pt-32 md:px-10 md:pb-24">
        <Image
          src="/editorial/casamento-hero.webp"
          alt="Casal caminhando em uma paisagem ao pôr do sol"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[63%_center] sm:object-[68%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-black/20" />

        <div className="relative mx-auto w-full max-w-7xl">
          <div className="max-w-3xl">
            <p className="eyebrow">Fotografia · Histórias · Momentos</p>
            <h1 className="mt-5 font-display text-5xl leading-[0.96] text-linen sm:text-6xl md:text-8xl lg:text-9xl">
              O instante passa.
              <span className="block italic text-gold">A história fica.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-zinc-200 md:text-lg">
              Fotografia sensível para celebrar pessoas, encontros e tudo aquilo que merece ser lembrado.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link className="button-primary" href="/portfolio">Conhecer o portfólio</Link>
              <Link className="button-secondary bg-black/20 backdrop-blur-sm" href="/contato">Conversar sobre uma história</Link>
            </div>
          </div>
          <p className="mt-12 text-[10px] uppercase tracking-[0.2em] text-white/55">Imagem conceitual de demonstração</p>
        </div>
      </section>

      <section className="px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <p className="eyebrow">Histórias em imagens</p>
              <h2 className="mt-4 max-w-xl font-display text-4xl leading-tight text-linen md:text-6xl">Cada encontro pede um olhar diferente.</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-zinc-400 lg:justify-self-end">
              Uma narrativa visual construída com espaço, luz e verdade — da celebração mais intensa ao silêncio de um retrato.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:auto-rows-[18rem] lg:grid-cols-4">
            {demoPhotos.map((photo, index) => (
              <Link
                key={photo.src}
                href={`/${categorySlugs[photo.category]}`}
                className={`group relative overflow-hidden ${
                  index === 0
                    ? 'aspect-[4/3] sm:col-span-2 sm:aspect-[16/9] lg:aspect-auto lg:row-span-2'
                    : index === 3
                      ? 'aspect-[4/3] sm:col-span-2 sm:aspect-[16/9] lg:aspect-auto lg:col-span-2'
                      : 'aspect-[4/5] sm:aspect-[4/5] lg:aspect-auto'
                }`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes={index === 0 ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 25vw, 50vw'}
                  className="object-cover transition duration-700 ease-out group-hover:scale-[1.035]"
                  style={{ objectPosition: photo.position }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-gold">{String(index + 1).padStart(2, '0')}</p>
                    <h3 className="mt-2 font-display text-2xl text-white">{photo.category}</h3>
                  </div>
                  <span aria-hidden="true" className="translate-x-2 text-2xl text-white/70 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">↗</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-surface px-6 py-24 md:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow">Uma experiência completa</p>
          <div className="mt-10 grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-3">
            {principles.map(([number, title, description]) => (
              <article key={number} className="bg-surface p-7 md:p-9">
                <span className="font-display text-3xl text-gold/60">{number}</span>
                <h3 className="mt-8 font-display text-2xl text-linen">{title}</h3>
                <p className="mt-4 text-sm leading-6 text-zinc-400">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 text-center md:px-10 md:py-32">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow">Vamos criar memória</p>
          <h2 className="mt-5 font-display text-4xl leading-tight text-linen md:text-6xl">Sua história merece ser sentida outra vez.</h2>
          <p className="mx-auto mt-6 max-w-xl leading-7 text-zinc-400">Conte um pouco sobre o momento que você está planejando. A conversa começa sem compromisso.</p>
          <Link className="button-primary mt-9" href="/contato">Iniciar uma conversa</Link>
        </div>
      </section>
    </main>
  );
}
