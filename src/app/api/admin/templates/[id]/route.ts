import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("design_templates")
    .select("*, pricing_template:pricing_templates(id, name), design_template_fields(*)")
    .eq("id", id)
    .single();

  if (!error && data) {
    // Fetch cross-sells separately to avoid complex join issues
    const { data: crossSells } = await supabase
      .from("cross_sells")
      .select("*, cross_sell_template_id")
      .eq("design_template_id", id)
      .order("sort_order", { ascending: true });

    // Fetch the names of cross-sell templates
    if (crossSells?.length) {
      const csIds = crossSells.map((cs: { cross_sell_template_id: string }) => cs.cross_sell_template_id);
      const { data: csTemplates } = await supabase
        .from("design_templates")
        .select("id, name")
        .in("id", csIds);

      (data as Record<string, unknown>).cross_sells = crossSells.map((cs: { cross_sell_template_id: string }) => ({
        ...cs,
        cross_sell_template: csTemplates?.find((t: { id: string }) => t.id === cs.cross_sell_template_id) || null,
      }));
    } else {
      (data as Record<string, unknown>).cross_sells = [];
    }
  }

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
    updates.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  if (body.category !== undefined) updates.category = body.category;
  if (body.pricing_template_id !== undefined) updates.pricing_template_id = body.pricing_template_id;
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
  if (body.width_mm !== undefined) updates.width_mm = body.width_mm;
  if (body.height_mm !== undefined) updates.height_mm = body.height_mm;
  if (body.bleed_mm !== undefined) updates.bleed_mm = body.bleed_mm;
  if (body.is_double_sided !== undefined) updates.is_double_sided = body.is_double_sided;
  if (body.fold !== undefined) updates.fold = body.fold;
  if (body.metadata !== undefined) updates.metadata = body.metadata;

  const { data, error } = await supabase
    .from("design_templates")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update fields if provided (bulk replace)
  if (body.fields !== undefined) {
    await supabase.from("design_template_fields").delete().eq("design_template_id", id);
    if (body.fields.length > 0) {
      await supabase.from("design_template_fields").insert(
        body.fields.map((f: { field_type: string; label: string; placeholder?: string; is_required?: boolean; sort_order?: number; options?: unknown; x_mm?: number; y_mm?: number; width_mm?: number | null; font_size?: number; text_align?: string }, i: number) => ({
          design_template_id: id,
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
  }

  // Update cross-sells if provided
  if (body.cross_sell_ids !== undefined) {
    await supabase.from("cross_sells").delete().eq("design_template_id", id);
    if (body.cross_sell_ids.length > 0) {
      await supabase.from("cross_sells").insert(
        body.cross_sell_ids.map((csId: string, i: number) => ({
          design_template_id: id,
          cross_sell_template_id: csId,
          sort_order: i,
        }))
      );
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("design_templates").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
