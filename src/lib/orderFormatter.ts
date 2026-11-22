import type { CartItem } from '../store/cart';
import type { Database } from '../types/supabase';

type Coupon = Database['public']['Tables']['discount_coupons']['Row'];

interface OrderInfo {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  notes: string;
  isTakeaway: boolean;
  isAtRestaurant: boolean;
}

export function formatWhatsAppMessage(
  items: CartItem[],
  orderInfo: OrderInfo,
  total: number,
  appliedCoupon: Coupon | null,
  discountAmount: number,
  formatCurrency: (value: number) => string,
  publicUrl?: string,
  deliveryFee: number = 0
): string {
  let orderType = 'Novo Pedido - Delivery';
  let addressLabel = 'Endereço';

  if (orderInfo.isTakeaway) {
    orderType = 'Novo Pedido - Retirada';
    addressLabel = 'Horário de retirada';
  } else if (orderInfo.isAtRestaurant) {
    orderType = 'Novo Pedido - Mesa';
    addressLabel = 'Mesa';
  }

  const calculatedTotal = items.reduce((sum, item) => {
    if (item.isFreeProduct) return sum;
    const itemPrice = item.price + item.extras.reduce((extraSum, extra) => extraSum + (extra.price * extra.quantity), 0);
    return sum + (itemPrice * item.quantity);
  }, 0);

  const subtotal = calculatedTotal;

  const couponInfo = appliedCoupon
    ? appliedCoupon.discount_type === 'free_product'
      ? `\n\n*Cupom:* ${appliedCoupon.code}\n*Oferta:* ${appliedCoupon.free_product_description || 'Produto grátis'}`
      : `\n\n*Cupom:* ${appliedCoupon.code}\n*Desconto:* -${formatCurrency(discountAmount)}`
    : '';

  const finalTotal = subtotal - discountAmount + (deliveryFee || 0);
  const deliveryLine = deliveryFee > 0 ? `\n*Taxa de entrega:* ${formatCurrency(deliveryFee)}` : '';

  const hasBreakdown = (appliedCoupon && appliedCoupon.discount_type !== 'free_product') || deliveryFee > 0;

  const totalSection = hasBreakdown
    ? `\n\n*Subtotal:* ${formatCurrency(subtotal)}${couponInfo}${deliveryLine}\n*Total Final:* ${formatCurrency(finalTotal)}`
    : appliedCoupon
      ? `${couponInfo}\n\n*Total:* ${formatCurrency(subtotal)}`
      : `\n\n*Total:* ${formatCurrency(subtotal)}`;

  const itemsText = items
    .map((item) => {
      const basePrice = item.price * item.quantity;
      const extrasTotal = item.extras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0) * item.quantity;
      const itemTotal = basePrice + extrasTotal;

      const extras = item.extras.length > 0
        ? `\n  *Extras:*\n${item.extras.map(extra => `    - ${extra.name} (${extra.quantity}x): ${formatCurrency(extra.price * extra.quantity)}`).join('\n')}`
        : '';

      const subtotalLine = item.extras.length > 0
        ? `\n  *Subtotal:* ${formatCurrency(itemTotal)}`
        : '';

      return `*${item.name}*\n${item.quantity}x ${formatCurrency(basePrice)}${extras}${subtotalLine}`;
    })
    .join('\n\n');

  const linkLine = publicUrl ? `\n\n*Ver pedido:* ${publicUrl}` : '';

  return `${orderType}\n\n*Cliente:* ${orderInfo.customerName}\n*Email:* ${orderInfo.customerEmail}\n*Celular:* ${orderInfo.customerPhone}\n*${addressLabel}:* ${orderInfo.address}${
    orderInfo.notes ? `\n*Observações:* ${orderInfo.notes}` : ''
  }\n\n${itemsText}${totalSection}${linkLine}`;
}

export function getOrderType(isTakeaway: boolean, isAtRestaurant: boolean): 'delivery' | 'table' | 'takeaway' {
  if (isTakeaway) return 'takeaway';
  if (isAtRestaurant) return 'table';
  return 'delivery';
}
