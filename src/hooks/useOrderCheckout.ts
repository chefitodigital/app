import { useState } from 'react';
import { useThemeStore } from '../store/theme';
import { getOrderType } from '../lib/orderFormatter';
import { sendOrderToWhatsApp } from '../lib/whatsappSender';
import { supabase } from '../lib/supabase';
import { generatePublicOrderSlug } from '../lib/publicSlug';
import { getDeliveryMinimumShortfall } from '../lib/checkoutRules';
import toast from 'react-hot-toast';
import type { CartItem } from '../store/cart';
import type { Database } from '../types/supabase';
import { getCurrentBusinessId } from '../lib/businessFetch';
import { getBusinessSlug } from '../lib/businessRoutes';

type Coupon = Database['public']['Tables']['discount_coupons']['Row'];

export interface OrderSubmitResult {
  success: boolean;
  orderId?: string;
  orderSequence?: number | null;
  paymentMethod?: 'cash' | 'mbway' | 'pix';
  publicSlug?: string;
  publicUrl?: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  isAtRestaurant: boolean;
  isTakeaway: boolean;
  paymentMethod: 'cash' | 'mbway' | 'pix';
  deliveryLat: number | null;
  deliveryLng: number | null;
}

export function useOrderCheckout() {
  const { settings, formatCurrency } = useThemeStore();
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);
  const [savedAddressCoords, setSavedAddressCoords] = useState<({ lat: number; lng: number } | null)[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    isAtRestaurant: false,
    isTakeaway: false,
    paymentMethod: 'cash',
    deliveryLat: null,
    deliveryLng: null,
  });

  const validateCustomerInfo = (): boolean => {
    if (!customerInfo.name.trim()) {
      toast.error('Por favor, informe seu nome!');
      return false;
    }
    if (!customerInfo.email.trim()) {
      toast.error('Por favor, informe seu e-mail!');
      return false;
    }
    if (!customerInfo.phone.trim()) {
      toast.error('Por favor, informe seu celular!');
      return false;
    }
    if (!customerInfo.address.trim()) {
      const fieldName = customerInfo.isTakeaway
        ? 'o horário de retirada'
        : customerInfo.isAtRestaurant
          ? 'o número da mesa'
          : 'seu endereço';
      toast.error(`Por favor, informe ${fieldName}!`);
      return false;
    }
    return true;
  };

  const initiateCheckout = async (itemCount: number) => {
    if (itemCount === 0) {
      toast.error('Adicione itens ao carrinho primeiro!');
      return false;
    }

    if (!settings?.has_delivery && !settings?.has_table_service && !settings?.has_takeaway) {
      toast.error('Este negócio não está aceitando pedidos no momento.');
      return false;
    }

    const availableOptions = [
      settings?.has_delivery,
      settings?.has_table_service,
      settings?.has_takeaway
    ].filter(Boolean).length;

    let isDelivery = !customerInfo.isAtRestaurant && !customerInfo.isTakeaway;
    let isAtRestaurant = customerInfo.isAtRestaurant;
    let isTakeaway = customerInfo.isTakeaway;

    if (availableOptions === 1) {
      if (settings?.has_delivery && !settings?.has_table_service && !settings?.has_takeaway) {
        isDelivery = true;
      } else if (!settings?.has_delivery && settings?.has_table_service && !settings?.has_takeaway) {
        isAtRestaurant = true;
      } else if (!settings?.has_delivery && !settings?.has_table_service && settings?.has_takeaway) {
        isTakeaway = true;
      }
    } else if (
      (isDelivery && !settings?.has_delivery) ||
      (isAtRestaurant && !settings?.has_table_service) ||
      (isTakeaway && !settings?.has_takeaway)
    ) {
      isDelivery = !!settings?.has_delivery;
      isAtRestaurant = !isDelivery && !!settings?.has_table_service;
      isTakeaway = !isDelivery && !isAtRestaurant && !!settings?.has_takeaway;
    }

    setSavedAddresses([]);
    setSavedAddressCoords([]);
    setCustomerInfo(prev => ({
      ...prev,
      isAtRestaurant,
      isTakeaway,
    }));

    setShowCustomerForm(true);
    return true;
  };

  const submitOrder = async (
    items: CartItem[],
    total: number,
    discountAmount: number,
    appliedCoupon: Coupon | null
  ): Promise<OrderSubmitResult> => {
    if (!validateCustomerInfo()) {
      return { success: false };
    }

    const shouldAutoSendWhatsApp = !!(
      settings?.whatsapp_auto_send && settings?.social_links?.whatsapp
    );

    const orderTypeDb = getOrderType(customerInfo.isTakeaway, customerInfo.isAtRestaurant);
    const deliveryFee = getDeliveryFee();
    const orderSubtotalAfterDiscount = total - discountAmount;
    const minimumDeliveryOrderValue = settings?.delivery_minimum_order_value ?? 0;
    const isDeliveryOrder = !customerInfo.isTakeaway && !customerInfo.isAtRestaurant;

    const amountNeeded = getDeliveryMinimumShortfall(
      total,
      discountAmount,
      minimumDeliveryOrderValue,
      isDeliveryOrder,
    );
    if (amountNeeded > 0) {
      toast.error(`O pedido mínimo para entrega é ${formatCurrency(minimumDeliveryOrderValue)}. Adicione mais ${formatCurrency(amountNeeded)} ao carrinho.`);
      return { success: false };
    }

    // Open a placeholder tab only after all local validation passes, so an
    // invalid delivery order never leaves an empty WhatsApp tab behind.
    const whatsappWindow = shouldAutoSendWhatsApp ? window.open('', '_blank') : null;

    const finalTotal = orderSubtotalAfterDiscount + deliveryFee;

    const orderItems = items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      extras: item.extras.map(extra => ({
        id: extra.id,
        name: extra.name,
        price: extra.price,
        quantity: extra.quantity,
      })),
    }));


    try {
      // Generate unique 6-char public slug (retry on rare collision)
      let publicSlug = generatePublicOrderSlug();
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data: existing } = await supabase
          .from('orders')
          .select('id')
          .eq('public_slug', publicSlug)
          .maybeSingle();
        if (!existing) break;
        publicSlug = generatePublicOrderSlug();
      }
      const publicUrl = `${window.location.origin}/${getBusinessSlug(window.location.pathname)}/pedido/${publicSlug}`;

      const { error: createError } = await supabase.rpc('create_order_with_coupon', {
        p_order: {
          business_id: getCurrentBusinessId(),
          customer_id: null,
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone,
          address: customerInfo.address,
          notes: customerInfo.notes || null,
          order_type: orderTypeDb,
          items: orderItems,
          subtotal: total,
          discount_amount: discountAmount,
          total: finalTotal,
          delivery_fee: deliveryFee,
          coupon_code: appliedCoupon?.code || null,
          payment_method: customerInfo.paymentMethod,
          public_slug: publicSlug,
        },
        p_coupon_id: appliedCoupon?.id ?? null,
      });

      if (createError) {
        if (createError.message.includes('coupon_unavailable')) {
          toast.error('Este cupom já atingiu o limite de usos.');
        }
        throw createError;
      }

      // This lookup is informational: a failure must never cause the customer
      // to submit the already-created order again.
      let orderSequence: number | null = null;
      const businessId = getCurrentBusinessId();
      if (businessId) {
        try {
          const { data } = await supabase.rpc('get_public_order', { p_business_id: businessId, p_public_slug: publicSlug });
          const publicOrder = data as { order_sequence?: number | null } | null;
          if (typeof publicOrder?.order_sequence === 'number' && Number.isSafeInteger(publicOrder.order_sequence) && publicOrder.order_sequence > 0) orderSequence = publicOrder.order_sequence;
        } catch (error) {
          console.error('Não foi possível consultar a referência do pedido:', error);
        }
      }

      if (shouldAutoSendWhatsApp) {
        try {
          const opened = sendOrderToWhatsApp(
            items,
            {
              customerName: customerInfo.name,
              customerEmail: customerInfo.email,
              customerPhone: customerInfo.phone,
              address: customerInfo.address,
              notes: customerInfo.notes,
              isTakeaway: customerInfo.isTakeaway,
              isAtRestaurant: customerInfo.isAtRestaurant
            },
            total,
            appliedCoupon,
            discountAmount,
            settings!.social_links!.whatsapp!,
            formatCurrency,
            publicUrl,
            whatsappWindow,
            deliveryFee
          );
          if (!opened) toast.error('Pedido salvo, mas não foi possível abrir o WhatsApp. Verifique o bloqueio de pop-ups.');
        } catch (error) {
          console.error('Failed to open WhatsApp:', error);
          try { whatsappWindow?.close(); } catch { /* ignore */ }
        }
      } else {
        try { whatsappWindow?.close(); } catch { /* ignore */ }
      }

      return {
        success: true,
        orderId: undefined,
        orderSequence,
        paymentMethod: customerInfo.paymentMethod,
        publicSlug,
        publicUrl,
      };
    } catch (error) {
      console.error('Error creating order:', error);
      try { whatsappWindow?.close(); } catch { /* ignore */ }
      toast.error('Erro ao enviar pedido. Por favor, tente novamente.');
      return { success: false };
    }
  };

  const getDeliveryFee = (): number => {
    const isDeliveryOrder = !customerInfo.isTakeaway && !customerInfo.isAtRestaurant;
    return isDeliveryOrder ? Math.max(0, settings?.delivery_base_price ?? 0) : 0;
  };

  const getAddressLabel = () => {
    if (customerInfo.isTakeaway) return 'Horário de retirada';
    if (customerInfo.isAtRestaurant) return 'Número da Mesa';
    return 'Endereço';
  };

  const getAddressPlaceholder = () => {
    if (customerInfo.isTakeaway) return 'Ex: 19:30';
    if (customerInfo.isAtRestaurant) return 'Número da mesa';
    return 'Endereço completo';
  };

  const resetCustomerForm = () => {
    setShowCustomerForm(false);
    setCustomerInfo({
      name: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
      isAtRestaurant: false,
      isTakeaway: false,
      paymentMethod: 'cash',
      deliveryLat: null,
      deliveryLng: null,
    });
  };

  const returnToCart = () => setShowCustomerForm(false);

  return {
    showCustomerForm,
    customerInfo,
    savedAddresses,
    savedAddressCoords,
    setCustomerInfo,
    initiateCheckout,
    submitOrder,
    getAddressLabel,
    getAddressPlaceholder,
    resetCustomerForm,
    returnToCart,
    getDeliveryFee,
  };
}
