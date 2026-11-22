# Supabase - SQL para Sistema de Autenticação de Clientes

Este arquivo contém todos os comandos SQL necessários para implementar o sistema de autenticação de clientes com controle de roles (super_admin e customer).

## 📋 Índice

1. [Criar Tabela Users](#1-criar-tabela-users)
2. [Adicionar Campos em Customers](#2-adicionar-campos-em-customers)
3. [Função de Sincronização de Usuários](#3-função-de-sincronização-de-usuários)
4. [Trigger para Novos Usuários](#4-trigger-para-novos-usuários)
5. [Políticas RLS para Users](#5-políticas-rls-para-users)
6. [Atualizar Políticas de Orders](#6-atualizar-políticas-de-orders)
7. [Atualizar Políticas de Customers](#7-atualizar-políticas-de-customers)
8. [Criar Índices](#8-criar-índices)
9. [Como Atribuir Super Admin](#9-como-atribuir-super-admin)

---

## 1. Criar Tabela Users

Esta tabela armazena informações adicionais dos usuários e seus roles (super_admin ou customer).

```sql
-- Tabela: public.users
-- Vincula auth.users com informações adicionais e role
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('super_admin', 'customer')),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  birth_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Comentário
COMMENT ON TABLE public.users IS 'Armazena informações adicionais dos usuários e controle de acesso por role';
COMMENT ON COLUMN public.users.role IS 'Tipo de usuário: super_admin (acesso total) ou customer (acesso ao próprio perfil)';
COMMENT ON COLUMN public.users.customer_id IS 'Vincula o usuário a um registro de cliente';
COMMENT ON COLUMN public.users.birth_date IS 'Data de aniversário do usuário';
```

---

## 2. Adicionar Campos em Customers

Adicionar campos necessários para vincular customers com users e armazenar data de aniversário.

```sql
-- Adicionar campo user_id em customers (se ainda não existir)
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
  END IF;
END $$;

-- Adicionar campo birth_date em customers (se ainda não existir)
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
  END IF;
END $$;

-- Comentários
COMMENT ON COLUMN public.customers.user_id IS 'Vincula o cliente a um usuário autenticado';
COMMENT ON COLUMN public.customers.birth_date IS 'Data de aniversário do cliente';
```

---

## 3. Função de Sincronização de Usuários

Esta função é executada automaticamente quando um novo usuário é criado no auth.users.

```sql
-- Função: handle_new_user
-- Cria automaticamente um registro em public.users quando um usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, role, created_at, updated_at)
  VALUES (
    NEW.id,
    'customer', -- Por padrão, todos os novos usuários são customers
    now(),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário
COMMENT ON FUNCTION public.handle_new_user IS 'Cria automaticamente um registro em public.users quando um usuário se registra';
```

---

## 4. Trigger para Novos Usuários

Trigger que executa a função handle_new_user quando um novo usuário é criado.

```sql
-- Trigger: on_auth_user_created
-- Executa handle_new_user quando um novo usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Comentário
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Cria registro em public.users automaticamente quando usuário se registra';
```

---

## 5. Políticas RLS para Users

Políticas de segurança para controlar acesso à tabela users.

```sql
-- Política: Usuários podem ver apenas seu próprio registro
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
CREATE POLICY "Users can view own record"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

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
```

---

## 6. Atualizar Políticas de Orders

Atualizar políticas para permitir que clientes vejam apenas seus próprios pedidos.

```sql
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

-- Manter a política existente para super admins
-- A política "Authenticated users can read all orders" já existe e continua funcionando
```

---

## 7. Atualizar Políticas de Customers

Atualizar políticas para permitir que clientes vejam e atualizem apenas seu próprio registro.

```sql
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
```

---

## 8. Criar Índices

Índices para melhorar a performance das consultas.

```sql
-- Índice para buscar usuários por role
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Índice para buscar customers por user_id
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);

-- Índice para buscar orders por customer_id (se ainda não existir)
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
```

---

## 9. Como Atribuir Super Admin

Após criar seu primeiro usuário no sistema, você precisa atribuir a role de super_admin manualmente.

### Passo 1: Registrar-se no sistema
Primeiro, crie sua conta através da interface de registro do sistema.

### Passo 2: Executar o SQL no Supabase Dashboard

Acesse o Supabase Dashboard > SQL Editor e execute:

```sql
-- Substitua 'seu-email@exemplo.com' pelo seu email
UPDATE public.users
SET role = 'super_admin'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'seu-email@exemplo.com'
);
```

### Passo 3: Verificar
Para confirmar que o super_admin foi atribuído corretamente:

```sql
SELECT
  u.id,
  au.email,
  u.role,
  u.created_at
FROM public.users u
JOIN auth.users au ON au.id = u.id
WHERE u.role = 'super_admin';
```

---

## 🔄 Script Completo (Copiar e Colar)

Se preferir executar tudo de uma vez, copie e cole este script completo no SQL Editor do Supabase:

```sql
-- =====================================================
-- SCRIPT COMPLETO: Sistema de Autenticação de Clientes
-- =====================================================

-- 1. Criar tabela users
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

-- 2. Adicionar campos em customers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN birth_date date;
  END IF;
END $$;

-- 3. Criar função de sincronização
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, role, created_at, updated_at)
  VALUES (NEW.id, 'customer', now(), now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Políticas RLS para users
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
CREATE POLICY "Users can view own record"
  ON public.users FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own record" ON public.users;
CREATE POLICY "Users can update own record"
  ON public.users FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;
CREATE POLICY "Super admins can view all users"
  ON public.users FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'));

DROP POLICY IF EXISTS "Super admins can update all users" ON public.users;
CREATE POLICY "Super admins can update all users"
  ON public.users FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'));

-- 6. Políticas para orders (clientes veem apenas seus pedidos)
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = orders.customer_id AND customers.user_id = auth.uid()
  ));

-- 7. Políticas para customers
DROP POLICY IF EXISTS "Customers can view own record" ON public.customers;
CREATE POLICY "Customers can view own record"
  ON public.customers FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "Customers can update own record" ON public.customers;
CREATE POLICY "Customers can update own record"
  ON public.customers FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "Authenticated users can create customer" ON public.customers;
CREATE POLICY "Authenticated users can create customer"
  ON public.customers FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 8. Criar índices
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
```

---

## 📝 Notas Importantes

1. **Primeiro Usuário**: O primeiro usuário criado será automaticamente um `customer`. Use o SQL do item 9 para promovê-lo a `super_admin`.

2. **Segurança**: As políticas RLS garantem que:
   - Customers só veem seus próprios dados (pedidos, perfil)
   - Super admins têm acesso total a tudo

3. **Sincronização Automática**: O trigger `on_auth_user_created` cria automaticamente um registro em `public.users` quando alguém se registra.

4. **Replicação**: Para usar em outro restaurante, basta executar o "Script Completo" acima no novo projeto Supabase.

---

## ✅ Como Testar

Após executar os scripts:

1. Crie uma conta nova através do sistema
2. Verifique se o registro foi criado em `public.users`:
   ```sql
   SELECT * FROM public.users WHERE id = auth.uid();
   ```
3. Promova seu usuário para super_admin
4. Faça logout e login novamente para as permissões serem aplicadas

---

**Data de criação**: Janeiro 2026
**Versão**: 1.0
