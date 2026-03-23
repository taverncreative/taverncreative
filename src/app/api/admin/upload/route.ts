import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "design-assets";

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  // Ensure bucket exists (idempotent)
  await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ["image/png", "image/jpeg", "image/svg+xml", "image/webp"],
  });

  const formData = await request.formData();
  const collectionId = formData.get("collection_id") as string;
  const files = formData.getAll("files") as File[];

  if (!collectionId || files.length === 0) {
    return NextResponse.json({ error: "Missing collection_id or files" }, { status: 400 });
  }

  const uploaded: { name: string; url: string }[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop() || "png";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${collectionId}/${Date.now()}_${safeName}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) {
      errors.push(`${file.name}: ${error.message}`);
    } else {
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      uploaded.push({ name: file.name, url: urlData.publicUrl });
    }
  }

  // Store asset URLs in the collection's preview_images array
  if (uploaded.length > 0) {
    const { data: existing } = await supabase
      .from("design_collections")
      .select("preview_images")
      .eq("id", collectionId)
      .single();

    const currentImages = existing?.preview_images || [];
    const newImages = [...currentImages, ...uploaded.map((u) => u.url)];

    await supabase
      .from("design_collections")
      .update({ preview_images: newImages })
      .eq("id", collectionId);
  }

  return NextResponse.json({ uploaded, errors }, { status: uploaded.length > 0 ? 201 : 400 });
}
