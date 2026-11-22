import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../types/supabase';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

const isValidAddress = (address: string): boolean => {
  const trimmed = address.trim();
  if (!trimmed) return false;
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) return false;
  if (/^\d{1,2}h\d{0,2}$/i.test(trimmed)) return false;
  if (trimmed.length < 5) return false;
  return true;
};

interface UseOrdersReturn {
  orders: Order[];
  isLoading: boolean;
  fetchOrders: () => Promise<void>;
  createOrder: (data: OrderInsert) => Promise<boolean>;
  acceptOrder: (id: string) => Promise<boolean>;
  cancelOrder: (id: string) => Promise<boolean>;
  markAsDelivered: (id: string) => Promise<boolean>;
  togglePaymentStatus: (id: string, current: 'pending' | 'paid') => Promise<boolean>;
  isFirstOrderForCustomer: (customerEmail: string) => Promise<boolean>;
}

export function useOrders(): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []) as Order[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const findOrCreateCustomer = async (
    name: string,
    phone: string,
    email: string,
    address: string
  ): Promise<Customer | null> => {
    try {
      const normalizedPhone = phone.replace(/\D/g, '');
      const normalizedEmail = email.toLowerCase().trim();

      const { data: existingByEmail } = await supabase
        .from('customers')
        .select('*')
        .ilike('email', normalizedEmail)
        .order('user_id', { ascending: false, nullsFirst: false })
        .maybeSingle();

      let customer: Customer | null = existingByEmail as Customer | null;

      if (!customer) {
        const { data: existingByPhone } = await supabase
          .from('customers')
          .select('*')
          .ilike('phone', `%${normalizedPhone}%`)
          .order('user_id', { ascending: false, nullsFirst: false })
          .maybeSingle();

        customer = existingByPhone as Customer | null;
      }

      if (customer) {
        const existingAddresses = customer.addresses || [];
        const normalizedAddress = address.trim();
        const needsUpdate = isValidAddress(normalizedAddress) && !existingAddresses.some(a =>
          a.toLowerCase().trim() === normalizedAddress.toLowerCase()
        );

        const trimmedName = name.trim();
        const currentName = customer.name.trim();
        const alternateNames = customer.alternate_names || [];
        const nameIsDifferent = trimmedName.toLowerCase() !== currentName.toLowerCase() &&
                               !alternateNames.some(n => n.toLowerCase() === trimmedName.toLowerCase());

        if (needsUpdate || nameIsDifferent) {
          const updateData: CustomerUpdate = {};

          if (needsUpdate) {
            updateData.addresses = [...existingAddresses, normalizedAddress];
          }

          if (nameIsDifferent) {
            updateData.alternate_names = [...alternateNames, trimmedName];
            updateData.needs_review = true;
          }

          await supabase
            .from('customers')
            .update(updateData)
            .eq('id', customer.id);

          return { ...customer, ...updateData };
        }
        return customer;
      }

      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert([{
          name,
          phone,
          email: normalizedEmail,
          addresses: isValidAddress(address) ? [address.trim()] : []
        }])
        .select()
        .maybeSingle();

      if (error) throw error;
      return newCustomer as Customer;
    } catch (error) {
      console.error('Error finding/creating customer:', error);
      return null;
    }
  };

  const createOrder = useCallback(async (data: OrderInsert): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('orders')
        .insert([data]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating order:', error);
      return false;
    }
  }, []);

  const acceptOrder = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!order) throw new Error('Order not found');

      const customer = await findOrCreateCustomer(
        order.customer_name,
        order.customer_phone,
        order.customer_email,
        order.address
      );

      const { error } = await supabase
        .from('orders')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          customer_id: customer?.id || null,
          viewed: true,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Pedido aceito!');
      await fetchOrders();
      return true;
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Erro ao aceitar pedido');
      return false;
    }
  }, [fetchOrders]);

  const cancelOrder = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Pedido cancelado');
      await fetchOrders();
      return true;
    } catch (error) {
      console.error('Error canceling order:', error);
      toast.error('Erro ao cancelar pedido');
      return false;
    }
  }, [fetchOrders]);

  const markAsDelivered = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          viewed: true,
        })
        .eq('id', id);

      if (error) throw error;

      // A função/trigger do banco credita os pontos de forma atómica quando o
      // estado passa para "delivered". Fazer isso também no cliente duplicava
      // os pontos e ainda consultava uma tabela que não existe no schema atual.

      toast.success('Pedido enviado!');
      await fetchOrders();
      return true;
    } catch (error) {
      console.error('Error marking order as delivered:', error);
      toast.error('Erro ao marcar pedido como enviado');
      return false;
    }
  }, [fetchOrders]);

  const togglePaymentStatus = useCallback(async (id: string, current: 'pending' | 'paid'): Promise<boolean> => {
    const next = current === 'pending' ? 'paid' : 'pending';
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: next })
        .eq('id', id);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === id ? { ...o, payment_status: next } : o));
      return true;
    } catch (error) {
      console.error('Error toggling payment status:', error);
      toast.error('Erro ao atualizar estado do pagamento');
      return false;
    }
  }, []);

  const isFirstOrderForCustomer = useCallback(async (customerEmail: string): Promise<boolean> => {
    try {
      if (!customerEmail) return false;

      const normalizedEmail = customerEmail.toLowerCase().trim();

      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .ilike('customer_email', normalizedEmail)
        .in('status', ['accepted', 'delivered'])
        .limit(2);

      if (error) {
        console.error('Error checking first order:', error);
        return false;
      }

      return (data?.length || 0) === 1;
    } catch (error) {
      console.error('Error in isFirstOrderForCustomer:', error);
      return false;
    }
  }, []);

  return {
    orders,
    isLoading,
    fetchOrders,
    createOrder,
    acceptOrder,
    cancelOrder,
    markAsDelivered,
    togglePaymentStatus,
    isFirstOrderForCustomer,
  };
}
