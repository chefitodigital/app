import { describe, expect, it } from 'vitest';
import { canAccessAdminArea, canAccessCustomerArea } from './accessControl';

describe('access control', () => {
  it('allows administrative areas only for authenticated super admins', () => {
    expect(canAccessAdminArea(true, 'super_admin')).toBe(true);
    expect(canAccessAdminArea(true, 'customer')).toBe(false);
    expect(canAccessAdminArea(false, 'super_admin')).toBe(false);
    expect(canAccessAdminArea(false, null)).toBe(false);
  });

  it('allows the customer profile only to authenticated customers', () => {
    expect(canAccessCustomerArea(true, 'customer')).toBe(true);
    expect(canAccessCustomerArea(true, 'super_admin')).toBe(false);
    expect(canAccessCustomerArea(false, 'customer')).toBe(false);
  });
});

