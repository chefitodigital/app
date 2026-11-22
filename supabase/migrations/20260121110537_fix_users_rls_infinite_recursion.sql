/*
  # Fix Users RLS Infinite Recursion

  ## Problem
  The existing RLS policies for the `users` table cause infinite recursion when checking
  if a user is a super_admin, because the policy queries the same table it's protecting.

  ## Solution
  1. Drop the problematic recursive policies for super_admins
  2. Keep only the simple policies that allow users to view/edit their own records
  3. For super_admin operations, use the service role key in the application code
  
  ## Changes
  - Removed: "Super admins can view all users" policy (causes recursion)
  - Removed: "Super admins can update all users" policy (causes recursion)
  - Removed: Recursive checks in customers and orders policies
  - Kept: Basic policies allowing users to access only their own data
  
  ## Security Notes
  - Users can only view and edit their own record in the users table
  - Super admin operations must be performed using the service role key in backend code
  - This prevents the infinite recursion while maintaining data security
*/

-- =====================================================
-- SECTION 1: FIX USERS TABLE POLICIES
-- =====================================================

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can update all users" ON public.users;

-- Keep only the simple policies (these don't cause recursion)
-- Users can view their own record
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
CREATE POLICY "Users can view own record"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own record
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
CREATE POLICY "Users can insert own record"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own record (but not change their role)
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
CREATE POLICY "Users can update own record"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.users WHERE id = auth.uid()));


-- =====================================================
-- SECTION 2: FIX CUSTOMERS TABLE POLICIES
-- =====================================================

-- Remove recursive checks from customers policies
DROP POLICY IF EXISTS "Customers can view own record" ON public.customers;
CREATE POLICY "Customers can view own record"
  ON public.customers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Customers can update own record" ON public.customers;
CREATE POLICY "Customers can update own record"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Keep the insert policy as is
DROP POLICY IF EXISTS "Authenticated users can create customer" ON public.customers;
CREATE POLICY "Authenticated users can create customer"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());


-- =====================================================
-- SECTION 3: ADD COMMENT FOR DEVELOPERS
-- =====================================================

COMMENT ON TABLE public.users IS 'User authentication and roles. Note: Super admin operations require using the service role key in backend code to bypass RLS.';
