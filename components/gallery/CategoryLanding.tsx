import Link from 'next/link';
import { PortfolioGallery } from './PortfolioGallery';
import type { PortfolioCategory } from '@/lib/demo-photos';

export function CategoryLanding({ category, title, description }: { category: PortfolioCategory; title: string; description: string }) {
  const slug = category === 'Loja' ? 'loja' : category.toLowerCase();
  return (
    <main id="conteudo-principal" className="min-h-screen px-6 pb-24 pt-32 md:px-10 md:pt-40">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow">{category}</p>
        <h1 className="mt-4 max-w-5xl font-display text-5xl leading-[1.02] text-linen md:text-8xl">{title}</h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-400">{description}</p>
        <section className="mt-14" aria-label={`Seleção de ${category}`}>
          <PortfolioGallery slug={slug} showAllPhotos fallback={<p className="border border-dashed border-white/15 p-8 text-center text-sm text-zinc-500">Esta galeria esta sendo preparada.</p>} />
        </section>
        <div className="mt-12 flex flex-wrap gap-3 border-t border-white/10 pt-8">
          <Link className="button-secondary" href="/portfolio">Ver todo o portfólio</Link>
          <Link className="button-primary" href="/contato">Conversar sobre seu projeto</Link>
        </div>
      </div>
    </main>
  );
}
