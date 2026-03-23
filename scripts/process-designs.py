#!/usr/bin/env python3
"""
Process Save the Date PDFs into web-ready assets.
Extracts artwork, strips text, generates thumbnails/mockups,
extracts text positions, auto-tags, and generates SEO content.
"""

import fitz  # PyMuPDF
from PIL import Image, ImageFilter, ImageDraw, ImageFont
import json, os, re, colorsys
from collections import Counter
from pathlib import Path

DESIGNS_DIR = Path(__file__).parent.parent / "Save The Date Designs"
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "designs"
MANIFEST_PATH = Path(__file__).parent / "design-manifest.json"

# Style/colour mapping for each design
DESIGN_META = {
    "Autumn": {"styles": ["botanical", "traditional"], "colours": ["terracotta", "burgundy"]},
    "Blue Roses": {"styles": ["botanical", "romantic"], "colours": ["blues", "pinks"]},
    "Blush Floral": {"styles": ["botanical", "romantic"], "colours": ["pinks", "neutrals"]},
    "Blush Floral 2": {"styles": ["botanical", "romantic"], "colours": ["pinks", "neutrals"]},
    "Bouquet": {"styles": ["botanical", "traditional"], "colours": ["pinks", "greens"]},
    "Calligraphy": {"styles": ["traditional", "romantic"], "colours": ["neutrals"]},
    "Confetti": {"styles": ["modern"], "colours": ["pinks", "gold"]},
    "Delicate": {"styles": ["minimal", "romantic"], "colours": ["neutrals", "pinks"]},
    "Destination": {"styles": ["modern"], "colours": ["neutrals", "blues"]},
    "Eucalyptus": {"styles": ["botanical", "minimal"], "colours": ["greens", "neutrals"]},
    "Fiery": {"styles": ["modern"], "colours": ["terracotta", "burgundy"]},
    "Green Leaves Watercolour": {"styles": ["botanical"], "colours": ["greens"]},
    "Gypsophila Save the Date": {"styles": ["botanical", "romantic"], "colours": ["neutrals", "greens"]},
    "Kraft": {"styles": ["minimal", "traditional"], "colours": ["neutrals"]},
    "Lavender": {"styles": ["botanical", "romantic"], "colours": ["purples", "greens"]},
    "Movie": {"styles": ["modern"], "colours": ["neutrals"]},
    "Mr & Mr": {"styles": ["modern"], "colours": ["neutrals"]},
    "Mushroom": {"styles": ["botanical"], "colours": ["neutrals", "terracotta"]},
    "October": {"styles": ["botanical", "traditional"], "colours": ["burgundy", "terracotta"]},
    "Old Sunflowers": {"styles": ["botanical", "traditional"], "colours": ["gold", "greens"]},
    "Olive": {"styles": ["botanical", "minimal"], "colours": ["greens", "neutrals"]},
    "Outlines": {"styles": ["minimal", "modern"], "colours": ["neutrals"]},
    "Rust": {"styles": ["modern"], "colours": ["terracotta"]},
    "Whimsical": {"styles": ["romantic", "botanical"], "colours": ["pinks", "purples"]},
}

def slugify(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

def get_dominant_colours(img, n=5):
    """Extract dominant colours from image for verification."""
    small = img.resize((50, 50))
    pixels = list(small.getdata())
    if small.mode == 'RGBA':
        pixels = [(r, g, b) for r, g, b, a in pixels if a > 128]
    elif small.mode == 'RGB':
        pass
    else:
        return []
    counter = Counter(pixels)
    return counter.most_common(n)

def extract_text_info(page):
    """Extract text blocks with positions from a PDF page."""
    blocks = page.get_text("dict")["blocks"]
    text_items = []
    for block in blocks:
        if "lines" not in block:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                text = span["text"].strip()
                if not text:
                    continue
                bbox = span["bbox"]  # (x0, y0, x1, y1) in points
                text_items.append({
                    "text": text,
                    "bbox": bbox,
                    "font": span["font"],
                    "size": span["size"],
                    "color": span["color"],
                })
    return text_items

def classify_text_field(text, all_texts):
    """Classify a text element into a field type."""
    t = text.lower().strip()
    if "save the date" in t or "save our date" in t:
        return "heading", "Save the Date"
    if any(m in t for m in ["january", "february", "march", "april", "may", "june",
                            "july", "august", "september", "october", "november", "december"]):
        return "date", "Date"
    if re.match(r'\d{1,2}[./]\d{1,2}[./]\d{2,4}', t):
        return "date", "Date"
    if "&" in t and len(t) < 40:
        return "names", "Names"
    if any(w in t for w in ["church", "hall", "hotel", "manor", "barn", "garden", "castle", "venue", "house"]):
        return "venue", "Venue"
    if len(t) < 30 and not any(c.isdigit() for c in t):
        return "names", "Names"
    return "details", "Details"

def points_to_mm(points):
    """Convert PDF points to mm."""
    return points * 25.4 / 72.0

def strip_text_from_image(img, text_items, page_rect):
    """Remove text regions from image by inpainting with surrounding colours."""
    draw = ImageDraw.Draw(img)
    w, h = img.size
    page_w = page_rect.width
    page_h = page_rect.height

    for item in text_items:
        x0, y0, x1, y1 = item["bbox"]
        # Convert PDF coords to pixel coords
        px0 = int(x0 / page_w * w)
        py0 = int(y0 / page_h * h)
        px1 = int(x1 / page_w * w)
        py1 = int(y1 / page_h * h)

        # Expand region slightly
        margin = 8
        px0 = max(0, px0 - margin)
        py0 = max(0, py0 - margin)
        px1 = min(w, px1 + margin)
        py1 = min(h, py1 + margin)

        # Sample surrounding colour (above the text region)
        sample_y = max(0, py0 - 20)
        sample_region = img.crop((px0, sample_y, px1, min(sample_y + 10, py0)))
        if sample_region.size[0] > 0 and sample_region.size[1] > 0:
            pixels = list(sample_region.getdata())
            if pixels:
                avg = tuple(sum(c) // len(pixels) for c in zip(*pixels))
                fill_colour = avg[:3] if len(avg) >= 3 else (255, 255, 255)
            else:
                fill_colour = (255, 255, 255)
        else:
            fill_colour = (255, 255, 255)

        draw.rectangle([px0, py0, px1, py1], fill=fill_colour)

    # Gentle blur over text regions to smooth edges
    return img

def create_mounted_mockup(artwork_img, target_width, bg_colour=(245, 245, 245)):
    """Create a card-on-mount mockup with drop shadow."""
    art_w, art_h = artwork_img.size
    aspect = art_h / art_w
    card_w = int(target_width * 0.75)
    card_h = int(card_w * aspect)

    canvas_w = target_width
    canvas_h = int(card_h + target_width * 0.25)

    canvas = Image.new("RGB", (canvas_w, canvas_h), bg_colour)

    # Shadow
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

    canvas.paste(
        Image.new("RGB", (shadow.width, shadow.height), bg_colour),
        (card_x - shadow_offset * 2, card_y - shadow_offset * 2)
    )
    # Composite shadow
    shadow_rgb = shadow.convert("RGB")
    canvas.paste(shadow_rgb, (card_x - shadow_offset, card_y - shadow_offset), shadow.split()[3])

    # Paste artwork
    resized = artwork_img.resize((card_w, card_h), Image.LANCZOS)
    canvas.paste(resized, (card_x, card_y))

    return canvas

def generate_seo(name, styles, colours):
    """Generate SEO content for a design."""
    style_text = " and ".join(styles) if styles else "elegant"
    colour_text = ", ".join(colours) if colours else "neutral"

    alt_text = f"{name} save the date card featuring {style_text} design elements in {colour_text} tones"

    product_name = f"{name} Save the Date"

    descriptions = {
        "botanical": "adorned with hand-painted botanical illustrations",
        "romantic": "featuring flowing, romantic design elements",
        "modern": "with clean, contemporary styling",
        "minimal": "with an elegant, pared-back aesthetic",
        "traditional": "with timeless, classic design details",
    }
    style_desc = descriptions.get(styles[0], "with beautiful design details") if styles else ""
    product_description = (
        f"Announce your wedding with our stunning {name} save the date cards, "
        f"{style_desc}. "
        f"Personalise with your names, date and venue for a design that's uniquely yours. "
        f"Printed on premium 350gsm card stock with a luxurious finish."
    )

    meta_title = f"{name} Save the Date Cards | TavernCreative"
    meta_description = (
        f"Shop {name} save the date cards from TavernCreative. "
        f"Personalise online in seconds. Premium quality, fast UK delivery."
    )[:160]

    structured_data = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product_name,
        "description": product_description,
        "image": f"/designs/{slugify(name)}/product.png",
        "brand": {"@type": "Brand", "name": "TavernCreative"},
        "offers": {
            "@type": "Offer",
            "priceCurrency": "GBP",
            "price": "1.50",
            "availability": "https://schema.org/InStock",
            "url": f"/products/{slugify(name)}-save-the-date",
        },
    }

    return {
        "alt_text": alt_text,
        "product_name": product_name,
        "product_description": product_description,
        "meta_title": meta_title,
        "meta_description": meta_description,
        "structured_data": structured_data,
    }


def process_pdf(pdf_path):
    """Process a single PDF file."""
    name = pdf_path.stem
    slug = slugify(name)
    meta = DESIGN_META.get(name, {"styles": ["botanical"], "colours": ["neutrals"]})

    print(f"  Processing: {name}")

    doc = fitz.open(str(pdf_path))
    page = doc[0]
    page_rect = page.rect

    # Get page dimensions in mm
    width_mm = round(points_to_mm(page_rect.width), 1)
    height_mm = round(points_to_mm(page_rect.height), 1)

    # Extract text with positions
    text_items = extract_text_info(page)

    # Classify text fields and get positions
    fields = []
    seen_types = set()
    for item in text_items:
        field_type, field_label = classify_text_field(item["text"], [t["text"] for t in text_items])
        if field_type in seen_types and field_type != "details":
            continue
        seen_types.add(field_type)

        # Convert y position to mm (relative to page)
        y_mm = round(points_to_mm(item["bbox"][1]), 1)
        font_size = round(item["size"], 1)

        fields.append({
            "type": field_type,
            "label": field_label,
            "original_text": item["text"],
            "y_mm": y_mm,
            "font_size": font_size,
            "font": item["font"],
        })

    # Sort fields by y position
    fields.sort(key=lambda f: f["y_mm"])

    # Render page as high-res PNG
    mat = fitz.Matrix(300 / 72, 300 / 72)  # 300 DPI
    pix = page.get_pixmap(matrix=mat, alpha=False)
    img_data = pix.tobytes("png")

    from io import BytesIO
    full_img = Image.open(BytesIO(img_data)).convert("RGB")

    # Create output directory
    out_dir = OUTPUT_DIR / slug
    out_dir.mkdir(parents=True, exist_ok=True)

    # Save full preview (with text — for reference)
    full_img.save(out_dir / "preview.png", quality=90, optimize=True)

    # Strip text and save artwork
    artwork_img = full_img.copy()
    if text_items:
        artwork_img = strip_text_from_image(artwork_img, text_items, page_rect)
    artwork_img.save(out_dir / "artwork.png", quality=90, optimize=True)

    # Generate mounted mockups
    thumbnail = create_mounted_mockup(full_img, 400)
    thumbnail.save(out_dir / "thumbnail.png", quality=85, optimize=True)

    product_img = create_mounted_mockup(full_img, 800)
    product_img.save(out_dir / "product.png", quality=90, optimize=True)

    # Generate SEO content
    seo = generate_seo(name, meta["styles"], meta["colours"])

    doc.close()

    return {
        "name": name,
        "slug": slug,
        "style_tags": meta["styles"],
        "colour_tags": meta["colours"],
        "width_mm": width_mm,
        "height_mm": height_mm,
        "fields": fields,
        "files": {
            "artwork": f"/designs/{slug}/artwork.png",
            "preview": f"/designs/{slug}/preview.png",
            "thumbnail": f"/designs/{slug}/thumbnail.png",
            "product": f"/designs/{slug}/product.png",
        },
        **seo,
    }


def main():
    print("TavernCreative — PDF Design Processor")
    print("=" * 50)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    pdfs = sorted(DESIGNS_DIR.glob("*.pdf"))
    print(f"Found {len(pdfs)} PDFs\n")

    manifest = []
    for pdf in pdfs:
        try:
            result = process_pdf(pdf)
            manifest.append(result)
            print(f"    ✓ {result['product_name']} — {len(result['fields'])} fields, {result['width_mm']}×{result['height_mm']}mm")
        except Exception as e:
            print(f"    ✗ Error: {e}")

    # Write manifest
    with open(MANIFEST_PATH, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"\n{'=' * 50}")
    print(f"Processed: {len(manifest)}/{len(pdfs)} designs")
    print(f"Manifest: {MANIFEST_PATH}")
    print(f"Assets: {OUTPUT_DIR}")

    # Summary
    print(f"\nStyle distribution:")
    style_counts = Counter()
    for d in manifest:
        for s in d["style_tags"]:
            style_counts[s] += 1
    for s, c in style_counts.most_common():
        print(f"  {s}: {c}")

    print(f"\nColour distribution:")
    colour_counts = Counter()
    for d in manifest:
        for c in d["colour_tags"]:
            colour_counts[c] += 1
    for c, count in colour_counts.most_common():
        print(f"  {c}: {count}")


if __name__ == "__main__":
    main()
