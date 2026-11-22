import { useEffect, useState } from 'react';

type Day = { day: string; orders: number };
const countLabel = (count: number) => `${count} ${count === 1 ? 'pedido' : 'pedidos'}`;
const shortDate = (date: string) => date.slice(8, 10) + '/' + date.slice(5, 7);
const fullDate = (date: string) => date.split('-').reverse().join('/');

export function OrdersTrend({ days, allPeriod, loading }: { days: Day[]; allPeriod: boolean; loading: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  useEffect(() => { setSelected(null); }, [days]);
  const total = days.reduce((sum, day) => sum + Number(day.orders), 0);
  const peak = Math.max(0, ...days.map(day => Number(day.orders)));
  const max = Math.max(2, Math.ceil(peak / 2) * 2);
  const chosen = days.find(day => day.day === selected);
  const step = Math.max(1, Math.ceil(days.length / 7));

  return <section className="mt-5 rounded-2xl border border-white/60 bg-gray-50/80 p-6 shadow-card backdrop-blur-xl" aria-labelledby="orders-trend-title">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 id="orders-trend-title" className="text-lg font-bold">Evolução de pedidos</h2><p className="mt-1 text-sm text-gray-600">Pedidos por dia · horário de Brasília{allPeriod ? ' · últimos 90 dias' : ''}</p></div>
      {days.length > 0 && <div className="text-left sm:text-right"><p className="text-xs text-gray-500">Total no gráfico</p><p className="mt-1 text-xl font-bold text-gray-800">{countLabel(total)}</p></div>}
    </div>
    {loading && days.length === 0 ? <p className="mt-6 text-sm text-gray-600" role="status">Carregando gráfico...</p> : days.length === 0 ? <p className="mt-6 text-sm text-gray-600">Não há dados disponíveis para o período.</p> : <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm"><p className="font-bold text-gray-800" aria-live="polite">{chosen ? `${fullDate(chosen.day)} · ${countLabel(Number(chosen.orders))}` : 'Selecione uma barra para ver os pedidos do dia'}</p><span className="text-gray-500">Maior movimento: {countLabel(peak)} em um dia</span></div>
      <div className="mt-5 overflow-x-auto pb-2" tabIndex={0} aria-label="Gráfico de pedidos por dia. Role horizontalmente para ver todas as datas.">
        <div className="min-w-[560px]" style={{ minWidth: Math.max(560, days.length * 18) }}>
          <div className="flex h-40 gap-3"><div className="flex w-8 shrink-0 flex-col justify-between text-right text-xs text-gray-500" aria-hidden="true"><span>{max}</span><span>{max / 2}</span><span>0</span></div>
            <div className="relative flex min-w-0 flex-1 items-end"><div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden="true"><span className="border-t border-gray-200" /><span className="border-t border-gray-200" /><span className="border-t border-gray-300" /></div>
              {days.map(day => <button key={day.day} type="button" aria-label={`${fullDate(day.day)}: ${countLabel(Number(day.orders))}`} aria-pressed={selected === day.day} onMouseEnter={() => setSelected(day.day)} onFocus={() => setSelected(day.day)} onClick={() => setSelected(day.day)} className="group relative z-10 flex h-full min-w-0 flex-1 items-end justify-center rounded-t focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800"><span className={`w-3/4 max-w-6 rounded-t transition-colors ${selected === day.day ? 'bg-gray-900' : 'bg-gray-500 group-hover:bg-gray-800'} ${Number(day.orders) === 0 ? 'opacity-25' : ''}`} style={{ height: `${Math.max(Number(day.orders) ? 2 : 1, Number(day.orders) / max * 100)}%` }} /></button>)}
            </div></div>
          <div className="ml-11 mt-2 flex text-xs text-gray-500" aria-hidden="true">{days.map((day, index) => <span key={day.day} className="min-w-0 flex-1 overflow-visible whitespace-nowrap">{(index % step === 0 || index === days.length - 1) && (index !== days.length - 1 || index % step === 0 || days.length - 1 - Math.floor((days.length - 1) / step) * step > 2) ? shortDate(day.day) : ''}</span>)}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4"><p className="text-xs text-gray-500">{fullDate(days[0].day)} a {fullDate(days[days.length - 1].day)} · inclui todos os pedidos, independentemente da situação.</p><button type="button" aria-expanded={showTable} onClick={() => setShowTable(!showTable)} className="rounded-full bg-gray-200/70 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200">{showTable ? 'Ocultar detalhes' : 'Ver detalhes por dia'}</button></div>
      {showTable && <div className="mt-4 overflow-hidden rounded-xl border border-gray-200"><table className="w-full text-left text-sm"><caption className="sr-only">Quantidade de pedidos nos últimos sete dias do gráfico</caption><thead className="sticky top-0 bg-gray-100 text-gray-600"><tr><th scope="col" className="px-4 py-3">Data</th><th scope="col" className="px-4 py-3 text-right">Pedidos</th></tr></thead><tbody>{days.slice(-7).reverse().map(day => <tr key={day.day} className="border-t border-gray-200"><td className="px-4 py-2">{fullDate(day.day)}</td><td className="px-4 py-2 text-right">{Number(day.orders)}</td></tr>)}</tbody></table></div>}
    </>}
  </section>;
}
