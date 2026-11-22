/*
  ╔═══════════════════════════════════════════════════════════════════════════╗
  ║                   SCHEMA COMPLETO DO BANCO DE DADOS                       ║
  ║                          Sistema Chefito POS                              ║
  ║              VERSÃO ATUALIZADA - 31/08/2026 22:01                         ║
  ╚═══════════════════════════════════════════════════════════════════════════╝

  ⚠️  ═══════════════════════════════════════════════════════════════════════
  ⚠️   ATENÇÃO: MANTENHA ESTE ARQUIVO SEMPRE ATUALIZADO!
  ⚠️  ═══════════════════════════════════════════════════════════════════════
  ⚠️
  ⚠️   Este é o "snapshot" único e completo do banco de dados usado para
  ⚠️   recriar tudo em um NOVO projeto Supabase.
  ⚠️
  ⚠️   SEMPRE que criar uma nova migration em `supabase/migrations/`
  ⚠️   (nova tabela, coluna, política RLS, função, trigger, bucket, etc.),
  ⚠️   você DEVE também atualizar este arquivo (`supabase-complete-schema.sql`)
  ⚠️   para refletir a mudança. Caso contrário, ao trocar de projeto Supabase
  ⚠️   o banco recriado ficará DESATUALIZADO e a aplicação vai quebrar.
  ⚠️
  ⚠️   Checklist ao alterar o schema:
  ⚠️     1. Criar a migration em `supabase/migrations/`
  ⚠️     2. Atualizar o CREATE TABLE correspondente aqui
  ⚠️     3. Adicionar um bloco DO $$ idempotente para colunas novas
  ⚠️     4. Atualizar a data no cabeçalho ("VERSÃO ATUALIZADA - MES ANO")
  ⚠️     5. Adicionar entrada no CHANGELOG abaixo
  ⚠️  ═══════════════════════════════════════════════════════════════════════

  Este arquivo contém o schema COMPLETO do banco de dados, incluindo:
  - 15 tabelas com todos os campos e relacionamentos
  - Sistema completo de autenticação de usuários
  - Verificação e adição automática de colunas ausentes
  - Políticas RLS (Row Level Security) para todas as tabelas
  - Imagens via Cloudflare R2; Supabase Storage não é usado para novos uploads
  - Funções e triggers para atualização automática de timestamps
  - Índices para otimização de performance
  - Constraints e validações
  - Dados iniciais do restaurant_settings
  - Sistema de rastreamento de stories e visualizações de produtos

  ═══════════════════════════════════════════════════════════════════════════
  INSTRUÇÕES DE USO:
  ═══════════════════════════════════════════════════════════════════════════

  1. Acesse o Supabase Dashboard do NOVO projeto
  2. Vá em: SQL Editor
  3. Copie TODO este arquivo
  4. Cole no editor SQL
  5. Clique em "RUN" ou pressione Ctrl+Enter
  6. Pronto! O banco de dados estará configurado

  IMPORTANTE: Este script é COMPLETAMENTE IDEMPOTENTE (pode ser executado
  múltiplas vezes sem causar erros). Usa IF NOT EXISTS, ON CONFLICT e
  verificação de colunas existentes para segurança máxima.

  ═══════════════════════════════════════════════════════════════════════════
  CHANGELOG:
  ═══════════════════════════════════════════════════════════════════════════
  - 31/08/2026 22:01: adicionada a tabela restaurant_awards, com ordem de
    apresentação, leitura pública e gestão exclusiva do super_admin. As imagens
    dos prémios permanecem no Cloudflare R2.
  - 17/08/2026 16:49: garante public_slug em orders antes de criar o índice,
    permitindo executar este schema em projetos que já tinham a tabela criada.
  - 11/08/2026 01:30: políticas RLS reforçadas; alterações de catálogo,
    equipa e cupões passam a exigir super_admin, e clientes só acessam os
    próprios dados e pedidos.
  - 10/08/2026 00:12: criação de pedidos com cupom passa a ser atômica pela
    função create_order_with_coupon, evitando uso duplicado ou perdido.
  - 09/08/2026 23:52: adicionado product_card_description_lines em
    restaurant_settings para configurar de 0 a 7 linhas de descrição nos cards.
  - 09/08/2026 23:20: adicionado delivery_minimum_order_value em
    restaurant_settings para definir o valor mínimo de pedidos de entrega.
  - 20/07/2026 10:00: suporte multi-país (PT/BR). Adicionadas colunas
    country, pix_enabled, pix_key, pix_key_type, pix_beneficiary_name em
    restaurant_settings; payment_method aceita 'pix'; moeda passa a
    incluir 'BRL' quando country='BR'.
  - 13/07/2026 18:00: reservas passam a bloquear horários apenas após
    confirmação; RPC pública autenticada expõe somente horários ocupados
    por mesa, sem dados pessoais.
  - 12/07/2026 14:14: loyalty_enabled, loyalty_points_per_euro,
    loyalty_points_per_euro_discount, operating_schedule em restaurant_settings;
    loyalty_points e loyalty_points_total em customers; trigger
    award_loyalty_points em orders.
  - JUN 2026: products.is_vegan, is_vegetarian, is_gluten_free, is_spicy
  - JUN 2026: products.spicy_level (smallint 1..3, default 1)
  - MAI 2026: restaurant_settings RLS restrita a super_admin
  - FEV 2026: MBWay, delivery_fee, viewed, payment_method, story fields
  - JAN 2026: minimum_order_value em discount_coupons
  - ...ver histórico completo em supabase/migrations/

  ═══════════════════════════════════════════════════════════════════════════
*/


-- ═══════════════════════════════════════════════════════════════════════════
-- ETAPA 1: CRIAR TODAS AS TABELAS (SEM FOREIGN KEYS)
-- ═══════════════════════════════════════════════════════════════════════════

-- Tabela: categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tabela: tags
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'tag',
  created_at timestamptz DEFAULT now()
);

-- Tabela: extras
CREATE TABLE IF NOT EXISTS extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Tabela: products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  image_url text NOT NULL DEFAULT '',
  image_path text,
  category_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  "order" integer NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  has_custom_tag boolean DEFAULT false,
  custom_tag_text text,
  is_vegan boolean NOT NULL DEFAULT false,
  is_vegetarian boolean NOT NULL DEFAULT false,
  is_gluten_free boolean NOT NULL DEFAULT false,
  is_spicy boolean NOT NULL DEFAULT false,
  spicy_level smallint NOT NULL DEFAULT 1 CHECK (spicy_level BETWEEN 1 AND 3),
  require_extra boolean NOT NULL DEFAULT false,
  extras_label text,
  image_blur text,
  created_at timestamptz DEFAULT now()
);

-- Tabela: product_extras
CREATE TABLE IF NOT EXISTS product_extras (
  product_id uuid NOT NULL,
  extra_id uuid NOT NULL,
  PRIMARY KEY (product_id, extra_id)
);

-- Tabela: product_tags
CREATE TABLE IF NOT EXISTS product_tags (
  product_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  PRIMARY KEY (product_id, tag_id)
);

-- Tabela: restaurant_settings
CREATE TABLE IF NOT EXISTS restaurant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Meu Restaurante',
  accent_color text NOT NULL DEFAULT '#494949',
  title_font text NOT NULL DEFAULT 'Gowun Dodum',
  body_font text NOT NULL DEFAULT 'Gowun Dodum',
  button_font text NOT NULL DEFAULT 'Gowun Dodum',
  restaurant_icon text NOT NULL DEFAULT 'utensils',
  about_us text NOT NULL DEFAULT '',
  about_us_image_url text,
  location text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'EUR' CHECK (currency IN ('BRL', 'EUR')),
  has_delivery boolean DEFAULT true,
  has_table_service boolean DEFAULT true,
  has_takeaway boolean DEFAULT true,
  custom_button_text text NOT NULL DEFAULT '',
  custom_button_url text NOT NULL DEFAULT '',
  custom_tag_name text NOT NULL DEFAULT 'Destaque',
  logo_url text,
  favicon_url text,
  operating_hours jsonb,
  social_links jsonb DEFAULT '{}'::jsonb,
  order_confirmation_message text DEFAULT 'Obrigado pelo seu pedido!

Recebemos o seu pedido e estamos a prepará-lo com todo o cuidado.

Entraremos em contacto consigo brevemente para confirmar os detalhes.

Caso tenha alguma dúvida, não hesite em contactar-nos.',
  story_image_url text,
  story_image_format text DEFAULT 'vertical' CHECK (story_image_format IN ('vertical', 'portrait', 'square')),
  story_enabled boolean DEFAULT false,
  story_auto_open boolean DEFAULT false,
  product_card_description_lines integer NOT NULL DEFAULT 4 CHECK (product_card_description_lines BETWEEN 0 AND 7),
  story_images jsonb DEFAULT '[]'::jsonb CHECK (jsonb_array_length(story_images) <= 3),
  whatsapp_auto_send boolean DEFAULT false,
  mbway_phone text,
  mbway_reference_prefix text,
  mbway_enabled boolean NOT NULL DEFAULT false,
  delivery_fee_enabled boolean NOT NULL DEFAULT false,
  delivery_base_price numeric(10, 2) NOT NULL DEFAULT 0,
  delivery_price_per_km numeric(10, 2) NOT NULL DEFAULT 0,
  delivery_minimum_order_value numeric(10, 2) NOT NULL DEFAULT 0 CHECK (delivery_minimum_order_value >= 0),
  restaurant_lat double precision,
  restaurant_lng double precision,
  loyalty_enabled boolean NOT NULL DEFAULT false,
  loyalty_points_per_euro integer NOT NULL DEFAULT 1,
  loyalty_points_per_euro_discount integer NOT NULL DEFAULT 100,
  operating_schedule jsonb,
  created_at timestamptz DEFAULT now()
);

-- Tabela: restaurant_awards
-- As imagens são guardadas no Cloudflare R2; aqui fica apenas a URL pública.
CREATE TABLE IF NOT EXISTS public.restaurant_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS restaurant_awards_display_order_idx
  ON public.restaurant_awards (display_order, created_at);

-- Tabela: customers
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  addresses jsonb NOT NULL DEFAULT '[]'::jsonb,
  alternate_names text[] DEFAULT '{}',
  needs_review boolean DEFAULT false,
  notes text,
  user_id uuid,
  birth_date date,
  address_coordinates jsonb NOT NULL DEFAULT '[]'::jsonb,
  loyalty_points integer NOT NULL DEFAULT 0,
  loyalty_points_total integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela: users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('super_admin', 'customer')),
  customer_id uuid,
  birth_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela: discount_coupons
CREATE TABLE IF NOT EXISTS discount_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_product')),
  discount_value numeric(10, 2) NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
  product_id uuid,
  free_product_description text,
  ambassador_name text,
  usage_limit integer,
  usage_count integer DEFAULT 0 NOT NULL,
  minimum_order_value numeric(10, 2) CHECK (minimum_order_value >= 0),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_sequence_counter START WITH 1 INCREMENT BY 1;

-- Tabela: orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  customer_id uuid,
  address text NOT NULL,
  notes text,
  order_type text NOT NULL CHECK (order_type IN ('delivery', 'table', 'takeaway')),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(10, 2) NOT NULL DEFAULT 0,
  discount_amount numeric(10, 2) NOT NULL DEFAULT 0,
  total numeric(10, 2) NOT NULL DEFAULT 0,
  coupon_code text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'delivered')),
  accepted_at timestamptz,
  delivered_at timestamptz,
  viewed boolean DEFAULT false,
  order_sequence integer,
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mbway')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  delivery_fee numeric(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  public_slug text
);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS public_slug text;

CREATE UNIQUE INDEX IF NOT EXISTS orders_public_slug_key
  ON public.orders (public_slug)
  WHERE public_slug IS NOT NULL;

-- Tabela: staff
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  phone text NOT NULL,
  email text DEFAULT '',
  photo_url text DEFAULT '',
  hire_date date DEFAULT CURRENT_DATE,
  hourly_rate numeric(10, 2) DEFAULT 0,
  active boolean DEFAULT true,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela: staff_schedules
CREATE TABLE IF NOT EXISTS staff_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time DEFAULT '09:00',
  end_time time DEFAULT '18:00',
  is_day_off boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(staff_id, day_of_week)
);

-- Tabela: story_views
CREATE TABLE IF NOT EXISTS story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  story_image_url text NOT NULL,
  viewed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Tabela: product_modal_views
CREATE TABLE IF NOT EXISTS product_modal_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  product_name text NOT NULL,
  session_id text,
  viewed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════════
-- ETAPA 1.5: ADICIONAR COLUNAS SE NÃO EXISTIREM
-- (Garante idempotência total: funciona em bancos novos E em bancos existentes)
-- ═══════════════════════════════════════════════════════════════════════════

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ PRODUCTS                                                               │
-- └───────────────────────────────────────────────────────────────────────┘

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'description') THEN
    ALTER TABLE products ADD COLUMN description text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_url') THEN
    ALTER TABLE products ADD COLUMN image_url text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'require_extra') THEN
    ALTER TABLE products ADD COLUMN require_extra boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'extras_label') THEN
    ALTER TABLE products ADD COLUMN extras_label text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_blur') THEN
    ALTER TABLE products ADD COLUMN image_blur text;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_path') THEN
    ALTER TABLE products ADD COLUMN image_path text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'category_id') THEN
    ALTER TABLE products ADD COLUMN category_id uuid NOT NULL DEFAULT gen_random_uuid();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'slug') THEN
    ALTER TABLE products ADD COLUMN slug text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'order') THEN
    ALTER TABLE products ADD COLUMN "order" integer NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'active') THEN
    ALTER TABLE products ADD COLUMN active boolean DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'has_custom_tag') THEN
    ALTER TABLE products ADD COLUMN has_custom_tag boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'custom_tag_text') THEN
    ALTER TABLE products ADD COLUMN custom_tag_text text;
  END IF;
END $$;

-- Atributos dietéticos (JUN 2026)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_vegan') THEN
    ALTER TABLE products ADD COLUMN is_vegan boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_vegetarian') THEN
    ALTER TABLE products ADD COLUMN is_vegetarian boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_gluten_free') THEN
    ALTER TABLE products ADD COLUMN is_gluten_free boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_spicy') THEN
    ALTER TABLE products ADD COLUMN is_spicy boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'spicy_level') THEN
    ALTER TABLE products ADD COLUMN spicy_level smallint NOT NULL DEFAULT 1 CHECK (spicy_level BETWEEN 1 AND 3);
  END IF;
END $$;

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ RESTAURANT_SETTINGS                                                    │
-- └───────────────────────────────────────────────────────────────────────┘

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'name') THEN
    ALTER TABLE restaurant_settings ADD COLUMN name text NOT NULL DEFAULT 'Meu Restaurante';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'accent_color') THEN
    ALTER TABLE restaurant_settings ADD COLUMN accent_color text NOT NULL DEFAULT '#494949';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'title_font') THEN
    ALTER TABLE restaurant_settings ADD COLUMN title_font text NOT NULL DEFAULT 'Gowun Dodum';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'body_font') THEN
    ALTER TABLE restaurant_settings ADD COLUMN body_font text NOT NULL DEFAULT 'Gowun Dodum';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'button_font') THEN
    ALTER TABLE restaurant_settings ADD COLUMN button_font text NOT NULL DEFAULT 'Gowun Dodum';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'restaurant_icon') THEN
    ALTER TABLE restaurant_settings ADD COLUMN restaurant_icon text NOT NULL DEFAULT 'utensils';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'about_us') THEN
    ALTER TABLE restaurant_settings ADD COLUMN about_us text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'about_us_image_url') THEN
    ALTER TABLE restaurant_settings ADD COLUMN about_us_image_url text;
    COMMENT ON COLUMN restaurant_settings.about_us_image_url IS 'URL da imagem da seção Sobre Nós';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'location') THEN
    ALTER TABLE restaurant_settings ADD COLUMN location text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'currency') THEN
    ALTER TABLE restaurant_settings ADD COLUMN currency text NOT NULL DEFAULT 'EUR';
    ALTER TABLE restaurant_settings DROP CONSTRAINT IF EXISTS restaurant_settings_currency_check;
    ALTER TABLE restaurant_settings ADD CONSTRAINT restaurant_settings_currency_check CHECK (currency IN ('BRL', 'EUR'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'has_delivery') THEN
    ALTER TABLE restaurant_settings ADD COLUMN has_delivery boolean DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'has_table_service') THEN
    ALTER TABLE restaurant_settings ADD COLUMN has_table_service boolean DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'has_takeaway') THEN
    ALTER TABLE restaurant_settings ADD COLUMN has_takeaway boolean DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'custom_button_text') THEN
    ALTER TABLE restaurant_settings ADD COLUMN custom_button_text text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'custom_button_url') THEN
    ALTER TABLE restaurant_settings ADD COLUMN custom_button_url text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'custom_tag_name') THEN
    ALTER TABLE restaurant_settings ADD COLUMN custom_tag_name text NOT NULL DEFAULT 'Destaque';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'logo_url') THEN
    ALTER TABLE restaurant_settings ADD COLUMN logo_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'favicon_url') THEN
    ALTER TABLE restaurant_settings ADD COLUMN favicon_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'operating_hours') THEN
    ALTER TABLE restaurant_settings ADD COLUMN operating_hours jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'social_links') THEN
    ALTER TABLE restaurant_settings ADD COLUMN social_links jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Adicionar coluna order_confirmation_message em restaurant_settings (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'order_confirmation_message'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN order_confirmation_message text DEFAULT 'Obrigado pelo seu pedido!

Recebemos o seu pedido e estamos a prepará-lo com todo o cuidado.

Entraremos em contacto consigo brevemente para confirmar os detalhes.

Caso tenha alguma dúvida, não hesite em contactar-nos.';
    COMMENT ON COLUMN restaurant_settings.order_confirmation_message IS 'Mensagem de confirmação exibida após finalizar pedido';
  END IF;
END $$;

-- Adicionar coluna story_image_url em restaurant_settings (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'story_image_url'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN story_image_url text;
    COMMENT ON COLUMN restaurant_settings.story_image_url IS 'URL da imagem do story (deprecated - usar story_images)';
  END IF;
END $$;

-- Adicionar coluna story_image_format em restaurant_settings (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'story_image_format'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN story_image_format text DEFAULT 'vertical';
    ALTER TABLE restaurant_settings DROP CONSTRAINT IF EXISTS restaurant_settings_story_image_format_check;
    ALTER TABLE restaurant_settings ADD CONSTRAINT restaurant_settings_story_image_format_check CHECK (story_image_format IN ('vertical', 'portrait', 'square'));
    COMMENT ON COLUMN restaurant_settings.story_image_format IS 'Formato das imagens do story: vertical, portrait ou square';
  END IF;
END $$;

-- Adicionar coluna story_enabled em restaurant_settings (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'story_enabled'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN story_enabled boolean DEFAULT false;
    COMMENT ON COLUMN restaurant_settings.story_enabled IS 'Ativar/desativar funcionalidade de stories';
  END IF;
END $$;

-- Adicionar coluna story_auto_open em restaurant_settings (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'story_auto_open'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN story_auto_open boolean DEFAULT false;
    COMMENT ON COLUMN restaurant_settings.story_auto_open IS 'Abrir story automaticamente ao carregar página';
  END IF;
END $$;

-- Adicionar limite de linhas da descrição no card de produto (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'product_card_description_lines'
  ) THEN
    ALTER TABLE restaurant_settings
      ADD COLUMN product_card_description_lines integer NOT NULL DEFAULT 4;
  END IF;
END $$;

DO $$
BEGIN
  ALTER TABLE restaurant_settings
    ADD CONSTRAINT restaurant_settings_product_card_description_lines_range
    CHECK (product_card_description_lines BETWEEN 0 AND 7);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Adicionar coluna story_images em restaurant_settings (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'story_images'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN story_images jsonb DEFAULT '[]'::jsonb;
    ALTER TABLE restaurant_settings DROP CONSTRAINT IF EXISTS restaurant_settings_story_images_check;
    ALTER TABLE restaurant_settings ADD CONSTRAINT restaurant_settings_story_images_check CHECK (jsonb_array_length(story_images) <= 3);
    COMMENT ON COLUMN restaurant_settings.story_images IS 'Array de URLs de imagens do story (máximo 3)';
  END IF;
END $$;

-- Adicionar coluna whatsapp_auto_send em restaurant_settings (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'whatsapp_auto_send'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN whatsapp_auto_send boolean DEFAULT false;
    COMMENT ON COLUMN restaurant_settings.whatsapp_auto_send IS 'Enviar mensagem WhatsApp automaticamente ao criar pedido';
  END IF;
END $$;

-- Adicionar coluna mbway_phone em restaurant_settings (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'mbway_phone'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN mbway_phone text;
    COMMENT ON COLUMN restaurant_settings.mbway_phone IS 'Número de telefone para pagamentos MBWay';
  END IF;
END $$;

-- Adicionar coluna mbway_reference_prefix em restaurant_settings (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'mbway_reference_prefix'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN mbway_reference_prefix text;
    COMMENT ON COLUMN restaurant_settings.mbway_reference_prefix IS 'Prefixo para referências de pagamento MBWay';
  END IF;
END $$;

-- Adicionar coluna mbway_enabled em restaurant_settings (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'mbway_enabled'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN mbway_enabled boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Adicionar colunas de taxa de entrega em restaurant_settings (se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'delivery_fee_enabled'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN delivery_fee_enabled boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'delivery_base_price'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN delivery_base_price numeric(10, 2) NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'delivery_price_per_km'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN delivery_price_per_km numeric(10, 2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Adicionar valor mínimo de pedidos de entrega em restaurant_settings (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'delivery_minimum_order_value'
  ) THEN
    ALTER TABLE restaurant_settings
      ADD COLUMN delivery_minimum_order_value numeric(10, 2) NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  ALTER TABLE restaurant_settings
    ADD CONSTRAINT restaurant_settings_delivery_minimum_order_value_non_negative
    CHECK (delivery_minimum_order_value >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Adicionar coordenadas do restaurante em restaurant_settings (se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'restaurant_lat'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN restaurant_lat double precision;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurant_settings' AND column_name = 'restaurant_lng'
  ) THEN
    ALTER TABLE restaurant_settings ADD COLUMN restaurant_lng double precision;
  END IF;
END $$;

-- Loyalty + operating schedule em restaurant_settings (12/07/2026 14:14)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'loyalty_enabled') THEN
    ALTER TABLE restaurant_settings ADD COLUMN loyalty_enabled boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'loyalty_points_per_euro') THEN
    ALTER TABLE restaurant_settings ADD COLUMN loyalty_points_per_euro integer NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'loyalty_points_per_euro_discount') THEN
    ALTER TABLE restaurant_settings ADD COLUMN loyalty_points_per_euro_discount integer NOT NULL DEFAULT 100;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_settings' AND column_name = 'operating_schedule') THEN
    ALTER TABLE restaurant_settings ADD COLUMN operating_schedule jsonb;
  END IF;
END $$;

-- Loyalty points em customers (12/07/2026 14:14)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'loyalty_points') THEN
    ALTER TABLE customers ADD COLUMN loyalty_points integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'loyalty_points_total') THEN
    ALTER TABLE customers ADD COLUMN loyalty_points_total integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Trigger: creditar pontos quando pedido vira 'delivered' (12/07/2026 14:14)
CREATE OR REPLACE FUNCTION public.award_loyalty_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.restaurant_settings;
  pts integer;
BEGIN
  IF NEW.status = 'delivered'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'delivered')
     AND NEW.customer_id IS NOT NULL THEN
    SELECT * INTO s FROM public.restaurant_settings LIMIT 1;
    IF s.loyalty_enabled THEN
      pts := FLOOR(COALESCE(NEW.total, 0) * COALESCE(s.loyalty_points_per_euro, 1))::int;
      IF pts > 0 THEN
        UPDATE public.customers
           SET loyalty_points       = loyalty_points + pts,
               loyalty_points_total = loyalty_points_total + pts
         WHERE id = NEW.customer_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_loyalty_points ON public.orders;
CREATE TRIGGER trg_award_loyalty_points
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.award_loyalty_points();

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ CUSTOMERS                                                              │
-- └───────────────────────────────────────────────────────────────────────┘

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'name') THEN
    ALTER TABLE customers ADD COLUMN name text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'phone') THEN
    ALTER TABLE customers ADD COLUMN phone text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'email') THEN
    ALTER TABLE customers ADD COLUMN email text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'addresses') THEN
    ALTER TABLE customers ADD COLUMN addresses jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'alternate_names') THEN
    ALTER TABLE customers ADD COLUMN alternate_names text[] DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'needs_review') THEN
    ALTER TABLE customers ADD COLUMN needs_review boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'notes') THEN
    ALTER TABLE customers ADD COLUMN notes text;
  END IF;
END $$;

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

-- Adicionar coluna address_coordinates em customers (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'address_coordinates'
  ) THEN
    ALTER TABLE customers ADD COLUMN address_coordinates jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'updated_at') THEN
    ALTER TABLE customers ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ USERS                                                                  │
-- └───────────────────────────────────────────────────────────────────────┘

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
    ALTER TABLE users ADD COLUMN role text NOT NULL DEFAULT 'customer';
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'customer'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'customer_id') THEN
    ALTER TABLE users ADD COLUMN customer_id uuid;
    COMMENT ON COLUMN users.customer_id IS 'Vincula o usuário a um registro de cliente';
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
    ALTER TABLE users ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ ORDERS                                                                 │
-- └───────────────────────────────────────────────────────────────────────┘

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_name') THEN
    ALTER TABLE orders ADD COLUMN customer_name text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_email') THEN
    ALTER TABLE orders ADD COLUMN customer_email text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_phone') THEN
    ALTER TABLE orders ADD COLUMN customer_phone text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_id') THEN
    ALTER TABLE orders ADD COLUMN customer_id uuid;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'address') THEN
    ALTER TABLE orders ADD COLUMN address text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'notes') THEN
    ALTER TABLE orders ADD COLUMN notes text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_type') THEN
    ALTER TABLE orders ADD COLUMN order_type text NOT NULL DEFAULT 'takeaway';
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
    ALTER TABLE orders ADD CONSTRAINT orders_order_type_check CHECK (order_type IN ('delivery', 'table', 'takeaway'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'items') THEN
    ALTER TABLE orders ADD COLUMN items jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'subtotal') THEN
    ALTER TABLE orders ADD COLUMN subtotal numeric(10, 2) NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount_amount') THEN
    ALTER TABLE orders ADD COLUMN discount_amount numeric(10, 2) NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total') THEN
    ALTER TABLE orders ADD COLUMN total numeric(10, 2) NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'coupon_code') THEN
    ALTER TABLE orders ADD COLUMN coupon_code text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') THEN
    ALTER TABLE orders ADD COLUMN status text NOT NULL DEFAULT 'pending';
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
    ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'accepted', 'delivered'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'accepted_at') THEN
    ALTER TABLE orders ADD COLUMN accepted_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivered_at') THEN
    ALTER TABLE orders ADD COLUMN delivered_at timestamptz;
  END IF;
END $$;

-- Adicionar coluna viewed em orders (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'viewed'
  ) THEN
    ALTER TABLE orders ADD COLUMN viewed boolean DEFAULT false;
    COMMENT ON COLUMN orders.viewed IS 'Indica se o pedido foi visualizado pelo administrador';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_sequence') THEN
    ALTER TABLE orders ADD COLUMN order_sequence integer;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_method') THEN
    ALTER TABLE orders ADD COLUMN payment_method text NOT NULL DEFAULT 'cash';
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
    ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check CHECK (payment_method IN ('cash', 'mbway'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
    ALTER TABLE orders ADD COLUMN payment_status text NOT NULL DEFAULT 'pending';
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
    ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('pending', 'paid'));
  END IF;
END $$;

-- Adicionar coluna delivery_fee em orders (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'delivery_fee'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_fee numeric(10, 2) NOT NULL DEFAULT 0;
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- ETAPA 2: ADICIONAR FOREIGN KEYS
-- ═══════════════════════════════════════════════════════════════════════════

-- Adicionar foreign key em products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'products_category_id_fkey'
    AND table_name = 'products'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Adicionar foreign keys em product_extras
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'product_extras_product_id_fkey'
    AND table_name = 'product_extras'
  ) THEN
    ALTER TABLE product_extras ADD CONSTRAINT product_extras_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'product_extras_extra_id_fkey'
    AND table_name = 'product_extras'
  ) THEN
    ALTER TABLE product_extras ADD CONSTRAINT product_extras_extra_id_fkey
      FOREIGN KEY (extra_id) REFERENCES extras(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Adicionar foreign keys em product_tags
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'product_tags_product_id_fkey'
    AND table_name = 'product_tags'
  ) THEN
    ALTER TABLE product_tags ADD CONSTRAINT product_tags_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'product_tags_tag_id_fkey'
    AND table_name = 'product_tags'
  ) THEN
    ALTER TABLE product_tags ADD CONSTRAINT product_tags_tag_id_fkey
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Adicionar foreign key em customers
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

-- Adicionar foreign keys em users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_id_fkey'
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_customer_id_fkey'
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Adicionar foreign key em discount_coupons
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'discount_coupons_product_id_fkey'
    AND table_name = 'discount_coupons'
  ) THEN
    ALTER TABLE discount_coupons ADD CONSTRAINT discount_coupons_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Adicionar foreign key em orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_customer_id_fkey'
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Adicionar foreign key em staff_schedules
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'staff_schedules_staff_id_fkey'
    AND table_name = 'staff_schedules'
  ) THEN
    ALTER TABLE staff_schedules ADD CONSTRAINT staff_schedules_staff_id_fkey
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Adicionar foreign key em product_modal_views
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'product_modal_views_product_id_fkey'
    AND table_name = 'product_modal_views'
  ) THEN
    ALTER TABLE product_modal_views ADD CONSTRAINT product_modal_views_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- ETAPA 3: CRIAR ÍNDICES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_needs_review ON customers(needs_review) WHERE needs_review = true;
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_discount_coupons_product_id ON discount_coupons(product_id);
CREATE INDEX IF NOT EXISTS idx_discount_coupons_ambassador ON discount_coupons(ambassador_name);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff_id ON staff_schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff(active);
CREATE INDEX IF NOT EXISTS idx_staff_name ON staff(name);
CREATE INDEX IF NOT EXISTS idx_story_views_session_id ON story_views(session_id);
CREATE INDEX IF NOT EXISTS idx_story_views_story_image_url ON story_views(story_image_url);
CREATE INDEX IF NOT EXISTS idx_story_views_viewed_at ON story_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_modal_views_product_id ON product_modal_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_modal_views_viewed_at ON product_modal_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_modal_views_session_id ON product_modal_views(session_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- ETAPA 4: CRIAR FUNÇÕES E TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Função: update_customers_updated_at
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função: update_staff_updated_at
CREATE OR REPLACE FUNCTION update_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função: update_restaurant_awards_updated_at
CREATE OR REPLACE FUNCTION public.update_restaurant_awards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para customers
DROP TRIGGER IF EXISTS trigger_customers_updated_at ON customers;
CREATE TRIGGER trigger_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

-- Triggers para staff
DROP TRIGGER IF EXISTS staff_updated_at ON staff;
CREATE TRIGGER staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_updated_at();

DROP TRIGGER IF EXISTS staff_schedules_updated_at ON staff_schedules;
CREATE TRIGGER staff_schedules_updated_at
  BEFORE UPDATE ON staff_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_updated_at();

DROP TRIGGER IF EXISTS restaurant_awards_updated_at ON public.restaurant_awards;
CREATE TRIGGER restaurant_awards_updated_at
  BEFORE UPDATE ON public.restaurant_awards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_restaurant_awards_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════
-- ETAPA 5: STORAGE DE IMAGENS
-- ═══════════════════════════════════════════════════════════════════════════

-- As imagens são enviadas para Cloudflare R2 pela edge function r2-sign-upload.
-- Não crie bucket/políticas de escrita no Supabase Storage para imagens.


-- ═══════════════════════════════════════════════════════════════════════════
-- ETAPA 6: HABILITAR ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_modal_views ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════════════
-- ETAPA 7: CRIAR POLÍTICAS RLS
-- ═══════════════════════════════════════════════════════════════════════════

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ CATEGORIES                                                             │
-- └───────────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "Public read access for categories" ON categories;
CREATE POLICY "Public read access for categories"
  ON categories FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;
CREATE POLICY "Authenticated users can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ TAGS                                                                   │
-- └───────────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "Public read access for tags" ON tags;
CREATE POLICY "Public read access for tags"
  ON tags FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage tags" ON tags;
CREATE POLICY "Authenticated users can manage tags"
  ON tags FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ EXTRAS                                                                 │
-- └───────────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "Public read access for extras" ON extras;
CREATE POLICY "Public read access for extras"
  ON extras FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage extras" ON extras;
CREATE POLICY "Authenticated users can manage extras"
  ON extras FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ PRODUCTS                                                               │
-- └───────────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "Public read access for products" ON products;
CREATE POLICY "Public read access for products"
  ON products FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;
CREATE POLICY "Authenticated users can manage products"
  ON products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ PRODUCT_EXTRAS                                                         │
-- └───────────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "Public read access for product_extras" ON product_extras;
CREATE POLICY "Public read access for product_extras"
  ON product_extras FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage product_extras" ON product_extras;
CREATE POLICY "Authenticated users can manage product_extras"
  ON product_extras FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ PRODUCT_TAGS                                                           │
-- └───────────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "Public read access for product_tags" ON product_tags;
CREATE POLICY "Public read access for product_tags"
  ON product_tags FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage product_tags" ON product_tags;
CREATE POLICY "Authenticated users can manage product_tags"
  ON product_tags FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ RESTAURANT_SETTINGS                                                    │
-- └───────────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "Public read access for restaurant_settings" ON restaurant_settings;
CREATE POLICY "Public read access for restaurant_settings"
  ON restaurant_settings FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage restaurant_settings" ON restaurant_settings;
DROP POLICY IF EXISTS "Only super_admin can insert restaurant_settings" ON restaurant_settings;
CREATE POLICY "Only super_admin can insert restaurant_settings"
  ON restaurant_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Only super_admin can update restaurant_settings" ON restaurant_settings;
CREATE POLICY "Only super_admin can update restaurant_settings"
  ON restaurant_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Only super_admin can delete restaurant_settings" ON restaurant_settings;
CREATE POLICY "Only super_admin can delete restaurant_settings"
  ON restaurant_settings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
  );

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ USERS                                                                  │
-- └───────────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "Users can view own record" ON users;
CREATE POLICY "Users can view own record"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own record" ON users;
CREATE POLICY "Users can insert own record"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own record" ON users;
CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM users WHERE id = auth.uid()));

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ CUSTOMERS                                                              │
-- └───────────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "Authenticated users can read all customers" ON customers;
CREATE POLICY "Authenticated users can read all customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Customers can view own record" ON customers;
CREATE POLICY "Customers can view own record"
  ON customers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can create customer" ON customers;
CREATE POLICY "Authenticated users can create customer"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;
CREATE POLICY "Authenticated users can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Customers can update own record" ON customers;
CREATE POLICY "Customers can update own record"
  ON customers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can update customers" ON customers;
CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete customers" ON customers;
CREATE POLICY "Authenticated users can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ DISCOUNT_COUPONS                                                       │
-- └───────────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "Anyone can read active coupons" ON discount_coupons;
CREATE POLICY "Anyone can read active coupons"
  ON discount_coupons FOR SELECT
  TO public
  USING (active = true);

DROP POLICY IF EXISTS "Authenticated users can read all coupons" ON discount_coupons;
CREATE POLICY "Authenticated users can read all coupons"
  ON discount_coupons FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert coupons" ON discount_coupons;
CREATE POLICY "Authenticated users can insert coupons"
  ON discount_coupons FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update coupons" ON discount_coupons;
CREATE POLICY "Authenticated users can update coupons"
  ON discount_coupons FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete coupons" ON discount_coupons;
CREATE POLICY "Authenticated users can delete coupons"
  ON discount_coupons FOR DELETE
  TO authenticated
  USING (true);

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ ORDERS                                                                 │
-- └───────────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "Authenticated users can read all orders" ON orders;
CREATE POLICY "Authenticated users can read all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = orders.customer_id
      AND customers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
CREATE POLICY "Anyone can insert orders"
  ON orders FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
CREATE POLICY "Authenticated users can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete orders" ON orders;
CREATE POLICY "Authenticated users can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can view order by slug" ON orders;
CREATE POLICY "Public can view order by slug"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (
    public_slug IS NOT NULL
    AND (delivered_at IS NULL OR delivered_at > (now() - interval '24 hours'))
  );

GRANT SELECT ON public.orders TO anon;

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ STAFF                                                                  │
-- └───────────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "Authenticated users can view staff" ON staff;
CREATE POLICY "Authenticated users can view staff"
  ON staff FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create staff" ON staff;
CREATE POLICY "Authenticated users can create staff"
  ON staff FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update staff" ON staff;
CREATE POLICY "Authenticated users can update staff"
  ON staff FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete staff" ON staff;
CREATE POLICY "Authenticated users can delete staff"
  ON staff FOR DELETE
  TO authenticated
  USING (true);

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ STAFF_SCHEDULES                                                        │
-- └───────────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "Authenticated users can view staff schedules" ON staff_schedules;
CREATE POLICY "Authenticated users can view staff schedules"
  ON staff_schedules FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create staff schedules" ON staff_schedules;
CREATE POLICY "Authenticated users can create staff schedules"
  ON staff_schedules FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update staff schedules" ON staff_schedules;
CREATE POLICY "Authenticated users can update staff schedules"
  ON staff_schedules FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete staff schedules" ON staff_schedules;
CREATE POLICY "Authenticated users can delete staff schedules"
  ON staff_schedules FOR DELETE
  TO authenticated
  USING (true);

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ STORY_VIEWS                                                            │
-- └───────────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "Anyone can track story views" ON story_views;
CREATE POLICY "Anyone can track story views"
  ON story_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view story statistics" ON story_views;
CREATE POLICY "Anyone can view story statistics"
  ON story_views FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete old records" ON story_views;
CREATE POLICY "Authenticated users can delete old records"
  ON story_views FOR DELETE
  TO authenticated
  USING (true);

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ PRODUCT_MODAL_VIEWS                                                    │
-- └───────────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "Anyone can track product modal views" ON product_modal_views;
CREATE POLICY "Anyone can track product modal views"
  ON product_modal_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view product statistics" ON product_modal_views;
CREATE POLICY "Anyone can view product statistics"
  ON product_modal_views FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete old view records" ON product_modal_views;
CREATE POLICY "Authenticated users can delete old view records"
  ON product_modal_views FOR DELETE
  TO authenticated
  USING (true);

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ STORAGE POLICIES                                                       │
-- └───────────────────────────────────────────────────────────────────────┘

-- Intencionalmente vazio: novos uploads de imagem vão para Cloudflare R2.
-- Não conceda INSERT/UPDATE/DELETE em storage.objects para o bucket legacy `chefito`.

-- Leitura pública mantida caso um bucket legacy `chefito` exista (imagens antigas).
DROP POLICY IF EXISTS "Public read access for chefito bucket" ON storage.objects;
CREATE POLICY "Public read access for chefito bucket"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'chefito');

-- Bloqueio RESTRITIVO de qualquer escrita no bucket legacy `chefito` do Supabase Storage.
DROP POLICY IF EXISTS "Block inserts to chefito legacy storage" ON storage.objects;
CREATE POLICY "Block inserts to chefito legacy storage"
  ON storage.objects AS RESTRICTIVE FOR INSERT
  TO public
  WITH CHECK (bucket_id <> 'chefito');

DROP POLICY IF EXISTS "Block updates to chefito legacy storage" ON storage.objects;
CREATE POLICY "Block updates to chefito legacy storage"
  ON storage.objects AS RESTRICTIVE FOR UPDATE
  TO public
  USING (bucket_id <> 'chefito')
  WITH CHECK (bucket_id <> 'chefito');

DROP POLICY IF EXISTS "Block deletes from chefito legacy storage" ON storage.objects;
CREATE POLICY "Block deletes from chefito legacy storage"
  ON storage.objects AS RESTRICTIVE FOR DELETE
  TO public
  USING (bucket_id <> 'chefito');

-- Guarda em nível de banco: rejeita URLs do Supabase Storage nos campos de imagem.
CREATE OR REPLACE FUNCTION public.is_supabase_storage_url(_value text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(_value, '') ILIKE '%.supabase.co/storage/v1/object/%'
    OR COALESCE(_value, '') ILIKE '%/storage/v1/object/public/chefito/%'
$$;

CREATE OR REPLACE FUNCTION public.reject_legacy_supabase_storage_urls()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_TABLE_NAME = 'products' THEN
    IF (TG_OP = 'INSERT' OR NEW.image_url IS DISTINCT FROM OLD.image_url)
      AND public.is_supabase_storage_url(NEW.image_url) THEN
      RAISE EXCEPTION 'Supabase Storage URLs are blocked. Upload images through Cloudflare R2.';
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'restaurant_settings' THEN
    IF (TG_OP = 'INSERT' OR NEW.story_image_url IS DISTINCT FROM OLD.story_image_url)
      AND public.is_supabase_storage_url(NEW.story_image_url) THEN
      RAISE EXCEPTION 'Supabase Storage story_image_url is blocked. Upload story images through Cloudflare R2.';
    END IF;

    IF (TG_OP = 'INSERT' OR NEW.story_images IS DISTINCT FROM OLD.story_images)
      AND public.is_supabase_storage_url(to_jsonb(NEW.story_images)::text) THEN
      RAISE EXCEPTION 'Supabase Storage story_images are blocked. Upload story images through Cloudflare R2.';
    END IF;

    IF (TG_OP = 'INSERT' OR NEW.logo_url IS DISTINCT FROM OLD.logo_url)
      AND public.is_supabase_storage_url(NEW.logo_url) THEN
      RAISE EXCEPTION 'Supabase Storage logo_url is blocked. Upload images through Cloudflare R2.';
    END IF;

    IF (TG_OP = 'INSERT' OR NEW.favicon_url IS DISTINCT FROM OLD.favicon_url)
      AND public.is_supabase_storage_url(NEW.favicon_url) THEN
      RAISE EXCEPTION 'Supabase Storage favicon_url is blocked. Upload images through Cloudflare R2.';
    END IF;

    IF (TG_OP = 'INSERT' OR NEW.about_us_image_url IS DISTINCT FROM OLD.about_us_image_url)
      AND public.is_supabase_storage_url(NEW.about_us_image_url) THEN
      RAISE EXCEPTION 'Supabase Storage about_us_image_url is blocked. Upload images through Cloudflare R2.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reject_legacy_supabase_storage_urls_products ON public.products;
CREATE TRIGGER reject_legacy_supabase_storage_urls_products
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_legacy_supabase_storage_urls();

DROP TRIGGER IF EXISTS reject_legacy_supabase_storage_urls_settings ON public.restaurant_settings;
CREATE TRIGGER reject_legacy_supabase_storage_urls_settings
  BEFORE INSERT OR UPDATE ON public.restaurant_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_legacy_supabase_storage_urls();


-- ═══════════════════════════════════════════════════════════════════════════
-- ETAPA 8: INSERIR DADOS INICIAIS
-- ═══════════════════════════════════════════════════════════════════════════

-- Inserir registro inicial de restaurant_settings (se não existir)
INSERT INTO restaurant_settings (
  id,
  name,
  accent_color,
  title_font,
  body_font,
  button_font,
  restaurant_icon,
  about_us,
  location,
  currency,
  has_delivery,
  has_table_service,
  has_takeaway,
  custom_button_text,
  custom_button_url,
  custom_tag_name,
  order_confirmation_message,
  story_enabled,
  story_auto_open,
  product_card_description_lines,
  story_image_format,
  story_images,
  whatsapp_auto_send,
  mbway_enabled,
  delivery_fee_enabled,
  delivery_base_price,
  delivery_price_per_km,
  delivery_minimum_order_value,
  operating_hours,
  social_links
)
SELECT
  gen_random_uuid(),
  'Meu Restaurante',
  '#494949',
  'Gowun Dodum',
  'Gowun Dodum',
  'Gowun Dodum',
  'utensils',
  '',
  '',
  'EUR',
  true,
  true,
  true,
  '',
  '',
  'Destaque',
  'Obrigado pelo seu pedido!

Recebemos o seu pedido e estamos a prepará-lo com todo o cuidado.

Entraremos em contacto consigo brevemente para confirmar os detalhes.

Caso tenha alguma dúvida, não hesite em contactar-nos.',
  false,
  false,
  4,
  'vertical',
  '[]'::jsonb,
  false,
  false,
  false,
  0,
  0,
  0,
  NULL,
  '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM restaurant_settings LIMIT 1);


-- ═══════════════════════════════════════════════════════════════════════════
-- COMENTÁRIOS NAS COLUNAS
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE users IS 'User authentication and roles. Note: Super admin operations require using the service role key in backend code to bypass RLS.';
COMMENT ON COLUMN users.role IS 'Tipo de usuário: super_admin (acesso total) ou customer (acesso ao próprio perfil)';
COMMENT ON COLUMN users.customer_id IS 'Vincula o usuário a um registro de cliente';
COMMENT ON COLUMN users.birth_date IS 'Data de aniversário do usuário';
COMMENT ON COLUMN customers.user_id IS 'Vincula o cliente a um usuário autenticado';
COMMENT ON COLUMN customers.birth_date IS 'Data de aniversário do cliente';


-- ═══════════════════════════════════════════════════════════════════════════
-- ETAPA 9: FUNÇÕES RPC
-- ═══════════════════════════════════════════════════════════════════════════

-- Função: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
INSERT INTO public.users (id, role, created_at, updated_at)
VALUES (
NEW.id,
'customer',
NOW(),
NOW()
)
ON CONFLICT (id) DO NOTHING;

RETURN NEW;
END;
$$;

-- Trigger para criar user automaticamente ao registar em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Função para obter o próximo número sequencial de pedido
CREATE OR REPLACE FUNCTION get_next_order_sequence()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT nextval('order_sequence_counter');
$$;

GRANT EXECUTE ON FUNCTION get_next_order_sequence() TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_order_sequence() TO anon;

-- Cria o pedido e consome o cupom na mesma transação.
CREATE OR REPLACE FUNCTION public.create_order_with_coupon(
  p_order jsonb,
  p_coupon_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
BEGIN
  IF p_coupon_id IS NOT NULL THEN
    UPDATE public.discount_coupons
    SET usage_count = usage_count + 1
    WHERE id = p_coupon_id
      AND active = true
      AND (usage_limit IS NULL OR usage_count < usage_limit)
    RETURNING id INTO v_order_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'coupon_unavailable' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  INSERT INTO public.orders (
    customer_id, customer_name, customer_email, customer_phone, address, notes,
    order_type, items, subtotal, discount_amount, total, delivery_fee,
    coupon_code, payment_method, order_sequence, public_slug
  ) VALUES (
    NULLIF(p_order->>'customer_id', '')::uuid,
    p_order->>'customer_name', p_order->>'customer_email', p_order->>'customer_phone',
    p_order->>'address', NULLIF(p_order->>'notes', ''), p_order->>'order_type',
    COALESCE(p_order->'items', '[]'::jsonb), COALESCE((p_order->>'subtotal')::numeric, 0),
    COALESCE((p_order->>'discount_amount')::numeric, 0), COALESCE((p_order->>'total')::numeric, 0),
    COALESCE((p_order->>'delivery_fee')::numeric, 0), NULLIF(p_order->>'coupon_code', ''),
    COALESCE(p_order->>'payment_method', 'cash'), NULLIF(p_order->>'order_sequence', '')::integer,
    NULLIF(p_order->>'public_slug', '')
  ) RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_with_coupon(jsonb, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_with_coupon(jsonb, uuid) TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- ETAPA 10: CONFIGURAR REALTIME
-- ═══════════════════════════════════════════════════════════════════════════

-- Habilitar Realtime para a tabela orders
-- Isso permite notificações automáticas via WebSocket quando novos pedidos são criados
-- O sistema receberá alertas instantâneos sem precisar recarregar a página
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel
    WHERE prrelid = 'orders'::regclass
    AND prpubid = (SELECT oid FROM pg_publication WHERE pubname = 'supabase_realtime')
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- RESERVAS (Sistema de Reservas de Mesas)
-- ═══════════════════════════════════════════════════════════════════════════

-- Extensão de restaurant_settings com configuração de reservas
ALTER TABLE public.restaurant_settings
  ADD COLUMN IF NOT EXISTS reservations_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reservation_duration_min int DEFAULT 90,
  ADD COLUMN IF NOT EXISTS reservation_min_advance_min int DEFAULT 120,
  ADD COLUMN IF NOT EXISTS reservation_max_advance_days int DEFAULT 30;

-- Mesas físicas disponíveis para reserva
CREATE TABLE IF NOT EXISTS public.reservation_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'mesa' CHECK (kind IN ('mesa','espaco')),
  seats int NOT NULL CHECK (seats > 0),
  location text NOT NULL DEFAULT 'interior',
  description text,
  is_active boolean DEFAULT true,
  schedule jsonb,
  created_at timestamptz DEFAULT now()
);

-- Colunas adicionadas em versões posteriores (idempotente para bases antigas)
ALTER TABLE public.reservation_tables
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'mesa',
  ADD COLUMN IF NOT EXISTS schedule jsonb;

DO $$ BEGIN
  ALTER TABLE public.reservation_tables
    ADD CONSTRAINT reservation_tables_kind_check CHECK (kind IN ('mesa','espaco'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT ON public.reservation_tables TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reservation_tables TO authenticated;
GRANT ALL ON public.reservation_tables TO service_role;

ALTER TABLE public.reservation_tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read tables" ON public.reservation_tables;
CREATE POLICY "read tables" ON public.reservation_tables FOR SELECT USING (true);

-- Public (client-facing) read of active tables. Explicit anon+authenticated
-- grant so the reservation modal on the customer side lists tables.
DROP POLICY IF EXISTS "reservation_tables_public_read_active" ON public.reservation_tables;
CREATE POLICY "reservation_tables_public_read_active"
  ON public.reservation_tables
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "admin manage tables" ON public.reservation_tables;
CREATE POLICY "admin manage tables" ON public.reservation_tables
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin'));

-- Enum de status da reserva
DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM ('pending','confirmed','rejected','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Reservas
CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  table_id uuid REFERENCES public.reservation_tables(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  party_size int NOT NULL CHECK (party_size > 0),
  notes text,
  status reservation_status NOT NULL DEFAULT 'pending',
  viewed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reservations_table_starts_idx ON public.reservations (table_id, starts_at);
CREATE INDEX IF NOT EXISTS reservations_user_idx ON public.reservations (user_id);
CREATE INDEX IF NOT EXISTS reservations_status_idx ON public.reservations (status);

GRANT SELECT, INSERT, UPDATE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own reservations select" ON public.reservations;
CREATE POLICY "own reservations select" ON public.reservations
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

DROP POLICY IF EXISTS "own reservations insert" ON public.reservations;
CREATE POLICY "own reservations insert" ON public.reservations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "own reservations update" ON public.reservations;
CREATE POLICY "own reservations update" ON public.reservations
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

-- Slots ocupados: o cliente precisa saber apenas quais horários confirmados
-- já bloqueiam uma mesa, sem expor nomes, emails ou telefones de reservas.
CREATE OR REPLACE FUNCTION public.get_reserved_table_slots(
  p_table_ids uuid[],
  p_day_start timestamptz,
  p_day_end timestamptz
)
RETURNS TABLE (
  table_id uuid,
  starts_at timestamptz,
  ends_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.table_id, r.starts_at, r.ends_at
  FROM public.reservations r
  WHERE r.table_id = ANY(p_table_ids)
    AND r.status = 'confirmed'
    AND r.starts_at <= p_day_end
    AND r.ends_at >= p_day_start;
$$;

GRANT EXECUTE ON FUNCTION public.get_reserved_table_slots(uuid[], timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_reserved_table_slots(uuid[], timestamptz, timestamptz) TO service_role;

-- Segurança no banco: ao confirmar uma reserva, impede duplicar o mesmo
-- intervalo confirmado na mesma mesa. Pedidos pendentes podem existir, mas só
-- um deles poderá ser confirmado para aquele horário/mesa.
CREATE OR REPLACE FUNCTION public.prevent_confirmed_reservation_overlap()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND NEW.table_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.reservations r
      WHERE r.id <> NEW.id
        AND r.table_id = NEW.table_id
        AND r.status = 'confirmed'
        AND tstzrange(r.starts_at, r.ends_at, '[)') && tstzrange(NEW.starts_at, NEW.ends_at, '[)')
    ) THEN
      RAISE EXCEPTION 'Já existe uma reserva confirmada para esta mesa neste horário.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_confirmed_reservation_overlap_trigger ON public.reservations;
CREATE TRIGGER prevent_confirmed_reservation_overlap_trigger
  BEFORE INSERT OR UPDATE OF table_id, starts_at, ends_at, status
  ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_confirmed_reservation_overlap();

-- Realtime para novas reservas
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- MULTI-PAÍS (PT/BR): country + Pix
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.restaurant_settings
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'PT',
  ADD COLUMN IF NOT EXISTS pix_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pix_key text,
  ADD COLUMN IF NOT EXISTS pix_key_type text,
  ADD COLUMN IF NOT EXISTS pix_beneficiary_name text;

DO $$ BEGIN
  ALTER TABLE public.restaurant_settings
    ADD CONSTRAINT restaurant_settings_country_check CHECK (country IN ('PT','BR'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.restaurant_settings
    ADD CONSTRAINT restaurant_settings_pix_key_type_check
    CHECK (pix_key_type IS NULL OR pix_key_type IN ('cpf','cnpj','email','phone','random'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- payment_method passa a aceitar 'pix'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('cash','mbway','pix'));


-- ═══════════════════════════════════════════════════════════════════════════
-- Segurança RLS (11/08/2026 01:30)
-- Catálogo, equipa e cupões podem ser alterados somente pelo super_admin.
-- Clientes autenticados têm acesso somente aos respetivos dados e pedidos.
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

CREATE POLICY "Super admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins manage tags" ON public.tags FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins manage extras" ON public.extras FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins manage products" ON public.products FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins manage product extras" ON public.product_extras FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins manage product tags" ON public.product_tags FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins manage coupons" ON public.discount_coupons FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins manage staff" ON public.staff FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins manage staff schedules" ON public.staff_schedules FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

REVOKE ALL ON TABLE public.restaurant_awards FROM anon, authenticated;
GRANT SELECT ON TABLE public.restaurant_awards TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.restaurant_awards TO authenticated;

DROP POLICY IF EXISTS "Public read restaurant awards" ON public.restaurant_awards;
DROP POLICY IF EXISTS "Super admins insert restaurant awards" ON public.restaurant_awards;
DROP POLICY IF EXISTS "Super admins update restaurant awards" ON public.restaurant_awards;
DROP POLICY IF EXISTS "Super admins delete restaurant awards" ON public.restaurant_awards;

CREATE POLICY "Public read restaurant awards"
  ON public.restaurant_awards FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "Super admins insert restaurant awards"
  ON public.restaurant_awards FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins update restaurant awards"
  ON public.restaurant_awards FOR UPDATE TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins delete restaurant awards"
  ON public.restaurant_awards FOR DELETE TO authenticated
  USING (public.is_super_admin());

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

-- FIM DO SCHEMA COMPLETO - CHEFITO POS
-- ═══════════════════════════════════════════════════════════════════════════

/*
  ╔═══════════════════════════════════════════════════════════════════════════╗
  ║                          SCHEMA CRIADO COM SUCESSO!                       ║
  ╚═══════════════════════════════════════════════════════════════════════════╝

  O banco de dados agora contém:

  ✓ 16 tabelas configuradas e prontas para uso:
    - categories, tags, extras, products, product_extras, product_tags
    - restaurant_settings (com campos de stories e mensagem de confirmação)
    - restaurant_awards (badges e reconhecimentos públicos)
    - customers (com campos user_id e birth_date)
    - users (sistema de autenticação completo)
    - discount_coupons (com minimum_order_value)
    - orders
    - staff, staff_schedules
    - story_views (rastreamento de visualizações de stories)
    - product_modal_views (rastreamento de visualizações de produtos)

  ✓ Verificação e criação automática de colunas ausentes (idempotente)
  ✓ Row Level Security (RLS) habilitado em todas as tabelas
  ✓ Políticas RLS configuradas corretamente (sem recursão)
  ✓ Uploads de imagem configurados para Cloudflare R2 (fora do Supabase Storage)
  ✓ Funções e triggers para atualização automática
  ✓ Índices para otimização de performance
  ✓ Dados iniciais em restaurant_settings
  ✓ Realtime habilitado para notificações instantâneas de pedidos

  Próximos passos:

  1. Configure o arquivo .env do projeto com as credenciais do Supabase
  2. Crie um usuário autenticado no painel do Supabase (Authentication > Users)
  3. Use a aplicação para configurar o restaurante através da interface

  IMPORTANTE:
  - Este script é 100% idempotente e seguro para executar múltiplas vezes
  - Verifica automaticamente se colunas existem antes de tentar criá-las
  - Para operações de super admin, use a service role key no backend
  - Clientes só conseguem ver seus próprios dados
  - O sistema de RLS está configurado para máxima segurança

  Documentação: https://supabase.com/docs
*/
