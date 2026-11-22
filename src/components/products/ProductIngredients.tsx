import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getCurrentBusinessId } from '../../lib/businessFetch';
import { Select } from '../ui/Select';

type Item = { name: string; quantity: string; unit: string };
const units = ['g', 'kg', 'ml', 'l', 'unidade', 'folha', 'rodela', 'fatia'].map(value => ({ value, label: value }));
const aliases: Record<string, string> = { gr:'g', grama:'g', gramas:'g', quilo:'kg', quilos:'kg', quilograma:'kg', quilogramas:'kg', mililitro:'ml', mililitros:'ml', litro:'l', litros:'l', un:'unidade', unidades:'unidade', folhas:'folha', rodelas:'rodela', fatias:'fatia', colheres:'colher', 'porções':'porção' };
const normalUnit = (unit: string) => aliases[unit.trim().toLocaleLowerCase('pt-BR')] || unit.trim().toLocaleLowerCase('pt-BR');

export function ProductIngredients({ productId }: { productId: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [names, setNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    const businessId = getCurrentBusinessId();
    void Promise.all([supabase.rpc('get_product_ingredients', { p_product: productId }), businessId ? supabase.rpc('list_ingredient_names', { p_business: businessId }) : Promise.resolve({ data: [], error: null })]).then(([result, suggestions]) => {
      if (!active) return;
      if (result.error) { setLoadError(true); setMessage('Não foi possível carregar os ingredientes. Feche e abra o produto novamente para tentar de novo.'); }
      else setItems(((result.data || []) as unknown as {name:string;quantity:number;unit:string}[]).map(i => ({ ...i, unit: normalUnit(i.unit), quantity: String(i.quantity).replace('.', ',') })));
      if (!suggestions.error) setNames(suggestions.data || []);
      setLoading(false);
    });
    return () => { active = false; };
  }, [productId]);
  const save = async () => {
    if (loadError) return;
    const parsed = items.map(i => ({ name: i.name.trim(), unit: i.unit.trim().toLocaleLowerCase('pt-BR'), quantity: Number(i.quantity.replace(',', '.')) }));
    if (parsed.some(i => !i.name || !i.unit || !Number.isFinite(i.quantity) || i.quantity <= 0)) { setMessage('Informe o nome, a unidade e uma quantidade maior que zero para cada item.'); return; }
    if (new Set(parsed.map(i => `${i.name.toLocaleLowerCase('pt-BR')}|${i.unit}`)).size !== parsed.length) { setMessage('Agrupe itens repetidos na mesma unidade.'); return; }
    setSaving(true); setMessage('');
    const { error } = await supabase.rpc('save_product_ingredients', { p_product: productId, p_items: parsed });
    setSaving(false); setMessage(error ? 'Não foi possível salvar os ingredientes. Tente novamente.' : 'Ingredientes salvos.');
    if (!error) setNames(previous => Array.from(new Set([...previous, ...parsed.map(item => item.name)])).sort((a,b) => a.localeCompare(b, 'pt-BR')));
  };
  return <section className="rounded-xl border border-gray-200 bg-white/60 p-4 sm:p-5">
    <h4 className="font-bold text-gray-800">Ingredientes e consumo</h4><p className="mt-1 text-sm text-gray-600">Controle privado: estes itens não aparecem para seus clientes. Informe a quantidade usada em uma unidade do produto.</p>
    {loading ? <p className="mt-4 text-sm text-gray-500">Carregando ingredientes...</p> : <><div className="mt-4 space-y-3">{items.map((item,index) => <div key={index} className="grid grid-cols-[minmax(0,1fr)_4rem_8rem_auto] items-end gap-2"><div><label className="mb-1 block text-xs text-gray-600" htmlFor={`ingredient-name-${index}`}>Item</label><input id={`ingredient-name-${index}`} maxLength={100} value={item.name} onChange={e => setItems(items.map((i,n) => n===index ? {...i,name:e.target.value} : i))} className="h-12 w-full rounded-lg border border-gray-200 bg-white px-3" placeholder="Ex.: pão" /></div><div><label className="mb-1 block text-xs text-gray-600" htmlFor={`ingredient-quantity-${index}`}>Qtd.</label><input id={`ingredient-quantity-${index}`} inputMode="decimal" value={item.quantity} onChange={e => setItems(items.map((i,n) => n===index ? {...i,quantity:e.target.value} : i))} className="h-12 w-full rounded-lg border border-gray-200 bg-white px-2" placeholder="0" /></div><div><label className="mb-1 block text-xs text-gray-600" htmlFor={`ingredient-unit-${index}`}>Unidade</label><Select id={`ingredient-unit-${index}`} value={item.unit} onChange={unit => setItems(items.map((i,n) => n===index ? {...i,unit} : i))} options={item.unit && !units.some(option => option.value === item.unit) ? [{ value: item.unit, label: item.unit }, ...units] : units} placeholder="Unid." /></div><button type="button" aria-label={`Remover item ${index+1}`} onClick={() => setItems(items.filter((_,n) => n!==index))} className="h-12 w-9 text-gray-500 hover:text-gray-800"><i className="fas fa-trash" aria-hidden="true" /></button></div>)}</div>{showArchive && <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4"><p className="text-sm font-bold text-gray-800">Itens já cadastrados</p><p className="mt-1 text-xs text-gray-600">Selecione um item e informe a quantidade e a unidade usadas neste produto.</p><div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto">{names.filter(name => !items.some(item => item.name.trim().toLocaleLowerCase('pt-BR') === name.trim().toLocaleLowerCase('pt-BR'))).map(name => <button key={name} type="button" onClick={() => { setItems([...items,{name,quantity:'',unit:''}]); setMessage(''); }} className="rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:border-accent hover:text-accent"><i className="fas fa-plus mr-2" aria-hidden="true" />{name}</button>)}{names.filter(name => !items.some(item => item.name.trim().toLocaleLowerCase('pt-BR') === name.trim().toLocaleLowerCase('pt-BR'))).length === 0 && <p className="text-sm text-gray-500">Nenhum outro item disponível.</p>}</div></div>}<div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={loadError || names.length === 0} onClick={() => setShowArchive(!showArchive)} aria-expanded={showArchive} className="btn btn-secondary text-sm"><i className="fas fa-list" aria-hidden="true" /> {showArchive ? 'Fechar lista' : 'Itens cadastrados'}</button><button type="button" disabled={loadError} onClick={() => setItems([...items,{name:'',quantity:'',unit:''}])} className="btn btn-secondary text-sm"><i className="fas fa-plus" aria-hidden="true" /> Adicionar item</button><button type="button" onClick={() => void save()} disabled={saving || loadError} className="btn btn-primary text-sm">{saving ? 'Salvando...' : 'Salvar ingredientes'}</button></div>{message && <p role="status" className="mt-3 text-sm text-gray-600">{message}</p>}</>}
  </section>;
}
