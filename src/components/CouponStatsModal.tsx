import { Modal } from './ui/Modal';
import type { Database } from '../types/supabase';

type Coupon = Database['public']['Tables']['discount_coupons']['Row'];

interface CouponStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon: Coupon | null;
}

export function CouponStatsModal({ isOpen, onClose, coupon }: CouponStatsModalProps) {
  if (!coupon) return null;

  const getDiscountTypeLabel = () => {
    switch (coupon.discount_type) {
      case 'percentage':
        return 'Percentagem';
      case 'fixed':
        return 'Valor Fixo';
      case 'free_product':
        return 'Produto Grátis';
      default:
        return coupon.discount_type;
    }
  };

  const getDiscountValue = () => {
    switch (coupon.discount_type) {
      case 'percentage':
        return `${coupon.discount_value}%`;
      case 'fixed':
        return `${coupon.discount_value.toFixed(2)}`;
      case 'free_product':
        return coupon.free_product_description || 'Produto grátis';
      default:
        return coupon.discount_value;
    }
  };

  const usagePercentage = coupon.usage_limit
    ? Math.min((coupon.usage_count / coupon.usage_limit) * 100, 100)
    : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Estatísticas do Cupom">
      <div className="space-y-6">
        <div className="text-center pb-4 border-b border-gray-100">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-lg mb-3">
            <i className="fas fa-ticket text-2xl text-accent"></i>
          </div>
          <h4 className="text-2xl font-bold text-gray-800 font-mono tracking-wider">
            {coupon.code}
          </h4>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium mt-2 ${
            coupon.active
              ? 'bg-accent/10 text-accent'
              : 'bg-gray-100 text-gray-600'
          }`}>
            <span className={`w-2 h-2 rounded-full ${coupon.active ? 'bg-accent' : 'bg-gray-400'}`}></span>
            {coupon.active ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Tipo de Desconto</p>
            <p className="text-lg font-semibold text-gray-800">{getDiscountTypeLabel()}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Valor</p>
            <p className="text-lg font-semibold text-gray-800">{getDiscountValue()}</p>
          </div>
        </div>

        {coupon.ambassador_name && (
          <div className="bg-accent/10 rounded-lg p-4">
            <p className="text-sm text-accent mb-1">
              <i className="fas fa-user-tie mr-2"></i>Embaixador
            </p>
            <p className="text-lg font-semibold text-accent">{coupon.ambassador_name}</p>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Utilizações</p>
            <p className="text-lg font-bold text-gray-800">
              {coupon.usage_count}
              {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
            </p>
          </div>
          {coupon.usage_limit ? (
            <div className="relative">
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    usagePercentage >= 100
                      ? 'bg-gray-500'
                      : usagePercentage >= 80
                      ? 'bg-gray-400'
                      : 'bg-accent'
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">
                {usagePercentage >= 100
                  ? 'Limite atingido'
                  : `${(100 - usagePercentage).toFixed(0)}% restante`}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              <i className="fas fa-infinity mr-2"></i>Sem limite de usos
            </p>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          <i className="fas fa-calendar mr-2"></i>
          Criado em {new Date(coupon.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>
    </Modal>
  );
}
