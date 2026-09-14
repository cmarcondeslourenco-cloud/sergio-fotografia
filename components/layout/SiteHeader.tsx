import Link from 'next/link';

const links = [
  { href: '/portfolio', label: 'Portfólio' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/contato', label: 'Contato' },
  { href: '/cliente', label: 'Área do cliente' },
];

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-ink/85 backdrop-blur-xl">
      <nav aria-label="Navegação principal" className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between px-6 md:px-10">
        <Link href="/" className="relative z-10 font-display text-xl tracking-[0.04em] text-linen md:text-2xl">
          Fotografia<span className="text-gold">.</span>
        </Link>

        <div className="hidden items-center gap-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300 md:flex">
          {links.map((link) => (
            <Link key={link.href} className="transition-colors hover:text-gold" href={link.href}>
              {link.label}
            </Link>
          ))}
          <Link className="border border-white/15 px-4 py-2.5 transition-colors hover:border-gold hover:text-gold" href="/login">
            Admin
          </Link>
        </div>

        <details className="group relative md:hidden">
          <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center border border-white/15 text-linen [&::-webkit-details-marker]:hidden">
            <span className="sr-only">Abrir menu</span>
            <span aria-hidden="true" className="text-xl group-open:hidden">☰</span>
            <span aria-hidden="true" className="hidden text-xl group-open:inline">×</span>
          </summary>
          <div className="absolute right-0 top-[calc(100%+0.8rem)] w-[min(82vw,20rem)] border border-white/10 bg-surface p-2 shadow-glow">
            {links.map((link) => (
              <Link key={link.href} className="block border-b border-white/5 px-4 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-200 last:border-0 hover:text-gold" href={link.href}>
                {link.label}
              </Link>
            ))}
            <Link className="mt-2 block bg-gold px-4 py-4 text-xs font-bold uppercase tracking-[0.16em] text-ink" href="/login">
              Administração
            </Link>
          </div>
        </details>
      </nav>
    </header>
  );
}
