#!/usr/bin/env python3
"""
Import clean (text-free) Save the Date designs.
- Copies artwork to public/designs/{slug}/
- Generates thumbnail (400px) and product image (800px) on grey mount with shadow
- Generates design-manifest-clean.json for database seeding
"""

from PIL import Image, ImageFilter, ImageDraw
import json, os, re
from pathlib import Path

SRC_DIR = Path(__file__).parent.parent / "Save The Date Designs Clean"
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "designs"
MANIFEST_PATH = Path(__file__).parent / "design-manifest-clean.json"

# Style/colour tagging
DESIGN_META = {
    "Argyle Apple": {"styles": ["botanical"], "colours": ["greens"]},
    "Autumn": {"styles": ["botanical", "traditional"], "colours": ["terracotta", "burgundy"]},
    "Beach": {"styles": ["modern"], "colours": ["blues", "neutrals"]},
    "Blue Details": {"styles": ["minimal"], "colours": ["blues"]},
    "Blue Roses": {"styles": ["botanical", "romantic"], "colours": ["blues", "pinks"]},
    "Blue": {"styles": ["minimal", "modern"], "colours": ["blues"]},
    "Blush Floral": {"styles": ["botanical", "romantic"], "colours": ["pinks", "neutrals"]},
    "Bunting": {"styles": ["traditional"], "colours": ["pinks", "blues"]},
    "Burst": {"styles": ["modern"], "colours": ["pinks", "gold"]},
    "Calligraphy": {"styles": ["traditional", "romantic"], "colours": ["neutrals"]},
    "Confetti": {"styles": ["modern"], "colours": ["pinks", "gold"]},
    "Destination": {"styles": ["modern"], "colours": ["neutrals", "blues"]},
    "Eucalyptus": {"styles": ["botanical", "minimal"], "colours": ["greens", "neutrals"]},
    "Fiery": {"styles": ["modern"], "colours": ["terracotta", "burgundy"]},
    "Flags Bunting": {"styles": ["traditional"], "colours": ["pinks", "blues"]},
    "Green Leaves Watercolour": {"styles": ["botanical"], "colours": ["greens"]},
    "Greenery Eucalyptu11s": {"styles": ["botanical", "minimal"], "colours": ["greens"]},
    "Greenery Eucalyptus": {"styles": ["botanical", "minimal"], "colours": ["greens"]},
    "Greenery": {"styles": ["botanical"], "colours": ["greens"]},
    "Gypsophila Save the Date": {"styles": ["botanical", "romantic"], "colours": ["neutrals", "greens"]},
    "Heart Sky": {"styles": ["romantic"], "colours": ["blues", "pinks"]},
    "Kraft": {"styles": ["minimal", "traditional"], "colours": ["neutrals"]},
    "Kraft Bunting": {"styles": ["traditional"], "colours": ["neutrals"]},
    "Lavender": {"styles": ["botanical", "romantic"], "colours": ["purples", "greens"]},
    "Modern": {"styles": ["modern", "minimal"], "colours": ["neutrals"]},
    "Mr & Mr": {"styles": ["modern"], "colours": ["neutrals"]},
    "Mushroom": {"styles": ["botanical"], "colours": ["neutrals", "terracotta"]},
    "October": {"styles": ["botanical", "traditional"], "colours": ["burgundy", "terracotta"]},
    "Olive": {"styles": ["botanical", "minimal"], "colours": ["greens", "neutrals"]},
    "Outline": {"styles": ["minimal", "modern"], "colours": ["neutrals"]},
    "Outlines": {"styles": ["minimal", "modern"], "colours": ["neutrals"]},
    "Pink Details": {"styles": ["minimal", "romantic"], "colours": ["pinks"]},
    "Pink Watercolour": {"styles": ["romantic", "botanical"], "colours": ["pinks"]},
    "Potpourri Save the Date": {"styles": ["botanical", "romantic"], "colours": ["pinks", "purples"]},
    "Rings": {"styles": ["minimal", "modern"], "colours": ["gold", "neutrals"]},
    "Rust": {"styles": ["modern"], "colours": ["terracotta"]},
    "Rustic Floral": {"styles": ["botanical", "traditional"], "colours": ["pinks", "greens"]},
    "Script": {"styles": ["traditional", "romantic"], "colours": ["neutrals"]},
    "Simple": {"styles": ["minimal"], "colours": ["neutrals"]},
    "Spring": {"styles": ["botanical", "romantic"], "colours": ["pinks", "greens"]},
    "SPRING new": {"styles": ["botanical", "romantic"], "colours": ["pinks", "greens"]},
    "Succulents": {"styles": ["botanical"], "colours": ["greens", "pinks"]},
    "Sunflowers": {"styles": ["botanical", "traditional"], "colours": ["gold", "greens"]},
    "Tis The Season Save the Date": {"styles": ["traditional"], "colours": ["greens", "burgundy"]},
    "Whimsical Land": {"styles": ["romantic", "botanical"], "colours": ["pinks", "greens"]},
    "Whimsical": {"styles": ["romantic", "botanical"], "colours": ["pinks", "purples"]},
    "White Roses": {"styles": ["romantic", "botanical"], "colours": ["neutrals", "greens"]},
    "Wildflowers": {"styles": ["botanical", "romantic"], "colours": ["pinks", "purples"]},
    "Winter": {"styles": ["traditional"], "colours": ["blues", "neutrals"]},
}

def slugify(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

def create_mounted_mockup(artwork_img, target_width, bg_colour=(245, 245, 245)):
    art_w, art_h = artwork_img.size
    aspect = art_h / art_w
    # Padding around the card (percentage of target width)
    padding = int(target_width * 0.1)
    # Card fits within target_width minus padding on both sides
    card_w = target_width - (padding * 2)
    card_h = int(card_w * aspect)
    canvas_w = target_width
    canvas_h = card_h + (padding * 2)
    canvas = Image.new("RGB", (canvas_w, canvas_h), bg_colour)

    shadow_offset = int(target_width * 0.015)
    shadow = Image.new("RGBA", (card_w + shadow_offset * 4, card_h + shadow_offset * 4), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rectangle(
        [shadow_offset * 2, shadow_offset * 2, card_w + shadow_offset * 2, card_h + shadow_offset * 2],
        fill=(0, 0, 0, 40)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=shadow_offset * 2))

    card_x = (canvas_w - card_w) // 2
    card_y = (canvas_h - card_h) // 2

    shadow_rgb = shadow.convert("RGB")
    canvas.paste(shadow_rgb, (card_x - shadow_offset, card_y - shadow_offset), shadow.split()[3])

    resized = artwork_img.resize((card_w, card_h), Image.LANCZOS)
    canvas.paste(resized, (card_x, card_y))
    return canvas

def generate_seo(name, styles, colours):
    style_text = " and ".join(styles) if styles else "elegant"
    colour_text = ", ".join(colours) if colours else "neutral"
    alt_text = f"{name} save the date card featuring {style_text} design in {colour_text} tones"
    product_name = f"{name} Save the Date"

    descs = {
        "botanical": "adorned with hand-painted botanical illustrations",
        "romantic": "featuring flowing, romantic design elements",
        "modern": "with clean, contemporary styling",
        "minimal": "with an elegant, pared-back aesthetic",
        "traditional": "with timeless, classic design details",
    }
    style_desc = descs.get(styles[0], "with beautiful design details") if styles else ""
    product_description = (
        f"Announce your wedding with our {name} save the date cards, "
        f"{style_desc}. "
        f"Personalise with your names, date and venue for a design that's uniquely yours. "
        f"Printed on premium 300gsm card stock."
    )
    meta_title = f"{name} Save the Date Cards | TavernCreative"
    meta_description = f"Shop {name} save the date cards from TavernCreative. Personalise online in seconds. Premium quality, fast UK delivery."[:160]

    return {
        "alt_text": alt_text,
        "product_name": product_name,
        "product_description": product_description,
        "meta_title": meta_title,
        "meta_description": meta_description,
    }

def process_design(filepath):
    stem = filepath.stem.replace("-01", "")
    name = stem
    slug = slugify(name)
    meta = DESIGN_META.get(name, {"styles": ["botanical"], "colours": ["neutrals"]})

    img = Image.open(str(filepath)).convert("RGB")
    w, h = img.size
    is_landscape = w > h

    # Card dimensions in mm (A6 with 3mm bleed)
    if is_landscape:
        width_mm, height_mm = 171.0, 128.0
    else:
        width_mm, height_mm = 128.0, 171.0

    out_dir = OUTPUT_DIR / slug
    out_dir.mkdir(parents=True, exist_ok=True)

    # Save artwork
    img.save(out_dir / "artwork.png", quality=90, optimize=True)
    # Preview = same as artwork for clean designs
    img.save(out_dir / "preview.png", quality=90, optimize=True)
    # Thumbnails
    create_mounted_mockup(img, 400).save(out_dir / "thumbnail.png", quality=85, optimize=True)
    create_mounted_mockup(img, 800).save(out_dir / "product.png", quality=90, optimize=True)

    seo = generate_seo(name, meta["styles"], meta["colours"])

    return {
        "name": name,
        "slug": slug,
        "style_tags": meta["styles"],
        "colour_tags": meta["colours"],
        "width_mm": width_mm,
        "height_mm": height_mm,
        "is_landscape": is_landscape,
        "files": {
            "artwork": f"/designs/{slug}/artwork.png",
            "preview": f"/designs/{slug}/preview.png",
            "thumbnail": f"/designs/{slug}/thumbnail.png",
            "product": f"/designs/{slug}/product.png",
        },
        **seo,
    }

def main():
    print("TavernCreative — Clean Design Import")
    print("=" * 50)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    pngs = sorted(SRC_DIR.glob("*.png"))
    print(f"Found {len(pngs)} designs\n")

    manifest = []
    for png in pngs:
        try:
            result = process_design(png)
            manifest.append(result)
            orientation = "L" if result["is_landscape"] else "P"
            print(f"  ✓ {result['name']} [{orientation}] — {result['slug']}")
        except Exception as e:
            print(f"  ✗ {png.stem}: {e}")

    with open(MANIFEST_PATH, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"\n{'=' * 50}")
    print(f"Processed: {len(manifest)}/{len(pngs)}")
    print(f"Manifest: {MANIFEST_PATH}")

    landscape = sum(1 for d in manifest if d["is_landscape"])
    portrait = len(manifest) - landscape
    print(f"Landscape: {landscape}, Portrait: {portrait}")

if __name__ == "__main__":
    main()
