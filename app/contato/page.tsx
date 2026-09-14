import type { Metadata } from 'next';
import { ContactForm } from '@/components/contact/ContactForm';

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Conte sobre seu casamento, evento, ensaio ou projeto fotográfico.',
};

export default function ContactPage() {
  return (
    <main id="conteudo-principal" className="min-h-screen px-6 pb-24 pt-32 md:px-10 md:pt-40">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
        <div>
          <p className="eyebrow">Contato</p>
          <h1 className="mt-4 font-display text-5xl leading-none text-linen md:text-7xl">Vamos conversar com calma.</h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-zinc-400">
            Conte onde, quando e como você imagina esse momento. Essas primeiras informações ajudam a tornar a conversa mais pessoal e objetiva.
          </p>
          <dl className="mt-10 grid gap-5 border-t border-white/10 pt-8 text-sm">
            <div>
              <dt className="eyebrow">Retorno</dt>
              <dd className="mt-2 text-zinc-300">O contato será respondido pelos canais informados no formulário.</dd>
            </div>
            <div>
              <dt className="eyebrow">Privacidade</dt>
              <dd className="mt-2 text-zinc-300">Nenhuma informação enviada aparece publicamente.</dd>
            </div>
          </dl>
        </div>
        <ContactForm />
      </div>
    </main>
  );
}
