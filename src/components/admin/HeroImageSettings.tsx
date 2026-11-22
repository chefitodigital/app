import { useEffect, useState, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

export function HeroImageSettings() {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    let active = true;
    void (supabase as SupabaseClient).from('platform_ticker').select('hero_image_url').eq('id', true).single().then(({ data, error }) => {
      if (!active) return;
      if (error) setStatus('Não foi possível carregar a imagem. Verifique a configuração da página inicial.');
      else setUrl(data?.hero_image_url ?? '');
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = url.trim();
    if (value) {
      try { if (new URL(value).protocol !== 'https:') throw new Error(); }
      catch { setStatus('Informe um endereço válido que comece com https://.'); return; }
    }
    setBusy(true); setStatus('');
    const { error } = await (supabase as SupabaseClient).from('platform_ticker').update({ hero_image_url: value || null }).eq('id', true).select('id').single();
    setBusy(false);
    setStatus(error ? 'Não foi possível salvar a imagem. Tente novamente.' : 'Imagem da página inicial atualizada.');
  }

  return <section className="max-w-2xl rounded-2xl border border-white/60 bg-gray-50/80 p-6 shadow-card">
    <h2 className="text-xl font-bold">Imagem da página inicial</h2>
    <p className="mt-2 text-sm text-gray-500">Informe o link da imagem de fundo. O filtro escuro será mantido.</p>
    {url && !previewError ? <img src={url} alt="Prévia da imagem da página inicial" onError={() => setPreviewError(true)} className="mt-5 aspect-[16/9] w-full rounded-xl object-cover" /> : <div className="mt-5 aspect-[16/9] w-full rounded-xl bg-black" aria-label="Prévia do fundo preto" />}
    <form onSubmit={save} className="mt-5 space-y-4">
      <div><label htmlFor="hero-image-url" className="mb-2 block text-sm font-medium text-gray-700">Link da imagem</label><input id="hero-image-url" type="url" maxLength={2048} value={url} placeholder="https://" disabled={busy || loading} onChange={event => { setUrl(event.target.value); setPreviewError(false); setStatus(''); }} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 focus:border-gray-600 focus:outline-none" /><p className="mt-2 text-sm text-gray-500">Deixe o campo vazio para usar um fundo preto.</p>{previewError && <p className="mt-2 text-sm text-gray-600">Não foi possível carregar a prévia. Confira o link.</p>}</div>
      <button className="btn btn-primary" disabled={busy || loading}>{busy ? 'Salvando...' : 'Salvar imagem'}</button>
      {status && <p role="status" className="text-sm text-gray-600">{status}</p>}
    </form>
  </section>;
}
