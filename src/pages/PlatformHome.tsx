import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { AnimatePresence, motion } from 'motion/react';
import { RESTAURANT_ICONS } from '../lib/restaurantIcons';
import { PLATFORM_ADMIN_ID } from '../lib/platformAdmin';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PlatformTicker } from '../components/PlatformTicker';
import './platform.css';

type AuthMode = 'login' | 'register';

export default function PlatformHome() {
  const [mode, setMode] = useState<AuthMode>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [recovering, setRecovering] = useState(false);
  const [iconIndex, setIconIndex] = useState(0);
  const [tickerMessage, setTickerMessage] = useState('Da cozinha para a tela.');
  const [heroImage, setHeroImage] = useState('');
  useEffect(() => {
    let active = true;
    void (supabase as SupabaseClient).from('platform_ticker').select('*').eq('id', true).maybeSingle().then(({ data }) => {
      if (!active) return;
      if (data?.message) setTickerMessage(data.message);
      if (typeof data?.hero_image_url === 'string') {
        try {
          if (new URL(data.hero_image_url).protocol === 'https:') {
            const image = new Image();
            image.onload = () => { if (active) setHeroImage(image.src); };
            image.src = data.hero_image_url;
          }
        } catch { /* URL inválida: mantém o fundo preto. */ }
      }
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setIconIndex(index => (index + 1) % RESTAURANT_ICONS.length), 2000);
    return () => window.clearInterval(timer);
  }, []);
  const reveal = (delay = 0) => ({
    initial: { opacity: 0, transform: 'translateY(16px)' },
    whileInView: { opacity: 1, transform: 'translateY(0)' },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: 0.5, delay: delay, ease: [0.23, 1, 0.32, 1] as const },
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'register') {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser?.email?.toLowerCase() !== email.trim().toLowerCase()) {
          const { data, error } = await supabase.auth.signUp({ email, password });
          if (error) throw error;
          if (!data.session) {
            setMessage('Enviamos um link de confirmação para seu email. Confirme a conta e volte para entrar.');
            return;
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não foi possível confirmar sua sessão.');
      if (user.id === PLATFORM_ADMIN_ID) { window.location.assign('/admin'); return; }
      const { data: business, error } = await supabase
        .from('businesses')
        .select('slug')
        .eq('owner_user_id', user.id)
        .maybeSingle();
      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          throw new Error('Sua conta está pronta, mas a criação de negócios ainda não está disponível. Entre novamente mais tarde.');
        }
        throw error;
      }
      window.location.assign(business ? `/${business.slug}/` : '/criar-negocio');
    } catch (error) {
      if (error instanceof Error && /User already registered/i.test(error.message)) {
        setMode('login');
        setMessage('Este email já tem uma conta. Entre com sua senha.');
      } else {
        setMessage(error instanceof Error ? error.message : 'Não foi possível acessar sua conta. Tente novamente.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function requestPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/redefinir-senha` });
      if (error) throw error;
      setMessage('Se houver uma conta com esse email, enviaremos um link para redefinir sua senha.');
    } catch {
      setMessage('Não foi possível enviar a solicitação. Tente novamente em alguns instantes.');
    } finally { setBusy(false); }
  }

  return (
    <div className="platform-page">
      <header className="platform-header">
        <a className="platform-brand" href="/" aria-label="Chefito, página inicial">
          <img className="platform-brand-mark" src="/app.png" alt="" /> Chefito
        </a>
        <nav aria-label="Navegação principal">
          <a href="#como-funciona">Como funciona</a>
          <a href="#acesso">Entrar</a>
        </nav>
      </header>

      <main>
        <section className="platform-hero platform-landing-hero" aria-labelledby="platform-title">
          {heroImage && <motion.div aria-hidden="true" className="platform-hero-background" style={{ '--platform-hero-image': `url(${JSON.stringify(heroImage)})` } as CSSProperties} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }} />}
          <div className="platform-hero-bottom">
            <motion.div className="platform-intro platform-visual" {...reveal()}>
              <span className="platform-eyebrow">DA COZINHA PARA A TELA</span>
              <h1 id="platform-title">Seu negócio merece um lugar à mesa.</h1>
              <p>Cardápio digital, pedidos e gestão de clientes — tudo em uma só plataforma.</p>
              <div className="platform-preview" aria-label="Exemplo de presença digital do negócio">
                <div className="platform-preview-heading"><span className="platform-preview-icon" aria-hidden="true"><AnimatePresence mode="wait" initial={false}><motion.i key={iconIndex} className={`fa-solid fa-${RESTAURANT_ICONS[iconIndex].value === 'burger' ? 'burger-cheese' : RESTAURANT_ICONS[iconIndex].value}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} /></AnimatePresence></span><div><strong>Seu negócio</strong><small>Seu espaço no Chefito</small></div></div>
                <div className="platform-preview-categories"><span>Cardápio</span><span>Pedidos</span><span>Gestão</span></div>
                <div className="platform-preview-link"><i className="fa-solid fa-link" aria-hidden="true" /> chefi.to/seu-negocio</div>
              </div>
              <a className="platform-discover" href="#como-funciona">Conheça o Chefito <span aria-hidden="true"><i className="fa-solid fa-chevrons-down" /></span></a>
            </motion.div>
            <motion.div className="platform-auth-shell" id="acesso" {...reveal(0.12)}>
            <div className="platform-auth-card">
              <div className="platform-auth-heading">
                <span className="platform-card-kicker">COMECE AQUI</span>
                <h2>{recovering ? 'Redefinir senha' : mode === 'register' ? 'Crie sua conta' : 'Boas-vindas de volta'}</h2>
                <p>{recovering ? 'Informe seu email para receber o link de recuperação.' : mode === 'register' ? 'Vamos colocar seu cardápio na tela?' : 'Entre para acompanhar sua operação.'}</p>
              </div>
              {!recovering && <div className="platform-auth-tabs" role="group" aria-label="Tipo de acesso">
                <button type="button" className={mode === 'register' ? 'is-active' : ''} onClick={() => { setMode('register'); setMessage(''); }}>Criar conta</button>
                <button type="button" className={mode === 'login' ? 'is-active' : ''} onClick={() => { setMode('login'); setMessage(''); }}>Entrar</button>
              </div>}
              <form onSubmit={recovering ? requestPasswordReset : submit} method="post" action={mode === 'login' ? '/entrar' : '/cadastro'} aria-labelledby="auth-form-title" style={recovering ? { marginTop: 28 } : undefined}>
                <span id="auth-form-title" className="sr-only">{recovering ? 'Formulário de recuperação de senha' : mode === 'login' ? 'Formulário de entrada' : 'Formulário de cadastro'}</span>
                <div className="platform-field">
                  <label htmlFor="platform-email">Email</label>
                  <input id="platform-email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="voce@negocio.com" />
                </div>
                {!recovering && <div className="platform-field">
                  <label htmlFor="platform-password">Senha</label>
                  <input id="platform-password" name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required placeholder="Mínimo de 6 caracteres" />
                </div>}
                {!recovering && mode === 'login' && <button type="button" className="platform-auth-text-button" onClick={() => { setRecovering(true); setMessage(''); }}><i className="fa-solid fa-key" aria-hidden="true" /> Esqueci minha senha</button>}
                {message && <p className="platform-form-message" role="status" aria-live="polite">{message}</p>}
                <button className="platform-submit" type="submit" disabled={busy}>{busy ? 'Aguarde...' : recovering ? 'Enviar link de recuperação' : mode === 'register' ? 'Criar minha conta' : 'Entrar no Chefito'}</button>
                {recovering && <button type="button" className="platform-auth-back" onClick={() => { setRecovering(false); setMessage(''); }}>Voltar para entrar</button>}
              </form>
              <p className="platform-auth-footnote">Tudo para cuidar da sua operação em um só lugar.</p>
            </div>
            </motion.div>
          </div>
        </section>

        <section className="platform-benefits" id="como-funciona" aria-labelledby="benefits-title">
          <div className="platform-benefits-heading"><span className="platform-eyebrow">COMO FUNCIONA</span><h2 id="benefits-title">Comece em<br />três passos.</h2></div>
          <div className="platform-benefit-grid">
            <motion.article {...reveal()}><span className="platform-benefit-icon" aria-hidden="true">01</span><h3>Crie sua conta</h3><p>Cadastre seu email e prepare seu espaço no Chefito.</p></motion.article>
            <motion.article {...reveal()}><span className="platform-benefit-icon" aria-hidden="true">02</span><h3>Monte seu cardápio</h3><p>Adicione produtos, fotos e detalhes com a identidade da sua marca.</p></motion.article>
            <motion.article {...reveal()}><span className="platform-benefit-icon" aria-hidden="true">03</span><h3>Compartilhe e gerencie</h3><p>Divulgue sua página, receba pedidos e acompanhe os resultados.</p></motion.article>
          </div>
        </section>
      </main>
      <PlatformTicker message={tickerMessage} />
      <footer className="platform-footer"><div className="platform-footer-inner"><div className="platform-footer-details"><span>Chefito</span><p>Da cozinha para a tela.</p></div><nav className="platform-footer-links" aria-label="Redes do Chefito"><a href="https://www.instagram.com/chefi.to" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-instagram" aria-hidden="true" /> Instagram</a><a href="https://scri.boo/chefi.to" target="_blank" rel="noopener noreferrer"><i className="fa-solid fa-feather-pointed" aria-hidden="true" /> Scriboo</a></nav></div></footer>
    </div>
  );
}
