import Link from 'next/link';
import { AnimatedHero } from '@/components/home/AnimatedHero';
import { PortfolioGallery } from '@/components/gallery/PortfolioGallery';
import { normalizeCategory, type PortfolioCategory } from '@/lib/demo-photos';
import { portfolioGalleries } from '@/lib/portfolio/config';

const homeCategories: Array<{ category: PortfolioCategory; slug: string }> = portfolioGalleries.map(({ title, slug }) => ({ category: title, slug }));

const principles = [
  ['01', 'Presença antes da pose', 'Direção leve para que pessoas e histórias continuem reconhecíveis nas imagens.'],
  ['02', 'Entrega sem atrito', 'Galerias privadas organizadas para selecionar, rever e baixar com tranquilidade.'],
  ['03', 'Memória em alta qualidade', 'Originais preservados e uma experiência responsiva em qualquer tela.'],
];

const portfolioFilters: Array<'Todos' | PortfolioCategory> = ['Todos', 'Casamentos', 'Ensaios', 'Eventos', 'Loja'];

export default async function HomePage({ searchParams: promisedSearchParams }: { searchParams?: Promise<{ categoria?: string }> }) {
  const searchParams = await promisedSearchParams;
  const selected = normalizeCategory(searchParams?.categoria);
  const visibleCategories = selected ? homeCategories.filter(({ category }) => category === selected) : homeCategories;

  return (
    <main id="conteudo-principal">
      <AnimatedHero />

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

          <nav id="portfolio" className="mt-12 flex flex-wrap gap-2" aria-label="Filtros do portfólio">
            {portfolioFilters.map((filter) => {
              const href = filter === 'Todos' ? '/#portfolio' : `/?categoria=${filter.toLowerCase()}#portfolio`;
              const isActive = selected === filter || (!selected && filter === 'Todos');
              return <Link key={filter} href={href} aria-current={isActive ? 'page' : undefined} className={`border px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${isActive ? 'border-gold bg-gold text-ink' : 'border-white/10 text-zinc-400 hover:border-gold hover:text-gold'}`}>{filter}</Link>;
            })}
          </nav>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:auto-rows-[18rem] lg:grid-cols-4">
            {visibleCategories.map(({ category, slug }, index) => (
              <div
                key={category}
                className={`group relative overflow-hidden ${
                  index === 0
                    ? 'aspect-[4/3] sm:col-span-2 sm:aspect-[16/9] lg:aspect-auto lg:row-span-2'
                    : index === 3
                      ? 'aspect-[4/3] sm:col-span-2 sm:aspect-[16/9] lg:aspect-auto lg:col-span-2'
                      : 'aspect-[4/5] sm:aspect-[4/5] lg:aspect-auto'
                }`}
              >
                <div className="h-full [&>div]:h-full [&>div]:aspect-auto [&_img]:transition [&_img]:duration-700 [&_img]:ease-out [&_img]:group-hover:scale-[1.035]">
                  <PortfolioGallery slug={slug} fallback={<div className="h-full bg-surface" aria-hidden="true" />} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-gold">{String(index + 1).padStart(2, '0')}</p>
                    <Link href={`/${slug}`} className="mt-2 block font-display text-2xl text-white">{category}</Link>
                  </div>
                  <Link href={`/${slug}`} aria-label={`Ver galeria de ${category}`} className="translate-x-2 text-2xl text-white/70 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">↗</Link>
                </div>
              </div>
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
          <Link className="button-primary mt-9" href="https://wa.me/5544998061806" target="_blank" rel="noreferrer">Iniciar uma conversa</Link>
        </div>
      </section>
    </main>
  );
}
