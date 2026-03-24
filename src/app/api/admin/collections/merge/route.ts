import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Merge multiple collections into one (the first selected becomes the target)
export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const { targetId, sourceIds } = await request.json() as { targetId: string; sourceIds: string[] };

  if (!targetId || !sourceIds?.length) {
    return NextResponse.json({ error: "Need targetId and sourceIds" }, { status: 400 });
  }

  // Move all collection_products from sources to target
  for (const sourceId of sourceIds) {
    if (sourceId === targetId) continue;

    // Update collection_products to point to target
    await supabase
      .from("collection_products")
      .update({ collection_id: targetId })
      .eq("collection_id", sourceId);

    // Update products to point to target collection
    await supabase
      .from("products")
      .update({ design_collection_id: targetId })
      .eq("design_collection_id", sourceId);

    // Delete the source collection
    await supabase
      .from("design_collections")
      .delete()
      .eq("id", sourceId);
  }

  return NextResponse.json({ success: true, merged: sourceIds.length });
}
