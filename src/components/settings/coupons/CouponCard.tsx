import React, { useState } from 'react';
import type { Database } from '../../../types/supabase';
import { ConfirmModal } from '../../ui/ConfirmModal';

type Coupon = Database['public']['Tables']['discount_coupons']['Row'];

interface CouponCardProps {
  coupon: Coupon;
  currency: string;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  onViewStats: (coupon: Coupon) => void;
}

export const CouponCard = React.memo(function CouponCard({ coupon, currency, onToggle, onDelete, onViewStats }: CouponCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getCouponIcon = (coupon: Coupon) => {
    switch (coupon.discount_type) {
      case 'percentage':
        return 'percent';
      case 'fixed':
        return 'tag';
      case 'free_product':
        return 'gift';
      default:
        return 'ticket';
    }
  };

  const getCouponDescription = (coupon: Coupon) => {
    switch (coupon.discount_type) {
      case 'percentage':
        return `${coupon.discount_value}% de desconto`;
      case 'fixed':
        return `${currency === 'EUR' ? '€' : 'R$'} ${coupon.discount_value.toFixed(2)} de desconto`;
      case 'free_product':
        return `Oferta: ${coupon.free_product_description || 'Produto grátis'}`;
      default:
        return '';
    }
  };

  const isExhausted = coupon.usage_limit && coupon.usage_count >= coupon.usage_limit;

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border-2 ${
        isExhausted
          ? 'border-gray-200 bg-gray-50'
          : 'border-accent/30 bg-accent/5'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          isExhausted ? 'bg-gray-200' : 'bg-accent/10'
        }`}>
          <i className={`fas fa-${getCouponIcon(coupon)} ${
            isExhausted ? 'text-gray-400' : 'text-accent'
          }`}></i>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-gray-800" style={{ fontFamily: 'var(--font-title)' }}>
              {coupon.code}
            </p>
            {isExhausted && (
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                Esgotado
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{getCouponDescription(coupon)}</p>
          <div className="flex items-center gap-3 mt-1">
            {coupon.ambassador_name && (
              <span className="text-xs text-accent">
                <i className="fas fa-user-tie mr-1"></i>
                {coupon.ambassador_name}
              </span>
            )}
            <span className="text-xs text-gray-500">
              <i className="fas fa-chart-bar mr-1"></i>
              {coupon.usage_count}{coupon.usage_limit ? `/${coupon.usage_limit}` : ''} usos
            </span>
            {coupon.minimum_order_value !== null &&
             (coupon.discount_type === 'fixed' || coupon.discount_type === 'free_product') && (
              <span className="text-xs text-gray-500">
                <i className="fas fa-shopping-cart mr-1"></i>
                Min: {currency === 'EUR' ? '€' : 'R$'}{coupon.minimum_order_value.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onViewStats(coupon)}
          className="p-2 text-gray-500 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
          title="Ver estatísticas"
        >
          <i className="fas fa-chart-simple"></i>
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={coupon.active}
          onClick={() => onToggle(coupon.id, !coupon.active)}
          className={`relative w-12 h-7 rounded-full transition-colors duration-200 ease-in-out flex-shrink-0 ${
            coupon.active ? 'bg-accent' : 'bg-gray-300'
          }`}
          title={coupon.active ? 'Desativar cupom' : 'Ativar cupom'}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-gray-50 rounded-full shadow-md transition-transform duration-200 ease-in-out ${
              coupon.active && 'translate-x-5'
            }`}
          />
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="p-2 text-gray-500 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
          title="Excluir cupom"
        >
          <i className="fas fa-trash"></i>
        </button>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete(coupon.id);
          setShowDeleteConfirm(false);
        }}
        title="Excluir cupom"
        description="Tem certeza que deseja excluir este cupom? Esta ação não pode ser desfeita."
        confirmLabel="Excluir cupom"
      />
    </div>
  );
});
