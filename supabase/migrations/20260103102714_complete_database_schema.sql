/*
  ╔═══════════════════════════════════════════════════════════════════════════╗
  ║                   SCHEMA COMPLETO DO BANCO DE DADOS                       ║
  ║                          Sistema Chefito POS                              ║
  ╚═══════════════════════════════════════════════════════════════════════════╝

  Este arquivo contém o schema COMPLETO do banco de dados, incluindo:
  - 13 tabelas com todos os campos atuais
  - Políticas RLS (Row Level Security) para todas as tabelas
  - Storage bucket 'chefito' com políticas de acesso
  - Funções e triggers para atualização automática de timestamps
  - Índices para otimização de performance
  - Constraints e validações

  INSTRUÇÕES DE USO:
  1. Copie todo este arquivo
  2. Acesse o Supabase Dashboard > SQL Editor
  3. Cole e execute este script
  4. O script é idempotente (pode ser executado múltiplas vezes sem causar erros)
*/


-- ═══════════════════════════════════════════════════════════════════════════
-- SEÇÃO 1: TABELAS BASE DO CARDÁPIO
-- ═══════════════════════════════════════════════════════════════════════════

-- Tabela: categories
-- Armazena as categorias de produtos do cardápio (ex: Entradas, Pratos Principais, Sobremesas)
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tabela: tags
-- Armazena tags para produtos (ex: Vegano, Sem Glúten, Picante)
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'tag',
  created_at timestamptz DEFAULT now()
);

-- Tabela: extras
-- Armazena extras/adicionais que podem ser adicionados aos produtos
CREATE TABLE IF NOT EXISTS extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Tabela: products
-- Armazena todos os produtos do cardápio
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  image_url text NOT NULL DEFAULT '',
  image_path text,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  "order" integer NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  has_custom_tag boolean DEFAULT false,
  custom_tag_text text,
  created_at timestamptz DEFAULT now()
);

-- Tabela: product_extras
-- Relacionamento N:N entre produtos e extras
CREATE TABLE IF NOT EXISTS product_extras (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  extra_id uuid NOT NULL REFERENCES extras(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, extra_id)
);

-- Tabela: product_tags
-- Relacionamento N:N entre produtos e tags
CREATE TABLE IF NOT EXISTS product_tags (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);


-- ═══════════════════════════════════════════════════════════════════════════
-- SEÇÃO 2: CONFIGURAÇÕES DO RESTAURANTE
-- ═══════════════════════════════════════════════════════════════════════════

-- Tabela: restaurant_settings
-- Armazena todas as configurações personalizáveis do restaurante
CREATE TABLE IF NOT EXISTS restaurant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Meu Restaurante',
  accent_color text NOT NULL DEFAULT '#212529',
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
  created_at timestamptz DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════════
-- SEÇÃO 3: GESTÃO DE CLIENTES
-- ═══════════════════════════════════════════════════════════════════════════

-- Tabela: customers
-- Armazena informações dos clientes
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  addresses jsonb NOT NULL DEFAULT '[]'::jsonb,
  alternate_names text[] DEFAULT '{}',
  needs_review boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para customers
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_needs_review ON customers(needs_review) WHERE needs_review = true;


-- ═══════════════════════════════════════════════════════════════════════════
-- SEÇÃO 4: CUPONS DE DESCONTO
-- ═══════════════════════════════════════════════════════════════════════════

-- Tabela: discount_coupons
-- Armazena cupons de desconto (porcentagem, valor fixo ou produto grátis)
CREATE TABLE IF NOT EXISTS discount_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_product')),
  discount_value numeric(10, 2) NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  free_product_description text,
  ambassador_name text,
  usage_limit integer,
  usage_count integer DEFAULT 0 NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Índices para discount_coupons
CREATE INDEX IF NOT EXISTS idx_discount_coupons_product_id ON discount_coupons(product_id);
CREATE INDEX IF NOT EXISTS idx_discount_coupons_ambassador ON discount_coupons(ambassador_name);


-- ═══════════════════════════════════════════════════════════════════════════
-- SEÇÃO 5: PEDIDOS
-- ═══════════════════════════════════════════════════════════════════════════

-- Tabela: orders
-- Armazena todos os pedidos realizados
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
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
  created_at timestamptz DEFAULT now()
);

-- Índice para orders
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- SEÇÃO 6: GESTÃO DE FUNCIONÁRIOS
-- ═══════════════════════════════════════════════════════════════════════════

-- Tabela: staff
-- Armazena informações dos funcionários
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
-- Armazena os horários semanais dos funcionários
CREATE TABLE IF NOT EXISTS staff_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time DEFAULT '09:00',
  end_time time DEFAULT '18:00',
  is_day_off boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(staff_id, day_of_week)
);

-- Índices para staff
CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff_id ON staff_schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff(active);
CREATE INDEX IF NOT EXISTS idx_staff_name ON staff(name);


-- ═══════════════════════════════════════════════════════════════════════════
-- SEÇÃO 7: STORAGE BUCKET PARA IMAGENS
-- ═══════════════════════════════════════════════════════════════════════════

-- Criar bucket público 'chefito' para armazenar imagens de produtos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chefito',
  'chefito',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ═══════════════════════════════════════════════════════════════════════════
-- SEÇÃO 8: FUNÇÕES E TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Função: update_customers_updated_at
-- Atualiza automaticamente o campo updated_at quando um cliente é modificado
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função: update_staff_updated_at
-- Atualiza automaticamente o campo updated_at quando staff ou staff_schedules são modificados
CREATE OR REPLACE FUNCTION update_staff_updated_at()
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


-- ═══════════════════════════════════════════════════════════════════════════
-- SEÇÃO 9: ROW LEVEL SECURITY (RLS) - HABILITAR
-- ═══════════════════════════════════════════════════════════════════════════

-- Habilitar RLS em todas as tabelas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════════════
-- SEÇÃO 10: ROW LEVEL SECURITY (RLS) - POLÍTICAS
-- ═══════════════════════════════════════════════════════════════════════════

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ TABELAS PÚBLICAS (Leitura pública + Escrita autenticada)             │
-- │ categories, tags, extras, products, product_extras, product_tags,     │
-- │ restaurant_settings                                                    │
-- └───────────────────────────────────────────────────────────────────────┘

-- Políticas para CATEGORIES
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

-- Políticas para TAGS
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

-- Políticas para EXTRAS
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

-- Políticas para PRODUCTS
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

-- Políticas para PRODUCT_EXTRAS
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

-- Políticas para PRODUCT_TAGS
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

-- Políticas para RESTAURANT_SETTINGS
DROP POLICY IF EXISTS "Public read access for restaurant_settings" ON restaurant_settings;
CREATE POLICY "Public read access for restaurant_settings"
  ON restaurant_settings FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage restaurant_settings" ON restaurant_settings;
CREATE POLICY "Authenticated users can manage restaurant_settings"
  ON restaurant_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ DISCOUNT_COUPONS (Leitura pública de cupons ativos + Gestão auth)    │
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
-- │ ORDERS (Inserção pública para clientes + Gestão auth)                │
-- └───────────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "Authenticated users can read all orders" ON orders;
CREATE POLICY "Authenticated users can read all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

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

-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ CUSTOMERS (Apenas autenticados)                                       │
-- └───────────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "Authenticated users can read all customers" ON customers;
CREATE POLICY "Authenticated users can read all customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;
CREATE POLICY "Authenticated users can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

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
-- │ STAFF e STAFF_SCHEDULES (Apenas autenticados)                        │
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
-- │ STORAGE POLICIES (Bucket chefito)                                     │
-- └───────────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "Public read access for chefito bucket" ON storage.objects;
CREATE POLICY "Public read access for chefito bucket"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'chefito');

DROP POLICY IF EXISTS "Authenticated users can upload to chefito bucket" ON storage.objects;
CREATE POLICY "Authenticated users can upload to chefito bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chefito'
    AND (storage.foldername(name))[1] = replace(replace(auth.jwt()->>'email', '@', '_at_'), '.', '_')
  );

DROP POLICY IF EXISTS "Authenticated users can update their own images in chefito" ON storage.objects;
CREATE POLICY "Authenticated users can update their own images in chefito"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'chefito'
    AND (storage.foldername(name))[1] = replace(replace(auth.jwt()->>'email', '@', '_at_'), '.', '_')
  )
  WITH CHECK (
    bucket_id = 'chefito'
    AND (storage.foldername(name))[1] = replace(replace(auth.jwt()->>'email', '@', '_at_'), '.', '_')
  );

DROP POLICY IF EXISTS "Authenticated users can delete their own images in chefito" ON storage.objects;
CREATE POLICY "Authenticated users can delete their own images in chefito"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chefito'
    AND (storage.foldername(name))[1] = replace(replace(auth.jwt()->>'email', '@', '_at_'), '.', '_')
  );


-- ═══════════════════════════════════════════════════════════════════════════
-- SEÇÃO 11: DADOS INICIAIS (OPCIONAL)
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
  operating_hours,
  social_links
)
SELECT
  gen_random_uuid(),
  'Meu Restaurante',
  '#10b981',
  'Playfair Display',
  'Inter',
  'Inter',
  '🍽️',
  '',
  '',
  'BRL',
  true,
  true,
  true,
  '',
  '',
  'Destaque',
  NULL,
  '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM restaurant_settings LIMIT 1);


-- ═══════════════════════════════════════════════════════════════════════════
-- FIM DO SCHEMA COMPLETO
-- ═══════════════════════════════════════════════════════════════════════════