import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("design_templates")
    .select("*, pricing_template:pricing_templates(id, name), design_template_fields(*)")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();

  // Unique slug — timestamp suffix prevents overwrites
  const baseSlug = body.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const insertData: Record<string, unknown> = {
    name: body.name,
    slug,
    category: body.category,
    pricing_template_id: body.pricing_template_id || null,
    sort_order: body.sort_order || 0,
  };
  // Only include columns that exist (added by migration 003)
  if (body.width_mm !== undefined) insertData.width_mm = body.width_mm;
  if (body.height_mm !== undefined) insertData.height_mm = body.height_mm;
  if (body.bleed_mm !== undefined) insertData.bleed_mm = body.bleed_mm;
  if (body.is_double_sided !== undefined) insertData.is_double_sided = body.is_double_sided;
  if (body.fold !== undefined) insertData.fold = body.fold;
  if (body.metadata !== undefined) insertData.metadata = body.metadata;

  const { data, error } = await supabase
    .from("design_templates")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Save fields if provided
  if (body.fields?.length > 0) {
    await supabase.from("design_template_fields").insert(
      body.fields.map((f: { field_type: string; label: string; placeholder?: string; is_required?: boolean; sort_order?: number; options?: unknown; x_mm?: number; y_mm?: number; width_mm?: number | null; font_size?: number; text_align?: string }, i: number) => ({
        design_template_id: data.id,
        field_type: f.field_type || "text",
        label: f.label,
        placeholder: f.placeholder || null,
        is_required: f.is_required ?? true,
        sort_order: f.sort_order ?? i,
        options: f.options || null,
        x_mm: f.x_mm ?? 0,
        y_mm: f.y_mm ?? 0,
        width_mm: f.width_mm || null,
        font_size: f.font_size ?? 12,
        text_align: f.text_align || "center",
      }))
    );
  }

  return NextResponse.json(data, { status: 201 });
}
