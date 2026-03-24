import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readdir } from "fs/promises";
import path from "path";

/**
 * GET /api/admin/collections/[id]/assets
 * Returns all design assets for a collection — both from Supabase storage and local filesystem.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Get collection slug
  const { data: collection } = await supabase
    .from("design_collections")
    .select("slug")
    .eq("id", id)
    .single();

  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  const assets: { url: string; name: string; source: string }[] = [];

  // 1. Check local filesystem
  const localDir = path.join(process.cwd(), "public/designs", collection.slug);
  try {
    const files = await readdir(localDir);
    for (const file of files) {
      if (/\.(png|jpg|jpeg|webp|svg)$/i.test(file)) {
        assets.push({
          url: `/designs/${collection.slug}/${file}`,
          name: file,
          source: "local",
        });
      }
    }
  } catch {
    // Directory doesn't exist — that's fine
  }

  // 2. Check Supabase storage
  const { data: storageFiles } = await supabase.storage
    .from("design-assets")
    .list(collection.slug);

  if (storageFiles) {
    for (const file of storageFiles) {
      if (/\.(png|jpg|jpeg|webp|svg)$/i.test(file.name)) {
        const { data: urlData } = supabase.storage
          .from("design-assets")
          .getPublicUrl(`${collection.slug}/${file.name}`);

        // Don't add duplicates (same name already from local)
        if (!assets.find((a) => a.name === file.name)) {
          assets.push({
            url: urlData.publicUrl,
            name: file.name,
            source: "supabase",
          });
        }
      }
    }
  }

  return NextResponse.json(assets);
}
