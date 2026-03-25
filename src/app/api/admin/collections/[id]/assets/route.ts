import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/collections/[id]/assets
 * Returns all design assets for a collection from Supabase storage.
 * Groups assets by subfolder or filename prefix.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: collection } = await supabase
    .from("design_collections")
    .select("slug")
    .eq("id", id)
    .single();

  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  interface Asset {
    url: string;
    name: string;
    source: string;
    group: string;
  }

  const assets: Asset[] = [];
  const seenNames = new Set<string>();

  // Determine group from filename prefix
  function getGroup(filename: string): string {
    // Files like "invitation-product.webp" → "Invitations"
    // Files like "product.webp" → "Save the Dates" (default)
    // Files with "asset-" prefix from bulk upload → use the upload batch context
    if (/^invitation-/i.test(filename)) return "Single Card Invitations";
    if (/^save-the-date-|^std-/i.test(filename)) return "Save the Dates";
    if (/^rsvp-/i.test(filename)) return "RSVP Cards";
    if (/^menu-/i.test(filename)) return "Menus";
    if (/^place-card-/i.test(filename)) return "Place Cards";
    if (/^thank-/i.test(filename)) return "Thank You Cards";
    return "Design Assets";
  }

  // Check Supabase storage paths
  const storagePaths = [collection.slug, `collections/${id}`];

  for (const storagePath of storagePaths) {
    // List top-level files
    const { data: storageFiles } = await supabase.storage
      .from("design-assets")
      .list(storagePath);

    if (storageFiles) {
      for (const file of storageFiles) {
        // Check if it's a folder (has no file extension and metadata indicates folder)
        if (file.id === null && !file.name.includes(".")) {
          // It's a subfolder — list its contents
          const { data: subFiles } = await supabase.storage
            .from("design-assets")
            .list(`${storagePath}/${file.name}`);

          if (subFiles) {
            // Use folder name as group, cleaned up
            const groupName = file.name
              .replace(/-/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());

            for (const subFile of subFiles) {
              if (/\.(png|jpg|jpeg|webp|svg)$/i.test(subFile.name) && !seenNames.has(subFile.name)) {
                const { data: urlData } = supabase.storage
                  .from("design-assets")
                  .getPublicUrl(`${storagePath}/${file.name}/${subFile.name}`);

                seenNames.add(subFile.name);
                assets.push({
                  url: urlData.publicUrl,
                  name: subFile.name,
                  source: "supabase",
                  group: groupName,
                });
              }
            }
          }
        } else if (/\.(png|jpg|jpeg|webp|svg)$/i.test(file.name) && !seenNames.has(file.name)) {
          const { data: urlData } = supabase.storage
            .from("design-assets")
            .getPublicUrl(`${storagePath}/${file.name}`);

          seenNames.add(file.name);
          assets.push({
            url: urlData.publicUrl,
            name: file.name,
            source: "supabase",
            group: getGroup(file.name),
          });
        }
      }
    }
  }

  return NextResponse.json(assets);
}
