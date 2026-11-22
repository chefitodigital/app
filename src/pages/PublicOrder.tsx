import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useThemeStore } from '../store/theme';
import { isValidPublicOrderSlug } from '../lib/publicSlug';
import type { Database } from '../types/supabase';
import { getCurrentBusinessId } from '../lib/businessFetch';

type Order = Database['public']['Tables']['orders']['Row'];
type PublicOrderData = Pick<Order,
  'id' | 'order_type' | 'items' | 'subtotal' | 'discount_amount' | 'total' |
  'delivery_fee' | 'coupon_code' | 'status' | 'order_sequence' | 'created_at' | 'delivered_at'
>;

interface ProductLite {
  id: string;
  image_url: string;
}

const ORDER_TYPE_LABEL: Record<Order['order_type'], string> = {
  delivery: 'Entrega',
  table: 'Consumo na mesa',
  takeaway: 'Retirada',
};

export default function PublicOrder() {
  const { slug } = useParams<{ slug: string }>();
  const { settings, formatCurrency } = useThemeStore();
  const [order, setOrder] = useState<PublicOrderData | null>(null);
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!slug || !isValidPublicOrderSlug(slug)) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const businessId = getCurrentBusinessId();
      if (!businessId) { setNotFound(true); setLoading(false); return; }
      const { data, error } = await supabase.rpc('get_public_order', {
        p_business_id: businessId,
        p_public_slug: slug,
      });

      if (cancelled) return;

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Client-side expiry check (also enforced by RLS)
      const publicOrder = data as unknown as PublicOrderData;
      if (publicOrder.delivered_at) {
        const deliveredAt = new Date(publicOrder.delivered_at).getTime();
        if (Date.now() - deliveredAt > 24 * 60 * 60 * 1000) {
          setExpired(true);
          setLoading(false);
          return;
        }
      }

      setOrder(publicOrder);

      const ids = Array.from(new Set((publicOrder.items || []).map((item) => item.id).filter(Boolean)));
      if (ids.length) {
        const { data: products } = await supabase
          .from('products')
          .select('id, image_url')
          .in('id', ids);
        if (!cancelled && products) {
          const map: Record<string, string> = {};
          (products as ProductLite[]).forEach(p => { map[p.id] = p.image_url; });
          setProductImages(map);
        }
      }

      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || expired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <i className="fas fa-receipt text-2xl text-gray-400" />
        </div>
        <h1 className="text-xl font-title text-gray-800 mb-2">
          {expired ? 'Este pedido não está mais disponível' : 'Pedido não encontrado'}
        </h1>
        <p className="text-sm text-gray-500 max-w-md">
          {expired
            ? 'O link expirou 24 horas após o pedido ter sido enviado.'
            : 'Verifique se o endereço está correto.'}
        </p>
      </div>
    );
  }

  if (!order) return null;

  const isDelivery = order.order_type === 'delivery';
  const deliveryFeeEnabled = settings?.delivery_fee_enabled ?? false;
  const deliveryFee = Number(order.delivery_fee) || 0;
  const isDelivered = order.status === 'delivered';

  const createdAt = new Date(order.created_at);
  const formattedDate = createdAt.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          {settings?.logo_url && (
            <img
              src={settings.logo_url}
              alt={settings.name}
              className="h-12 mx-auto mb-3 object-contain"
            />
          )}
          <h1 className="text-2xl font-title text-gray-900">{settings?.name || 'Pedido'}</h1>
          <p className="text-sm text-gray-500 mt-1">Comprovante do pedido</p>
        </div>

        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 sm:p-8">
          {/* Meta */}
          <div className="flex items-start justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Pedido</div>
              <div className="text-lg font-title text-gray-900">
                #{order.order_sequence ?? order.id.slice(0, 6)}
              </div>
              <div className="text-xs text-gray-500 mt-1">{formattedDate}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                <i className="fas fa-utensils text-[10px]" />
                {ORDER_TYPE_LABEL[order.order_type]}
              </span>
              {isDelivered && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  <i className="fas fa-check text-[10px]" />
                  Enviado
                </span>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3 mb-6">
            {(order.items || []).map((item, idx) => {
              const image = productImages[item.id];
              const extrasTotal = (item.extras || []).reduce(
                (s, e) => s + (Number(e.price) || 0) * (Number(e.quantity) || 0),
                0
              );
              const lineTotal = (Number(item.price) + extrasTotal) * Number(item.quantity);
              return (
                <div key={idx} className="flex gap-3 p-3 rounded-2xl bg-gray-50">
                  <div className="w-16 h-16 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0">
                    {image ? (
                      <img src={image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <i className="fas fa-image" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-gray-900 text-sm">
                        {item.quantity}× {item.name}
                      </div>
                      <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                        {formatCurrency(lineTotal)}
                      </div>
                    </div>
                    {(item.extras || []).length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {item.extras.map((e, i) => (
                          <li key={i} className="text-xs text-gray-500">
                            + {e.quantity}× {e.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="space-y-2 text-sm pt-4 border-t border-gray-100">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(Number(order.subtotal))}</span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Desconto{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
                <span>-{formatCurrency(Number(order.discount_amount))}</span>
              </div>
            )}
            {isDelivery && deliveryFeeEnabled && (
              <div className="flex justify-between text-gray-600">
                <span>Entrega</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-title text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>{formatCurrency(Number(order.total))}</span>
            </div>
            {isDelivery && !deliveryFeeEnabled && (
              <p className="text-xs text-gray-500 pt-2 italic">
                O valor acima não inclui o preço da entrega.
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Este link expira 24h após o pedido ser marcado como enviado.
        </p>
      </div>
    </div>
  );
}
