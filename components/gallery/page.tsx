import Link from 'next/link';
import { DemoGallery } from '@/components/gallery/DemoGallery';

const filters = ['Todos', 'Casamentos', 'Ensaios', 'Eventos', 'Festas', 'Autorais', 'Astrofotografia'];
const normalize = (value?: string) => value?.toLowerCase() ?? '';

export default function PortfolioPage({ searchParams }: { searchParams?: { categoria?: string } }) {
  const selected = normalize(searchParams?.categoria);
  const active = filters.find((filter) => normalize(filter) === selected) ?? 'Todos';
  return <main className="min-h-screen px-6 pb-24 pt-32 md:px-10"><div className="mx-auto max-w-7xl"><p className="text-xs uppercase tracking-[0.35em] text-gold">Portfólio · Simulação local</p><h1 className="mt-4 font-display text-5xl md:text-7xl">Trabalhos selecionados</h1><p className="mt-6 max-w-xl text-zinc-400">Uma seleção de imagens locais para validar composição, carregamento e lightbox antes da integração com o Storage.</p><div className="mt-12 flex gap-2 overflow-x-auto border-b border-white/10 pb-4" aria-label="Filtros do portfólio">{filters.map((filter) => { const href = filter === 'Todos' ? '/portfolio' : `/portfolio?categoria=${normalize(filter)}`; return <Link key={filter} href={href} aria-current={active === filter ? 'page' : undefined} className={`whitespace-nowrap px-4 py-2 text-xs uppercase tracking-[0.12em] transition-colors ${active === filter ? 'bg-gold text-ink' : 'text-zinc-400 hover:text-gold'}`}>{filter}</Link>; })}</div><section className="mt-16"><p className="mb-6 text-xs uppercase tracking-[0.25em] text-gold">{active}</p><DemoGallery /></section></div></main>;
}
