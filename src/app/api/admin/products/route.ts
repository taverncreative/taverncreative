import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, design_collection:design_collections(*), product_type:product_types(*)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();

  const slug = body.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: body.name,
      slug,
      design_collection_id: body.design_collection_id,
      product_type_id: body.product_type_id,
      description: body.description || null,
      base_price: body.base_price || 0,
      mockup_images: body.mockup_images || [],
      is_published: body.is_published || false,
    })
    .select(
      "*, design_collection:design_collections(*), product_type:product_types(*)"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
