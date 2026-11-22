import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PageHeader } from '../components/ui/PageHeader';
import type { Database } from '../types/supabase';

type Ad = Database['public']['Tables']['platform_ads']['Row'];

function AdCard({ ad }: { ad: Ad }) {
  const ref = useRef<HTMLElement>(null);
  const recorded = useRef(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let timer: number | undefined;
    let visible = false;
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.5;
      if (timer) window.clearTimeout(timer);
      if (visible && document.visibilityState === 'visible' && !recorded.current) {
        timer = window.setTimeout(async () => {
          if (recorded.current || !visible || document.visibilityState !== 'visible') return;
          recorded.current = true;
          const { error } = await supabase.rpc('record_platform_ad_views', { p_ad_ids: [ad.id] });
          if (error) { recorded.current = false; console.error('Erro ao registrar visualização:', error); }
          else window.dispatchEvent(new Event('chefito-ads-viewed'));
        }, 1000);
      } else if (timer) window.clearTimeout(timer);
    }, { threshold: 0.5 });
    observer.observe(element);
    const onVisibilityChange = () => { if (document.visibilityState === 'visible' && !recorded.current) { observer.unobserve(element); observer.observe(element); } };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => { if (timer) window.clearTimeout(timer); observer.disconnect(); document.removeEventListener('visibilitychange', onVisibilityChange); };
  }, [ad.id]);
  return <article ref={ref} className="rounded-2xl bg-white p-6 shadow-card border border-gray-200">
    <div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"><i className="fas fa-circle-star" aria-hidden="true" /></span>
      <div className="min-w-0"><h2 className="text-xl font-bold text-gray-800">{ad.title}</h2><p className="mt-2 whitespace-pre-line text-gray-600">{ad.message}</p>
        {ad.button_label && ad.button_url && <a href={ad.button_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-5">{ad.button_label} <i className="fas fa-square-up-right" aria-hidden="true" /></a>}
      </div></div>
  </article>;
}

export default function ChefitoCentral() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    void supabase.from('platform_ads').select('*').eq('status', 'published').order('created_at', { ascending: false }).then(({ data, error: fetchError }) => {
      if (!active) return;
      const now = Date.now();
      setError(!!fetchError); setAds((data || []).filter(ad => (!ad.starts_at || Date.parse(ad.starts_at) <= now) && (!ad.ends_at || Date.parse(ad.ends_at) > now))); setLoading(false);
    });
    return () => { active = false; };
  }, []);
  return <div className="mx-auto max-w-4xl pb-8">
    <PageHeader title="Central Chefito" description="Novidades e oportunidades para seu negócio" icon="trophy-star" />
    {loading ? <p className="text-gray-600" role="status">Carregando novidades...</p> : error ? <p role="alert">Não foi possível carregar as novidades. Atualize a página para tentar novamente.</p> : ads.length ? <div className="space-y-4">{ads.map(ad => <AdCard key={ad.id} ad={ad} />)}</div> : <div className="rounded-2xl bg-white p-10 text-center text-gray-600 shadow-card"><i className="fas fa-trophy-star text-3xl text-gray-400" aria-hidden="true" /><p className="mt-3 font-bold text-gray-800">Nenhuma novidade por enquanto</p><p className="mt-1 text-sm">Quando houver uma novidade, ela aparecerá aqui.</p></div>}
  </div>;
}
