import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("design_collections")
    .select("*, collection_products(id, status, is_live)")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Add completion stats
  const enriched = (data || []).map((c: Record<string, unknown>) => {
    const products = (c.collection_products || []) as { status: string; is_live: boolean }[];
    const total = products.length;
    const complete = products.filter((p) => p.status === "complete").length;
    const live = products.filter((p) => p.is_live).length;
    return {
      ...c,
      _stats: { total, complete, live, pct: total > 0 ? Math.round((complete / total) * 100) : 0 },
    };
  });

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();

  const slug = body.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data, error } = await supabase
    .from("design_collections")
    .insert({
      name: body.name,
      slug,
      description: body.description || null,
      hero_image_url: body.hero_image_url || null,
      preview_images: body.preview_images || [],
      sort_order: body.sort_order || 0,
      is_published: body.is_published || false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
