import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, design_collection:design_collections(*), product_type:product_types(*), personalisation_fields(*)"
    )
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  return NextResponse.json(data);
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
  if (body.base_price !== undefined) updates.base_price = body.base_price;
  if (body.mockup_images !== undefined)
    updates.mockup_images = body.mockup_images;
  if (body.is_published !== undefined)
    updates.is_published = body.is_published;
  if (body.design_collection_id !== undefined)
    updates.design_collection_id = body.design_collection_id;
  if (body.product_type_id !== undefined)
    updates.product_type_id = body.product_type_id;

  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select(
      "*, design_collection:design_collections(*), product_type:product_types(*)"
    )
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
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
