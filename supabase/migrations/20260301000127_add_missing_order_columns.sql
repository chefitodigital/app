/*
  # Adicionar colunas ausentes na tabela orders

  ## Motivo
  O schema completo define 3 colunas na tabela orders que estavam em falta
  no banco de dados atual: order_sequence, payment_method e payment_status.

  ## Alteracoes
  - Tabela: orders
    - order_sequence (integer): numero sequencial do pedido
    - payment_method (text, NOT NULL, DEFAULT 'cash'): metodo de pagamento (cash ou mbway)
    - payment_status (text, NOT NULL, DEFAULT 'pending'): estado do pagamento (pending ou paid)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_sequence'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_sequence integer;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_method text NOT NULL DEFAULT 'cash';
    ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check CHECK (payment_method IN ('cash', 'mbway'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_status text NOT NULL DEFAULT 'pending';
    ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('pending', 'paid'));
  END IF;
END $$;
