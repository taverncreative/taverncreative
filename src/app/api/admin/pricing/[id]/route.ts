import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pricing_templates")
    .select("*, pricing_tiers(*), pricing_template_upsells(*, upsell_options(*))")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const body = await request.json();

  // Update template
  await supabase
    .from("pricing_templates")
    .update({
      name: body.name,
      unit_weight_grams: body.unit_weight_grams || 0,
      shipping_override: body.shipping_override || false,
      shipping_override_note: body.shipping_override_note || null,
    })
    .eq("id", id);

  // Replace tiers
  await supabase.from("pricing_tiers").delete().eq("pricing_template_id", id);
  if (body.tiers?.length) {
    await supabase.from("pricing_tiers").insert(
      body.tiers.map((t: { min_quantity: number; max_quantity?: number; unit_price: number }, i: number) => ({
        pricing_template_id: id,
        min_quantity: t.min_quantity,
        max_quantity: t.max_quantity || null,
        unit_price: t.unit_price,
        sort_order: i,
      }))
    );
  }

  // Replace upsell links
  await supabase.from("pricing_template_upsells").delete().eq("pricing_template_id", id);
  if (body.upsell_option_ids?.length) {
    await supabase.from("pricing_template_upsells").insert(
      body.upsell_option_ids.map((upsellId: string, i: number) => ({
        pricing_template_id: id,
        upsell_option_id: upsellId,
        sort_order: i,
      }))
    );
  }

  const { data } = await supabase
    .from("pricing_templates")
    .select("*, pricing_tiers(*), pricing_template_upsells(*, upsell_options(*))")
    .eq("id", id)
    .single();

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("pricing_templates").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
