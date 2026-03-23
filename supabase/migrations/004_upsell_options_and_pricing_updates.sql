-- Migration 004: Reusable upsell options + pricing template updates

-- Add weight and shipping override to pricing_templates
ALTER TABLE pricing_templates ADD COLUMN IF NOT EXISTS unit_weight_grams INTEGER DEFAULT 0;
ALTER TABLE pricing_templates ADD COLUMN IF NOT EXISTS shipping_override BOOLEAN DEFAULT false;
ALTER TABLE pricing_templates ADD COLUMN IF NOT EXISTS shipping_override_note TEXT;

-- Reusable upsell options (e.g., "Make it double sided", "Add wax seal")
CREATE TABLE IF NOT EXISTS upsell_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_per_unit NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Junction table: which upsell options are attached to which pricing templates
CREATE TABLE IF NOT EXISTS pricing_template_upsells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_template_id UUID NOT NULL REFERENCES pricing_templates(id) ON DELETE CASCADE,
  upsell_option_id UUID NOT NULL REFERENCES upsell_options(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  UNIQUE(pricing_template_id, upsell_option_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pricing_template_upsells_template ON pricing_template_upsells(pricing_template_id);
CREATE INDEX IF NOT EXISTS idx_pricing_template_upsells_upsell ON pricing_template_upsells(upsell_option_id);

-- RLS
ALTER TABLE upsell_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_template_upsells ENABLE ROW LEVEL SECURITY;

-- Public read access (needed for storefront)
CREATE POLICY "Upsell options are viewable by everyone"
  ON upsell_options FOR SELECT USING (true);

CREATE POLICY "Pricing template upsells are viewable by everyone"
  ON pricing_template_upsells FOR SELECT USING (true);

-- Updated_at trigger for upsell_options
CREATE TRIGGER update_upsell_options_updated_at
  BEFORE UPDATE ON upsell_options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
