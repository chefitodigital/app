import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PLATFORM_ADMIN_ID } from '../lib/platformAdmin';
import type { Database } from '../types/supabase';
import { Select } from '../components/ui/Select';
import { OrdersTrend } from '../components/admin/OrdersTrend';
import { BusinessDetails } from '../components/admin/BusinessDetails';
import { TickerSettings } from '../components/admin/TickerSettings';
import { HeroImageSettings } from '../components/admin/HeroImageSettings';

type Ad = Database['public']['Tables']['platform_ads']['Row'];
type Business = { id: string; name: string; slug: string; status: string; created_at: string; owner_email: string | null; location: string | null; products: number; orders: number; customers: number; sales: number; last_order: string | null };
type View = { ad_id: string; business_id: string; business_name: string; first_viewed_at: string; last_viewed_at: string; view_count: number };
type Overview = { businesses: Business[]; ad_views: View[] };
type Form = { title: string; message: string; button_label: string; button_url: string; status: string };
const emptyForm: Form = { title: '', message: '', button_label: '', button_url: '', status: 'draft' };
const date = (value: string | null) => value ? new Date(value).toLocaleDateString('pt-BR') : '—';
const money = (value: number) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const quantidade = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`;

export default function PlatformAdmin() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [tab, setTab] = useState<'overview' | 'businesses' | 'ads' | 'homepage'>('overview');
  const [period, setPeriod] = useState('30');
  const [overview, setOverview] = useState<Overview>({ businesses: [], ad_views: [] });
  const [ads, setAds] = useState<Ad[]>([]);
  const [trend, setTrend] = useState<{ day: string; orders: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [activity, setActivity] = useState('all');
  const [expandedBusiness, setExpandedBusiness] = useState<string | null>(null);
  const [expandedAd, setExpandedAd] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => { void supabase.auth.getUser().then(({ data }) => setAuthorized(data.user?.id === PLATFORM_ADMIN_ID)); }, []);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    const from = period === 'all' ? undefined : new Date(Date.now() - Number(period) * 86400000).toISOString();
    const [stats, adResult, daily] = await Promise.all([
      supabase.rpc('platform_admin_overview', { p_from: from }),
      supabase.from('platform_ads').select('*').order('created_at', { ascending: false }),
      supabase.rpc('platform_admin_daily_orders', { p_days: period === 'all' ? 90 : Number(period) }),
    ]);
    if (stats.error || adResult.error || daily.error) setError('Não foi possível carregar os dados. Tente novamente.');
    else { setOverview(stats.data as unknown as Overview); setAds(adResult.data || []); setTrend(daily.data || []); }
    setLoading(false);
  }, [period]);
  useEffect(() => { if (authorized) void load(); }, [authorized, load]);
  const businesses = overview.businesses;
  const filtered = useMemo(() => businesses.filter(b => {
    const matches = `${b.name} ${b.slug} ${b.owner_email || ''} ${b.location || ''}`.toLowerCase().includes(query.toLowerCase());
    const recent = b.last_order && Date.now() - new Date(b.last_order).getTime() < 30 * 86400000;
    return matches && (activity === 'all' || (activity === 'active' && recent) || (activity === 'inactive' && !recent) || (activity === 'new' && Date.now() - new Date(b.created_at).getTime() < 30 * 86400000));
  }), [businesses, query, activity]);
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setNotice('');
    if (!!form.button_label.trim() !== !!form.button_url.trim()) { setError('Informe o texto e o link do botão juntos.'); return; }
    if (form.button_url) { try { if (!['http:', 'https:'].includes(new URL(form.button_url).protocol)) throw Error(); } catch { setError('Informe um link válido começando com http:// ou https://.'); return; } }
    setSaving(true);
    const values = { title: form.title.trim(), message: form.message.trim(), status: form.status, button_label: form.button_label.trim() || null, button_url: form.button_url.trim() || null, starts_at: null, ends_at: null, updated_at: new Date().toISOString() };
    const result = editing ? await supabase.from('platform_ads').update(values).eq('id', editing) : await supabase.from('platform_ads').insert(values);
    setSaving(false);
    if (result.error) { setError('Não foi possível salvar o anúncio. Confira os campos e tente novamente.'); return; }
    setForm(emptyForm); setEditing(null); setNotice('Anúncio salvo com sucesso.'); await load();
  };
  if (authorized === null) return <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6" role="status" aria-live="polite"><div className="flex flex-col items-center gap-3 text-center"><img src="/app.png" alt="" className="h-10 w-10 object-contain opacity-70" /><p className="text-sm text-gray-600">Verificando acesso...</p></div></main>;
  if (!authorized) return (
    <div className="platform-page">
      <header className="platform-header">
        <a className="platform-brand" href="/" aria-label="Chefito, página inicial">
          <img className="platform-brand-mark" src="/app.png" alt="" /> Chefito
        </a>
      </header>
      <main className="platform-not-found">
        <div className="platform-not-found-content">
          <span className="platform-not-found-icon" aria-hidden="true"><i className="fa-solid fa-lock" /></span>
          <h1>Acesso restrito</h1>
          <p>Esta área é exclusiva da administração do Chefito.</p>
          <a className="platform-not-found-link" href="/">Voltar ao início</a>
        </div>
      </main>
    </div>
  );
  const label = 'block text-sm font-medium text-gray-700 mb-2';
  const input = 'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 transition-colors hover:border-gray-300 focus:border-gray-600 focus:outline-none';
  const section = 'rounded-2xl border border-white/60 bg-gray-50/80 p-6 shadow-card backdrop-blur-xl';
  return <div className="min-h-screen bg-gray-100 text-gray-800" style={{ '--color-accent': '#212529' } as React.CSSProperties}>
    <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6"><div className="flex items-center gap-3"><img src="/app.png" alt="" className="h-10 w-10 object-contain" /><span className="text-2xl font-bold tracking-tight">chefito</span><span className="hidden h-5 w-px bg-gray-300 sm:block" /><span className="hidden text-sm text-gray-500 sm:block">Administração da plataforma</span></div><div className="flex items-center gap-5"><span className="text-sm text-gray-500">Chefito é gratuito</span><button type="button" onClick={async () => { await supabase.auth.signOut(); window.location.assign('/'); }} className="text-sm font-bold">Sair</button></div></header>
    <main className="mx-auto max-w-7xl px-6 pb-16"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">Administração da plataforma</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Seu painel Chefito</h1><p className="mt-2 text-sm text-gray-500">Acompanhe a plataforma e fique perto dos seus negócios.</p></div><div className="flex flex-wrap items-center gap-3"><label htmlFor="admin-period" className="text-sm">Período dos pedidos</label><Select id="admin-period" className="w-48" value={period} onChange={setPeriod} options={[{value:"7",label:"Últimos 7 dias"},{value:"30",label:"Últimos 30 dias"},{value:"90",label:"Últimos 90 dias"},{value:"all",label:"Todo o período"}]} /></div></div>
      <nav aria-label="Administração" className="mb-8 flex w-fit max-w-full flex-wrap gap-1 rounded-full bg-gray-200/70 p-1">{([['overview','Visão geral'],['businesses','Negócios'],['ads','Anúncios'],['homepage','Página inicial']] as const).map(([id,title]) => <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-full px-5 py-3 text-sm font-bold transition-colors ${tab === id ? 'bg-gray-800 text-white shadow-card' : 'text-gray-600 hover:bg-white/70'}`} aria-current={tab === id ? 'page' : undefined}>{title}</button>)}</nav>
      {error && <div role="alert" className="mb-5 rounded-xl border border-gray-300 bg-gray-200 p-4 text-gray-800">{error}</div>}{notice && <div role="status" className="mb-5 rounded-xl border border-gray-200 bg-gray-200 p-4 text-gray-800">{notice}</div>}{loading && <p role="status" className="mb-4 text-sm text-gray-500">Atualizando dados...</p>}
      {tab === 'overview' && <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Negócios', businesses.length], ['Novos nos últimos 30 dias', businesses.filter(b => Date.now() - new Date(b.created_at).getTime() < 30 * 86400000).length], ['Pedidos no período', businesses.reduce((n,b) => n + Number(b.orders), 0)], ['Vendas entregues no período', money(businesses.reduce((n,b) => n + Number(b.sales), 0))]].map(([name,value]) => <div className={section} key={name}><p className="text-sm text-gray-600">{name}</p><p className="mt-4 text-3xl font-bold tracking-tight text-gray-800">{value}</p></div>)}</div><div className={`${section} mt-5`}><h2 className="text-lg font-bold">Atividade dos negócios</h2><p className="mt-2 text-gray-500">{(() => { const n = businesses.filter(b => b.last_order && Date.now() - new Date(b.last_order).getTime() < 30 * 86400000).length; return `${quantidade(n, 'negócio recebeu', 'negócios receberam')} pedidos nos últimos 30 dias.`; })()}</p><p className="mt-3 text-sm text-gray-500">Vendas correspondem aos pedidos marcados como entregues. O Chefito é gratuito para todos os negócios.</p></div></>}
      {tab === 'homepage' && <div className="space-y-5"><HeroImageSettings /><TickerSettings /></div>}
      {tab === 'overview' && <OrdersTrend days={trend} allPeriod={period === 'all'} loading={loading} />}
      {tab === 'businesses' && <section><div className="mb-5 flex flex-wrap gap-3"><input className={`${input} max-w-md`} value={query} onChange={e => setQuery(e.target.value)} placeholder="Pesquisar por nome, endereço ou email" aria-label="Pesquisar negócios" /><Select id="business-filter" className="w-72 max-w-full" value={activity} onChange={setActivity} options={[{value:"all",label:"Todos os negócios"},{value:"new",label:"Novos nos últimos 30 dias"},{value:"active",label:"Com pedidos nos últimos 30 dias"},{value:"inactive",label:"Sem pedidos nos últimos 30 dias"}]} /></div><div className="space-y-3">{filtered.map(b => <article className={section} key={b.id}><button type="button" className="flex w-full flex-wrap items-center justify-between gap-3 text-left" onClick={() => setExpandedBusiness(expandedBusiness === b.id ? null : b.id)} aria-expanded={expandedBusiness === b.id}><span><strong className="text-lg">{b.name}</strong><span className="ml-3 text-sm text-gray-500">chefi.to/{b.slug}</span></span><span className="text-sm text-gray-500">{quantidade(b.products, 'produto', 'produtos')} · {quantidade(b.orders, 'pedido', 'pedidos')} · {money(b.sales)} <i className="fas fa-chevron-down ml-2" aria-hidden="true" /></span></button>{expandedBusiness === b.id && <div className="mt-5 grid gap-3 border-t border-gray-100 pt-5 text-sm sm:grid-cols-2 lg:grid-cols-3"><p>Responsável: {b.owner_email || 'Não informado'}</p><p>Endereço: {b.location || 'Não informado'}</p><p>Cadastro: {date(b.created_at)}</p><p>Último pedido: {date(b.last_order)}</p><p>Clientes cadastrados: {b.customers}</p><p>Situação: {b.status === 'active' ? 'Ativo' : b.status === 'suspended' ? 'Suspenso' : 'Indisponível'}</p><a href={`/${encodeURIComponent(b.slug)}`} target="_blank" rel="noreferrer" className="font-bold underline">Abrir página do negócio</a></div>}{expandedBusiness === b.id && <BusinessDetails key={`${b.id}-${period}`} businessId={b.id} period={period} />}</article>)}{!loading && filtered.length === 0 && <p className="py-8 text-center text-gray-500">Nenhum negócio encontrado.</p>}</div></section>}
      {tab === 'ads' && <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]"><section className={section}><div className="mb-6 flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-200 text-gray-800"><i className="fas fa-megaphone" aria-hidden="true" /></span><div><h2 className="text-xl font-bold">{editing ? 'Editar anúncio' : 'Criar anúncio'}</h2><p className="mt-1 text-sm text-gray-500">Compartilhe novidades com os donos de negócios.</p></div></div><form onSubmit={save} className="space-y-4"><div><label className={label} htmlFor="ad-title">Título</label><input id="ad-title" className={input} required maxLength={120} value={form.title} onChange={e => setForm({...form,title:e.target.value})} /></div><div><label className={label} htmlFor="ad-message">Mensagem</label><textarea id="ad-message" className={input} rows={4} required maxLength={3000} value={form.message} onChange={e => setForm({...form,message:e.target.value})} /></div><div><label className={label} htmlFor="ad-label">Texto do botão (opcional)</label><input id="ad-label" className={input} maxLength={60} value={form.button_label} onChange={e => setForm({...form,button_label:e.target.value})} /></div><div><label className={label} htmlFor="ad-url">Link do botão (opcional)</label><input id="ad-url" className={input} type="url" placeholder="https://" value={form.button_url} onChange={e => setForm({...form,button_url:e.target.value})} /></div><fieldset><legend className={`${label} mb-3`}>Situação</legend><div className="grid grid-cols-3 gap-2">{([{value:'draft',label:'Rascunho',icon:'file-pen'}, {value:'published',label:'Publicado',icon:'circle-check'}, {value:'ended',label:'Encerrado',icon:'circle-stop'}] as const).map(option => <label key={option.value} className="relative cursor-pointer"><input type="radio" name="ad-status" value={option.value} checked={form.status === option.value} onChange={() => setForm({...form,status:option.value})} className="peer sr-only" /><span className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border-2 border-gray-200 p-2 text-center text-gray-600 transition-colors hover:border-gray-300 peer-checked:border-gray-800 peer-checked:bg-gray-200/70 peer-checked:text-gray-800 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gray-800"><i className={`fas fa-${option.icon} text-xl`} aria-hidden="true" /><span className="text-sm font-medium">{option.label}</span></span></label>)}</div></fieldset><div className="flex gap-3"><button disabled={saving} className="btn btn-primary min-w-40">{saving ? 'Salvando...' : 'Salvar anúncio'}</button>{editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); }} className="rounded-full bg-gray-100 px-6 py-3">Cancelar edição</button>}</div></form></section><section><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Seus anúncios</h2><p className="mt-1 text-sm text-gray-500">Acompanhe suas publicações e visualizações.</p></div><span className="rounded-full bg-gray-200 px-3 py-1 text-sm text-gray-600">{ads.length}</span></div><div className="space-y-4">{ads.map(ad => { const views = (overview.ad_views || []).filter(v => v.ad_id === ad.id); return <article key={ad.id} className={section}><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-lg font-bold">{ad.title}</h3><p className="mt-1 text-sm text-gray-500">{ad.status === 'published' ? 'Publicado' : ad.status === 'ended' ? 'Encerrado' : 'Rascunho'} · Criado em {date(ad.created_at)}</p></div><button type="button" className="text-sm font-bold underline" onClick={() => { setEditing(ad.id); setForm({ title: ad.title, message: ad.message, button_label: ad.button_label || '', button_url: ad.button_url || '', status: ad.status }); window.scrollTo({top:0,behavior:'smooth'}); }}>Editar</button></div><p className="mt-3 whitespace-pre-line text-gray-600">{ad.message}</p><p className="mt-4 text-sm text-gray-500">{quantidade(views.length, 'negócio visualizou', 'negócios visualizaram')} · {quantidade(views.reduce((n,v) => n + v.view_count, 0), 'visualização', 'visualizações')}</p><button type="button" className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray-200/70 px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200" aria-expanded={expandedAd === ad.id} onClick={() => setExpandedAd(expandedAd === ad.id ? null : ad.id)}> {expandedAd === ad.id ? 'Ocultar visualizações' : 'Ver quem visualizou'}</button>{expandedAd === ad.id && <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">{views.length ? views.map(v => <div key={v.business_id} className="text-sm"><strong>{v.business_name}</strong><span className="block text-gray-500">{quantidade(v.view_count, 'visualização', 'visualizações')} · última em {date(v.last_viewed_at)}</span></div>) : <p className="text-sm text-gray-500">Nenhuma visualização ainda.</p>}</div>}</article>; })}{!loading && ads.length === 0 && <p className="text-gray-500">Nenhum anúncio criado.</p>}</div></section></div>}
    </main></div>;
}
