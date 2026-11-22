import type { CartItem } from '../store/cart';
import type { Database } from '../types/supabase';
import { formatWhatsAppMessage } from './orderFormatter';

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

export function formatPhoneForWhatsApp(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11 ? `55${cleaned}` : cleaned;
}

export function sendOrderToWhatsApp(
  items: CartItem[],
  orderInfo: OrderInfo,
  total: number,
  appliedCoupon: Coupon | null,
  discountAmount: number,
  restaurantWhatsApp: string,
  formatCurrency: (value: number) => string,
  publicUrl?: string,
  targetWindow?: Window | null,
  deliveryFee: number = 0
): boolean {
  try {
    if (!restaurantWhatsApp || restaurantWhatsApp.trim() === '') {
      console.log('WhatsApp number not configured, skipping auto-send');
      try { targetWindow?.close(); } catch { /* ignore */ }
      return false;
    }

    const formattedPhone = formatPhoneForWhatsApp(restaurantWhatsApp);

    if (!formattedPhone) {
      console.log('Invalid WhatsApp number format, skipping auto-send');
      try { targetWindow?.close(); } catch { /* ignore */ }
      return false;
    }

    const message = formatWhatsAppMessage(
      items,
      orderInfo,
      total,
      appliedCoupon,
      discountAmount,
      formatCurrency,
      publicUrl,
      deliveryFee
    );

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

    if (targetWindow && !targetWindow.closed) {
      targetWindow.location.href = whatsappUrl;
    } else {
      if (!window.open(whatsappUrl, '_blank')) return false;
    }

    return true;
  } catch (error) {
    console.error('Error opening WhatsApp:', error);
    try { targetWindow?.close(); } catch { /* ignore */ }
    return false;
  }
}
