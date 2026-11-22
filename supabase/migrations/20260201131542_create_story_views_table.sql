/*
  # Criar tabela de visualizações do Story

  ## Nova Tabela
  - `story_views`
    - `id` (uuid, primary key): identificador único
    - `session_id` (text): identificador da sessão do cliente
    - `story_image_url` (text): URL da imagem visualizada
    - `viewed_at` (timestamptz): momento da visualização
    - `created_at` (timestamptz): timestamp de criação

  ## Índices
  - Índice em `session_id` para verificações rápidas de sessão
  - Índice em `story_image_url` para agrupar por story
  - Índice em `viewed_at` para queries por período

  ## Segurança
  - RLS habilitado
  - Política: permite insert público (para rastreamento anônimo)
  - Política: permite select para todos (para estatísticas)
  - Política: apenas autenticados podem deletar registros antigos

  ## Notas
  - Sistema de rastreamento anônimo usando session_id
  - Não armazena dados pessoais dos clientes
  - Usado para estatísticas de engajamento do story
*/

-- Criar tabela story_views se não existir
CREATE TABLE IF NOT EXISTS story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  story_image_url text NOT NULL,
  viewed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_story_views_session_id ON story_views(session_id);
CREATE INDEX IF NOT EXISTS idx_story_views_story_image_url ON story_views(story_image_url);
CREATE INDEX IF NOT EXISTS idx_story_views_viewed_at ON story_views(viewed_at DESC);

-- Habilitar RLS
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Criar políticas (usando DROP IF EXISTS para evitar duplicação)
DROP POLICY IF EXISTS "Anyone can track story views" ON story_views;
CREATE POLICY "Anyone can track story views"
  ON story_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view story statistics" ON story_views;
CREATE POLICY "Anyone can view story statistics"
  ON story_views
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete old records" ON story_views;
CREATE POLICY "Authenticated users can delete old records"
  ON story_views
  FOR DELETE
  TO authenticated
  USING (true);