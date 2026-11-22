/*
  # Adicionar colunas ausentes em customers e users

  1. Alterações na tabela customers
    - Adiciona coluna `user_id` (uuid) se não existir
    - Adiciona coluna `birth_date` (date) se não existir
    - Adiciona foreign key para auth.users se não existir

  2. Alterações na tabela users
    - Adiciona coluna `birth_date` (date) se não existir

  3. Segurança
    - Mantém todas as políticas RLS existentes
    - Adiciona comentários explicativos nas colunas

  Nota: Este script é idempotente e pode ser executado múltiplas vezes
  sem causar erros. Verifica a existência de cada coluna antes de criá-la.
*/

-- Adicionar coluna user_id em customers (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN user_id uuid;
    COMMENT ON COLUMN customers.user_id IS 'Vincula o cliente a um usuário autenticado';
  END IF;
END $$;

-- Adicionar coluna birth_date em customers (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE customers ADD COLUMN birth_date date;
    COMMENT ON COLUMN customers.birth_date IS 'Data de aniversário do cliente';
  END IF;
END $$;

-- Adicionar coluna birth_date em users (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE users ADD COLUMN birth_date date;
    COMMENT ON COLUMN users.birth_date IS 'Data de aniversário do usuário';
  END IF;
END $$;

-- Adicionar foreign key em customers.user_id (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'customers_user_id_fkey'
    AND table_name = 'customers'
  ) THEN
    ALTER TABLE customers ADD CONSTRAINT customers_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Adicionar índice em customers.user_id (se não existir)
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);