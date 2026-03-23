import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("personalisation_fields")
    .select("*")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("personalisation_fields")
    .insert({
      product_id: id,
      field_type: body.field_type || "text",
      label: body.label,
      placeholder: body.placeholder || null,
      is_required: body.is_required ?? true,
      sort_order: body.sort_order || 0,
      options: body.options || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Bulk update — replace all fields for this product
  const { id } = await params;
  const supabase = createAdminClient();
  const fields = await request.json();

  // Delete existing fields
  await supabase
    .from("personalisation_fields")
    .delete()
    .eq("product_id", id);

  if (fields.length === 0) {
    return NextResponse.json([]);
  }

  // Insert new fields
  const { data, error } = await supabase
    .from("personalisation_fields")
    .insert(
      fields.map(
        (
          f: { field_type: string; label: string; placeholder?: string; is_required?: boolean; sort_order?: number; options?: unknown },
          i: number
        ) => ({
          product_id: id,
          field_type: f.field_type || "text",
          label: f.label,
          placeholder: f.placeholder || null,
          is_required: f.is_required ?? true,
          sort_order: f.sort_order ?? i,
          options: f.options || null,
        })
      )
    )
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
