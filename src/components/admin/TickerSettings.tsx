import { useEffect, useState, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

export function TickerSettings() {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  useEffect(() => {
    let active = true;
    void (supabase as SupabaseClient).from('platform_ticker').select('message').eq('id', true).maybeSingle().then(({ data, error }) => {
      if (!active) return;
      if (error) setStatus('Não foi possível carregar a mensagem.');
      else setMessage(data?.message ?? '');
    });
    return () => { active = false; };
  }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const phrases = message.split(/\r?\n/).map(phrase => phrase.trim()).filter(Boolean);
    if (!phrases.length) { setStatus('Digite pelo menos uma frase.'); return; }
    setBusy(true); setStatus('');
    const { error } = await (supabase as SupabaseClient).from('platform_ticker').upsert({ id: true, message: phrases.join('\n') });
    setBusy(false);
    setStatus(error ? 'Não foi possível salvar a mensagem. Tente novamente.' : 'Mensagem atualizada com sucesso.');
  }
  return <section className="max-w-2xl rounded-2xl border border-white/60 bg-gray-50/80 p-6 shadow-card">
    <h2 className="text-xl font-bold">Mensagens da página inicial</h2>
    <p className="mt-2 text-sm text-gray-500">Digite uma frase por linha. Elas aparecem em sequência na faixa acima do rodapé.</p>
    <form onSubmit={save} className="mt-6 space-y-4">
      <div><label htmlFor="ticker-message" className="mb-2 block text-sm font-medium text-gray-700">Mensagens</label><textarea id="ticker-message" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 focus:border-gray-600 focus:outline-none" rows={4} maxLength={240} required value={message} onChange={event => setMessage(event.target.value)} /><p className="mt-2 text-sm text-gray-500">Até 240 caracteres no total.</p></div>
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Salvando...' : 'Salvar mensagem'}</button>
      {status && <p role="status" className="text-sm text-gray-600">{status}</p>}
    </form>
  </section>;
}
