import React from 'react';
import { useThemeStore } from '../../store/theme';
import type { Database } from '../../types/supabase';

type Coupon = Database['public']['Tables']['discount_coupons']['Row'];

interface CouponInputProps {
  couponCode: string;
  setCouponCode: (code: string) => void;
  appliedCoupon: Coupon | null;
  isValidatingCoupon: boolean;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
}

export default function CouponInput({
  couponCode,
  setCouponCode,
  appliedCoupon,
  isValidatingCoupon,
  onApplyCoupon,
  onRemoveCoupon
}: CouponInputProps) {
  const { formatCurrency } = useThemeStore();

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <i className={`fas ${appliedCoupon.discount_type === 'free_product' ? 'fa-gift' : 'fa-ticket'} text-accent flex-shrink-0`}></i>
          <span className="font-medium text-accent flex-shrink-0">
            {appliedCoupon.code}
          </span>
          <span className="text-sm text-gray-600 truncate">
            ({appliedCoupon.discount_type === 'percentage'
              ? `${appliedCoupon.discount_value}%`
              : appliedCoupon.discount_type === 'fixed'
                ? formatCurrency(appliedCoupon.discount_value)
                : appliedCoupon.free_product_description || 'Produto grátis'})
          </span>
        </div>
        <button
          onClick={onRemoveCoupon}
          className="text-gray-500 hover:text-accent transition-colors flex-shrink-0 ml-2"
        >
          <i className="fas fa-xmark"></i>
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex items-center bg-gray-50 rounded-lg border border-gray-200 overflow-hidden focus-within:border-gray-400 transition-colors">
      <i className="fas fa-tag text-gray-400 ml-4"></i>
      <input
        type="text"
        value={couponCode}
        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
        placeholder="Insira o código do cupom"
        className="flex-1 px-3 py-3.5 bg-transparent text-sm uppercase placeholder:normal-case placeholder:text-gray-400 focus:outline-none"
      />
      <button
        onClick={onApplyCoupon}
        disabled={isValidatingCoupon || !couponCode.trim()}
        className="h-full px-5 py-3.5 bg-accent text-gray-50 text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {isValidatingCoupon ? (
          <i className="fas fa-spinner fa-spin"></i>
        ) : (
          'Aplicar'
        )}
      </button>
    </div>
  );
}
