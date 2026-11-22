import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { useCoupons } from '../../hooks/useCoupons';
import { CouponStatsModal } from '../CouponStatsModal';
import { CouponForm } from './coupons/CouponForm';
import { CouponList } from './coupons/CouponList';
import type { Database } from '../../types/supabase';

type Coupon = Database['public']['Tables']['discount_coupons']['Row'];

export function CouponsSection() {
  const { coupons, createCoupon, updateCoupon, deleteCoupon } = useCoupons();
  const [statsModalCoupon, setStatsModalCoupon] = useState<Coupon | null>(null);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle description="Crie cupons de desconto para seus clientes">
            Cupons de desconto
          </CardTitle>
        </CardHeader>

        <div className="space-y-6">
          <CouponForm
            currency="BRL"
            onSubmit={createCoupon}
          />

          <CouponList
            coupons={coupons}
            currency="BRL"
            onToggle={(id, active) => updateCoupon(id, { active })}
            onDelete={deleteCoupon}
            onViewStats={setStatsModalCoupon}
          />
        </div>
      </Card>

      <CouponStatsModal
        isOpen={!!statsModalCoupon}
        onClose={() => setStatsModalCoupon(null)}
        coupon={statsModalCoupon}
      />
    </>
  );
}
