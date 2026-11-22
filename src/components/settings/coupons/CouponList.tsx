import { CouponCard } from './CouponCard';
import type { Database } from '../../../types/supabase';

type Coupon = Database['public']['Tables']['discount_coupons']['Row'];

interface CouponListProps {
  coupons: Coupon[];
  currency: string;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  onViewStats: (coupon: Coupon) => void;
}

export function CouponList({ coupons, currency, onToggle, onDelete, onViewStats }: CouponListProps) {
  if (coupons.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <i className="fas fa-ticket-simple text-4xl mb-3 opacity-50"></i>
        <p>Nenhum cupom criado</p>
        <p className="text-sm">Crie o primeiro cupom de desconto acima</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {coupons.map((coupon) => (
        <CouponCard
          key={coupon.id}
          coupon={coupon}
          currency={currency}
          onToggle={onToggle}
          onDelete={onDelete}
          onViewStats={onViewStats}
        />
      ))}
    </div>
  );
}
