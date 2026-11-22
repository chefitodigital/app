import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getCurrentBusinessId } from '../../lib/businessFetch';
import { Select } from '../ui/Select';

type Item = { name: string; quantity: number; unit: string };
function format(item: Item) {
  let value = Number(item.quantity); let unit = item.unit;
  if (value >= 1000 && (unit === 'g' || unit === 'ml')) { value /= 1000; unit = unit === 'g' ? 'kg' : 'l'; }
  if (value !== 1 && unit === 'unidade') unit = 'unidades';
  if (value !== 1 && unit === 'folha') unit = 'folhas';
  if (value !== 1 && unit === 'rodela') unit = 'rodelas';
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} ${unit}`;
}
export function IngredientConsumption() {
  const [period, setPeriod] = useState('7');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true; const businessId = getCurrentBusinessId();
    if (!businessId) { setError(true); setLoading(false); return; }
    setLoading(true); setError(false);
    const start = period === 'all' ? new Date('1970-01-01T00:00:00Z') : new Date();
    if (period !== 'all') { start.setHours(0,0,0,0); start.setDate(start.getDate() - (Number(period)-1)); }
    const end = new Date(); end.setHours(24,0,0,0);
    void supabase.rpc('ingredient_consumption', { p_business: businessId, p_from: start.toISOString(), p_to: end.toISOString() }).then(({data,error:fetchError}) => {
      if (!active) return;
      setError(!!fetchError); setItems((data || []) as unknown as Item[]); setLoading(false);
    });
    return () => { active = false; };
  }, [period]);
  return <section className="ui-card rounded-2xl bg-gray-50/70 p-6 shadow-card"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-gray-800">Consumo de ingredientes</h2><p className="mt-1 text-sm text-gray-600">Estimativa dos itens usados nos pedidos concluídos.</p></div><div className="w-48"><Select id="ingredient-period" value={period} onChange={setPeriod} options={[{value:'7',label:'Últimos 7 dias'},{value:'30',label:'Últimos 30 dias'},{value:'90',label:'Últimos 90 dias'},{value:'all',label:'Todo o período'}]} /></div></div><p className="mt-4 text-sm text-gray-600">Os ingredientes são registrados quando o pedido é concluído. Pedidos anteriores à configuração não entram no cálculo.</p>{loading ? <p role="status" className="mt-5 text-gray-500">Carregando consumo...</p> : error ? <p role="alert" className="mt-5 text-gray-600">Não foi possível carregar o consumo.</p> : items.length ? <div className="mt-4 divide-y divide-gray-200">{items.map(item => <div key={`${item.name}-${item.unit}`} className="flex items-center justify-between gap-4 py-3"><span className="text-gray-700">{item.name}</span><strong className="text-gray-800">{format(item)}</strong></div>)}</div> : <p className="mt-5 text-sm text-gray-600">Nenhum consumo registrado neste período. Cadastre os ingredientes na edição dos produtos.</p>}</section>;
}
