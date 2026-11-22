import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import './platform.css';

const recoveryLink = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('type') === 'recovery';
let recoveryEventSeen = false;
supabase.auth.onAuthStateChange(event => { if (event === 'PASSWORD_RECOVERY') recoveryEventSeen = true; });

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY' && active) { setReady(true); setChecking(false); }
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      setReady(!error && !!data.session && (recoveryLink || recoveryEventSeen));
      setChecking(false);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) { setMessage('As senhas não coincidem. Confira e tente novamente.'); return; }
    setBusy(true); setMessage('');
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setMessage('Não foi possível alterar sua senha. Solicite um novo link e tente novamente.'); return; }
    setPassword(''); setConfirmation(''); setComplete(true);
  }

  return <div className="platform-page">
    <header className="platform-header"><a className="platform-brand" href="/" aria-label="Chefito, página inicial"><img className="platform-brand-mark" src="/app.png" alt="" /> Chefito</a></header>
    <main className="platform-reset-main"><div className="platform-auth-shell platform-reset-card"><div className="platform-auth-card">
      <div className="platform-auth-heading"><span className="platform-card-kicker">ACESSO À SUA CONTA</span><h2>{complete ? 'Senha alterada' : 'Crie uma nova senha'}</h2><p>{complete ? 'Sua senha foi atualizada com sucesso.' : 'Escolha uma senha para voltar a acessar sua conta.'}</p></div>
      {checking ? <p className="platform-reset-status" role="status">Verificando link...</p> : complete ? <a className="platform-submit platform-reset-link" href="/#acesso">Voltar para entrar</a> : !ready ? <><p className="platform-form-message platform-reset-status" role="status">Este link é inválido ou expirou. Solicite um novo link na página inicial.</p><a className="platform-submit platform-reset-link" href="/#acesso">Voltar ao início</a></> : <form onSubmit={submit} className="platform-reset-form">
        <div className="platform-field"><label htmlFor="new-password">Nova senha</label><input id="new-password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={event => setPassword(event.target.value)} placeholder="Mínimo de 6 caracteres" /></div>
        <div className="platform-field"><label htmlFor="confirm-password">Confirme a nova senha</label><input id="confirm-password" type="password" autoComplete="new-password" minLength={6} required value={confirmation} onChange={event => setConfirmation(event.target.value)} /></div>
        {message && <p className="platform-form-message" role="alert">{message}</p>}
        <button className="platform-submit" type="submit" disabled={busy}>{busy ? 'Salvando...' : 'Salvar nova senha'}</button>
      </form>}
    </div></div></main>
  </div>;
}
