import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/fonts
 * Returns all fonts from Supabase Storage "fonts" bucket + fonts used in templates.
 */
export async function GET() {
  const supabase = createAdminClient();

  // List all fonts in the Supabase "fonts" bucket
  const { data: fontFiles } = await supabase.storage.from("fonts").list("", { limit: 500 });

  const families: string[] = [];
  if (fontFiles) {
    for (const f of fontFiles) {
      if (/\.(ttf|otf|woff|woff2)$/i.test(f.name)) {
        let family = f.name.replace(/\.[^.]+$/, "");
        family = family
          .replace(/-?(Regular|Bold|Italic|Light|Medium|SemiBold|ExtraBold|ExtraLight|Thin|Black|Book|VariableFont[^ ]*|DEMO|Demo|demo)$/gi, "")
          .replace(/[-_ ]+$/, "")
          .trim();
        if (family && family.length >= 2 && !families.includes(family)) {
          families.push(family);
        }
      }
    }
  }

  // Also get fonts actually used in templates (for the customer font bank)
  const { data } = await supabase
    .from("design_template_fields")
    .select("text_align")
    .not("text_align", "is", null)
    .not("text_align", "eq", "center");

  const usedFonts = [...new Set(
    (data || [])
      .map((row) => row.text_align)
      .filter((f): f is string => !!f && f !== "center")
  )];

  return NextResponse.json({
    allFamilies: families.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
    usedFonts,
  });
}

/**
 * POST /api/admin/fonts
 * Upload a new font file to Supabase Storage "fonts" bucket
 */
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !["ttf", "otf", "woff", "woff2"].includes(ext)) {
    return NextResponse.json({ error: "Invalid format. Use .ttf, .otf, .woff, or .woff2" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  // Upload to Supabase Storage "fonts" bucket
  const { error } = await supabase.storage
    .from("fonts")
    .upload(file.name, buffer, {
      contentType: ext === "otf" ? "font/otf" : ext === "woff2" ? "font/woff2" : ext === "woff" ? "font/woff" : "font/ttf",
      upsert: true,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Clean family name
  let family = file.name.replace(/\.[^.]+$/, "");
  family = family
    .replace(/-?(Regular|Bold|Italic|Light|Medium|SemiBold|ExtraBold|ExtraLight|Thin|Black|Book|VariableFont[^ ]*|DEMO|Demo|demo)$/gi, "")
    .replace(/[-_ ]+$/, "")
    .trim();
  if (!family || family.length < 2) family = file.name.replace(/\.[^.]+$/, "");

  return NextResponse.json({ family, file: file.name });
}
