import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ProductPage as ProductPageClient } from "./product-page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("name, design_collection:design_collections(name)")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!data) return { title: "Product Not Found" };
  return {
    title: `${data.name} | TavernCreative`,
    description: `Personalise your ${data.name} wedding stationery. Printed on premium 300gsm card stock with free UK delivery on orders over £50.`,
  };
}

export default async function ProductPageServer({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      "*, design_collection:design_collections(id, name, slug, style_tags, colour_tags)"
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!product) notFound();

  const collection = product.design_collection as {
    id: string; name: string; slug: string;
    style_tags: string[]; colour_tags: string[];
  };

  // Clean product name
  let displayName = product.name as string;
  if (displayName.startsWith(`${collection.name} ${collection.name}`)) {
    displayName = displayName.replace(`${collection.name} `, "");
  }

  // Get template data
  const cpRef = (product.description as string)?.startsWith("collection_product:")
    ? (product.description as string).replace("collection_product:", "")
    : null;

  let pricingTiers: { min_quantity: number; unit_price: number }[] = [];
  let templateFields: {
    label: string; placeholder: string; field_type: string;
    is_required: boolean; sort_order: number; font_size: number;
    text_align: string; y_mm: number;
    options: Record<string, unknown> | null;
  }[] = [];
  let templateMetadata: { highlight_colour?: string; customer_swatches?: string[] } = {};
  let templateWidth = 148;
  let templateHeight = 105;

  if (cpRef) {
    // First try to read field_snapshot from collection_product (independent copy)
    const { data: cpRow } = await supabase
      .from("collection_products")
      .select("field_snapshot, metadata_snapshot, design_template:design_templates(pricing_template_id, width_mm, height_mm, metadata, design_template_fields(*))")
      .eq("id", cpRef)
      .single();

    const snapshot = cpRow?.field_snapshot as typeof templateFields | null;
    const metaSnap = cpRow?.metadata_snapshot as typeof templateMetadata | null;

    const template = (cpRow?.design_template as unknown) as {
      pricing_template_id: string | null;
      width_mm: number | null;
      height_mm: number | null;
      metadata: Record<string, unknown> | null;
      design_template_fields: typeof templateFields;
    } | null;

    if (template?.width_mm) templateWidth = Number(template.width_mm);
    if (template?.height_mm) templateHeight = Number(template.height_mm);

    if (template?.pricing_template_id) {
      const { data: tiers } = await supabase
        .from("pricing_tiers")
        .select("min_quantity, unit_price")
        .eq("pricing_template_id", template.pricing_template_id)
        .order("min_quantity", { ascending: true });
      pricingTiers = (tiers || []).map((t) => ({
        min_quantity: Number(t.min_quantity),
        unit_price: Number(t.unit_price),
      }));
    }

    // Use snapshot if available, otherwise fall back to template fields
    if (snapshot && Array.isArray(snapshot) && snapshot.length > 0) {
      templateFields = snapshot;
    } else if (template?.design_template_fields) {
      templateFields = template.design_template_fields
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((f) => ({
          label: f.label,
          placeholder: f.placeholder || "",
          field_type: (f.options as Record<string, unknown>)?.field_type as string || f.field_type,
          is_required: f.is_required,
          sort_order: f.sort_order,
          font_size: f.font_size,
          text_align: f.text_align,
          y_mm: f.y_mm,
          options: f.options as Record<string, unknown> | null,
        }));
    }

    // Use metadata snapshot if available, otherwise fall back to template metadata
    if (metaSnap) {
      templateMetadata = metaSnap;
    } else if (template?.metadata) {
      templateMetadata = template.metadata as typeof templateMetadata;
    }
  }

  const styleTags = collection.style_tags || [];
  const styleDesc = styleTags.includes("botanical")
    ? "hand-painted botanical illustrations"
    : styleTags.includes("minimal") ? "clean, minimal design"
    : styleTags.includes("modern") ? "contemporary styling"
    : styleTags.includes("romantic") ? "flowing, romantic details"
    : styleTags.includes("traditional") ? "timeless, classic elegance"
    : "beautiful design";

  // Convert template fields to designer fields format
  const designerFields = templateFields.map((f) => {
    const opts = f.options || {};
    return {
      label: f.label,
      placeholder: f.placeholder,
      font_size: f.font_size,
      font_family: f.text_align || "Montserrat",
      y_mm: f.y_mm,
      field_type: f.field_type,
      is_required: f.is_required,
      sort_order: f.sort_order,
      is_uppercase: opts.is_uppercase as boolean | undefined,
      font_weight: opts.font_weight as number | undefined,
      is_highlight_colour: opts.is_highlight_colour as boolean | undefined,
      text_colour: opts.text_colour as string | undefined,
      scale_y: opts.scale_y as number | undefined,
      text_width_pct: opts.text_width_pct as number | undefined,
      allow_wrap: opts.allow_wrap as boolean | undefined,
      letter_spacing: opts.letter_spacing as number | undefined,
      text_stroke: opts.text_stroke as number | undefined,
      line_spacing: opts.line_spacing as number | undefined,
      names_connector: opts.names_connector as string | undefined,
      names_connector_size: opts.names_connector_size as number | undefined,
      names_connector_font: opts.names_connector_font as string | undefined,
      names_connector_colour: opts.names_connector_colour as string | undefined,
      names_line_spacing: opts.names_line_spacing as number | undefined,
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <nav className="text-xs text-muted-foreground mb-6 flex items-center gap-1.5">
        <Link href="/shop/save-the-dates" className="hover:text-foreground transition-colors">Save the Dates</Link>
        <span>/</span>
        <span className="text-foreground">{displayName}</span>
      </nav>

      <ProductPageClient
        productId={product.id as string}
        productName={displayName}
        productSlug={slug}
        collectionName={collection.name}
        collectionSlug={collection.slug}
        styleDesc={styleDesc}
        designerFields={designerFields}
        artWidthMm={templateWidth}
        artHeightMm={templateHeight}
        highlightColour={templateMetadata.highlight_colour || "#1a1a1a"}
        customerSwatches={templateMetadata.customer_swatches || []}
        pricingTiers={pricingTiers}
        basePrice={Number(product.base_price)}
      />
    </div>
  );
}
