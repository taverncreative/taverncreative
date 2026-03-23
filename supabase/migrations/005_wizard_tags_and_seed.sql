-- Migration 005: Wizard Tags + Dummy Seed Data
-- Adds style_tags and colour_tags to design_collections for wizard matching
-- Seeds 6 dummy collections covering all style/colour combos

-- ============================================================
-- ADD TAGS TO COLLECTIONS
-- ============================================================

ALTER TABLE design_collections ADD COLUMN IF NOT EXISTS style_tags TEXT[] DEFAULT '{}';
ALTER TABLE design_collections ADD COLUMN IF NOT EXISTS colour_tags TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_collections_style_tags ON design_collections USING gin(style_tags);
CREATE INDEX IF NOT EXISTS idx_collections_colour_tags ON design_collections USING gin(colour_tags);

-- ============================================================
-- SEED: 6 Dummy Collections
-- ============================================================

-- 1. Wildflower Meadow (botanical, romantic — purples, pinks)
INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order)
VALUES (
  'Wildflower Meadow',
  'wildflower-meadow',
  'Loose, hand-gathered wildflower arrangements with a romantic countryside feel',
  ARRAY['botanical', 'romantic'],
  ARRAY['purples', 'pinks'],
  true, 1
) ON CONFLICT (slug) DO UPDATE SET style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags;

-- 2. Sage & Stone (minimal, modern — greens, neutrals)
INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order)
VALUES (
  'Sage & Stone',
  'sage-and-stone',
  'Clean lines with muted sage tones and organic textures',
  ARRAY['minimal', 'modern'],
  ARRAY['greens', 'neutrals'],
  true, 2
) ON CONFLICT (slug) DO UPDATE SET style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags;

-- 3. Classic Script (traditional — neutrals)
INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order)
VALUES (
  'Classic Script',
  'classic-script',
  'Timeless calligraphy on premium ivory card — elegance that never dates',
  ARRAY['traditional'],
  ARRAY['neutrals'],
  true, 3
) ON CONFLICT (slug) DO UPDATE SET style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags;

-- 4. Blush & Bloom (romantic, botanical — pinks, neutrals)
INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order)
VALUES (
  'Blush & Bloom',
  'blush-and-bloom',
  'Soft blush peonies with gold foil accents and romantic typography',
  ARRAY['romantic', 'botanical'],
  ARRAY['pinks', 'neutrals'],
  true, 4
) ON CONFLICT (slug) DO UPDATE SET style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags;

-- 5. Ink & Edge (modern, minimal — bold, neutrals)
INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order)
VALUES (
  'Ink & Edge',
  'ink-and-edge',
  'Bold monochrome with strong geometric shapes and modern sans-serif type',
  ARRAY['modern', 'minimal'],
  ARRAY['bold', 'neutrals'],
  true, 5
) ON CONFLICT (slug) DO UPDATE SET style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags;

-- 6. Enchanted Garden (botanical, traditional, romantic — greens, purples, pinks)
INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order)
VALUES (
  'Enchanted Garden',
  'enchanted-garden',
  'Lush garden roses with vintage-inspired frames and rich colour',
  ARRAY['botanical', 'traditional', 'romantic'],
  ARRAY['greens', 'purples', 'pinks'],
  true, 6
) ON CONFLICT (slug) DO UPDATE SET style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags;

-- ============================================================
-- SEED: Create collection_products for each collection × template
-- This assumes the 10 default design_templates exist from migration 002
-- ============================================================

-- Helper: for each seeded collection, add all templates as "complete" + "is_live"
-- We do this in a DO block so we can loop
DO $$
DECLARE
  coll RECORD;
  tmpl RECORD;
  cp_id UUID;
BEGIN
  FOR coll IN
    SELECT id, name, slug FROM design_collections
    WHERE slug IN ('wildflower-meadow', 'sage-and-stone', 'classic-script', 'blush-and-bloom', 'ink-and-edge', 'enchanted-garden')
  LOOP
    FOR tmpl IN
      SELECT id, name, slug, category FROM design_templates ORDER BY sort_order
    LOOP
      -- Insert collection_product if not exists
      INSERT INTO collection_products (collection_id, design_template_id, status, is_live, committed_at)
      VALUES (coll.id, tmpl.id, 'complete', true, now())
      ON CONFLICT (collection_id, design_template_id) DO UPDATE SET status = 'complete', is_live = true, committed_at = now()
      RETURNING id INTO cp_id;

      -- Sync to storefront products table
      -- Build slug and product name
      DECLARE
        p_slug TEXT;
        p_name TEXT;
        pt_id UUID;
        existing_id UUID;
        base NUMERIC(10,2) := 1.50; -- dummy base price
      BEGIN
        p_slug := coll.slug || '-' || tmpl.slug;
        p_name := coll.name || ' ' || tmpl.name;

        -- Get product_type_id
        SELECT pt.id INTO pt_id FROM product_types pt WHERE pt.category = tmpl.category LIMIT 1;

        -- Check existing
        SELECT p.id INTO existing_id FROM products p WHERE p.slug = p_slug;

        IF existing_id IS NOT NULL THEN
          UPDATE products SET
            name = p_name,
            is_published = true,
            base_price = base,
            design_collection_id = coll.id,
            product_type_id = pt_id,
            description = 'collection_product:' || cp_id
          WHERE id = existing_id;
        ELSE
          INSERT INTO products (design_collection_id, product_type_id, name, slug, description, base_price, is_published)
          VALUES (coll.id, pt_id, p_name, p_slug, 'collection_product:' || cp_id, base, true);
        END IF;
      END;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================
-- SEED: Add personalisation fields to all design templates (if missing)
-- Standard fields per category so the wizard has data to work with
-- ============================================================

-- Save the Dates: Names, Date, Venue
INSERT INTO design_template_fields (design_template_id, field_type, label, placeholder, is_required, sort_order, x_mm, y_mm, font_size, text_align)
SELECT dt.id, 'text', 'Names', 'Emily & James', true, 0, 0, 40, 24, 'Montserrat'
FROM design_templates dt WHERE dt.slug = 'save-the-dates'
AND NOT EXISTS (SELECT 1 FROM design_template_fields f WHERE f.design_template_id = dt.id AND f.label = 'Names');

INSERT INTO design_template_fields (design_template_id, field_type, label, placeholder, is_required, sort_order, x_mm, y_mm, font_size, text_align)
SELECT dt.id, 'date', 'Date', '25th July 2026', true, 1, 0, 56, 14, 'Montserrat'
FROM design_templates dt WHERE dt.slug = 'save-the-dates'
AND NOT EXISTS (SELECT 1 FROM design_template_fields f WHERE f.design_template_id = dt.id AND f.label = 'Date');

INSERT INTO design_template_fields (design_template_id, field_type, label, placeholder, is_required, sort_order, x_mm, y_mm, font_size, text_align)
SELECT dt.id, 'text', 'Venue', 'Solton Manor, Dover', true, 2, 0, 68, 12, 'Montserrat'
FROM design_templates dt WHERE dt.slug = 'save-the-dates'
AND NOT EXISTS (SELECT 1 FROM design_template_fields f WHERE f.design_template_id = dt.id AND f.label = 'Venue');

-- Invitations: Names, Date, Time, Venue, Details
INSERT INTO design_template_fields (design_template_id, field_type, label, placeholder, is_required, sort_order, x_mm, y_mm, font_size, text_align)
SELECT dt.id, 'text', 'Names', 'Emily & James', true, 0, 0, 30, 24, 'Montserrat'
FROM design_templates dt WHERE dt.slug = 'invitations'
AND NOT EXISTS (SELECT 1 FROM design_template_fields f WHERE f.design_template_id = dt.id AND f.label = 'Names');

INSERT INTO design_template_fields (design_template_id, field_type, label, placeholder, is_required, sort_order, x_mm, y_mm, font_size, text_align)
SELECT dt.id, 'text', 'Invite Line', 'request the pleasure of your company', true, 1, 0, 50, 11, 'Montserrat'
FROM design_templates dt WHERE dt.slug = 'invitations'
AND NOT EXISTS (SELECT 1 FROM design_template_fields f WHERE f.design_template_id = dt.id AND f.label = 'Invite Line');

INSERT INTO design_template_fields (design_template_id, field_type, label, placeholder, is_required, sort_order, x_mm, y_mm, font_size, text_align)
SELECT dt.id, 'date', 'Date', 'Saturday 25th July 2026', true, 2, 0, 65, 14, 'Montserrat'
FROM design_templates dt WHERE dt.slug = 'invitations'
AND NOT EXISTS (SELECT 1 FROM design_template_fields f WHERE f.design_template_id = dt.id AND f.label = 'Date');

INSERT INTO design_template_fields (design_template_id, field_type, label, placeholder, is_required, sort_order, x_mm, y_mm, font_size, text_align)
SELECT dt.id, 'time', 'Time', '2:00 PM', true, 3, 0, 78, 12, 'Montserrat'
FROM design_templates dt WHERE dt.slug = 'invitations'
AND NOT EXISTS (SELECT 1 FROM design_template_fields f WHERE f.design_template_id = dt.id AND f.label = 'Time');

INSERT INTO design_template_fields (design_template_id, field_type, label, placeholder, is_required, sort_order, x_mm, y_mm, font_size, text_align)
SELECT dt.id, 'text', 'Venue', 'Solton Manor, Dover', true, 4, 0, 90, 12, 'Montserrat'
FROM design_templates dt WHERE dt.slug = 'invitations'
AND NOT EXISTS (SELECT 1 FROM design_template_fields f WHERE f.design_template_id = dt.id AND f.label = 'Venue');

-- RSVP Cards: RSVP By Date, Dietary Requirements
INSERT INTO design_template_fields (design_template_id, field_type, label, placeholder, is_required, sort_order, x_mm, y_mm, font_size, text_align)
SELECT dt.id, 'text', 'RSVP Heading', 'Répondez s''il vous plaît', true, 0, 0, 25, 18, 'Montserrat'
FROM design_templates dt WHERE dt.slug = 'rsvp-cards'
AND NOT EXISTS (SELECT 1 FROM design_template_fields f WHERE f.design_template_id = dt.id AND f.label = 'RSVP Heading');

INSERT INTO design_template_fields (design_template_id, field_type, label, placeholder, is_required, sort_order, x_mm, y_mm, font_size, text_align)
SELECT dt.id, 'date', 'RSVP By', 'Please reply by 1st June 2026', true, 1, 0, 45, 11, 'Montserrat'
FROM design_templates dt WHERE dt.slug = 'rsvp-cards'
AND NOT EXISTS (SELECT 1 FROM design_template_fields f WHERE f.design_template_id = dt.id AND f.label = 'RSVP By');

-- Menus: Title, Starters, Mains, Desserts
INSERT INTO design_template_fields (design_template_id, field_type, label, placeholder, is_required, sort_order, x_mm, y_mm, font_size, text_align)
SELECT dt.id, 'text', 'Menu Title', 'Wedding Breakfast', true, 0, 0, 20, 20, 'Montserrat'
FROM design_templates dt WHERE dt.slug = 'menus'
AND NOT EXISTS (SELECT 1 FROM design_template_fields f WHERE f.design_template_id = dt.id AND f.label = 'Menu Title');

INSERT INTO design_template_fields (design_template_id, field_type, label, placeholder, is_required, sort_order, x_mm, y_mm, font_size, text_align)
SELECT dt.id, 'textarea', 'Starters', 'Soup of the Day / Prawn Cocktail', true, 1, 0, 45, 10, 'Montserrat'
FROM design_templates dt WHERE dt.slug = 'menus'
AND NOT EXISTS (SELECT 1 FROM design_template_fields f WHERE f.design_template_id = dt.id AND f.label = 'Starters');

INSERT INTO design_template_fields (design_template_id, field_type, label, placeholder, is_required, sort_order, x_mm, y_mm, font_size, text_align)
SELECT dt.id, 'textarea', 'Mains', 'Roast Beef / Pan-fried Salmon', true, 2, 0, 70, 10, 'Montserrat'
FROM design_templates dt WHERE dt.slug = 'menus'
AND NOT EXISTS (SELECT 1 FROM design_template_fields f WHERE f.design_template_id = dt.id AND f.label = 'Mains');

INSERT INTO design_template_fields (design_template_id, field_type, label, placeholder, is_required, sort_order, x_mm, y_mm, font_size, text_align)
SELECT dt.id, 'textarea', 'Desserts', 'Chocolate Fondant / Lemon Tart', true, 3, 0, 95, 10, 'Montserrat'
FROM design_templates dt WHERE dt.slug = 'menus'
AND NOT EXISTS (SELECT 1 FROM design_template_fields f WHERE f.design_template_id = dt.id AND f.label = 'Desserts');

-- Place Cards: Guest Name
INSERT INTO design_template_fields (design_template_id, field_type, label, placeholder, is_required, sort_order, x_mm, y_mm, font_size, text_align)
SELECT dt.id, 'text', 'Guest Name', 'Guest Name', true, 0, 0, 30, 16, 'Montserrat'
FROM design_templates dt WHERE dt.slug = 'place-cards'
AND NOT EXISTS (SELECT 1 FROM design_template_fields f WHERE f.design_template_id = dt.id AND f.label = 'Guest Name');

-- Thank You Cards: Names, Message
INSERT INTO design_template_fields (design_template_id, field_type, label, placeholder, is_required, sort_order, x_mm, y_mm, font_size, text_align)
SELECT dt.id, 'text', 'Thank You', 'Thank You', true, 0, 0, 30, 22, 'Montserrat'
FROM design_templates dt WHERE dt.slug = 'thank-you-cards'
AND NOT EXISTS (SELECT 1 FROM design_template_fields f WHERE f.design_template_id = dt.id AND f.label = 'Thank You');

INSERT INTO design_template_fields (design_template_id, field_type, label, placeholder, is_required, sort_order, x_mm, y_mm, font_size, text_align)
SELECT dt.id, 'text', 'Names', 'Emily & James', true, 1, 0, 50, 14, 'Montserrat'
FROM design_templates dt WHERE dt.slug = 'thank-you-cards'
AND NOT EXISTS (SELECT 1 FROM design_template_fields f WHERE f.design_template_id = dt.id AND f.label = 'Names');

INSERT INTO design_template_fields (design_template_id, field_type, label, placeholder, is_required, sort_order, x_mm, y_mm, font_size, text_align)
SELECT dt.id, 'textarea', 'Message', 'Thank you so much for sharing our special day and for your generous gift', false, 2, 0, 65, 10, 'Montserrat'
FROM design_templates dt WHERE dt.slug = 'thank-you-cards'
AND NOT EXISTS (SELECT 1 FROM design_template_fields f WHERE f.design_template_id = dt.id AND f.label = 'Message');
