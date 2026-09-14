import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sobre',
  description: 'Conheça a intenção por trás de uma fotografia feita com presença, naturalidade e respeito.',
};

export default function AboutPage() {
  return (
    <main id="conteudo-principal" className="min-h-screen px-6 pb-24 pt-32 md:px-10 md:pt-40">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
        <div className="relative aspect-[4/5] overflow-hidden">
          <Image src="/editorial/ensaio.webp" alt="Retrato conceitual em um pátio de tons naturais" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          <p className="absolute bottom-4 left-4 bg-black/65 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-white/70 backdrop-blur">Imagem conceitual</p>
        </div>
        <div>
          <p className="eyebrow">Sobre o olhar</p>
          <h1 className="mt-4 font-display text-5xl leading-[1.02] text-linen md:text-7xl">Olhar, presença e memória.</h1>
          <div className="mt-8 space-y-5 text-base leading-8 text-zinc-400">
            <p>Fotografar é prestar atenção. É reconhecer o gesto pequeno, a luz que dura poucos segundos e a emoção que não precisa ser dirigida.</p>
            <p>Este espaço foi preparado para apresentar um trabalho autoral com calma e para entregar cada história com a mesma delicadeza com que ela foi registrada.</p>
          </div>
          <div className="mt-8 border-l border-gold pl-6 text-sm leading-7 text-zinc-500">
            A biografia, o nome profissional e os dados reais do fotógrafo permanecem intencionalmente editáveis até serem fornecidos e aprovados.
          </div>
          <Link className="button-primary mt-9" href="/contato">Contar sua história</Link>
        </div>
      </div>
    </main>
  );
}
