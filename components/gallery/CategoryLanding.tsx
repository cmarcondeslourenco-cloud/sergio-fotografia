import Link from 'next/link';
import { DemoGallery } from './DemoGallery';
import { demoPhotos, type PortfolioCategory } from '@/lib/demo-photos';

export function CategoryLanding({ category, title, description }: { category: PortfolioCategory; title: string; description: string }) {
  const photos = demoPhotos.filter((photo) => photo.category === category);
  return (
    <main id="conteudo-principal" className="min-h-screen px-6 pb-24 pt-32 md:px-10 md:pt-40">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow">{category}</p>
        <h1 className="mt-4 max-w-5xl font-display text-5xl leading-[1.02] text-linen md:text-8xl">{title}</h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-400">{description}</p>
        <section className="mt-14" aria-label={`Seleção de ${category}`}>
          <DemoGallery photos={photos} />
        </section>
        <div className="mt-12 flex flex-wrap gap-3 border-t border-white/10 pt-8">
          <Link className="button-secondary" href="/portfolio">Ver todo o portfólio</Link>
          <Link className="button-primary" href="/contato">Conversar sobre seu projeto</Link>
        </div>
      </div>
    </main>
  );
}
