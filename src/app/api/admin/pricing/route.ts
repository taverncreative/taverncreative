import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pricing_templates")
    .select("*, pricing_tiers(*), pricing_template_upsells(*, upsell_options(*))")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();

  // Create pricing template
  const { data: template, error: templateError } = await supabase
    .from("pricing_templates")
    .insert({
      name: body.name,
      unit_weight_grams: body.unit_weight_grams || 0,
      shipping_override: body.shipping_override || false,
      shipping_override_note: body.shipping_override_note || null,
    })
    .select()
    .single();

  if (templateError) {
    return NextResponse.json({ error: templateError.message }, { status: 500 });
  }

  // Insert tiers
  if (body.tiers?.length) {
    await supabase.from("pricing_tiers").insert(
      body.tiers.map((t: { min_quantity: number; max_quantity?: number; unit_price: number }, i: number) => ({
        pricing_template_id: template.id,
        min_quantity: t.min_quantity,
        max_quantity: t.max_quantity || null,
        unit_price: t.unit_price,
        sort_order: i,
      }))
    );
  }

  // Link upsell options
  if (body.upsell_option_ids?.length) {
    await supabase.from("pricing_template_upsells").insert(
      body.upsell_option_ids.map((upsellId: string, i: number) => ({
        pricing_template_id: template.id,
        upsell_option_id: upsellId,
        sort_order: i,
      }))
    );
  }

  // Re-fetch with relations
  const { data } = await supabase
    .from("pricing_templates")
    .select("*, pricing_tiers(*), pricing_template_upsells(*, upsell_options(*))")
    .eq("id", template.id)
    .single();

  return NextResponse.json(data, { status: 201 });
}
