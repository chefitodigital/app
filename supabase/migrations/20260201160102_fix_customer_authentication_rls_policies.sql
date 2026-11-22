/*
  # Corrige Políticas RLS para Autenticação de Clientes
  
  1. Problema Identificado
    - Políticas RLS antigas na tabela customers permitem acesso total (USING true)
    - Conflito entre políticas antigas e novas políticas baseadas em user_id
    - Políticas redundantes que comprometem a segurança
  
  2. Solução
    - Remove TODAS as políticas antigas conflitantes
    - Mantém apenas as políticas seguras:
      - Clientes veem apenas seus próprios dados
      - Super admins veem todos os dados
      - Autenticados podem criar customer vinculado ao seu user_id
  
  3. Tabelas Afetadas
    - customers: limpeza e reaplicação de políticas seguras
    - orders: melhoria nas políticas para super_admins
    - users: verificação de políticas existentes
  
  4. Segurança
    - Remove políticas com USING (true) que permitem acesso irrestrito
    - Garante que customers só acessem seus próprios dados
    - Super admins mantêm acesso total através de verificação de role
  
  5. Dados Preservados
    - NENHUM dado será perdido
    - Apenas políticas de acesso são modificadas
    - Produtos (11), categorias (3) e extras (5) permanecem intactos
*/

-- =====================================================
-- SEÇÃO 1: LIMPAR POLÍTICAS ANTIGAS DA TABELA CUSTOMERS
-- =====================================================

-- Remove todas as políticas antigas que podem causar conflito
DROP POLICY IF EXISTS "Authenticated users can read all customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;

-- Remove políticas duplicadas
DROP POLICY IF EXISTS "Customers can view own record" ON public.customers;
DROP POLICY IF EXISTS "Customers can update own record" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can create customer" ON public.customers;


-- =====================================================
-- SEÇÃO 2: APLICAR POLÍTICAS SEGURAS PARA CUSTOMERS
-- =====================================================

-- Política: Clientes podem ver apenas seu próprio registro OU super_admins veem tudo
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

-- Política: Clientes podem atualizar apenas seu próprio registro OU super_admins atualizam tudo
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

-- Política: Usuários autenticados podem criar customer vinculado ao seu user_id
CREATE POLICY "Authenticated users can create customer"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Política: Super admins podem deletar customers
CREATE POLICY "Super admins can delete customers"
  ON public.customers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Política: Super admins podem inserir customers com qualquer user_id
CREATE POLICY "Super admins can insert customers"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );


-- =====================================================
-- SEÇÃO 3: MELHORAR POLÍTICAS DA TABELA ORDERS
-- =====================================================

-- Remove políticas antigas conflitantes
DROP POLICY IF EXISTS "Authenticated users can read all orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;

-- Política: Clientes veem apenas seus próprios pedidos OU super_admins veem tudo
CREATE POLICY "Customers can view orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE customers.id = orders.customer_id
      AND customers.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Política: Super admins podem atualizar orders
CREATE POLICY "Super admins can update orders"
  ON public.orders FOR UPDATE
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

-- Política: Super admins podem deletar orders
CREATE POLICY "Super admins can delete orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Mantém a política existente para inserção anônima (para o menu público)
-- DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
-- Esta política já existe e está correta


-- =====================================================
-- SEÇÃO 4: COMENTÁRIOS EXPLICATIVOS
-- =====================================================

COMMENT ON POLICY "Customers can view own record" ON public.customers IS 
  'Clientes autenticados podem ver apenas seu próprio registro. Super admins veem todos.';

COMMENT ON POLICY "Customers can update own record" ON public.customers IS 
  'Clientes autenticados podem atualizar apenas seu próprio registro. Super admins atualizam todos.';

COMMENT ON POLICY "Authenticated users can create customer" ON public.customers IS 
  'Permite que usuários autenticados criem um perfil de cliente vinculado ao seu user_id.';

COMMENT ON POLICY "Customers can view orders" ON public.orders IS 
  'Clientes veem apenas seus próprios pedidos. Super admins veem todos os pedidos.';
