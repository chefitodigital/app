export type AppUserRole = 'super_admin' | 'customer' | null;

export function canAccessAdminArea(isAuthenticated: boolean, role: AppUserRole): boolean {
  return isAuthenticated && role === 'super_admin';
}

export function canAccessCustomerArea(isAuthenticated: boolean, role: AppUserRole): boolean {
  return isAuthenticated && role === 'customer';
}

