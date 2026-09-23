'use client';

import { useState, type FormEvent } from 'react';
import { workTypes } from '@/lib/contact/schema';

type FormState = 'idle' | 'sending' | 'success' | 'error';

export function ContactForm() {
  const [state, setState] = useState<FormState>('idle');
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '', whatsapp: '', email: '', workType: 'Casamento', eventDate: '', city: '', message: ''
  });

  function updateField(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

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

  function sendWhatsApp() {
    const text = `Olá! Meu nome é ${formData.name || '[Nome]'}.\n\nTipo de trabalho: ${formData.workType}\n${formData.eventDate ? `Data prevista: ${formData.eventDate}\n` : ''}${formData.city ? `Cidade: ${formData.city}\n` : ''}\nMensagem:\n${formData.message || '[Sua mensagem]'}\n\nAguardo retorno. Obrigado!`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/5544998061806?text=${encoded}`, '_blank');
  }

  return (
    <form onSubmit={submit} className="border border-white/10 bg-surface p-6 shadow-glow md:p-10">
      <div className="grid gap-6 md:grid-cols-2">
        <label className="text-sm text-zinc-300">
          Nome <span aria-hidden="true" className="text-gold">*</span>
          <input className="field mt-2" name="name" autoComplete="name" required minLength={2} maxLength={100} value={formData.name} onChange={e => updateField('name', e.target.value)} />
        </label>
        <label className="text-sm text-zinc-300">
          WhatsApp <span aria-hidden="true" className="text-gold">*</span>
          <input className="field mt-2" name="whatsapp" autoComplete="tel" inputMode="tel" required minLength={8} maxLength={30} placeholder="(00) 00000-0000" value={formData.whatsapp} onChange={e => updateField('whatsapp', e.target.value)} />
        </label>
        <label className="text-sm text-zinc-300">
          E-mail
          <input className="field mt-2" name="email" autoComplete="email" type="email" maxLength={160} value={formData.email} onChange={e => updateField('email', e.target.value)} />
        </label>
        <label className="text-sm text-zinc-300">
          Tipo de trabalho <span aria-hidden="true" className="text-gold">*</span>
          <select className="field mt-2" name="workType" value={formData.workType} onChange={e => updateField('workType', e.target.value)} required>
            {workTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label className="text-sm text-zinc-300">
          Data prevista
          <input className="field mt-2" name="eventDate" type="date" value={formData.eventDate} onChange={e => updateField('eventDate', e.target.value)} />
        </label>
        <label className="text-sm text-zinc-300">
          Cidade
          <input className="field mt-2" name="city" autoComplete="address-level2" maxLength={120} value={formData.city} onChange={e => updateField('city', e.target.value)} />
        </label>
      </div>

      <label className="mt-6 block text-sm text-zinc-300">
        Conte sobre sua história <span aria-hidden="true" className="text-gold">*</span>
        <textarea className="field mt-2 min-h-36 resize-y" name="message" required minLength={10} maxLength={3000} value={formData.message} onChange={e => updateField('message', e.target.value)} />
      </label>

      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>Empresa<input name="company" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button className="button-primary" type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'Enviando…' : 'Enviar mensagem'}
        </button>
        <button type="button" onClick={sendWhatsApp} className="button-secondary flex items-center gap-2 bg-green-700/20 border-green-500/30 text-green-300 hover:bg-green-700/30 hover:text-green-200">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Contato Inteligente
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