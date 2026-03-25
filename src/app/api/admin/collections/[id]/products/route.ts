import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("collection_products")
    .select("*, design_template:design_templates(*, pricing_template:pricing_templates(name)), commit_log(*)")
    .eq("collection_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: collectionId } = await params;
  const supabase = createAdminClient();
  const body = await request.json();

  // Add a new template to this collection
  if (body.action === "add" && body.template_id) {
    const { data, error } = await supabase
      .from("collection_products")
      .insert({
        collection_id: collectionId,
        design_template_id: body.template_id,
        status: "todo",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  }

  // Update status
  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) updates.status = body.status;
  if (body.mockup_images !== undefined) updates.mockup_images = body.mockup_images;
  if (body.placed_assets !== undefined) updates.placed_assets = body.placed_assets;
  if (body.field_snapshot !== undefined) updates.field_snapshot = body.field_snapshot;
  if (body.metadata_snapshot !== undefined) updates.metadata_snapshot = body.metadata_snapshot;

  // Commit/uncommit — sync to the products table for the storefront
  if (body.is_live !== undefined) {
    updates.is_live = body.is_live;
    updates.committed_at = body.is_live ? new Date().toISOString() : null;

    // Log the commit action
    await supabase.from("commit_log").insert({
      collection_product_id: body.product_id,
      action: body.is_live ? "committed" : "uncommitted",
    });

    // Sync to storefront products table
    await syncProductToStorefront(supabase, collectionId, body.product_id, body.is_live);
  }

  if (Object.keys(updates).length > 0 && body.product_id) {
    const { data, error } = await supabase
      .from("collection_products")
      .update(updates)
      .eq("id", body.product_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  return NextResponse.json({ success: true });
}

/**
 * When committing: creates/updates a row in the `products` table so the storefront can display it.
 * When uncommitting: sets is_published = false to hide it.
 */
async function syncProductToStorefront(
  supabase: ReturnType<typeof createAdminClient>,
  collectionId: string,
  collectionProductId: string,
  isLive: boolean
) {
  // Get the collection_product with its design template and collection info
  const { data: cp } = await supabase
    .from("collection_products")
    .select("*, design_template:design_templates(*, design_template_fields(*)), collection:design_collections(*)")
    .eq("id", collectionProductId)
    .single();

  if (!cp || !cp.design_template || !cp.collection) return;

  const template = cp.design_template as Record<string, unknown>;
  const collection = cp.collection as Record<string, unknown>;
  const templateName = template.name as string;
  const collectionName = collection.name as string;
  const category = template.category as string;

  // Snapshot fields at commit time if not already snapshotted
  const templateFields = (template.design_template_fields || []) as Record<string, unknown>[];
  if (!cp.field_snapshot && templateFields.length > 0) {
    const snapshot = templateFields
      .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
      .map((f) => ({
        label: f.label,
        placeholder: f.placeholder || "",
        field_type: (f.options as Record<string, unknown>)?.field_type || f.field_type,
        is_required: f.is_required,
        sort_order: f.sort_order,
        font_size: f.font_size,
        text_align: f.text_align,
        y_mm: f.y_mm,
        options: f.options,
      }));
    const metaSnap = template.metadata || {};

    await supabase
      .from("collection_products")
      .update({ field_snapshot: snapshot, metadata_snapshot: metaSnap })
      .eq("id", collectionProductId);
  }

  // Find the matching product_type by category
  const { data: productTypes } = await supabase
    .from("product_types")
    .select("id, slug, name")
    .eq("category", category);

  if (!productTypes?.length) return;

  // Use the first product type for this category (e.g., "invitations" -> "Invitations")
  const productType = productTypes[0];
  const productTypeName = (productType as Record<string, unknown>).name as string || templateName;

  // Build a clean name: "Blue Roses Save the Dates" (not "Blue Roses Blue Floral Save the Dates")
  const slug = `${slugify(collectionName)}-${slugify(productTypeName)}`;
  const productName = `${collectionName} ${productTypeName}`;

  // Get base price from the pricing template if assigned
  let basePrice = 0;
  if (template.pricing_template_id) {
    const { data: tiers } = await supabase
      .from("pricing_tiers")
      .select("unit_price")
      .eq("pricing_template_id", template.pricing_template_id as string)
      .order("min_quantity", { ascending: true })
      .limit(1);

    if (tiers?.length) {
      basePrice = Number(tiers[0].unit_price);
    }
  }

  // Check if a products row already exists for this collection_product
  // We use a convention: store collection_product_id in description for linking
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (isLive) {
    const productData = {
      design_collection_id: collectionId,
      product_type_id: productType.id,
      name: productName,
      slug,
      description: `collection_product:${collectionProductId}`,
      base_price: basePrice,
      mockup_images: (() => {
        // Priority 1: Use admin-set thumbnail from metadata_snapshot
        const meta = cp.metadata_snapshot as Record<string, unknown> | null;
        if (meta?.thumbnail_url) {
          return [meta.thumbnail_url as string];
        }
        // Priority 2: Use existing mockup_images
        if ((cp.mockup_images as string[])?.length) {
          return cp.mockup_images as string[];
        }
        // Priority 3: Fall back to Supabase Storage collection URLs
        const baseUrl = `https://gelwujnrilhppwxnapvt.supabase.co/storage/v1/object/public/design-assets`;
        return [
          `${baseUrl}/${collection.slug as string}/product.webp`,
          `${baseUrl}/${collection.slug as string}/preview.webp`,
        ];
      })(),
      is_published: true,
    };

    let productId: string;

    if (existing) {
      // Update existing product
      await supabase
        .from("products")
        .update(productData)
        .eq("id", existing.id);
      productId = existing.id;
    } else {
      // Create new product
      const { data: newProduct } = await supabase
        .from("products")
        .insert(productData)
        .select("id")
        .single();

      if (!newProduct) return;
      productId = newProduct.id;
    }

    // Sync personalisation fields from design template
    // Delete existing fields first
    await supabase
      .from("personalisation_fields")
      .delete()
      .eq("product_id", productId);

    // Copy fields from design template
    const templateFields = (template.design_template_fields || []) as Record<string, unknown>[];
    if (templateFields.length > 0) {
      const fieldsToInsert = templateFields.map((f) => ({
        product_id: productId,
        field_type: f.field_type as string,
        label: f.label as string,
        placeholder: f.placeholder as string | null,
        is_required: f.is_required as boolean,
        sort_order: f.sort_order as number,
        options: f.options as Record<string, string>[] | null,
      }));

      await supabase
        .from("personalisation_fields")
        .insert(fieldsToInsert);
    }

    // Also make sure the collection is published
    await supabase
      .from("design_collections")
      .update({ is_published: true })
      .eq("id", collectionId);

  } else {
    // Uncommitting — hide from storefront
    if (existing) {
      await supabase
        .from("products")
        .update({ is_published: false })
        .eq("id", existing.id);
    }
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
