import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readdir } from "fs/promises";
import { join } from "path";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("design_collections")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  // Also scan public/designs/{slug}/ for local asset files
  const slug = data.slug as string;
  let localAssets: string[] = [];
  try {
    const designDir = join(process.cwd(), "public", "designs", slug);
    const files = await readdir(designDir);
    localAssets = files
      .filter((f: string) => /\.(png|jpg|jpeg|svg|webp)$/i.test(f))
      .map((f: string) => `/designs/${slug}/${f}`);
  } catch {
    // Directory doesn't exist — no local assets
  }

  return NextResponse.json({ ...data, local_assets: localAssets });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) {
    updates.name = body.name;
    updates.slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  if (body.description !== undefined) updates.description = body.description;
  if (body.hero_image_url !== undefined)
    updates.hero_image_url = body.hero_image_url;
  if (body.preview_images !== undefined)
    updates.preview_images = body.preview_images;
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
  if (body.is_published !== undefined)
    updates.is_published = body.is_published;

  const { data, error } = await supabase
    .from("design_collections")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("design_collections")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
