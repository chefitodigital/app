import { describe, expect, it } from 'vitest';
import { getDeliveryMinimumShortfall } from './checkoutRules';

describe('getDeliveryMinimumShortfall', () => {
  it('blocks delivery when the discounted subtotal is below the minimum', () => {
    expect(getDeliveryMinimumShortfall(25, 7, 20, true)).toBe(2);
  });

  it('allows delivery when the discounted subtotal reaches the minimum', () => {
    expect(getDeliveryMinimumShortfall(25, 5, 20, true)).toBe(0);
  });

  it('never applies the delivery minimum to takeaway or table service', () => {
    expect(getDeliveryMinimumShortfall(5, 0, 20, false)).toBe(0);
  });

  it('does not count the delivery fee and never produces a negative shortfall', () => {
    expect(getDeliveryMinimumShortfall(20, 0, 20, true)).toBe(0);
    expect(getDeliveryMinimumShortfall(10, 20, 20, true)).toBe(20);
    expect(getDeliveryMinimumShortfall(40, 5, 20, true)).toBe(0);
  });

  it('does not block delivery when the restaurant has no configured minimum', () => {
    expect(getDeliveryMinimumShortfall(1, 0, 0, true)).toBe(0);
  });
});
