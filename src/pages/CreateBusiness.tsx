import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { normalizeBusinessSlug } from '../lib/businessRoutes';
import './platform.css';

export default function CreateBusiness() {
  const [name, setName] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const slug = normalizeBusinessSlug(slugInput);

  useEffect(() => {
    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.replace('/'); return; }
      const { data } = await supabase.from('businesses').select('slug').eq('owner_user_id', user.id).maybeSingle();
      if (data) window.location.replace(`/${data.slug}/`);
    });
  }, []);

  function changeName(value: string) {
    setName(value);
    if (!slugEdited) setSlugInput(normalizeBusinessSlug(value) || '');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!slug) { setMessage('Escolha um endereço válido para seu negócio.'); return; }
    setBusy(true);
    setMessage('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Sua sessão expirou. Entre novamente.');
      const { error } = await supabase.from('businesses').insert({ owner_user_id: user.id, name: name.trim(), slug });
      if (error) {
        if (error.code === '23505') throw new Error('Esse endereço já está em uso. Escolha outro.');
        throw error;
      }
      window.location.assign(`/${slug}/gestao`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível criar o negócio.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="platform-page">
      <header className="platform-header"><a className="platform-brand" href="/"><img className="platform-brand-mark" src="/app.png" alt="" /> chefito<span className="platform-brand-dot">.</span></a></header>
      <main className="platform-hero" style={{ minHeight: 'calc(100vh - 180px)' }}>
        <div className="platform-intro"><span className="platform-eyebrow">Seu espaço no Chefito</span><h1>Vamos dar nome ao seu negócio.</h1><p>Crie sua página para publicar seu cardápio e organizar sua operação.</p></div>
        <div className="platform-auth-shell"><div className="platform-auth-card">
          <div className="platform-auth-heading"><span className="platform-card-kicker">ÚLTIMO PASSO</span><h2>Dados do negócio</h2><p>Você poderá ajustar a aparência e o conteúdo depois.</p></div>
          <form onSubmit={submit} method="post" action="/criar-negocio" aria-label="Criar negócio" style={{ marginTop: 32 }}>
            <div className="platform-field"><label htmlFor="business-name">Nome do negócio</label><input id="business-name" name="business-name" autoComplete="organization" value={name} onChange={(event) => changeName(event.target.value)} minLength={2} maxLength={120} required placeholder="Ex.: Café da Vila" /></div>
            <div className="platform-field"><label htmlFor="business-slug">Endereço da página</label><input id="business-slug" name="business-slug" value={slugInput} onChange={(event) => { setSlugEdited(true); setSlugInput(event.target.value); }} required placeholder="cafe-da-vila" aria-describedby="slug-preview" /><small id="slug-preview">chefi.to/{slug || 'seu-negocio'}</small></div>
            {message && <p className="platform-form-message" role="status" aria-live="polite">{message}</p>}
            <button className="platform-submit" type="submit" disabled={busy}>{busy ? 'Criando...' : 'Publicar meu negócio'}</button>
          </form>
        </div></div>
      </main>
    </div>
  );
}
