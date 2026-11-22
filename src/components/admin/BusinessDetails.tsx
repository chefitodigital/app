import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Details = {
  settings: { whatsapp: string | null; social: string | null; has_delivery: boolean; has_takeaway: boolean; has_table_service: boolean; pix_enabled: boolean } | null;
  catalog: { active_products: number; categories: number; active_staff: number; active_coupons: number; products_with_ingredients: number };
  orders: { total: number; pending: number; accepted: number; delivered: number; delivery: number; takeaway: number; table_service: number; delivered_total: number; average_delivered: number; paid: number; unpaid: number };
  products: { name: string; quantity: number }[];
  ingredients: { name: string; quantity: number; unit: string }[];
};
const money = (value: number) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const count = (value: number) => Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
function amount(value: number, unit: string) {
  const n = Number(value);
  if (n >= 1000 && (unit === 'g' || unit === 'ml')) return `${count(n / 1000)} ${unit === 'g' ? 'kg' : 'l'}`;
  const plural: Record<string, string> = { unidade: 'unidades', folha: 'folhas', rodela: 'rodelas', fatia: 'fatias' };
  return `${count(n)} ${n !== 1 ? plural[unit] || unit : unit}`;
}

export function BusinessDetails({ businessId, period }: { businessId: string; period: string }) {
  const [data, setData] = useState<Details | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let current = true;
    const from = period === 'all' ? undefined : new Date(Date.now() - Number(period) * 86400000).toISOString();
    void supabase.rpc('platform_admin_business_details', { p_business: businessId, p_from: from }).then(result => {
      if (!current) return;
      if (result.error || !result.data) setError(true);
      else setData(result.data as unknown as Details);
    });
    return () => { current = false; };
  }, [businessId, period]);
  if (error) return <p role="alert" className="mt-5 text-sm text-gray-600">Não foi possível carregar os detalhes deste negócio.</p>;
  if (!data) return <p role="status" className="mt-5 text-sm text-gray-600">Carregando detalhes...</p>;
  const metrics = [['Concluídos',count(data.orders.delivered)], ['Em andamento',count(data.orders.accepted)], ['Aguardando',count(data.orders.pending)], ['Ticket médio dos concluídos',money(data.orders.average_delivered)], ['Produtos ativos',count(data.catalog.active_products)], ['Categorias',count(data.catalog.categories)], ['Funcionários ativos',count(data.catalog.active_staff)], ['Cupons ativos',count(data.catalog.active_coupons)]];
  const channels = [data.settings?.has_delivery && 'Entrega', data.settings?.has_takeaway && 'Retirada', data.settings?.has_table_service && 'Mesa'].filter(Boolean);
  return <div className="mt-6 space-y-6 border-t border-gray-200 pt-6">
    <div><h4 className="font-bold text-gray-800">Visão operacional</h4><p className="mt-1 text-sm text-gray-600">Pedidos e valores seguem o período selecionado no painel. Os demais números são atuais.</p><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{metrics.map(([label,value]) => <div key={label} className="rounded-lg bg-gray-100 p-3"><p className="text-xs text-gray-600">{label}</p><p className="mt-1 font-bold text-gray-800">{value}</p></div>)}</div></div>
    <div className="grid gap-4 text-sm sm:grid-cols-2"><p><span className="text-gray-600">Modalidades ativas:</span> {channels.length ? channels.join(', ') : 'Não informadas'}</p><p><span className="text-gray-600">Pix:</span> {data.settings?.pix_enabled ? 'Ativado' : 'Não ativado'}</p><p><span className="text-gray-600">WhatsApp:</span> {data.settings?.whatsapp || 'Não informado'}</p><p><span className="text-gray-600">Rede social:</span> {data.settings?.social || 'Não informado'}</p></div>
    <div><h4 className="font-bold text-gray-800">Pedidos por modalidade</h4><p className="mt-2 text-sm text-gray-600">Entrega: {count(data.orders.delivery)} · Retirada: {count(data.orders.takeaway)} · Mesa: {count(data.orders.table_service)}</p><p className="mt-1 text-sm text-gray-600">Pagos: {count(data.orders.paid)} · Aguardando pagamento: {count(data.orders.unpaid)}</p></div>
    <div className="grid gap-6 lg:grid-cols-2"><section><h4 className="font-bold text-gray-800">Produtos mais vendidos</h4><p className="mt-1 text-sm text-gray-600">Quantidade em pedidos concluídos no período.</p>{data.products.length ? <ul className="mt-3 divide-y divide-gray-200">{data.products.map((item,index) => <li key={`${item.name}-${index}`} className="flex justify-between gap-4 py-2 text-sm"><span>{item.name}</span><strong>{count(item.quantity)}</strong></li>)}</ul> : <p className="mt-3 text-sm text-gray-600">Nenhuma venda concluída no período.</p>}</section>
    <section><h4 className="font-bold text-gray-800">Consumo de ingredientes</h4><p className="mt-1 text-sm text-gray-600">Estimativa de pedidos concluídos no período de conclusão; {count(data.catalog.products_with_ingredients)} {data.catalog.products_with_ingredients === 1 ? 'produto' : 'produtos'} com ficha técnica. Pedidos anteriores à configuração não entram no cálculo.</p>{data.ingredients.length ? <ul className="mt-3 divide-y divide-gray-200">{data.ingredients.map((item,index) => <li key={`${item.name}-${item.unit}-${index}`} className="flex justify-between gap-4 py-2 text-sm"><span>{item.name}</span><strong>{amount(item.quantity,item.unit)}</strong></li>)}</ul> : <p className="mt-3 text-sm text-gray-600">Nenhum consumo registrado no período.</p>}</section></div>
  </div>;
}
