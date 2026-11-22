import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../types/supabase';

type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

export interface CustomerWithTotalSpent extends Customer {
  totalSpent: number;
}

export interface DuplicateGroup {
  customers: CustomerWithTotalSpent[];
  matchType: 'phone' | 'email' | 'address';
}

interface UseCustomersReturn {
  customers: CustomerWithTotalSpent[];
  isLoading: boolean;
  fetchCustomers: () => Promise<void>;
  createCustomer: (data: CustomerInsert) => Promise<Customer | null>;
  updateCustomer: (id: string, data: CustomerUpdate) => Promise<boolean>;
  deleteCustomer: (id: string) => Promise<boolean>;
  mergeCustomers: (keepId: string, deleteId: string, mergedData: CustomerUpdate) => Promise<boolean>;
  findDuplicates: () => DuplicateGroup[];
  findOrCreateCustomer: (name: string, phone: string, email: string, address: string) => Promise<Customer | null>;
  resolveAlternateNames: (id: string, chosenName: string) => Promise<boolean>;
}

export function useCustomers(): UseCustomersReturn {
  const [customers, setCustomers] = useState<CustomerWithTotalSpent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (customersError) throw customersError;

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('customer_id, total')
        .eq('status', 'delivered');

      if (ordersError) throw ordersError;

      const totalSpentByCustomer = new Map<string, number>();
      (ordersData || []).forEach((order) => {
        if (order.customer_id) {
          const current = totalSpentByCustomer.get(order.customer_id) || 0;
          totalSpentByCustomer.set(order.customer_id, current + (order.total || 0));
        }
      });

      const customersWithTotalSpent: CustomerWithTotalSpent[] = (customersData || []).map((customer) => ({
        ...customer,
        totalSpent: totalSpentByCustomer.get(customer.id) || 0,
      }));

      setCustomers(customersWithTotalSpent);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const customersChannel = supabase
      .channel('customers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers',
        },
        () => {
          fetchCustomers();
        }
      )
      .subscribe();

    const ordersChannel = supabase
      .channel('orders-changes-for-customers')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          fetchCustomers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(customersChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [fetchCustomers]);

  const createCustomer = useCallback(async (data: CustomerInsert): Promise<Customer | null> => {
    try {
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert([data])
        .select()
        .maybeSingle();

      if (error) throw error;
      toast.success('Cliente criado com sucesso!');
      return newCustomer as Customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('Erro ao criar cliente');
      return null;
    }
  }, []);

  const updateCustomer = useCallback(async (id: string, data: CustomerUpdate): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('customers')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      toast.success('Cliente atualizado com sucesso!');
      await fetchCustomers();
      return true;
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Erro ao atualizar cliente');
      return false;
    }
  }, [fetchCustomers]);

  const deleteCustomer = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Cliente excluído com sucesso!');
      await fetchCustomers();
      return true;
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Erro ao excluir cliente');
      return false;
    }
  }, [fetchCustomers]);

  const mergeCustomers = useCallback(async (
    keepId: string,
    deleteId: string,
    mergedData: CustomerUpdate
  ): Promise<boolean> => {
    try {
      const { error: updateOrdersError } = await supabase
        .from('orders')
        .update({ customer_id: keepId })
        .eq('customer_id', deleteId);

      if (updateOrdersError) throw updateOrdersError;

      const { error: updateCustomerError } = await supabase
        .from('customers')
        .update(mergedData)
        .eq('id', keepId);

      if (updateCustomerError) throw updateCustomerError;

      const { error: deleteError } = await supabase
        .from('customers')
        .delete()
        .eq('id', deleteId);

      if (deleteError) throw deleteError;

      toast.success('Clientes mesclados com sucesso!');
      await fetchCustomers();
      return true;
    } catch (error) {
      console.error('Error merging customers:', error);
      toast.error('Erro ao mesclar clientes');
      return false;
    }
  }, [fetchCustomers]);

  const findDuplicates = useCallback((): DuplicateGroup[] => {
    const duplicates: DuplicateGroup[] = [];
    const processedPairs = new Set<string>();

    const phoneGroups = new Map<string, CustomerWithTotalSpent[]>();
    const emailGroups = new Map<string, CustomerWithTotalSpent[]>();

    customers.forEach(customer => {
      const normalizedPhone = customer.phone.replace(/\D/g, '');
      if (normalizedPhone) {
        const existing = phoneGroups.get(normalizedPhone) || [];
        existing.push(customer);
        phoneGroups.set(normalizedPhone, existing);
      }

      const normalizedEmail = customer.email.toLowerCase().trim();
      if (normalizedEmail) {
        const existing = emailGroups.get(normalizedEmail) || [];
        existing.push(customer);
        emailGroups.set(normalizedEmail, existing);
      }
    });

    phoneGroups.forEach((group) => {
      if (group.length > 1) {
        const pairKey = group.map(c => c.id).sort().join('-');
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          duplicates.push({ customers: group, matchType: 'phone' });
        }
      }
    });

    emailGroups.forEach((group) => {
      if (group.length > 1) {
        const pairKey = group.map(c => c.id).sort().join('-');
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          duplicates.push({ customers: group, matchType: 'email' });
        }
      }
    });

    return duplicates;
  }, [customers]);

  const findOrCreateCustomer = useCallback(async (
    name: string,
    phone: string,
    email: string,
    address: string
  ): Promise<Customer | null> => {
    try {
      const normalizedPhone = phone.replace(/\D/g, '');
      const normalizedEmail = email.toLowerCase().trim();

      const { data: existingByPhone } = await supabase
        .from('customers')
        .select('*')
        .ilike('phone', `%${normalizedPhone}%`)
        .maybeSingle();

      if (existingByPhone) {
        const customer = existingByPhone as Customer;
        const existingAddresses = customer.addresses || [];
        const normalizedAddress = address.trim();
        const needsUpdate = normalizedAddress && !existingAddresses.some(a =>
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

      const { data: existingByEmail } = await supabase
        .from('customers')
        .select('*')
        .ilike('email', normalizedEmail)
        .maybeSingle();

      if (existingByEmail) {
        const customer = existingByEmail as Customer;
        const existingAddresses = customer.addresses || [];
        const normalizedAddress = address.trim();
        const needsUpdate = normalizedAddress && !existingAddresses.some(a =>
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
          addresses: address.trim() ? [address.trim()] : []
        }])
        .select()
        .maybeSingle();

      if (error) throw error;
      return newCustomer as Customer;
    } catch (error) {
      console.error('Error finding/creating customer:', error);
      return null;
    }
  }, []);

  const resolveAlternateNames = useCallback(async (id: string, chosenName: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: chosenName,
          alternate_names: [],
          needs_review: false,
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Nomes alternativos resolvidos!');
      await fetchCustomers();
      return true;
    } catch (error) {
      console.error('Error resolving alternate names:', error);
      toast.error('Erro ao resolver nomes alternativos');
      return false;
    }
  }, [fetchCustomers]);

  return {
    customers,
    isLoading,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    mergeCustomers,
    findDuplicates,
    findOrCreateCustomer,
    resolveAlternateNames,
  };
}
