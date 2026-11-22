import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';
import type { Database } from '../types/supabase';

type Customer = Database['public']['Tables']['customers']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];

interface CustomerProfile {
  name: string;
  phone: string;
  email: string;
  birth_date: string;
  addresses: string[];
}

export function useCustomerProfile() {
  const { userId, userEmail } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCustomerData = useCallback(async () => {
    if (!userEmail) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();

      if (customerError) {
        console.error('Error fetching customer:', customerError);
        setCustomer(null);
      } else if (!customerData) {
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert({
            user_id: userId,
            name: userEmail.split('@')[0],
            phone: '',
            email: userEmail,
            addresses: [],
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating customer profile:', createError);
          setCustomer(null);
        } else {
          setCustomer(newCustomer);
        }
      } else {
        if (userId && !customerData.user_id) {
          await supabase
            .from('customers')
            .update({ user_id: userId })
            .eq('id', customerData.id);
          customerData.user_id = userId;
        }
        setCustomer(customerData);
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', userEmail)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        setOrders([]);
      } else {
        setOrders(ordersData || []);
      }
    } catch (error) {
      console.error('Error in fetchCustomerData:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, userEmail]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const updateProfile = async (profile: Partial<CustomerProfile>) => {
    if (!userEmail) {
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      setIsSaving(true);

      if (customer) {
        const { error } = await supabase
          .from('customers')
          .update({
            name: profile.name || customer.name,
            phone: profile.phone || customer.phone,
            birth_date: profile.birth_date || customer.birth_date,
            updated_at: new Date().toISOString(),
          })
          .eq('email', userEmail);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('customers')
          .insert({
            user_id: userId,
            name: profile.name || '',
            phone: profile.phone || '',
            email: userEmail,
            birth_date: profile.birth_date || null,
            addresses: profile.addresses || [],
          })
          .select()
          .single();

        if (error) throw error;
        setCustomer(data);
      }

      await fetchCustomerData();
      toast.success('Perfil atualizado com sucesso!');
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const addAddress = async (address: string) => {
    if (!userEmail) {
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      if (!customer) {
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert({
            user_id: userId,
            name: userEmail.split('@')[0],
            phone: '',
            email: userEmail,
            addresses: [address],
          })
          .select()
          .single();

        if (createError) throw createError;
        setCustomer(newCustomer);
        toast.success('Endereco adicionado!');
        return true;
      }

      const addresses = Array.isArray(customer.addresses) ? customer.addresses : [];
      const newAddresses = [...addresses, address];

      const { error } = await supabase
        .from('customers')
        .update({
          addresses: newAddresses,
          updated_at: new Date().toISOString(),
        })
        .eq('email', userEmail);

      if (error) throw error;

      await fetchCustomerData();
      toast.success('Endereco adicionado!');
      return true;
    } catch (error) {
      console.error('Error adding address:', error);
      toast.error('Erro ao adicionar endereco');
      return false;
    }
  };

  const removeAddress = async (index: number) => {
    if (!customer || !userEmail) {
      toast.error('Perfil nao encontrado');
      return false;
    }

    try {
      const addresses = Array.isArray(customer.addresses) ? customer.addresses : [];
      const newAddresses = addresses.filter((_, i) => i !== index);

      const { error } = await supabase
        .from('customers')
        .update({
          addresses: newAddresses,
          updated_at: new Date().toISOString(),
        })
        .eq('email', userEmail);

      if (error) throw error;

      await fetchCustomerData();
      toast.success('Endereco removido!');
      return true;
    } catch (error) {
      console.error('Error removing address:', error);
      toast.error('Erro ao remover endereco');
      return false;
    }
  };

  const updateAddressCoords = async (index: number, coords: { lat: number; lng: number }) => {
    if (!customer || !userEmail) return false;

    try {
      const existingCoords: ({ lat: number; lng: number } | null)[] = Array.isArray(customer.address_coordinates)
        ? [...customer.address_coordinates]
        : [];

      while (existingCoords.length <= index) {
        existingCoords.push(null);
      }
      existingCoords[index] = coords;

      const { error } = await supabase
        .from('customers')
        .update({ address_coordinates: existingCoords, updated_at: new Date().toISOString() })
        .eq('email', userEmail);

      if (error) throw error;

      await fetchCustomerData();
      toast.success('Localização salva!');
      return true;
    } catch (error) {
      console.error('Error updating address coords:', error);
      toast.error('Erro ao salvar localização');
      return false;
    }
  };

  return {
    customer,
    orders,
    isLoading,
    isSaving,
    updateProfile,
    addAddress,
    removeAddress,
    updateAddressCoords,
    refreshData: fetchCustomerData,
  };
}
