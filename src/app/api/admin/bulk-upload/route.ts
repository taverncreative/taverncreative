import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import sharp from "sharp";

// Process a single design file: save to public/designs/{slug}/ and create/update collection
export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const formData = await request.formData();

  const file = formData.get("file") as File | null;
  const designName = formData.get("designName") as string;
  const fileType = formData.get("fileType") as string; // "text" or "notext"
  const productType = formData.get("productType") as string; // "save_the_dates", "invitations", etc.

  if (!file || !designName || !fileType || !productType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Generate slug from design name
  const slug = designName
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Create designs directory if needed
  const designDir = path.join(process.cwd(), "public", "designs", slug);
  if (!existsSync(designDir)) {
    await mkdir(designDir, { recursive: true });
  }

  // Read file buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Determine file names based on product type and whether it has text
  const productPrefix = productType === "save_the_dates" ? "" : `${productType.replace("_", "-")}-`;

  if (fileType === "notext") {
    // No text version = artwork/preview (used as artboard background)
    const previewName = productPrefix ? `${productPrefix.slice(0, -1)}-preview` : "preview";
    const artworkName = productPrefix ? `${productPrefix.slice(0, -1)}-artwork` : "artwork";

    // Save as WebP (optimized)
    await sharp(buffer).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(designDir, `${previewName}.webp`));
    await sharp(buffer).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(designDir, `${artworkName}.webp`));
  } else {
    // Text version = product image + thumbnail
    const productName = productPrefix ? `${productPrefix.slice(0, -1)}-product` : "product";
    const thumbName = productPrefix ? `${productPrefix.slice(0, -1)}-thumbnail` : "thumbnail";

    // Product image (full size)
    await sharp(buffer).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(designDir, `${productName}.webp`));
    // Thumbnail (smaller)
    await sharp(buffer).resize({ width: 400, withoutEnlargement: true }).webp({ quality: 75 }).toFile(path.join(designDir, `${thumbName}.webp`));
  }

  // Create or find the collection in the database
  const { data: existing } = await supabase
    .from("design_collections")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  let collectionId: string;

  if (existing) {
    collectionId = existing.id;
  } else {
    const { data: created, error } = await supabase
      .from("design_collections")
      .insert({
        name: designName,
        slug,
        description: `Personalise with your names, date and venue for a design that's uniquely yours. Printed on premium 300gsm card stock.`,
        is_published: true,
        sort_order: 999,
        hero_image_url: `/designs/${slug}/product.webp`,
        preview_images: [`/designs/${slug}/preview.webp`, `/designs/${slug}/thumbnail.webp`],
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

  return NextResponse.json({
    collectionId,
    slug,
    designName,
    isNew: !existing,
  });
}
