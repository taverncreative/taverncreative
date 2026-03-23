-- Migration 003: Template artboard properties (size, sides, folds)

CREATE TYPE fold_type AS ENUM ('none', 'half', 'tri', 'gate', 'z');

-- Add artboard properties to design_templates
ALTER TABLE design_templates ADD COLUMN width_mm NUMERIC(6,1) DEFAULT 127; -- 5 inches
ALTER TABLE design_templates ADD COLUMN height_mm NUMERIC(6,1) DEFAULT 178; -- 7 inches
ALTER TABLE design_templates ADD COLUMN bleed_mm NUMERIC(4,1) DEFAULT 3;
ALTER TABLE design_templates ADD COLUMN is_double_sided BOOLEAN DEFAULT false;
ALTER TABLE design_templates ADD COLUMN fold fold_type DEFAULT 'none';

-- Drop description column (not needed)
ALTER TABLE design_templates DROP COLUMN IF EXISTS description;

-- Add position data to personalisation fields on the template
ALTER TABLE design_template_fields ADD COLUMN x_mm NUMERIC(6,1) DEFAULT 0;
ALTER TABLE design_template_fields ADD COLUMN y_mm NUMERIC(6,1) DEFAULT 0;
ALTER TABLE design_template_fields ADD COLUMN width_mm NUMERIC(6,1);
ALTER TABLE design_template_fields ADD COLUMN font_size NUMERIC(4,1) DEFAULT 12;
ALTER TABLE design_template_fields ADD COLUMN text_align TEXT DEFAULT 'center';
