import type { Metadata } from 'next';
import Link from 'next/link';
import { DemoGallery } from '@/components/gallery/DemoGallery';
import { demoPhotos, normalizeCategory, type PortfolioCategory } from '@/lib/demo-photos';

export const metadata: Metadata = {
  title: 'Portfólio',
  description: 'Uma seleção de casamentos, ensaios, eventos e astrofotografia.',
};

const filters: Array<'Todos' | PortfolioCategory> = ['Todos', 'Casamentos', 'Ensaios', 'Eventos', 'Astrofotografia'];

export default function PortfolioPage({ searchParams }: { searchParams?: { categoria?: string } }) {
  const selected = normalizeCategory(searchParams?.categoria);
  const active = selected ?? 'Todos';
  const photos = selected ? demoPhotos.filter((photo) => photo.category === selected) : demoPhotos;

  return (
    <main id="conteudo-principal" className="min-h-screen px-6 pb-24 pt-32 md:px-10 md:pt-40">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.65fr] lg:items-end">
          <div>
            <p className="eyebrow">Portfólio</p>
            <h1 className="mt-4 font-display text-5xl leading-none text-linen md:text-7xl">Histórias escolhidas pelo olhar.</h1>
          </div>
          <p className="max-w-xl leading-7 text-zinc-400 lg:justify-self-end">
            Imagens conceituais geradas para demonstrar o layout. As galerias finais receberão apenas o trabalho autoral aprovado pelo fotógrafo.
          </p>
        </div>

        <nav className="mt-12 grid grid-cols-2 gap-2 border-b border-white/10 pb-4 sm:flex sm:flex-wrap" aria-label="Filtros do portfólio">
          {filters.map((filter) => {
            const href = filter === 'Todos' ? '/portfolio' : `/portfolio?categoria=${filter.toLowerCase()}`;
            const isActive = active === filter;
            return (
              <Link
                key={filter}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-11 items-center justify-center whitespace-nowrap border px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors sm:px-4 sm:tracking-[0.16em] ${
                  filter === 'Astrofotografia' ? 'col-span-2 sm:col-auto' : ''
                } ${
                  isActive ? 'border-gold bg-gold text-ink' : 'border-white/10 text-zinc-400 hover:border-gold hover:text-gold'
                }`}
              >
                {filter}
              </Link>
            );
          })}
        </nav>

        <section className="mt-12" aria-labelledby="portfolio-heading">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Seleção atual</p>
              <h2 id="portfolio-heading" className="mt-2 font-display text-3xl text-linen">{active}</h2>
            </div>
            <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">{photos.length} {photos.length === 1 ? 'imagem' : 'imagens'}</span>
          </div>
          <DemoGallery photos={photos} />
        </section>
      </div>
    </main>
  );
}
