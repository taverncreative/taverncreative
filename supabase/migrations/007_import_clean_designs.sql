-- Migration 007: Import 49 clean Save the Date designs
-- Run AFTER migration 005 (style_tags/colour_tags columns)

-- First, remove old dummy/PDF-based collections that have been replaced

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Argyle Apple', 'argyle-apple', 'Announce your wedding with our Argyle Apple save the date cards, adorned with hand-painted botanical illustrations. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{botanical}', '{greens}',
  true, 200,
  '/designs/argyle-apple/product.png',
  ARRAY['/designs/argyle-apple/preview.png', '/designs/argyle-apple/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Autumn', 'autumn', 'Announce your wedding with our Autumn save the date cards, adorned with hand-painted botanical illustrations. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{botanical,traditional}', '{terracotta,burgundy}',
  true, 201,
  '/designs/autumn/product.png',
  ARRAY['/designs/autumn/preview.png', '/designs/autumn/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Beach', 'beach', 'Announce your wedding with our Beach save the date cards, with clean, contemporary styling. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{modern}', '{blues,neutrals}',
  true, 202,
  '/designs/beach/product.png',
  ARRAY['/designs/beach/preview.png', '/designs/beach/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Blue Details', 'blue-details', 'Announce your wedding with our Blue Details save the date cards, with an elegant, pared-back aesthetic. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{minimal}', '{blues}',
  true, 203,
  '/designs/blue-details/product.png',
  ARRAY['/designs/blue-details/preview.png', '/designs/blue-details/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Blue Roses', 'blue-roses', 'Announce your wedding with our Blue Roses save the date cards, adorned with hand-painted botanical illustrations. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{botanical,romantic}', '{blues,pinks}',
  true, 204,
  '/designs/blue-roses/product.png',
  ARRAY['/designs/blue-roses/preview.png', '/designs/blue-roses/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Blue', 'blue', 'Announce your wedding with our Blue save the date cards, with an elegant, pared-back aesthetic. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{minimal,modern}', '{blues}',
  true, 205,
  '/designs/blue/product.png',
  ARRAY['/designs/blue/preview.png', '/designs/blue/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Blush Floral', 'blush-floral', 'Announce your wedding with our Blush Floral save the date cards, adorned with hand-painted botanical illustrations. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{botanical,romantic}', '{pinks,neutrals}',
  true, 206,
  '/designs/blush-floral/product.png',
  ARRAY['/designs/blush-floral/preview.png', '/designs/blush-floral/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Bunting', 'bunting', 'Announce your wedding with our Bunting save the date cards, with timeless, classic design details. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{traditional}', '{pinks,blues}',
  true, 207,
  '/designs/bunting/product.png',
  ARRAY['/designs/bunting/preview.png', '/designs/bunting/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Burst', 'burst', 'Announce your wedding with our Burst save the date cards, with clean, contemporary styling. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{modern}', '{pinks,gold}',
  true, 208,
  '/designs/burst/product.png',
  ARRAY['/designs/burst/preview.png', '/designs/burst/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Calligraphy', 'calligraphy', 'Announce your wedding with our Calligraphy save the date cards, with timeless, classic design details. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{traditional,romantic}', '{neutrals}',
  true, 209,
  '/designs/calligraphy/product.png',
  ARRAY['/designs/calligraphy/preview.png', '/designs/calligraphy/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Confetti', 'confetti', 'Announce your wedding with our Confetti save the date cards, with clean, contemporary styling. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{modern}', '{pinks,gold}',
  true, 210,
  '/designs/confetti/product.png',
  ARRAY['/designs/confetti/preview.png', '/designs/confetti/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Destination', 'destination', 'Announce your wedding with our Destination save the date cards, with clean, contemporary styling. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{modern}', '{neutrals,blues}',
  true, 211,
  '/designs/destination/product.png',
  ARRAY['/designs/destination/preview.png', '/designs/destination/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Eucalyptus', 'eucalyptus', 'Announce your wedding with our Eucalyptus save the date cards, adorned with hand-painted botanical illustrations. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{botanical,minimal}', '{greens,neutrals}',
  true, 212,
  '/designs/eucalyptus/product.png',
  ARRAY['/designs/eucalyptus/preview.png', '/designs/eucalyptus/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Fiery', 'fiery', 'Announce your wedding with our Fiery save the date cards, with clean, contemporary styling. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{modern}', '{terracotta,burgundy}',
  true, 213,
  '/designs/fiery/product.png',
  ARRAY['/designs/fiery/preview.png', '/designs/fiery/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Flags Bunting', 'flags-bunting', 'Announce your wedding with our Flags Bunting save the date cards, with timeless, classic design details. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{traditional}', '{pinks,blues}',
  true, 214,
  '/designs/flags-bunting/product.png',
  ARRAY['/designs/flags-bunting/preview.png', '/designs/flags-bunting/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Green Leaves Watercolour', 'green-leaves-watercolour', 'Announce your wedding with our Green Leaves Watercolour save the date cards, adorned with hand-painted botanical illustrations. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{botanical}', '{greens}',
  true, 215,
  '/designs/green-leaves-watercolour/product.png',
  ARRAY['/designs/green-leaves-watercolour/preview.png', '/designs/green-leaves-watercolour/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Greenery Eucalyptu11s', 'greenery-eucalyptu11s', 'Announce your wedding with our Greenery Eucalyptu11s save the date cards, adorned with hand-painted botanical illustrations. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{botanical,minimal}', '{greens}',
  true, 216,
  '/designs/greenery-eucalyptu11s/product.png',
  ARRAY['/designs/greenery-eucalyptu11s/preview.png', '/designs/greenery-eucalyptu11s/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Greenery Eucalyptus', 'greenery-eucalyptus', 'Announce your wedding with our Greenery Eucalyptus save the date cards, adorned with hand-painted botanical illustrations. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{botanical,minimal}', '{greens}',
  true, 217,
  '/designs/greenery-eucalyptus/product.png',
  ARRAY['/designs/greenery-eucalyptus/preview.png', '/designs/greenery-eucalyptus/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Greenery', 'greenery', 'Announce your wedding with our Greenery save the date cards, adorned with hand-painted botanical illustrations. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{botanical}', '{greens}',
  true, 218,
  '/designs/greenery/product.png',
  ARRAY['/designs/greenery/preview.png', '/designs/greenery/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Gypsophila Save the Date', 'gypsophila-save-the-date', 'Announce your wedding with our Gypsophila Save the Date save the date cards, adorned with hand-painted botanical illustrations. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{botanical,romantic}', '{neutrals,greens}',
  true, 219,
  '/designs/gypsophila-save-the-date/product.png',
  ARRAY['/designs/gypsophila-save-the-date/preview.png', '/designs/gypsophila-save-the-date/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Heart Sky', 'heart-sky', 'Announce your wedding with our Heart Sky save the date cards, featuring flowing, romantic design elements. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{romantic}', '{blues,pinks}',
  true, 220,
  '/designs/heart-sky/product.png',
  ARRAY['/designs/heart-sky/preview.png', '/designs/heart-sky/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Kraft Bunting', 'kraft-bunting', 'Announce your wedding with our Kraft Bunting save the date cards, with timeless, classic design details. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{traditional}', '{neutrals}',
  true, 221,
  '/designs/kraft-bunting/product.png',
  ARRAY['/designs/kraft-bunting/preview.png', '/designs/kraft-bunting/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Kraft', 'kraft', 'Announce your wedding with our Kraft save the date cards, with an elegant, pared-back aesthetic. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{minimal,traditional}', '{neutrals}',
  true, 222,
  '/designs/kraft/product.png',
  ARRAY['/designs/kraft/preview.png', '/designs/kraft/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Lavender', 'lavender', 'Announce your wedding with our Lavender save the date cards, adorned with hand-painted botanical illustrations. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{botanical,romantic}', '{purples,greens}',
  true, 223,
  '/designs/lavender/product.png',
  ARRAY['/designs/lavender/preview.png', '/designs/lavender/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Modern', 'modern', 'Announce your wedding with our Modern save the date cards, with clean, contemporary styling. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{modern,minimal}', '{neutrals}',
  true, 224,
  '/designs/modern/product.png',
  ARRAY['/designs/modern/preview.png', '/designs/modern/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Mr & Mr', 'mr-mr', 'Announce your wedding with our Mr & Mr save the date cards, with clean, contemporary styling. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{modern}', '{neutrals}',
  true, 225,
  '/designs/mr-mr/product.png',
  ARRAY['/designs/mr-mr/preview.png', '/designs/mr-mr/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Mushroom', 'mushroom', 'Announce your wedding with our Mushroom save the date cards, adorned with hand-painted botanical illustrations. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{botanical}', '{neutrals,terracotta}',
  true, 226,
  '/designs/mushroom/product.png',
  ARRAY['/designs/mushroom/preview.png', '/designs/mushroom/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'October', 'october', 'Announce your wedding with our October save the date cards, adorned with hand-painted botanical illustrations. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{botanical,traditional}', '{burgundy,terracotta}',
  true, 227,
  '/designs/october/product.png',
  ARRAY['/designs/october/preview.png', '/designs/october/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Olive', 'olive', 'Announce your wedding with our Olive save the date cards, adorned with hand-painted botanical illustrations. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{botanical,minimal}', '{greens,neutrals}',
  true, 228,
  '/designs/olive/product.png',
  ARRAY['/designs/olive/preview.png', '/designs/olive/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Outline', 'outline', 'Announce your wedding with our Outline save the date cards, with an elegant, pared-back aesthetic. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{minimal,modern}', '{neutrals}',
  true, 229,
  '/designs/outline/product.png',
  ARRAY['/designs/outline/preview.png', '/designs/outline/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Outlines', 'outlines', 'Announce your wedding with our Outlines save the date cards, with an elegant, pared-back aesthetic. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{minimal,modern}', '{neutrals}',
  true, 230,
  '/designs/outlines/product.png',
  ARRAY['/designs/outlines/preview.png', '/designs/outlines/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Pink Details', 'pink-details', 'Announce your wedding with our Pink Details save the date cards, with an elegant, pared-back aesthetic. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{minimal,romantic}', '{pinks}',
  true, 231,
  '/designs/pink-details/product.png',
  ARRAY['/designs/pink-details/preview.png', '/designs/pink-details/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Pink Watercolour', 'pink-watercolour', 'Announce your wedding with our Pink Watercolour save the date cards, featuring flowing, romantic design elements. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{romantic,botanical}', '{pinks}',
  true, 232,
  '/designs/pink-watercolour/product.png',
  ARRAY['/designs/pink-watercolour/preview.png', '/designs/pink-watercolour/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Potpourri Save the Date', 'potpourri-save-the-date', 'Announce your wedding with our Potpourri Save the Date save the date cards, adorned with hand-painted botanical illustrations. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{botanical,romantic}', '{pinks,purples}',
  true, 233,
  '/designs/potpourri-save-the-date/product.png',
  ARRAY['/designs/potpourri-save-the-date/preview.png', '/designs/potpourri-save-the-date/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Rings', 'rings', 'Announce your wedding with our Rings save the date cards, with an elegant, pared-back aesthetic. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{minimal,modern}', '{gold,neutrals}',
  true, 234,
  '/designs/rings/product.png',
  ARRAY['/designs/rings/preview.png', '/designs/rings/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Rust', 'rust', 'Announce your wedding with our Rust save the date cards, with clean, contemporary styling. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{modern}', '{terracotta}',
  true, 235,
  '/designs/rust/product.png',
  ARRAY['/designs/rust/preview.png', '/designs/rust/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Rustic Floral', 'rustic-floral', 'Announce your wedding with our Rustic Floral save the date cards, adorned with hand-painted botanical illustrations. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{botanical,traditional}', '{pinks,greens}',
  true, 236,
  '/designs/rustic-floral/product.png',
  ARRAY['/designs/rustic-floral/preview.png', '/designs/rustic-floral/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'SPRING new', 'spring-new', 'Announce your wedding with our SPRING new save the date cards, adorned with hand-painted botanical illustrations. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{botanical,romantic}', '{pinks,greens}',
  true, 237,
  '/designs/spring-new/product.png',
  ARRAY['/designs/spring-new/preview.png', '/designs/spring-new/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Script', 'script', 'Announce your wedding with our Script save the date cards, with timeless, classic design details. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{traditional,romantic}', '{neutrals}',
  true, 238,
  '/designs/script/product.png',
  ARRAY['/designs/script/preview.png', '/designs/script/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Simple', 'simple', 'Announce your wedding with our Simple save the date cards, with an elegant, pared-back aesthetic. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{minimal}', '{neutrals}',
  true, 239,
  '/designs/simple/product.png',
  ARRAY['/designs/simple/preview.png', '/designs/simple/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Spring', 'spring', 'Announce your wedding with our Spring save the date cards, adorned with hand-painted botanical illustrations. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{botanical,romantic}', '{pinks,greens}',
  true, 240,
  '/designs/spring/product.png',
  ARRAY['/designs/spring/preview.png', '/designs/spring/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Succulents', 'succulents', 'Announce your wedding with our Succulents save the date cards, adorned with hand-painted botanical illustrations. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{botanical}', '{greens,pinks}',
  true, 241,
  '/designs/succulents/product.png',
  ARRAY['/designs/succulents/preview.png', '/designs/succulents/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Sunflowers', 'sunflowers', 'Announce your wedding with our Sunflowers save the date cards, adorned with hand-painted botanical illustrations. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{botanical,traditional}', '{gold,greens}',
  true, 242,
  '/designs/sunflowers/product.png',
  ARRAY['/designs/sunflowers/preview.png', '/designs/sunflowers/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Tis The Season Save the Date', 'tis-the-season-save-the-date', 'Announce your wedding with our Tis The Season Save the Date save the date cards, with timeless, classic design details. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{traditional}', '{greens,burgundy}',
  true, 243,
  '/designs/tis-the-season-save-the-date/product.png',
  ARRAY['/designs/tis-the-season-save-the-date/preview.png', '/designs/tis-the-season-save-the-date/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Whimsical Land', 'whimsical-land', 'Announce your wedding with our Whimsical Land save the date cards, featuring flowing, romantic design elements. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{romantic,botanical}', '{pinks,greens}',
  true, 244,
  '/designs/whimsical-land/product.png',
  ARRAY['/designs/whimsical-land/preview.png', '/designs/whimsical-land/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Whimsical', 'whimsical', 'Announce your wedding with our Whimsical save the date cards, featuring flowing, romantic design elements. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{romantic,botanical}', '{pinks,purples}',
  true, 245,
  '/designs/whimsical/product.png',
  ARRAY['/designs/whimsical/preview.png', '/designs/whimsical/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'White Roses', 'white-roses', 'Announce your wedding with our White Roses save the date cards, featuring flowing, romantic design elements. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{romantic,botanical}', '{neutrals,greens}',
  true, 246,
  '/designs/white-roses/product.png',
  ARRAY['/designs/white-roses/preview.png', '/designs/white-roses/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Wildflowers', 'wildflowers', 'Announce your wedding with our Wildflowers save the date cards, adorned with hand-painted botanical illustrations. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{botanical,romantic}', '{pinks,purples}',
  true, 247,
  '/designs/wildflowers/product.png',
  ARRAY['/designs/wildflowers/preview.png', '/designs/wildflowers/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;

INSERT INTO design_collections (name, slug, description, style_tags, colour_tags, is_published, sort_order, hero_image_url, preview_images)
VALUES (
  'Winter', 'winter', 'Announce your wedding with our Winter save the date cards, with timeless, classic design details. Personalise with your names, date and venue for a design that''s uniquely yours. Printed on premium 350gsm card stock.',
  '{traditional}', '{blues,neutrals}',
  true, 248,
  '/designs/winter/product.png',
  ARRAY['/designs/winter/preview.png', '/designs/winter/thumbnail.png']
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags, colour_tags = EXCLUDED.colour_tags,
  is_published = true, hero_image_url = EXCLUDED.hero_image_url,
  preview_images = EXCLUDED.preview_images;


-- Link each collection to save-the-dates template and create storefront products
DO $$
DECLARE
  coll RECORD;
  std_template_id UUID;
  pt_id UUID;
  cp_id UUID;
BEGIN
  SELECT id INTO std_template_id FROM design_templates WHERE slug = 'save-the-dates' LIMIT 1;
  SELECT id INTO pt_id FROM product_types WHERE slug = 'save-the-dates' LIMIT 1;

  FOR coll IN SELECT id, name, slug FROM design_collections WHERE slug IN ('argyle-apple', 'autumn', 'beach', 'blue-details', 'blue-roses', 'blue', 'blush-floral', 'bunting', 'burst', 'calligraphy', 'confetti', 'destination', 'eucalyptus', 'fiery', 'flags-bunting', 'green-leaves-watercolour', 'greenery-eucalyptu11s', 'greenery-eucalyptus', 'greenery', 'gypsophila-save-the-date', 'heart-sky', 'kraft-bunting', 'kraft', 'lavender', 'modern', 'mr-mr', 'mushroom', 'october', 'olive', 'outline', 'outlines', 'pink-details', 'pink-watercolour', 'potpourri-save-the-date', 'rings', 'rust', 'rustic-floral', 'spring-new', 'script', 'simple', 'spring', 'succulents', 'sunflowers', 'tis-the-season-save-the-date', 'whimsical-land', 'whimsical', 'white-roses', 'wildflowers', 'winter')
  LOOP
    INSERT INTO collection_products (collection_id, design_template_id, status, is_live, committed_at)
    VALUES (coll.id, std_template_id, 'complete', true, now())
    ON CONFLICT (collection_id, design_template_id) DO UPDATE SET status = 'complete', is_live = true, committed_at = now()
    RETURNING id INTO cp_id;

    INSERT INTO products (design_collection_id, product_type_id, name, slug, description, base_price, is_published, mockup_images)
    VALUES (coll.id, pt_id, coll.name || ' Save the Date', coll.slug || '-save-the-date',
      'collection_product:' || cp_id,
      1.50, true,
      ARRAY['/designs/' || coll.slug || '/product.png', '/designs/' || coll.slug || '/thumbnail.png'])
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name, is_published = true, mockup_images = EXCLUDED.mockup_images;
  END LOOP;
END $$;