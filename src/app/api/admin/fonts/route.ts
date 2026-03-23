import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/fonts
 * Returns all unique fonts used across all design template fields.
 * This forms the "customer font bank" — any font you've used becomes available to customers.
 */
export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("design_template_fields")
    .select("text_align")
    .not("text_align", "is", null)
    .not("text_align", "eq", "center");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Extract unique font names (text_align stores the font family)
  const fonts = [...new Set(
    (data || [])
      .map((row) => row.text_align)
      .filter((f): f is string => !!f && f !== "center")
  )].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  return NextResponse.json(fonts);
}
