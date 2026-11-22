import React from 'react';
import CouponInput from './CouponInput';
import { useThemeStore } from '../../store/theme';
import type { Database } from '../../types/supabase';

type Coupon = Database['public']['Tables']['discount_coupons']['Row'];

interface CartSummaryProps {
  itemCount: number;
  total: number;
  discountAmount: number;
  deliveryFee: number;
  finalTotal: number;
  deliveryMinimumOrderValue: number;
  amountNeededForDelivery: number;
  couponCode: string;
  setCouponCode: (code: string) => void;
  appliedCoupon: Coupon | null;
  isValidatingCoupon: boolean;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  onCheckout: () => void;
}

export default function CartSummary({
  itemCount,
  total,
  discountAmount,
  deliveryFee,
  finalTotal,
  deliveryMinimumOrderValue,
  amountNeededForDelivery,
  couponCode,
  setCouponCode,
  appliedCoupon,
  isValidatingCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  onCheckout
}: CartSummaryProps) {
  const { formatCurrency } = useThemeStore();
  const hasBreakdown = (appliedCoupon && appliedCoupon.discount_type !== 'free_product') || deliveryFee > 0;
  const grandTotal = (appliedCoupon ? finalTotal : total) + deliveryFee;

  return (
    <div className="border-t border-gray-100 p-4 sm:p-6 space-y-3 sm:space-y-4">
      {itemCount > 0 && (
        <div className="space-y-3">
          <CouponInput
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            appliedCoupon={appliedCoupon}
            isValidatingCoupon={isValidatingCoupon}
            onApplyCoupon={onApplyCoupon}
            onRemoveCoupon={onRemoveCoupon}
          />
        </div>
      )}

      {hasBreakdown && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(total)}</span>
          </div>
          {appliedCoupon && appliedCoupon.discount_type !== 'free_product' && (
            <div className="flex items-center justify-between text-accent">
              <span>Desconto</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          {deliveryFee > 0 && (
            <div className="flex items-center justify-between text-gray-600">
              <span>Frete</span>
              <span>{formatCurrency(deliveryFee)}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-lg sm:text-xl font-bold text-gray-800">Total</span>
        <span className="text-xl sm:text-2xl font-bold text-accent">
          {formatCurrency(grandTotal)}
        </span>
      </div>
      {deliveryMinimumOrderValue > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-100 p-3 text-sm text-gray-700 flex items-start gap-2">
          <i className="fas fa-circle-info mt-0.5" />
          <span>Pedido mínimo para entrega: {formatCurrency(deliveryMinimumOrderValue)}.</span>
        </div>
      )}
      <button
        onClick={onCheckout}
        className="btn btn-primary w-full text-sm sm:text-base disabled:cursor-not-allowed disabled:opacity-50"
        disabled={itemCount === 0 || amountNeededForDelivery > 0}
      >
        Finalizar Pedido
      </button>
    </div>
  );
}
