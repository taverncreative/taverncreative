-- Migration 002: Pricing Templates, Design Templates, and Commit Workflow
-- Run this in the Supabase SQL Editor after 001_initial_schema.sql

-- ============================================================
-- PRICING TEMPLATES
-- ============================================================

-- Pricing Templates (e.g., "Standard Invitation Pricing", "Premium Card Pricing")
CREATE TABLE pricing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Quantity tiers for a pricing template (e.g., 25 = £37.50, 50 = £62.50)
CREATE TABLE pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_template_id UUID NOT NULL REFERENCES pricing_templates(id) ON DELETE CASCADE,
  min_quantity INTEGER NOT NULL,
  max_quantity INTEGER, -- NULL means unlimited
  unit_price NUMERIC(10,2) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Upsells for a pricing template (e.g., "Double sided" +30p per item)
CREATE TABLE pricing_upsells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_template_id UUID NOT NULL REFERENCES pricing_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Make it double sided"
  description TEXT,
  price_per_unit NUMERIC(10,2) NOT NULL, -- e.g., 0.30 for 30p per item
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DESIGN TEMPLATES (replaces the old product_type role)
-- ============================================================

-- Design Templates (e.g., "5x7 Invitation", "A6 Save the Date")
CREATE TABLE design_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category product_category NOT NULL,
  description TEXT,
  pricing_template_id UUID REFERENCES pricing_templates(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Personalisation fields now belong to design templates (not products)
-- We'll create a new table and keep the old one for now
CREATE TABLE design_template_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_template_id UUID NOT NULL REFERENCES design_templates(id) ON DELETE CASCADE,
  field_type field_type NOT NULL DEFAULT 'text',
  label TEXT NOT NULL,
  placeholder TEXT,
  is_required BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  options JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- COLLECTION PRODUCTS (a design applied to a template within a collection)
-- ============================================================

CREATE TYPE product_status AS ENUM ('todo', 'in_progress', 'complete');

CREATE TABLE collection_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES design_collections(id) ON DELETE CASCADE,
  design_template_id UUID NOT NULL REFERENCES design_templates(id) ON DELETE CASCADE,
  status product_status DEFAULT 'todo',
  mockup_images TEXT[] DEFAULT '{}',
  -- Commit to shop
  is_live BOOLEAN DEFAULT false,
  committed_at TIMESTAMPTZ, -- when it was last committed
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(collection_id, design_template_id)
);

-- Commit log — tracks every time a product is committed/uncommitted
CREATE TABLE commit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_product_id UUID NOT NULL REFERENCES collection_products(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'committed' or 'uncommitted'
  committed_at TIMESTAMPTZ DEFAULT now()
);

-- Cross-sells between design templates (e.g., "ordered invites? how about evening invites")
CREATE TABLE cross_sells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_template_id UUID NOT NULL REFERENCES design_templates(id) ON DELETE CASCADE,
  cross_sell_template_id UUID NOT NULL REFERENCES design_templates(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(design_template_id, cross_sell_template_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_pricing_tiers_template ON pricing_tiers(pricing_template_id);
CREATE INDEX idx_pricing_upsells_template ON pricing_upsells(pricing_template_id);
CREATE INDEX idx_design_templates_category ON design_templates(category);
CREATE INDEX idx_design_template_fields ON design_template_fields(design_template_id);
CREATE INDEX idx_collection_products_collection ON collection_products(collection_id);
CREATE INDEX idx_collection_products_template ON collection_products(design_template_id);
CREATE INDEX idx_collection_products_live ON collection_products(is_live) WHERE is_live = true;
CREATE INDEX idx_commit_log_product ON commit_log(collection_product_id);
CREATE INDEX idx_cross_sells_template ON cross_sells(design_template_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER update_pricing_templates_updated_at
  BEFORE UPDATE ON pricing_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_design_templates_updated_at
  BEFORE UPDATE ON design_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_collection_products_updated_at
  BEFORE UPDATE ON collection_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE pricing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_upsells ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_template_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE commit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_sells ENABLE ROW LEVEL SECURITY;

-- Public read access for live products
CREATE POLICY "Design templates are viewable by everyone"
  ON design_templates FOR SELECT
  USING (true);

CREATE POLICY "Design template fields are viewable by everyone"
  ON design_template_fields FOR SELECT
  USING (true);

CREATE POLICY "Pricing templates are viewable by everyone"
  ON pricing_templates FOR SELECT
  USING (true);

CREATE POLICY "Pricing tiers are viewable by everyone"
  ON pricing_tiers FOR SELECT
  USING (true);

CREATE POLICY "Pricing upsells are viewable by everyone"
  ON pricing_upsells FOR SELECT
  USING (true);

CREATE POLICY "Live collection products are viewable by everyone"
  ON collection_products FOR SELECT
  USING (is_live = true);

CREATE POLICY "Cross sells are viewable by everyone"
  ON cross_sells FOR SELECT
  USING (true);

-- ============================================================
-- UPDATE ORDER ITEMS to reference collection_products
-- ============================================================

-- Add new column to order_items for the new product reference
ALTER TABLE order_items ADD COLUMN collection_product_id UUID REFERENCES collection_products(id) ON DELETE RESTRICT;
-- Add column for selected upsells
ALTER TABLE order_items ADD COLUMN selected_upsells JSONB DEFAULT '[]';

-- ============================================================
-- SEED: Migrate product_types to design_templates
-- ============================================================

INSERT INTO design_templates (name, slug, category, sort_order)
SELECT name, slug, category, sort_order FROM product_types;
