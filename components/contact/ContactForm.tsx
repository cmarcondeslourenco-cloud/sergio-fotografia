'use client';

import { useState, type FormEvent } from 'react';
import { workTypes } from '@/lib/contact/schema';

type FormState = 'idle' | 'sending' | 'success' | 'error';

export function ContactForm() {
  const [state, setState] = useState<FormState>('idle');
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('sending');
    setMessage('Enviando sua mensagem…');

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Não foi possível enviar agora.');
      form.reset();
      setState('success');
      setMessage('Mensagem recebida e sinalizada para o fotógrafo. Obrigado por compartilhar sua história.');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Não foi possível enviar agora.');
    }
  }

  return (
    <form onSubmit={submit} className="border border-white/10 bg-surface p-6 shadow-glow md:p-10">
      <div className="grid gap-6 md:grid-cols-2">
        <label className="text-sm text-zinc-300">
          Nome <span aria-hidden="true" className="text-gold">*</span>
          <input className="field mt-2" name="name" autoComplete="name" required minLength={2} maxLength={100} />
        </label>
        <label className="text-sm text-zinc-300">
          WhatsApp <span aria-hidden="true" className="text-gold">*</span>
          <input className="field mt-2" name="whatsapp" autoComplete="tel" inputMode="tel" required minLength={8} maxLength={30} placeholder="(00) 00000-0000" />
        </label>
        <label className="text-sm text-zinc-300">
          E-mail
          <input className="field mt-2" name="email" autoComplete="email" type="email" maxLength={160} />
        </label>
        <label className="text-sm text-zinc-300">
          Tipo de trabalho <span aria-hidden="true" className="text-gold">*</span>
          <select className="field mt-2" name="workType" defaultValue="Casamento" required>
            {workTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label className="text-sm text-zinc-300">
          Data prevista
          <input className="field mt-2" name="eventDate" type="date" />
        </label>
        <label className="text-sm text-zinc-300">
          Cidade
          <input className="field mt-2" name="city" autoComplete="address-level2" maxLength={120} />
        </label>
      </div>

      <label className="mt-6 block text-sm text-zinc-300">
        Conte sobre sua história <span aria-hidden="true" className="text-gold">*</span>
        <textarea className="field mt-2 min-h-36 resize-y" name="message" required minLength={10} maxLength={3000} />
      </label>

      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>Empresa<input name="company" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button className="button-primary" type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'Enviando…' : 'Enviar mensagem'}
        </button>
        <p
          role="status"
          aria-live="polite"
          className={`text-sm ${state === 'success' ? 'text-emerald-300' : state === 'error' ? 'text-red-300' : 'text-zinc-500'}`}
        >
          {message || 'Seus dados serão usados somente para responder ao contato.'}
        </p>
      </div>
    </form>
  );
}
