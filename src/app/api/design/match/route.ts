import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/design/match
 *
 * Takes wizard answers and returns the best matching collection + product
 * with all template fields populated with the customer's text.
 *
 * Body: {
 *   productType: "save_the_dates" | "invitations" | "on_the_day" | "thank_yous"
 *   style: string (e.g., "botanical", "minimal", "modern", "traditional", "romantic")
 *   colour: string (e.g., "purples", "greens", "pinks", "neutrals", "bold")
 *   personalisation: Record<string, string> (e.g., { Names: "Emily & James", Date: "25th July 2026" })
 *   excludeCollectionIds?: string[] (for "try something different")
 * }
 */
export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();

  const { productType, style, colour, personalisation, excludeCollectionIds } = body;

  // 1. Get all published collections with their tags
  const { data: collections, error: collError } = await supabase
    .from("design_collections")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (collError || !collections?.length) {
    return NextResponse.json({ error: "No collections available" }, { status: 404 });
  }

  // 2. Score each collection by tag overlap
  type ScoredCollection = typeof collections[0] & { score: number };
  let scored: ScoredCollection[] = collections
    .filter((c) => !excludeCollectionIds?.includes(c.id))
    .map((c) => {
      let score = 0;
      const styleTags: string[] = c.style_tags || [];
      const colourTags: string[] = c.colour_tags || [];

      // Style match
      if (style && styleTags.includes(style)) score += 3;
      // Colour match
      if (colour && colourTags.includes(colour)) score += 2;
      // Partial style matches (collection has multiple styles)
      if (style === "botanical" && styleTags.includes("romantic")) score += 1;
      if (style === "romantic" && styleTags.includes("botanical")) score += 1;
      if (style === "minimal" && styleTags.includes("modern")) score += 1;
      if (style === "modern" && styleTags.includes("minimal")) score += 1;
      // Undecided colour — prefer neutrals
      if (colour === "undecided" && colourTags.includes("neutrals")) score += 1;

      return { ...c, score };
    });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // If no good match, use the top one anyway
  if (scored.length === 0) {
    scored = collections.map((c) => ({ ...c, score: 0 }));
  }

  const bestCollection = scored[0];

  // 3. Find the collection_product for this collection + product type
  const { data: collectionProducts } = await supabase
    .from("collection_products")
    .select(`
      *,
      design_template:design_templates(
        *,
        design_template_fields(*),
        pricing_template:pricing_templates(
          *,
          pricing_tiers(*),
          pricing_upsells(*)
        )
      )
    `)
    .eq("collection_id", bestCollection.id)
    .eq("is_live", true);

  if (!collectionProducts?.length) {
    return NextResponse.json({ error: "No live products in this collection" }, { status: 404 });
  }

  // Find the one matching the requested product type
  const match = collectionProducts.find((cp) => {
    const template = cp.design_template as Record<string, unknown>;
    return template?.category === productType;
  });

  if (!match) {
    return NextResponse.json({ error: `No ${productType} product in this collection` }, { status: 404 });
  }

  const template = match.design_template as Record<string, unknown>;
  const fields = ((template.design_template_fields || []) as Record<string, unknown>[])
    .sort((a, b) => (a.sort_order as number) - (b.sort_order as number));

  // 4. Populate fields with customer personalisation data
  const populatedFields = fields.map((f) => {
    const label = f.label as string;
    const customerValue = personalisation?.[label] || "";
    return {
      ...f,
      customer_value: customerValue || (f.placeholder as string) || "",
    };
  });

  // 5. Get all alternatives for "try something different"
  const alternatives = scored
    .filter((c) => c.id !== bestCollection.id)
    .slice(0, 3)
    .map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      score: c.score,
    }));

  // 6. Get product slug for direct link / add-to-cart
  const productSlug = `${bestCollection.slug}-${(template.slug as string) || ""}`;
  const { data: storefrontProduct } = await supabase
    .from("products")
    .select("id, slug, base_price")
    .eq("slug", productSlug)
    .maybeSingle();

  return NextResponse.json({
    collection: {
      id: bestCollection.id,
      name: bestCollection.name,
      slug: bestCollection.slug,
      description: bestCollection.description,
      style_tags: bestCollection.style_tags,
      colour_tags: bestCollection.colour_tags,
    },
    template: {
      id: template.id,
      name: template.name,
      slug: template.slug,
      category: template.category,
      width_mm: template.width_mm,
      height_mm: template.height_mm,
      bleed_mm: template.bleed_mm,
      is_double_sided: template.is_double_sided,
      fold: template.fold,
    },
    fields: populatedFields,
    pricing: template.pricing_template || null,
    product: storefrontProduct || null,
    collectionProductId: match.id,
    mockupImages: match.mockup_images || [],
    alternatives,
  });
}
