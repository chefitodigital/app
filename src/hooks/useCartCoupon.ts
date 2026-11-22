import { useState, createElement } from 'react';
import { useCoupons } from './useCoupons';
import { useThemeStore } from '../store/theme';
import toast from 'react-hot-toast';
import type { Database } from '../types/supabase';

type Coupon = Database['public']['Tables']['discount_coupons']['Row'];

export function useCartCoupon() {
  const { validateCoupon, incrementUsageCount } = useCoupons(false);
  const { formatCurrency } = useThemeStore();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const calculateDiscount = (total: number) => {
    if (!appliedCoupon) return 0;

    if (appliedCoupon.discount_type === 'percentage') {
      return total * (appliedCoupon.discount_value / 100);
    }

    if (appliedCoupon.discount_type === 'fixed') {
      return Math.min(appliedCoupon.discount_value, total);
    }

    return 0;
  };

  const handleApplyCoupon = async (cartTotal: number) => {
    if (!couponCode.trim()) {
      toast.error('Insira um código de cupom');
      return;
    }

    setIsValidatingCoupon(true);
    const result = await validateCoupon(couponCode);
    setIsValidatingCoupon(false);

    if (result.error) {
      switch (result.error) {
        case 'not_found':
          toast.error('Cupom inválido');
          break;
        case 'inactive':
          toast.error('Este cupom não está mais ativo');
          break;
        case 'limit_reached':
          toast.error('Este cupom já atingiu o limite de usos');
          break;
        default:
          toast.error('Erro ao validar cupom');
      }
      return;
    }

    if (result.coupon) {
      if (
        (result.coupon.discount_type === 'fixed' || result.coupon.discount_type === 'free_product') &&
        result.coupon.minimum_order_value !== null &&
        cartTotal < result.coupon.minimum_order_value
      ) {
        const amountNeeded = result.coupon.minimum_order_value - cartTotal;
        toast.error(
          `Este cupom requer um valor mínimo de ${formatCurrency(result.coupon.minimum_order_value)}. Adicione mais ${formatCurrency(amountNeeded)} ao carrinho.`,
          {
            duration: 5000,
            icon: createElement('i', { className: 'fas fa-circle-exclamation text-gray-500' })
          }
        );
        return;
      }

      setAppliedCoupon(result.coupon);
      setCouponCode('');

      if (result.coupon.discount_type === 'free_product') {
        toast.success(`Cupom aplicado! Ganhou: ${result.coupon.free_product_description || 'Oferta especial'}`, {
          duration: 4000,
        });
      } else {
        toast.success('Cupom aplicado com sucesso!');
      }
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast.success('Cupom removido');
  };

  const incrementCouponUsage = async () => {
    if (appliedCoupon) {
      await incrementUsageCount(appliedCoupon.id);
    }
  };

  const resetCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  return {
    couponCode,
    setCouponCode,
    appliedCoupon,
    isValidatingCoupon,
    calculateDiscount,
    handleApplyCoupon,
    handleRemoveCoupon,
    incrementCouponUsage,
    resetCoupon,
  };
}
