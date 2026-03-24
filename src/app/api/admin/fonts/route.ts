import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeFile, readFile } from "fs/promises";
import path from "path";

const FONTS_DIR = path.join(process.cwd(), "public/Fonts");
const REGISTRY_PATH = path.join(process.cwd(), "public/font-registry.json");
const CSS_PATH = path.join(process.cwd(), "src/styles/custom-fonts.css");

/**
 * GET /api/admin/fonts
 * Returns the font registry (all uploaded fonts) + fonts used in templates.
 */
export async function GET() {
  // Get registry of uploaded fonts
  let registry: { family: string; file: string }[] = [];
  try {
    registry = JSON.parse(await readFile(REGISTRY_PATH, "utf-8"));
  } catch { /* empty */ }

  // Also get fonts actually used in templates (for the customer font bank)
  const supabase = createAdminClient();
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
    registry,
    usedFonts,
    allFamilies: registry.map((r) => r.family),
  });
}

/**
 * POST /api/admin/fonts
 * Upload a new font file (.ttf, .otf, .woff, .woff2)
 */
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("font") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !["ttf", "otf", "woff", "woff2"].includes(ext)) {
    return NextResponse.json({ error: "Invalid format. Use .ttf, .otf, .woff, or .woff2" }, { status: 400 });
  }

  // Save font file
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(FONTS_DIR, file.name), buffer);

  // Clean family name
  let family = file.name.replace(/\.[^.]+$/, "");
  family = family
    .replace(/-?(Regular|Bold|Italic|Light|Medium|SemiBold|ExtraBold|ExtraLight|Thin|Black|Book|VariableFont[^ ]*|DEMO|Demo|demo)$/gi, "")
    .replace(/[-_ ]+$/, "")
    .trim();
  if (!family || family.length < 2) family = file.name.replace(/\.[^.]+$/, "");

  // Update registry
  let registry: { family: string; file: string }[] = [];
  try {
    registry = JSON.parse(await readFile(REGISTRY_PATH, "utf-8"));
  } catch { /* empty */ }

  if (!registry.find((r) => r.file === file.name)) {
    registry.push({ family, file: file.name });
    registry.sort((a, b) => a.family.toLowerCase().localeCompare(b.family.toLowerCase()));
    await writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2));
  }

  // Regenerate CSS
  await regenerateCSS(registry);

  return NextResponse.json({ family, file: file.name });
}

/**
 * DELETE /api/admin/fonts
 * Remove a font file
 */
export async function DELETE(req: NextRequest) {
  const { file: fileName } = await req.json();
  if (!fileName) return NextResponse.json({ error: "No file specified" }, { status: 400 });

  if (fileName.includes("Montserrat")) {
    return NextResponse.json({ error: "Cannot delete the default font" }, { status: 400 });
  }

  try {
    const { unlink } = await import("fs/promises");
    await unlink(path.join(FONTS_DIR, fileName));
  } catch { /* file might not exist */ }

  let registry: { family: string; file: string }[] = [];
  try {
    registry = JSON.parse(await readFile(REGISTRY_PATH, "utf-8"));
  } catch { /* empty */ }

  registry = registry.filter((r) => r.file !== fileName);
  await writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2));
  await regenerateCSS(registry);

  return NextResponse.json({ ok: true });
}

async function regenerateCSS(registry: { family: string; file: string }[]) {
  const lines = ["/* Custom fonts - upload new fonts via admin. */\n"];

  for (const font of registry) {
    const ext = font.file.split(".").pop()?.toLowerCase() || "ttf";
    const fmt = ext === "otf" ? "opentype" : ext === "woff2" ? "woff2" : ext === "woff" ? "woff" : "truetype";
    const isVariable = font.file.includes("VariableFont");
    const isItalic = font.file.toLowerCase().includes("italic");
    const urlName = encodeURIComponent(font.file).replace(/%20/g, "%20");

    lines.push(`@font-face {`);
    lines.push(`  font-family: '${font.family}';`);
    lines.push(`  src: url('/Fonts/${urlName}') format('${fmt}');`);
    lines.push(`  font-weight: ${isVariable ? "100 900" : "400"};`);
    lines.push(`  font-style: ${isItalic ? "italic" : "normal"};`);
    lines.push(`  font-display: swap;`);
    lines.push(`}\n`);
  }

  await writeFile(CSS_PATH, lines.join("\n"));
}
