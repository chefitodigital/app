import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { OrderItem } from '../types/supabase';

export interface ProductStat {
  name: string;
  quantity: number;
}

interface UseProductStatsReturn {
  stats: ProductStat[];
  isLoading: boolean;
  fetchProductStats: () => Promise<void>;
}

export function useProductStats(): UseProductStatsReturn {
  const [stats, setStats] = useState<ProductStat[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProductStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('items')
        .eq('status', 'delivered');

      if (error) throw error;

      const productMap = new Map<string, number>();

      (data || []).forEach(order => {
        const items = order.items as OrderItem[];
        items.forEach(item => {
          const current = productMap.get(item.name) || 0;
          productMap.set(item.name, current + item.quantity);
        });
      });

      const sortedStats = Array.from(productMap.entries())
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity);

      setStats(sortedStats);
    } catch (error) {
      console.error('Error fetching product stats:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    stats,
    isLoading,
    fetchProductStats,
  };
}
