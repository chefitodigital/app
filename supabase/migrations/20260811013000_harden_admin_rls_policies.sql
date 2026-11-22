-- Security hardening: only super_admin may change global restaurant data.
-- Customer data and orders remain limited to their owner or a super_admin.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

DO $$
DECLARE
  target_table text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'categories', 'tags', 'extras', 'products', 'product_extras', 'product_tags',
    'discount_coupons', 'staff', 'staff_schedules'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can manage %1$s" ON public.%1$I', target_table);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Authenticated users can insert coupons" ON public.discount_coupons;
DROP POLICY IF EXISTS "Authenticated users can update coupons" ON public.discount_coupons;
DROP POLICY IF EXISTS "Authenticated users can delete coupons" ON public.discount_coupons;
DROP POLICY IF EXISTS "Authenticated users can read all coupons" ON public.discount_coupons;
DROP POLICY IF EXISTS "Authenticated users can create staff" ON public.staff;
DROP POLICY IF EXISTS "Authenticated users can update staff" ON public.staff;
DROP POLICY IF EXISTS "Authenticated users can delete staff" ON public.staff;
DROP POLICY IF EXISTS "Authenticated users can view staff" ON public.staff;
DROP POLICY IF EXISTS "Authenticated users can create staff schedules" ON public.staff_schedules;
DROP POLICY IF EXISTS "Authenticated users can update staff schedules" ON public.staff_schedules;
DROP POLICY IF EXISTS "Authenticated users can delete staff schedules" ON public.staff_schedules;
DROP POLICY IF EXISTS "Authenticated users can view staff schedules" ON public.staff_schedules;

DROP POLICY IF EXISTS "Super admins manage categories" ON public.categories;
DROP POLICY IF EXISTS "Super admins manage tags" ON public.tags;
DROP POLICY IF EXISTS "Super admins manage extras" ON public.extras;
DROP POLICY IF EXISTS "Super admins manage products" ON public.products;
DROP POLICY IF EXISTS "Super admins manage product extras" ON public.product_extras;
DROP POLICY IF EXISTS "Super admins manage product tags" ON public.product_tags;
DROP POLICY IF EXISTS "Super admins manage coupons" ON public.discount_coupons;
DROP POLICY IF EXISTS "Super admins manage staff" ON public.staff;
DROP POLICY IF EXISTS "Super admins manage staff schedules" ON public.staff_schedules;

-- Content stays publicly readable; writes are administrator-only.
CREATE POLICY "Super admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins manage tags" ON public.tags FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins manage extras" ON public.extras FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins manage products" ON public.products FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins manage product extras" ON public.product_extras FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins manage product tags" ON public.product_tags FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins manage coupons" ON public.discount_coupons FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins manage staff" ON public.staff FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins manage staff schedules" ON public.staff_schedules FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Remove legacy broad customer/order access before installing owner-or-admin access.
DROP POLICY IF EXISTS "Authenticated users can read all customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Customers can view own record" ON public.customers;
DROP POLICY IF EXISTS "Customers can update own record" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can create customer" ON public.customers;
DROP POLICY IF EXISTS "Super admins can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Super admins can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Customer or admin reads customers" ON public.customers;
DROP POLICY IF EXISTS "Customer or admin creates customers" ON public.customers;
DROP POLICY IF EXISTS "Customer or admin updates customers" ON public.customers;

CREATE POLICY "Customer or admin reads customers" ON public.customers FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "Customer or admin creates customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "Customer or admin updates customers" ON public.customers FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_super_admin()) WITH CHECK (user_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "Super admins delete customers" ON public.customers FOR DELETE TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "Authenticated users can read all orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can view orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Customer or admin reads orders" ON public.orders;
DROP POLICY IF EXISTS "Customer creates own order" ON public.orders;
DROP POLICY IF EXISTS "Super admins update orders" ON public.orders;
DROP POLICY IF EXISTS "Super admins delete orders" ON public.orders;

CREATE POLICY "Customer or admin reads orders" ON public.orders FOR SELECT TO authenticated USING (
  public.is_super_admin() OR EXISTS (SELECT 1 FROM public.customers c WHERE c.id = orders.customer_id AND c.user_id = auth.uid())
);
CREATE POLICY "Customer creates own order" ON public.orders FOR INSERT TO authenticated WITH CHECK (
  customer_id IS NULL OR EXISTS (SELECT 1 FROM public.customers c WHERE c.id = orders.customer_id AND c.user_id = auth.uid())
);
CREATE POLICY "Super admins update orders" ON public.orders FOR UPDATE TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins delete orders" ON public.orders FOR DELETE TO authenticated USING (public.is_super_admin());
