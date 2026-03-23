-- TavernCreative Database Schema
-- Phase 1: Storefront

-- Enums
CREATE TYPE product_category AS ENUM ('save_the_dates', 'invitations', 'on_the_day', 'thank_yous');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'in_production', 'shipped', 'delivered');
CREATE TYPE field_type AS ENUM ('text', 'date', 'time', 'textarea', 'select');

-- Design Collections (e.g., Wildflower, Botanical, Minimalist)
CREATE TABLE design_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  hero_image_url TEXT,
  preview_images TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product Types (e.g., Save the Dates, Invitations, Menus, Place Cards)
CREATE TABLE product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category product_category NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Products (intersection of design collection + product type)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_collection_id UUID NOT NULL REFERENCES design_collections(id) ON DELETE CASCADE,
  product_type_id UUID NOT NULL REFERENCES product_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  mockup_images TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Personalisation Fields (defines the form for each product)
CREATE TABLE personalisation_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  field_type field_type NOT NULL DEFAULT 'text',
  label TEXT NOT NULL,
  placeholder TEXT,
  is_required BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  options JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Customers (linked to Supabase auth)
CREATE TABLE customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  wedding_date DATE,
  partner_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE,
  status order_status DEFAULT 'pending',
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_address JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  personalisation_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_products_collection ON products(design_collection_id);
CREATE INDEX idx_products_type ON products(product_type_id);
CREATE INDEX idx_products_published ON products(is_published) WHERE is_published = true;
CREATE INDEX idx_collections_published ON design_collections(is_published) WHERE is_published = true;
CREATE INDEX idx_personalisation_product ON personalisation_fields(product_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_design_collections_updated_at
  BEFORE UPDATE ON design_collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE design_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalisation_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Published collections are viewable by everyone"
  ON design_collections FOR SELECT
  USING (is_published = true);

CREATE POLICY "Product types are viewable by everyone"
  ON product_types FOR SELECT
  USING (true);

CREATE POLICY "Published products are viewable by everyone"
  ON products FOR SELECT
  USING (is_published = true);

CREATE POLICY "Fields for published products are viewable by everyone"
  ON personalisation_fields FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = personalisation_fields.product_id
      AND products.is_published = true
    )
  );

-- Customer policies
CREATE POLICY "Users can view their own customer record"
  ON customers FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own customer record"
  ON customers FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own customer record"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Order policies
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

-- Service role has full access (used by admin API routes)
-- No explicit policies needed — service role bypasses RLS

-- Seed default product types
INSERT INTO product_types (name, slug, category, sort_order) VALUES
  ('Save the Dates', 'save-the-dates', 'save_the_dates', 1),
  ('Invitations', 'invitations', 'invitations', 2),
  ('RSVP Cards', 'rsvp-cards', 'invitations', 3),
  ('Information Cards', 'information-cards', 'invitations', 4),
  ('Order of Service', 'order-of-service', 'on_the_day', 5),
  ('Menus', 'menus', 'on_the_day', 6),
  ('Place Cards', 'place-cards', 'on_the_day', 7),
  ('Table Numbers', 'table-numbers', 'on_the_day', 8),
  ('Table Plan', 'table-plan', 'on_the_day', 9),
  ('Thank You Cards', 'thank-you-cards', 'thank_yous', 10);
