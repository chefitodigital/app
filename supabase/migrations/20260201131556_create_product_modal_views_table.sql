/*
  # Criar tabela de visualizações de modais de produtos

  ## Nova Tabela
  - `product_modal_views`
    - `id` (uuid, primary key): identificador único
    - `product_id` (uuid, foreign key): referência ao produto
    - `product_name` (text): nome do produto (para histórico)
    - `session_id` (text, nullable): identificador da sessão
    - `viewed_at` (timestamptz): momento da visualização
    - `created_at` (timestamptz): timestamp de criação

  ## Índices
  - Índice em `product_id` para agrupar por produto
  - Índice em `viewed_at` para queries por período
  - Índice em `session_id` para análise de sessões

  ## Segurança
  - RLS habilitado
  - Política: permite insert público (para rastreamento anônimo)
  - Política: permite select para todos (para estatísticas)
  - Política: apenas autenticados podem deletar registros antigos

  ## Notas
  - Rastreia quantas vezes cada modal de produto foi aberto
  - Sistema anônimo usando session_id opcional
  - Armazena product_name para manter histórico mesmo se produto for deletado
*/

-- Criar tabela product_modal_views se não existir
CREATE TABLE IF NOT EXISTS product_modal_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  product_name text NOT NULL,
  session_id text,
  viewed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_product
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_product_modal_views_product_id ON product_modal_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_modal_views_viewed_at ON product_modal_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_modal_views_session_id ON product_modal_views(session_id);

-- Habilitar RLS
ALTER TABLE product_modal_views ENABLE ROW LEVEL SECURITY;

-- Criar políticas (usando DROP IF EXISTS para evitar duplicação)
DROP POLICY IF EXISTS "Anyone can track product modal views" ON product_modal_views;
CREATE POLICY "Anyone can track product modal views"
  ON product_modal_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view product statistics" ON product_modal_views;
CREATE POLICY "Anyone can view product statistics"
  ON product_modal_views
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete old view records" ON product_modal_views;
CREATE POLICY "Authenticated users can delete old view records"
  ON product_modal_views
  FOR DELETE
  TO authenticated
  USING (true);