import Image from 'next/image';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main id="conteudo-principal" className="relative grid min-h-[100svh] place-items-center overflow-hidden px-6 py-32 text-center">
      <Image src="/editorial/astrofotografia.webp" alt="" fill sizes="100vw" className="object-cover opacity-35" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-ink/75 to-ink" />
      <div className="relative max-w-2xl">
        <p className="eyebrow">Erro 404</p>
        <h1 className="mt-5 font-display text-5xl leading-tight text-linen md:text-7xl">Parece que esse momento escapou da lente.</h1>
        <p className="mx-auto mt-6 max-w-lg leading-7 text-zinc-300">A página pode ter mudado de endereço ou o link privado pode ter expirado.</p>
        <Link className="button-primary mt-9" href="/">Voltar para o início</Link>
      </div>
    </main>
  );
}
