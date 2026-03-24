import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getStorageUrl(bucket: string, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const formData = await request.formData();

  const file = formData.get("file") as File | null;
  const designName = formData.get("designName") as string;
  const fileType = formData.get("fileType") as string; // "text" or "notext"
  const productType = formData.get("productType") as string;

  if (!file || !designName || !fileType || !productType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const slug = slugify(designName);
  const buffer = Buffer.from(await file.arrayBuffer());

  // Determine storage paths
  const isInvitation = productType === "invitations";
  const prefix = isInvitation ? "invitation-" : "";

  let storagePaths: { path: string; contentType: string }[] = [];

  if (fileType === "notext") {
    storagePaths = [
      { path: `${slug}/${prefix}preview.webp`, contentType: "image/webp" },
    ];
  } else {
    storagePaths = [
      { path: `${slug}/${prefix}product.webp`, contentType: "image/webp" },
    ];
  }

  // Upload to Supabase Storage
  for (const sp of storagePaths) {
    const { error } = await supabase.storage
      .from("design-assets")
      .upload(sp.path, buffer, {
        contentType: file.type || sp.contentType,
        upsert: true,
      });

    if (error) {
      console.error(`Upload error for ${sp.path}:`, error.message);
      // Continue — upsert should handle conflicts
    }
  }

  // Create or find the collection
  const { data: existing } = await supabase
    .from("design_collections")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  let collectionId: string;
  let isNew = false;

  if (existing) {
    collectionId = existing.id;

    // Update hero/preview images if we just uploaded new ones
    if (fileType === "text") {
      await supabase
        .from("design_collections")
        .update({
          hero_image_url: getStorageUrl("design-assets", `${slug}/${prefix}product.webp`),
          preview_images: [
            getStorageUrl("design-assets", `${slug}/${prefix}product.webp`),
          ],
        })
        .eq("id", collectionId);
    }
  } else {
    isNew = true;
    const { data: created, error } = await supabase
      .from("design_collections")
      .insert({
        name: designName,
        slug,
        description: `Personalise with your names, date and venue for a design that's uniquely yours. Printed on premium 300gsm card stock.`,
        is_published: true,
        sort_order: 999,
        hero_image_url: getStorageUrl("design-assets", `${slug}/${prefix}product.webp`),
        preview_images: [
          getStorageUrl("design-assets", `${slug}/${prefix}preview.webp`),
        ],
        style_tags: [],
        colour_tags: [],
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    collectionId = created!.id;
  }

  // Also upload to the collection's assets in storage (for admin asset bank)
  // Upload the no-text version as a collection asset
  if (fileType === "notext") {
    const assetPath = `collections/${collectionId}/${prefix}asset-${Date.now()}.webp`;
    await supabase.storage
      .from("design-assets")
      .upload(assetPath, buffer, {
        contentType: file.type || "image/webp",
        upsert: true,
      });
  }

  // Find or create template for this product type
  const categoryMap: Record<string, string> = {
    save_the_dates: "save_the_dates",
    invitations: "invitations",
    on_the_day: "on_the_day",
    thank_yous: "thank_yous",
  };
  const dbCategory = categoryMap[productType] || "save_the_dates";

  const { data: templates } = await supabase
    .from("design_templates")
    .select("id")
    .eq("category", dbCategory)
    .limit(1);

  if (templates?.length) {
    const templateId = templates[0].id;

    // Create collection_product if it doesn't exist
    const { data: existingCp } = await supabase
      .from("collection_products")
      .select("id")
      .eq("collection_id", collectionId)
      .eq("design_template_id", templateId)
      .single();

    if (!existingCp) {
      await supabase.from("collection_products").insert({
        collection_id: collectionId,
        design_template_id: templateId,
        status: "todo",
        is_live: false,
      });
    }
  }

  return NextResponse.json({
    collectionId,
    slug,
    designName,
    isNew,
    fileType,
  });
}
