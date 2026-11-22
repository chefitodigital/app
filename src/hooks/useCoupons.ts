import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../types/supabase';

type Coupon = Database['public']['Tables']['discount_coupons']['Row'];
type CouponInsert = Database['public']['Tables']['discount_coupons']['Insert'];

export interface CouponValidationResult {
  coupon: Coupon | null;
  error?: 'not_found' | 'inactive' | 'limit_reached' | 'minimum_not_reached';
  minimumRequired?: number;
}

interface UseCouponsReturn {
  coupons: Coupon[];
  isLoading: boolean;
  fetchCoupons: () => Promise<void>;
  createCoupon: (data: CouponInsert) => Promise<boolean>;
  updateCoupon: (id: string, data: Partial<Coupon>) => Promise<boolean>;
  deleteCoupon: (id: string) => Promise<boolean>;
  validateCoupon: (code: string) => Promise<CouponValidationResult>;
  incrementUsageCount: (couponId: string) => Promise<boolean>;
}

export function useCoupons(autoFetch = true): UseCouponsReturn {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Erro ao carregar cupons');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) void fetchCoupons();
  }, [autoFetch, fetchCoupons]);

  const createCoupon = useCallback(async (data: CouponInsert): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('discount_coupons')
        .insert([{ ...data, code: data.code.toUpperCase() }]);

      if (error) {
        if (error.code === '23505') {
          toast.error('Já existe um cupom com este código');
        } else {
          throw error;
        }
        return false;
      }

      toast.success('Cupom criado com sucesso!');
      await fetchCoupons();
      return true;
    } catch (error) {
      console.error('Error creating coupon:', error);
      toast.error('Erro ao criar cupom');
      return false;
    }
  }, [fetchCoupons]);

  const updateCoupon = useCallback(async (id: string, data: Partial<Coupon>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('discount_coupons')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast.success('Cupom atualizado!');
      await fetchCoupons();
      return true;
    } catch (error) {
      console.error('Error updating coupon:', error);
      toast.error('Erro ao atualizar cupom');
      return false;
    }
  }, [fetchCoupons]);

  const deleteCoupon = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('discount_coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Cupom excluído!');
      await fetchCoupons();
      return true;
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Erro ao excluir cupom');
      return false;
    }
  }, [fetchCoupons]);

  const validateCoupon = useCallback(async (code: string): Promise<CouponValidationResult> => {
    try {
      const { data: couponData, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (!couponData) {
        return { coupon: null, error: 'not_found' };
      }

      if (!couponData.active) {
        return { coupon: null, error: 'inactive' };
      }

      if (couponData.usage_limit && couponData.usage_count >= couponData.usage_limit) {
        return { coupon: null, error: 'limit_reached' };
      }

      return {
        coupon: couponData
      };
    } catch (error) {
      console.error('Error validating coupon:', error);
      return { coupon: null, error: 'not_found' };
    }
  }, []);

  const incrementUsageCount = useCallback(async (couponId: string): Promise<boolean> => {
    try {
      const { data: currentCoupon } = await supabase
        .from('discount_coupons')
        .select('usage_count')
        .eq('id', couponId)
        .maybeSingle();

      if (currentCoupon) {
        const { error } = await supabase
          .from('discount_coupons')
          .update({ usage_count: (currentCoupon.usage_count || 0) + 1 })
          .eq('id', couponId);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error incrementing coupon usage:', error);
      return false;
    }
  }, []);

  return {
    coupons,
    isLoading,
    fetchCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
    incrementUsageCount,
  };
}
