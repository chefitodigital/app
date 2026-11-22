/*
  # Sistema de Autenticação de Clientes

  1. Nova Tabela
    - `public.users`
      - `id` (uuid, primary key, references auth.users)
      - `role` (text, 'super_admin' ou 'customer')
      - `customer_id` (uuid, references customers)
      - `birth_date` (date)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Alterações em Customers
    - Adiciona campo `user_id` (references auth.users)
    - Adiciona campo `birth_date` (date)

  3. Segurança
    - Habilita RLS em public.users
    - Políticas para users: usuários veem apenas próprio registro, super_admins veem tudo
    - Políticas para customers: usuários veem apenas próprio registro, super_admins veem tudo
    - Políticas para orders: clientes veem apenas próprios pedidos

  4. Performance
    - Índices em role, user_id para otimização de consultas

  Nota: A sincronização de novos usuários será feita via código no frontend
*/

-- =====================================================
-- SEÇÃO 1: CRIAR TABELA USERS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('super_admin', 'customer')),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  birth_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.users IS 'Armazena informações adicionais dos usuários e controle de acesso por role';
COMMENT ON COLUMN public.users.role IS 'Tipo de usuário: super_admin (acesso total) ou customer (acesso ao próprio perfil)';
COMMENT ON COLUMN public.users.customer_id IS 'Vincula o usuário a um registro de cliente';
COMMENT ON COLUMN public.users.birth_date IS 'Data de aniversário do usuário';


-- =====================================================
-- SEÇÃO 2: ADICIONAR CAMPOS EM CUSTOMERS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'customers'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.customers
    ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    
    COMMENT ON COLUMN public.customers.user_id IS 'Vincula o cliente a um usuário autenticado';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'customers'
    AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE public.customers
    ADD COLUMN birth_date date;
    
    COMMENT ON COLUMN public.customers.birth_date IS 'Data de aniversário do cliente';
  END IF;
END $$;


-- =====================================================
-- SEÇÃO 3: POLÍTICAS RLS PARA USERS
-- =====================================================

-- Política: Usuários podem ver apenas seu próprio registro
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
CREATE POLICY "Users can view own record"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Política: Usuários podem inserir apenas seu próprio registro
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
CREATE POLICY "Users can insert own record"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Política: Usuários podem atualizar apenas seu próprio registro
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
CREATE POLICY "Users can update own record"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política: Super admins podem ver todos os registros
DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;
CREATE POLICY "Super admins can view all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Política: Super admins podem atualizar todos os registros
DROP POLICY IF EXISTS "Super admins can update all users" ON public.users;
CREATE POLICY "Super admins can update all users"
  ON public.users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );


-- =====================================================
-- SEÇÃO 4: POLÍTICAS PARA ORDERS
-- =====================================================

-- Política: Clientes podem ver apenas seus próprios pedidos
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE customers.id = orders.customer_id
      AND customers.user_id = auth.uid()
    )
  );


-- =====================================================
-- SEÇÃO 5: POLÍTICAS PARA CUSTOMERS
-- =====================================================

-- Política: Clientes podem ver apenas seu próprio registro
DROP POLICY IF EXISTS "Customers can view own record" ON public.customers;
CREATE POLICY "Customers can view own record"
  ON public.customers FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Política: Clientes podem atualizar apenas seu próprio registro
DROP POLICY IF EXISTS "Customers can update own record" ON public.customers;
CREATE POLICY "Customers can update own record"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Política: Qualquer usuário autenticado pode criar customer (para vincular após registro)
DROP POLICY IF EXISTS "Authenticated users can create customer" ON public.customers;
CREATE POLICY "Authenticated users can create customer"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());


-- =====================================================
-- SEÇÃO 6: ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
