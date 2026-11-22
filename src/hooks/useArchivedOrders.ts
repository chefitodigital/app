import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../types/supabase';

type Order = Database['public']['Tables']['orders']['Row'];

interface UseArchivedOrdersReturn {
  orders: Order[];
  totalCount: number;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  fetchArchivedOrders: () => Promise<void>;
}

export function useArchivedOrders(): UseArchivedOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchArchivedOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('status', 'delivered')
        .order('created_at', { ascending: false });

      if (searchQuery.trim()) {
        const search = `%${searchQuery.trim()}%`;
        query = query.or(
          `customer_name.ilike.${search},customer_phone.ilike.${search},customer_email.ilike.${search},address.ilike.${search},notes.ilike.${search}`
        );
      }

      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      setOrders((data || []) as Order[]);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching archived orders:', error);
      toast.error('Erro ao carregar arquivo');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, currentPage, pageSize]);

  return {
    orders,
    totalCount,
    isLoading,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    pageSize,
    fetchArchivedOrders,
  };
}
