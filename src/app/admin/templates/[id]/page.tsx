"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save, Type, Calendar, Clock, AlignLeft, ChevronUp, ChevronDown, Repeat, Columns2, Columns3, Image as ImageIcon, Move, X, Heart, Hash, Users, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { FieldType, ProductCategory } from "@/lib/types/database";

type FoldType = "none" | "half" | "tri" | "gate" | "z";
type ExtendedFieldType = FieldType | "repeater" | "big_date" | "heart" | "tri_details" | "names";

const BLEED_MM = 3; // Fixed 3mm bleed

// Available field types
const fieldTypes: { type: ExtendedFieldType; label: string; icon: typeof Type; desc?: string }[] = [
  { type: "text", label: "Text", icon: Type },
  { type: "textarea", label: "Long Text", icon: AlignLeft, desc: "Multi-line with breaks" },
  { type: "date", label: "Date", icon: Calendar },
  { type: "time", label: "Time", icon: Clock },
  { type: "names", label: "Names", icon: Users, desc: "Name & Name (3 lines)" },
  { type: "big_date", label: "Big Date", icon: Hash, desc: "DD | MM | YY" },
  { type: "heart", label: "Heart", icon: Heart, desc: "❤ divider" },
  { type: "tri_details", label: "Tri Details", icon: AlignLeft, desc: "Names | Date | Venue" },
  { type: "repeater", label: "Repeater", icon: Repeat },
];

const fieldTypeIcons: Record<string, typeof Type> = {
  text: Type,
  date: Calendar,
  time: Clock,
  textarea: AlignLeft,
  names: Users,
  big_date: Hash,
  heart: Heart,
  tri_details: AlignLeft,
  repeater: Repeat,
};

const categoryLabels: Record<ProductCategory, string> = {
  save_the_dates: "Save the Dates",
  invitations: "Invitations",
  on_the_day: "On the Day",
  thank_yous: "Thank Yous",
};

const foldLabels: Record<FoldType, string> = {
  none: "No Fold",
  half: "Half Fold",
  tri: "Tri-Fold",
  gate: "Gate Fold",
  z: "Z-Fold",
};

const sizePresets = [
  { label: "5×7″ (127×178mm)", w: 127, h: 178 },
  { label: "A5 (148×210mm)", w: 148, h: 210 },
  { label: "A6 (105×148mm)", w: 105, h: 148 },
  { label: "DL (99×210mm)", w: 99, h: 210 },
  { label: "Square 5″ (127×127mm)", w: 127, h: 127 },
  { label: "Square 6″ (152×152mm)", w: 152, h: 152 },
  { label: "4×6″ (102×152mm)", w: 102, h: 152 },
];

// Font options loaded from registry at runtime
let fontOptions: string[] = [];

// Curated wedding colour palette — all print-safe on white card
const WEDDING_PALETTE = [
  { hex: "#1a1a1a", label: "Black" },
  { hex: "#4a4a4a", label: "Charcoal" },
  { hex: "#8b7355", label: "Mocha" },
  { hex: "#b8860b", label: "Gold" },
  { hex: "#c9a96e", label: "Champagne" },
  { hex: "#d4a574", label: "Copper" },
  { hex: "#b76e79", label: "Rose Gold" },
  { hex: "#d4a0a0", label: "Blush" },
  { hex: "#c08497", label: "Dusty Rose" },
  { hex: "#722f37", label: "Burgundy" },
  { hex: "#6b3a5b", label: "Plum" },
  { hex: "#5f6b7a", label: "Slate" },
  { hex: "#2c3e50", label: "Navy" },
  { hex: "#4a6741", label: "Forest" },
  { hex: "#6b8e5a", label: "Sage" },
  { hex: "#7a8b6f", label: "Olive" },
  { hex: "#a0522d", label: "Sienna" },
  { hex: "#c05f3c", label: "Terracotta" },
  { hex: "#cd853f", label: "Caramel" },
  { hex: "#8fbc8f", label: "Eucalyptus" },
];

interface FieldDraft {
  field_type: ExtendedFieldType;
  label: string;
  placeholder: string;
  is_required: boolean;
  y_mm: number;
  font_size: number;
  font_family: string;
  text_align: string;
  is_uppercase?: boolean;
  font_weight?: number;
  is_highlight_colour?: boolean;
  text_colour?: string;
  scale_y?: number; // vertical squash/stretch (0.5 to 1.5, default 1)
  text_width_pct?: number; // max text width as % of card width (default 88)
  letter_spacing?: number; // letter spacing in em units (default 0)
  text_stroke?: number; // stroke width in px (0 = none, 0.1-2.0 range)
  line_spacing?: number; // line-height multiplier (default 1.2 for text, 1.4 for long text)
  big_date_format?: "dmy" | "mdy"; // DD|MM|YY or MM|DD|YY
  // Names-specific (3-line: Name1 / connector / Name2)
  names_connector?: string; // default "&"
  names_connector_size?: number; // font size for connector
  names_connector_colour?: string; // colour for connector (default black)
  names_connector_font?: string; // font for connector
  names_line_spacing?: number; // line spacing multiplier (default 1.2)
  // Repeater-specific
  repeater_columns?: 1 | 2 | 3;
  repeater_header_font?: string;
  repeater_header_size?: number;
  repeater_body_font?: string;
  repeater_body_size?: number;
}

interface PricingTemplate {
  id: string;
  name: string;
}

interface OtherTemplate {
  id: string;
  name: string;
  category: ProductCategory;
}

export default function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionId = searchParams.get("collection");
  const collectionProductId = searchParams.get("cp");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pricingTemplates, setPricingTemplates] = useState<PricingTemplate[]>([]);
  const [allTemplates, setAllTemplates] = useState<OtherTemplate[]>([]);
  const [allFonts, setAllFonts] = useState<string[]>([]);
  const [fontSearch, setFontSearch] = useState("");
  const [customerFonts, setCustomerFonts] = useState<string[]>([]);
  const [contextualSwatches, setContextualSwatches] = useState<string[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  // Collection context — design assets
  const [collectionName, setCollectionName] = useState("");
  const [collectionAssets, setCollectionAssets] = useState<{ url: string; name: string; group: string }[]>([]);
  const [pickingThumbnail, setPickingThumbnail] = useState(false);

  // Placed assets on the artboard (collection design elements)
  interface PlacedAsset {
    url: string;
    x_mm: number;
    y_mm: number;
    width_mm: number;
    height_mm: number;
    aspect_ratio: number; // width/height — locked on place
    rotation_deg: number; // 0, 45, 90, 135, 180, 225, 270, 315
    // Customer control: which directions they can nudge, and by how much (mm)
    customer_move_x: boolean;
    customer_move_y: boolean;
    customer_nudge_limit_mm: number; // max mm they can move in any allowed direction
  }
  const [placedAssets, setPlacedAssets] = useState<PlacedAsset[]>([]);
  const [selectedAssetIndex, setSelectedAssetIndex] = useState<number | null>(null);

  // Smart snap guides
  const SNAP_THRESHOLD_MM = 2; // snap within 2mm
  interface SnapLine { axis: "x" | "y"; position_mm: number }
  const [snapLines, setSnapLines] = useState<SnapLine[]>([]);

  // Snap guide positions (in mm from artboard origin, not bleed)
  function getSnapTargets() {
    return {
      x: [0, artW / 2, artW], // left edge, centre, right edge
      y: [0, artH / 2, artH], // top edge, centre, bottom edge
    };
  }

  function snapPosition(x_mm: number, y_mm: number, w_mm: number, h_mm: number) {
    const targets = getSnapTargets();
    const lines: SnapLine[] = [];
    let sx = x_mm;
    let sy = y_mm;

    // Asset edges and centre
    const assetXPoints = [x_mm, x_mm + w_mm / 2, x_mm + w_mm]; // left, centre, right
    const assetYPoints = [y_mm, y_mm + h_mm / 2, y_mm + h_mm]; // top, centre, bottom

    for (const tx of targets.x) {
      for (let pi = 0; pi < assetXPoints.length; pi++) {
        const diff = tx - assetXPoints[pi];
        if (Math.abs(diff) < SNAP_THRESHOLD_MM) {
          sx = x_mm + diff;
          lines.push({ axis: "x", position_mm: tx });
          break;
        }
      }
    }
    for (const ty of targets.y) {
      for (let pi = 0; pi < assetYPoints.length; pi++) {
        const diff = ty - assetYPoints[pi];
        if (Math.abs(diff) < SNAP_THRESHOLD_MM) {
          sy = y_mm + diff;
          lines.push({ axis: "y", position_mm: ty });
          break;
        }
      }
    }
    return { x: sx, y: sy, lines };
  }

  // Clamp: ensure at least 10% of asset stays on artboard
  function clampPosition(x_mm: number, y_mm: number, w_mm: number, h_mm: number) {
    const minVisible = Math.min(w_mm, h_mm) * 0.1;
    return {
      x: Math.max(-w_mm + minVisible - BLEED_MM, Math.min(artW + BLEED_MM - minVisible, x_mm)),
      y: Math.max(-h_mm + minVisible - BLEED_MM, Math.min(artH + BLEED_MM - minVisible, y_mm)),
    };
  }

  // Template properties
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategory>("invitations");
  const [pricingTemplateId, setPricingTemplateId] = useState("");
  const [widthMm, setWidthMm] = useState(127);
  const [heightMm, setHeightMm] = useState(178);
  const [isDoubleSided, setIsDoubleSided] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [fold, setFold] = useState<FoldType>("none");
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [highlightColour, setHighlightColour] = useState("#c05f3c"); // default terracotta
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState("");
  const [showToast, setShowToast] = useState("");
  const fieldSpacing = 5; // mm between fields
  const [customerSwatches, setCustomerSwatches] = useState<string[]>([]);

  // Fields
  const [fields, setFields] = useState<FieldDraft[]>([]);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);

  // Cross-sells
  const [crossSellIds, setCrossSellIds] = useState<string[]>([]);

  // Artboard dimensions — swap if landscape
  const artW = isLandscape ? heightMm : widthMm;
  const artH = isLandscape ? widthMm : heightMm;
  const totalW = artW + BLEED_MM * 2;
  const totalH = artH + BLEED_MM * 2;
  const ARTBOARD_MAX = 560;
  const scale = Math.min(ARTBOARD_MAX / totalW, 700 / totalH);

  // Extract dominant colours from an artwork image using canvas sampling
  function extractSwatches(imgUrl: string) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 100; // sample at low res for speed
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      const colours: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 16) { // sample every 4th pixel
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a < 128) continue; // skip transparent
        // Skip colours too light for CMYK print on white card
        // Luminance check: must be dark enough to be legible on white
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
        if (luminance > 140) continue; // skip anything above ~55% brightness
        if (r < 15 && g < 15 && b < 15) continue; // skip near-black
        // Quantize to reduce similar colours
        const qr = Math.round(r / 32) * 32;
        const qg = Math.round(g / 32) * 32;
        const qb = Math.round(b / 32) * 32;
        const key = `${qr},${qg},${qb}`;
        colours[key] = (colours[key] || 0) + 1;
      }
      // Sort by frequency, take top 8
      const sorted = Object.entries(colours)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([key]) => {
          const [r, g, b] = key.split(",").map(Number);
          return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
        });
      setContextualSwatches(sorted);
    };
    img.src = imgUrl;
  }

  useEffect(() => {
    async function load() {
      const [tRes, pRes, aRes] = await Promise.all([
        fetch(`/api/admin/templates/${id}`),
        fetch("/api/admin/pricing"),
        fetch("/api/admin/templates"),
      ]);
      const t = await tRes.json();
      setName(t.name);
      setCategory(t.category);
      setPricingTemplateId(t.pricing_template_id || "");
      const w = Number(t.width_mm) || 127;
      const h = Number(t.height_mm) || 178;
      // Always store width as the shorter side, height as the longer side
      // isLandscape controls which axis they map to on the artboard
      const isLand = w > h;
      setWidthMm(isLand ? h : w);   // shorter side
      setHeightMm(isLand ? w : h);  // longer side
      setIsLandscape(isLand);
      setIsDoubleSided(t.is_double_sided || false);
      setFold(t.fold || "none");
      if (t.metadata?.highlight_colour) setHighlightColour(t.metadata.highlight_colour);
      if (t.metadata?.customer_swatches) setCustomerSwatches(t.metadata.customer_swatches);
      setFields(
        (t.design_template_fields || [])
          .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
          .map((f: Record<string, unknown>) => ({
            field_type: f.field_type as ExtendedFieldType,
            label: (f.label as string) || "",
            placeholder: (f.placeholder as string) || "",
            is_required: f.is_required as boolean,
            y_mm: Number(f.y_mm) || 0,
            font_size: Number(f.font_size) || 14,
            font_family: (f.text_align as string) && (f.text_align as string) !== "center" ? (f.text_align as string) : "Montserrat",
            text_align: "center",
            // Restore repeater options from stored JSON if present
            ...(f.options ? (f.options as Record<string, unknown>) : {}),
          }))
      );
      setCrossSellIds(
        (t.cross_sells || []).map((cs: { cross_sell_template: { id: string } }) => cs.cross_sell_template.id)
      );
      setPricingTemplates(await pRes.json());
      const all: OtherTemplate[] = await aRes.json();
      setAllTemplates(all.filter((a) => a.id !== id));

      // Load collection assets if in collection context
      if (collectionId) {
        const colRes = await fetch(`/api/admin/collections/${collectionId}`);
        const col = await colRes.json();
        setCollectionName(col.name || "");
        // Fetch ALL assets from Supabase Storage via assets API (with grouping)
        const assetsRes = await fetch(`/api/admin/collections/${collectionId}/assets`);
        const assetsData = await assetsRes.json();
        setCollectionAssets(Array.isArray(assetsData) ? assetsData : []);
        // Load saved state for this collection product (field_snapshot, placed_assets, metadata)
        if (collectionProductId) {
          const cpRes = await fetch(`/api/admin/collections/${collectionId}/products`);
          const cps = await cpRes.json();
          const cp = Array.isArray(cps) ? cps.find((c: Record<string, unknown>) => c.id === collectionProductId) : null;
          if (cp?.placed_assets && Array.isArray(cp.placed_assets)) {
            setPlacedAssets(cp.placed_assets as PlacedAsset[]);
          }
          // CRITICAL: Load field_snapshot to restore admin's saved design
          if (cp?.field_snapshot && Array.isArray(cp.field_snapshot) && cp.field_snapshot.length > 0) {
            setFields(
              (cp.field_snapshot as Record<string, unknown>[])
                .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
                .map((f) => {
                  const opts = (f.options as Record<string, unknown>) || {};
                  return {
                    field_type: (opts.field_type as ExtendedFieldType) || (f.field_type as ExtendedFieldType),
                    label: (f.label as string) || "",
                    placeholder: (f.placeholder as string) || "",
                    is_required: f.is_required as boolean,
                    y_mm: Number(f.y_mm) || 0,
                    font_size: Number(f.font_size) || 14,
                    font_family: (f.text_align as string) && (f.text_align as string) !== "center" ? (f.text_align as string) : "Montserrat",
                    text_align: "center",
                    ...opts,
                  } as FieldDraft;
                })
            );
          }
          // Load metadata_snapshot (highlight colour, customer swatches, thumbnail)
          if (cp?.metadata_snapshot) {
            const meta = cp.metadata_snapshot as Record<string, unknown>;
            if (meta.highlight_colour) setHighlightColour(meta.highlight_colour as string);
            if (Array.isArray(meta.customer_swatches)) setCustomerSwatches(meta.customer_swatches as string[]);
            if (meta.thumbnail_url) setThumbnailUrl(meta.thumbnail_url as string);
          }
        }
        // Extract contextual swatches from the artwork
        if (col.slug) {
          extractSwatches(`/designs/${col.slug}/preview.webp`);
        }
      }

      // Load fonts from Supabase Storage via API + customer font bank
      try {
        const fontListRes = await fetch("/api/admin/fonts?list=all");
        const fontData = await fontListRes.json();
        // fontData is { allFamilies: string[], usedFonts: string[] } or just string[] (customer fonts)
        const families = Array.isArray(fontData.allFamilies) ? fontData.allFamilies : (Array.isArray(fontData) ? fontData : []);
        const usedFonts = Array.isArray(fontData.usedFonts) ? fontData.usedFonts : [];
        const allFamiliesSorted = [...new Set([...families, ...usedFonts, "Montserrat"])].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        setAllFonts(allFamiliesSorted);
        fontOptions = allFamiliesSorted;
        setCustomerFonts(usedFonts);
      } catch {
        setAllFonts(["Montserrat", "Playfair Display", "Dancing Script"]);
      }

      setLoading(false);
    }
    load();
  }, [id, collectionId]);

  function addField(type: ExtendedFieldType) {
    const defaultLabel =
      type === "date" ? "Date" : type === "time" ? "Time" : type === "repeater" ? "Items"
      : type === "big_date" ? "Date" : type === "heart" ? "❤" : type === "tri_details" ? "Details"
      : type === "names" ? "Names" : "";
    // Auto-place below last field with proper spacing based on font size
    let lastY: number;
    if (fields.length > 0) {
      const lastField = fields[fields.length - 1];
      // Estimate height of last field based on its font size (in mm)
      const lastFieldHeight = (lastField.font_size || 14) * 0.4; // rough px-to-mm
      const gap = Math.max(3, (lastField.font_size || 14) * 0.15); // proportional gap
      lastY = lastField.y_mm + lastFieldHeight + gap;
    } else {
      lastY = artH * 0.3;
    }
    const newField: FieldDraft = {
      field_type: type,
      label: defaultLabel,
      placeholder: type === "big_date" ? "25 | 07 | 28" : type === "heart" ? "❤"
        : type === "tri_details" ? "Emily & James | 25.10.28 | Solton Manor"
        : type === "names" ? "Ella West & Myles Porter" : "",
      is_required: type === "heart" || type === "tri_details" ? false : type === "names" ? true : true,
      y_mm: lastY,
      font_size: type === "repeater" ? 12 : type === "big_date" ? 28 : type === "heart" ? 12
        : type === "tri_details" ? 11 : type === "names" ? 36 : 14,
      font_family: "Montserrat",
      text_align: "center",
      ...(type === "big_date" ? {
        big_date_format: "dmy" as const,
        is_uppercase: true,
      } : {}),
      ...(type === "tri_details" ? {
        is_uppercase: true,
        font_weight: 600,
      } : {}),
      ...(type === "names" ? {
        names_connector: "&",
        names_connector_size: 18,
        names_connector_colour: "#1a1a1a",
        names_connector_font: "Montserrat",
        names_line_spacing: 1.2,
        is_highlight_colour: true,
      } : {}),
      ...(type === "repeater" ? {
        repeater_columns: 1,
        repeater_header_font: "Montserrat",
        repeater_header_size: 16,
        repeater_body_font: "Montserrat",
        repeater_body_size: 12,
      } : {}),
    };
    // Place new field below the last one, then recentre the whole group vertically
    const allFields = [...fields, newField];

    if (fields.length > 0) {
      const lastField = fields[fields.length - 1];
      const lastFieldHeight = lastField.font_size * 0.5;
      newField.y_mm = Math.round((lastField.y_mm + lastFieldHeight + fieldSpacing) * 10) / 10;
    } else {
      newField.y_mm = artH * 0.3;
    }

    // Recentre all fields vertically as a group
    const groupFirstY = allFields[0].y_mm;
    const groupLastY = newField.y_mm + newField.font_size * 0.5;
    const totalHeight = groupLastY - groupFirstY;
    const centreOffset = (artH - totalHeight) / 2 - groupFirstY;

    if (centreOffset !== 0) {
      const recentred = allFields.map((f) => ({
        ...f,
        y_mm: Math.max(2, Math.round((f.y_mm + centreOffset) * 10) / 10),
      }));
      setFields(recentred);
    } else {
      setFields(allFields);
    }
    setSelectedFieldIndex(allFields.length - 1);
  }

  function updateField(index: number, updates: Partial<FieldDraft>) {
    setFields(fields.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  }

  function removeField(index: number) {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields);
    // Select next field (or previous if last was deleted)
    if (newFields.length === 0) {
      setSelectedFieldIndex(null);
    } else if (index < newFields.length) {
      setSelectedFieldIndex(index);
    } else {
      setSelectedFieldIndex(newFields.length - 1);
    }
  }

  // Move only the selected field up/down on the artboard
  function moveSelectedField(direction: number) {
    if (selectedFieldIndex === null) return;
    const step = 1; // mm per click
    setFields(fields.map((f, i) =>
      i === selectedFieldIndex ? { ...f, y_mm: Math.max(0, f.y_mm + direction * step) } : f
    ));
  }

  function moveField(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const updated = [...fields];
    // Swap the fields AND their Y positions so they swap visually
    const tempY = updated[index].y_mm;
    updated[index] = { ...updated[index], y_mm: updated[newIndex].y_mm };
    updated[newIndex] = { ...updated[newIndex], y_mm: tempY };
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setFields(updated);
    setSelectedFieldIndex(newIndex);
  }

  function applySizePreset(w: number, h: number) {
    setWidthMm(Math.min(w, h));
    setHeightMm(Math.max(w, h));
  }

  // Auto-space fields evenly centred on the artboard

  // Save current layout as a new template (no assets, no colours — just text layout)
  async function handleSaveAsTemplate() {
    if (!saveTemplateName.trim()) return;
    const newName = saveTemplateName.trim();
    const res = await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        category,
        width_mm: isLandscape ? Math.max(widthMm, heightMm) : widthMm,
        height_mm: isLandscape ? Math.min(widthMm, heightMm) : heightMm,
        bleed_mm: BLEED_MM,
        is_double_sided: isDoubleSided,
        fold,
        fields: fields.map((f, i) => ({
          field_type: ["repeater", "big_date", "heart", "tri_details", "names"].includes(f.field_type) ? "text" : f.field_type,
          label: f.label,
          placeholder: f.placeholder,
          is_required: f.is_required,
          sort_order: i,
          x_mm: 0,
          y_mm: f.y_mm,
          width_mm: null,
          font_size: f.font_size,
          text_align: f.font_family,
          options: {
            ...(["repeater", "big_date", "heart", "tri_details"].includes(f.field_type) ? { field_type: f.field_type } : {}),
            ...(f.is_uppercase ? { is_uppercase: true } : {}),
            ...(f.font_weight && f.font_weight !== 400 ? { font_weight: f.font_weight } : {}),
            ...(f.scale_y && f.scale_y !== 1 ? { scale_y: f.scale_y } : {}),
            ...(f.text_width_pct && f.text_width_pct !== 88 ? { text_width_pct: f.text_width_pct } : {}),
            ...(f.letter_spacing ? { letter_spacing: f.letter_spacing } : {}),
            ...(f.text_stroke ? { text_stroke: f.text_stroke } : {}),
            ...(f.big_date_format ? { big_date_format: f.big_date_format } : {}),
            ...(f.field_type === "names" ? {
              names_connector: f.names_connector || "&",
              names_connector_size: f.names_connector_size || 18,
              names_connector_colour: f.names_connector_colour || "#1a1a1a",
              names_connector_font: f.names_connector_font || f.font_family,
              names_line_spacing: f.names_line_spacing || 1.2,
            } : {}),
            ...(f.field_type === "repeater" ? {
              repeater_columns: f.repeater_columns,
              repeater_header_font: f.repeater_header_font,
              repeater_header_size: f.repeater_header_size,
              repeater_body_font: f.repeater_body_font,
              repeater_body_size: f.repeater_body_size,
            } : {}),
          },
        })),
      }),
    });
    setShowSaveTemplateModal(false);
    setSaveTemplateName("");
    if (res.ok) {
      setShowToast("Template saved");
      setTimeout(() => setShowToast(""), 2500);
    }
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/admin/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category,
        pricing_template_id: pricingTemplateId || null,
        width_mm: isLandscape ? Math.max(widthMm, heightMm) : widthMm,
        height_mm: isLandscape ? Math.min(widthMm, heightMm) : heightMm,
        bleed_mm: BLEED_MM,
        is_double_sided: isDoubleSided,
        fold,
        metadata: {
          highlight_colour: highlightColour,
          customer_swatches: customerSwatches,
        },
        fields: fields.map((f, i) => ({
          field_type: (f.field_type === "repeater" || f.field_type === "big_date" || f.field_type === "heart" || f.field_type === "tri_details") ? "text" : f.field_type, // store as text in DB, real type in options
          label: f.label,
          placeholder: f.placeholder,
          is_required: f.is_required,
          sort_order: i,
          x_mm: 0,
          y_mm: f.y_mm,
          width_mm: null,
          font_size: f.font_size,
          text_align: f.font_family,
          // Store extra field config in options JSON
          options: {
            // Always store the real field type if it's not a standard DB type
            ...(["repeater", "big_date", "heart", "tri_details"].includes(f.field_type) ? { field_type: f.field_type } : {}),
            ...(f.is_uppercase ? { is_uppercase: true } : {}),
            ...(f.font_weight && f.font_weight !== 400 ? { font_weight: f.font_weight } : {}),
            ...(f.is_highlight_colour ? { is_highlight_colour: true } : {}),
            ...(f.text_colour && f.text_colour !== "#1a1a1a" ? { text_colour: f.text_colour } : {}),
            ...(f.scale_y && f.scale_y !== 1 ? { scale_y: f.scale_y } : {}),
            ...(f.text_width_pct && f.text_width_pct !== 88 ? { text_width_pct: f.text_width_pct } : {}),
            ...(f.letter_spacing ? { letter_spacing: f.letter_spacing } : {}),
            ...(f.text_stroke ? { text_stroke: f.text_stroke } : {}),
            ...(f.big_date_format ? { big_date_format: f.big_date_format } : {}),
            ...(f.field_type === "names" ? {
              names_connector: f.names_connector || "&",
              names_connector_size: f.names_connector_size || 18,
              names_connector_colour: f.names_connector_colour || "#1a1a1a",
              names_connector_font: f.names_connector_font || f.font_family,
              names_line_spacing: f.names_line_spacing || 1.2,
            } : {}),
            ...(f.field_type === "repeater" ? {
              repeater_columns: f.repeater_columns,
              repeater_header_font: f.repeater_header_font,
              repeater_header_size: f.repeater_header_size,
              repeater_body_font: f.repeater_body_font,
              repeater_body_size: f.repeater_body_size,
            } : {}),
          },
        })),
        cross_sell_ids: crossSellIds,
      }),
    });
    // Save placed assets + field snapshot to collection_product if in collection context
    if (collectionId && collectionProductId) {
      const snapshotFields = fields.map((f, i) => ({
        label: f.label,
        placeholder: f.placeholder,
        field_type: f.field_type,
        is_required: f.is_required,
        sort_order: i,
        font_size: f.font_size,
        text_align: f.font_family,
        y_mm: f.y_mm,
        options: {
          ...(["repeater", "big_date", "heart", "tri_details", "names"].includes(f.field_type) ? { field_type: f.field_type } : {}),
          ...(f.is_uppercase ? { is_uppercase: true } : {}),
          ...(f.font_weight && f.font_weight !== 400 ? { font_weight: f.font_weight } : {}),
          ...(f.is_highlight_colour ? { is_highlight_colour: true } : {}),
          ...(f.text_colour && f.text_colour !== "#1a1a1a" ? { text_colour: f.text_colour } : {}),
          ...(f.scale_y && f.scale_y !== 1 ? { scale_y: f.scale_y } : {}),
          ...(f.text_width_pct && f.text_width_pct !== 88 ? { text_width_pct: f.text_width_pct } : {}),
          ...(f.letter_spacing ? { letter_spacing: f.letter_spacing } : {}),
          ...(f.text_stroke ? { text_stroke: f.text_stroke } : {}),
          ...(f.line_spacing ? { line_spacing: f.line_spacing } : {}),
          ...(f.big_date_format ? { big_date_format: f.big_date_format } : {}),
          ...(f.field_type === "names" ? {
            names_connector: f.names_connector || "&",
            names_connector_size: f.names_connector_size || 18,
            names_connector_colour: f.names_connector_colour || "#1a1a1a",
            names_connector_font: f.names_connector_font || f.font_family,
            names_line_spacing: f.names_line_spacing || 1.2,
          } : {}),
          ...(f.field_type === "repeater" ? {
            repeater_columns: f.repeater_columns,
            repeater_header_font: f.repeater_header_font,
            repeater_header_size: f.repeater_header_size,
            repeater_body_font: f.repeater_body_font,
            repeater_body_size: f.repeater_body_size,
          } : {}),
        },
      }));

      await fetch(`/api/admin/collections/${collectionId}/products`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: collectionProductId,
          placed_assets: placedAssets,
          field_snapshot: snapshotFields,
          metadata_snapshot: {
            highlight_colour: highlightColour,
            customer_swatches: customerSwatches,
            thumbnail_url: thumbnailUrl,
            artwork_url: placedAssets.length > 0 ? placedAssets[0].url : undefined,
            placed_assets: placedAssets,
            artboard_width_mm: isLandscape ? Math.max(widthMm, heightMm) : widthMm,
            artboard_height_mm: isLandscape ? Math.min(widthMm, heightMm) : heightMm,
          },
        }),
      });
    }
    setSaving(false);
    router.push(collectionId ? `/admin/collections/${collectionId}` : "/admin/templates");
  }

  if (loading) return <p className="text-muted-foreground p-8">Loading...</p>;

  const selectedField = selectedFieldIndex !== null ? fields[selectedFieldIndex] : null;

  // Get filtered fonts, always including the current value at the top
  function getFilteredFonts(currentValue: string) {
    const filtered = allFonts.filter((ff) => ff.toLowerCase().includes(fontSearch.toLowerCase()));
    const top50 = filtered.slice(0, 50);
    // Ensure current value is always included
    if (currentValue && !top50.includes(currentValue)) {
      top50.unshift(currentValue);
    }
    return top50;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={() => router.push(collectionId ? `/admin/collections/${collectionId}` : "/admin/templates")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {collectionId ? `Back to ${collectionName || "Collection"}` : "Back"}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSaveTemplateModal(true)}>
            Save To Template
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left sidebar */}
        <div className="w-64 shrink-0 space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div>
                <Label className="text-xs">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ProductCategory)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Pricing & Artboard only on template editor, not design creator */}
              {!collectionId && (
                <div>
                  <Label className="text-xs">Pricing</Label>
                  <Select value={pricingTemplateId} onValueChange={setPricingTemplateId}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {pricingTemplates.map((pt) => (
                        <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Artboard settings — template editor only */}
          {!collectionId && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Artboard
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div>
                  <Label className="text-xs">Size Preset</Label>
                  <Select onValueChange={(v) => {
                    const p = sizePresets.find((s) => `${s.w}x${s.h}` === v);
                    if (p) applySizePreset(p.w, p.h);
                  }}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Choose..." /></SelectTrigger>
                    <SelectContent>
                      {sizePresets.map((p) => (
                        <SelectItem key={`${p.w}x${p.h}`} value={`${p.w}x${p.h}`}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">W (mm)</Label>
                    <Input type="number" value={widthMm} onChange={(e) => setWidthMm(Number(e.target.value))} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">H (mm)</Label>
                    <Input type="number" value={heightMm} onChange={(e) => setHeightMm(Number(e.target.value))} className="h-8 text-sm" />
                  </div>
                </div>
                {/* Orientation */}
                <div>
                  <Label className="text-xs">Orientation</Label>
                  <div className="flex gap-2 mt-1">
                    <button type="button" onClick={() => setIsLandscape(false)}
                      className={`flex-1 py-1.5 rounded text-xs border transition-colors ${!isLandscape ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/50"}`}>
                      Portrait
                    </button>
                    <button type="button" onClick={() => setIsLandscape(true)}
                      className={`flex-1 py-1.5 rounded text-xs border transition-colors ${isLandscape ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/50"}`}>
                      Landscape
                    </button>
                  </div>
                </div>
                <Separator />
                <div>
                  <Label className="text-xs">Sides</Label>
                  <div className="flex gap-2 mt-1">
                    <button type="button" onClick={() => setIsDoubleSided(false)}
                      className={`flex-1 py-1.5 rounded text-xs border transition-colors ${!isDoubleSided ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/50"}`}>
                      Single
                    </button>
                    <button type="button" onClick={() => setIsDoubleSided(true)}
                      className={`flex-1 py-1.5 rounded text-xs border transition-colors ${isDoubleSided ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/50"}`}>
                      Double
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Fold</Label>
                  <Select value={fold} onValueChange={(v) => setFold(v as FoldType)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(foldLabels).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add fields */}
          {/* Global Highlight Colour */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Highlight Colour
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <p className="text-[10px] text-muted-foreground">Fields marked as &ldquo;highlight&rdquo; will use this colour. Customers can change it.</p>
              <div className="flex items-center gap-2">
                <input type="color" value={highlightColour}
                  onChange={(e) => setHighlightColour(e.target.value)}
                  className="w-8 h-8 rounded border border-border cursor-pointer p-0" />
                <Input value={highlightColour}
                  onChange={(e) => setHighlightColour(e.target.value)}
                  className="h-7 text-xs font-mono flex-1" />
              </div>
              {/* Contextual swatches */}
              {contextualSwatches.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">From design</p>
                  <div className="flex flex-wrap gap-1">
                    {contextualSwatches.map((hex) => (
                      <button key={hex} type="button" onClick={() => setHighlightColour(hex)}
                        className={`w-5 h-5 rounded-full border transition-transform hover:scale-125 ${highlightColour === hex ? "border-foreground ring-1 ring-foreground ring-offset-1" : "border-border"}`}
                        style={{ backgroundColor: hex }} title={hex} />
                    ))}
                  </div>
                </div>
              )}
              {/* Wedding palette */}
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Wedding palette</p>
                <div className="flex flex-wrap gap-1">
                  {WEDDING_PALETTE.map(({ hex, label: l }) => (
                    <button key={hex} type="button" onClick={() => setHighlightColour(hex)}
                      className={`w-5 h-5 rounded-full border transition-transform hover:scale-125 ${highlightColour === hex ? "border-foreground ring-1 ring-foreground ring-offset-1" : "border-border"}`}
                      style={{ backgroundColor: hex }} title={l} />
                  ))}
                </div>
              </div>
              {/* Customer swatch bank */}
              <Separator />
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Customer swatch bank <span className="text-muted-foreground/50">(colours the customer can choose from)</span></p>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {customerSwatches.map((hex, ci) => (
                    <button key={ci} type="button"
                      className="w-5 h-5 rounded-full border border-border relative group"
                      style={{ backgroundColor: hex }} title={hex}
                      onClick={() => setCustomerSwatches(customerSwatches.filter((_, j) => j !== ci))}>
                      <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-white text-[8px] font-bold bg-black/40 rounded-full">×</span>
                    </button>
                  ))}
                  <button type="button"
                    onClick={() => { if (!customerSwatches.includes(highlightColour)) setCustomerSwatches([...customerSwatches, highlightColour]); }}
                    className="w-5 h-5 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-foreground text-[10px]">+</button>
                </div>
                <p className="text-[9px] text-muted-foreground/60">Click + to add current highlight colour. Click a swatch to remove it.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Add Fields
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-1.5">
                {fieldTypes.map(({ type, label, icon: Icon }) => (
                  <button key={type} type="button" onClick={() => addField(type)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded border border-border text-xs hover:bg-muted transition-colors ${type === "repeater" ? "col-span-2 justify-center bg-muted/30" : ""}`}>
                    <Icon className="h-3 w-3" />{label}
                    {type === "repeater" && <span className="text-muted-foreground ml-1">(header + body, multi-column)</span>}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Font Uploader */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Upload className="h-3.5 w-3.5" />
                Upload Font
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <label className="cursor-pointer">
                <div className="border-2 border-dashed border-border rounded-lg p-3 text-center hover:border-foreground/30 transition-colors">
                  <p className="text-[10px] text-muted-foreground">Drop TTF or OTF file</p>
                </div>
                <input
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append("file", file);
                    const res = await fetch("/api/admin/fonts", { method: "POST", body: formData });
                    const data = await res.json();
                    if (data.family) {
                      setAllFonts((prev) => [...new Set([...prev, data.family])].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())));
                      alert(`Font "${data.family}" uploaded successfully!`);
                    } else {
                      alert(data.error || "Upload failed");
                    }
                    e.target.value = "";
                  }}
                />
              </label>
            </CardContent>
          </Card>

          {/* Customer Font Bank — shows fonts available to customers (auto-built from your designs) */}
          {!collectionId && customerFonts.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Customer Font Bank ({customerFonts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-[10px] text-muted-foreground mb-2">Fonts you&apos;ve used on any design — automatically available to customers.</p>
                <div className="space-y-0.5 max-h-32 overflow-y-auto">
                  {customerFonts.map((f) => (
                    <p key={f} className="text-xs text-foreground/70" style={{ fontFamily: `'${f}', sans-serif` }}>{f}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product Thumbnail — pick from asset bank */}
          {collectionId && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Product Thumbnail
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {thumbnailUrl ? (
                  <div className="relative group">
                    <img src={thumbnailUrl} alt="Thumbnail" className="w-full rounded border border-border" />
                    <button
                      type="button"
                      onClick={() => setThumbnailUrl("")}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickingThumbnail(true)}
                      className="w-full mt-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Change thumbnail
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPickingThumbnail(true)}
                    className={`w-full border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                      pickingThumbnail ? "border-blue-400 bg-blue-50" : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <ImageIcon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground">
                      {pickingThumbnail ? "Now click an asset below..." : "Pick from asset bank"}
                    </p>
                  </button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Centre — Artboard */}
        <div className="flex-1 flex flex-col items-center">
          {isDoubleSided && (
            <div className="flex gap-2 mb-3">
              {(["front", "back"] as const).map((side) => (
                <button key={side} type="button" onClick={() => setActiveSide(side)}
                  className={`px-4 py-1 rounded text-xs border capitalize transition-colors ${activeSide === side ? "border-foreground bg-foreground text-background" : "border-border"}`}>
                  {side}
                </button>
              ))}
            </div>
          )}

          {/* Move field arrows */}
          {fields.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              {selectedFieldIndex !== null ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => moveSelectedField(-1)}>
                    <ChevronUp className="h-3 w-3 mr-1" /> Nudge Up
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => moveSelectedField(1)}>
                    <ChevronDown className="h-3 w-3 mr-1" /> Nudge Down
                  </Button>
                  <span className="text-[10px] text-muted-foreground mx-1">|</span>
                </>
              ) : null}
              <Button variant="outline" size="sm" onClick={() => setFields(fields.map((f) => ({ ...f, y_mm: Math.max(0, f.y_mm - 1) })))}>
                <ChevronUp className="h-3 w-3 mr-1" /> All Up
              </Button>
              <Button variant="outline" size="sm" onClick={() => setFields(fields.map((f) => ({ ...f, y_mm: f.y_mm + 1 })))}>
                <ChevronDown className="h-3 w-3 mr-1" /> All Down
              </Button>
            </div>
          )}

          {/* The artboard — overflow hidden clips assets at bleed edge */}
          <div
            className="relative bg-white shadow-md overflow-hidden"
            style={{ width: totalW * scale, height: totalH * scale }}
            onClick={() => { setSelectedFieldIndex(null); setSelectedAssetIndex(null); setSnapLines([]); }}
          >
            {/* Back side — TC logo file fills entire back */}
            {activeSide === "back" && (
              <img src="/TClogoA6back.webp" alt="TavernCreative back" className="absolute inset-0 w-full h-full object-fill" />
            )}
            {/* Bleed border — z-50 to always show above assets */}
            <div className="absolute border border-dashed border-red-400/80 z-50 pointer-events-none"
              style={{ left: BLEED_MM * scale, top: BLEED_MM * scale, width: artW * scale, height: artH * scale }} />
            <span className="absolute text-[8px] text-red-400/80 z-50" style={{ left: 2, top: 1 }}>
              3mm bleed
            </span>

            {/* Fold lines */}
            {fold === "half" && (
              <div className="absolute border-l border-dashed border-blue-300/60"
                style={{ left: totalW * scale / 2, top: BLEED_MM * scale, height: artH * scale }} />
            )}
            {(fold === "tri" || fold === "z") && [1, 2].map((n) => (
              <div key={n} className="absolute border-l border-dashed border-blue-300/60"
                style={{ left: (totalW * scale * n) / 3, top: BLEED_MM * scale, height: artH * scale }} />
            ))}
            {fold === "gate" && [1, 3].map((n) => (
              <div key={n} className="absolute border-l border-dashed border-blue-300/60"
                style={{ left: (totalW * scale * n) / 4, top: BLEED_MM * scale, height: artH * scale }} />
            ))}

            {/* Smart snap guide lines */}
            {snapLines.map((line, i) => (
              <div
                key={`snap-${i}`}
                className="absolute bg-cyan-400 z-30 pointer-events-none"
                style={line.axis === "x" ? {
                  left: (BLEED_MM + line.position_mm) * scale,
                  top: 0,
                  width: 1,
                  height: totalH * scale,
                } : {
                  left: 0,
                  top: (BLEED_MM + line.position_mm) * scale,
                  width: totalW * scale,
                  height: 1,
                }}
              />
            ))}

            {/* Placed design assets (front only) */}
            {activeSide === "front" && placedAssets.map((asset, i) => {
              const isSelAsset = selectedAssetIndex === i;
              return (
                <div
                  key={`asset-${i}`}
                  className={`absolute cursor-move ${isSelAsset ? "outline outline-2 outline-green-500" : "hover:outline hover:outline-1 hover:outline-green-300"}`}
                  style={{
                    left: (BLEED_MM + asset.x_mm) * scale,
                    top: (BLEED_MM + asset.y_mm) * scale,
                    width: asset.width_mm * scale,
                    height: asset.height_mm * scale,
                    transform: asset.rotation_deg ? `rotate(${asset.rotation_deg}deg)` : undefined,
                    transformOrigin: "center center",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAssetIndex(i);
                    setSelectedFieldIndex(null);
                  }}
                  onMouseDown={(e) => {
                    if ((e.target as HTMLElement).dataset.resize) return;
                    e.stopPropagation();
                    setSelectedAssetIndex(i);
                    setSelectedFieldIndex(null);
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startAssetX = asset.x_mm;
                    const startAssetY = asset.y_mm;
                    function onMove(ev: MouseEvent) {
                      const rawX = startAssetX + (ev.clientX - startX) / scale;
                      const rawY = startAssetY + (ev.clientY - startY) / scale;
                      const clamped = clampPosition(rawX, rawY, asset.width_mm, asset.height_mm);
                      const snapped = snapPosition(clamped.x, clamped.y, asset.width_mm, asset.height_mm);
                      setSnapLines(snapped.lines);
                      setPlacedAssets((prev) =>
                        prev.map((a, idx) =>
                          idx === i ? { ...a, x_mm: snapped.x, y_mm: snapped.y } : a
                        )
                      );
                    }
                    function onUp() {
                      setSnapLines([]);
                      window.removeEventListener("mousemove", onMove);
                      window.removeEventListener("mouseup", onUp);
                    }
                    window.addEventListener("mousemove", onMove);
                    window.addEventListener("mouseup", onUp);
                  }}
                >
                  <img
                    src={asset.url}
                    alt=""
                    className="w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />
                  {/* Resize handles + delete — corners only, proportional */}
                  {isSelAsset && (
                    <>
                      {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                        <div
                          key={corner}
                          data-resize="true"
                          className={`absolute w-2.5 h-2.5 bg-green-500 border border-white rounded-sm z-10 ${
                            corner === "nw" ? "cursor-nw-resize -top-1 -left-1" :
                            corner === "ne" ? "cursor-ne-resize -top-1 -right-1" :
                            corner === "sw" ? "cursor-sw-resize -bottom-1 -left-1" :
                            "cursor-se-resize -bottom-1 -right-1"
                          }`}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const mStartX = e.clientX;
                            const startW = asset.width_mm;
                            const startH = asset.height_mm;
                            const startAX = asset.x_mm;
                            const startAY = asset.y_mm;
                            const ar = asset.aspect_ratio;
                            function onMove(ev: MouseEvent) {
                              const dx = (ev.clientX - mStartX) / scale;
                              let newW = startW;
                              if (corner === "se" || corner === "ne") newW = Math.max(10, startW + dx);
                              else newW = Math.max(10, startW - dx);
                              const newH = newW / ar;
                              let newX = startAX;
                              let newY = startAY;
                              if (corner === "nw") { newX = startAX + (startW - newW); newY = startAY + (startH - newH); }
                              if (corner === "ne") { newY = startAY + (startH - newH); }
                              if (corner === "sw") { newX = startAX + (startW - newW); }
                              setPlacedAssets((prev) =>
                                prev.map((a, idx) =>
                                  idx === i ? { ...a, width_mm: newW, height_mm: newH, x_mm: newX, y_mm: newY } : a
                                )
                              );
                            }
                            function onUp() {
                              window.removeEventListener("mousemove", onMove);
                              window.removeEventListener("mouseup", onUp);
                            }
                            window.addEventListener("mousemove", onMove);
                            window.addEventListener("mouseup", onUp);
                          }}
                        />
                      ))}
                      {/* Delete button */}
                      <button
                        type="button"
                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-0.5 z-20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlacedAssets(placedAssets.filter((_, idx) => idx !== i));
                          setSelectedAssetIndex(null);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              );
            })}

            {/* Fields rendered as live text on artboard (front only) */}
            {activeSide === "front" && fields.map((field, i) => {
              const isSelected = selectedFieldIndex === i;

              // Repeater field renders differently
              if (field.field_type === "repeater") {
                const cols = field.repeater_columns || 1;
                return (
                  <div
                    key={i}
                    className={`absolute left-0 right-0 cursor-pointer transition-all ${isSelected ? "ring-2 ring-purple-500 ring-offset-1" : ""}`}
                    style={{
                      top: (BLEED_MM + field.y_mm) * scale,
                      paddingLeft: BLEED_MM * scale + 8,
                      paddingRight: BLEED_MM * scale + 8,
                    }}
                    onClick={(e) => { e.stopPropagation(); setSelectedFieldIndex(i); }}
                  >
                    <div
                      className="border border-dashed border-purple-300/60 rounded p-1"
                      style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${cols}, 1fr)`,
                        gap: 4,
                      }}
                    >
                      {Array.from({ length: cols }).map((_, c) => (
                        <div key={c} className="text-center">
                          <p style={{
                            fontFamily: `'${field.repeater_header_font || "Montserrat"}', sans-serif`,
                            fontSize: (field.repeater_header_size || 16) * scale * 0.22,
                            fontWeight: 600,
                          }} className="text-foreground/70 leading-tight">
                            Header
                          </p>
                          <p style={{
                            fontFamily: `'${field.repeater_body_font || "Montserrat"}', sans-serif`,
                            fontSize: (field.repeater_body_size || 12) * scale * 0.22,
                          }} className="text-foreground/50 leading-tight">
                            Body text here
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center mt-0.5">
                      <Plus className="h-2 w-2 text-purple-400" />
                      <span className="text-[7px] text-purple-400 ml-0.5">Customer adds more</span>
                    </div>
                  </div>
                );
              }

              // Determine text colour — highlight fields use global highlight colour
              const fieldColour = field.is_highlight_colour ? highlightColour : (field.text_colour || "#1a1a1a");

              const scaleY = field.scale_y || 1;

              // Heart field — decorative divider (SVG for perfect proportions)
              if (field.field_type === "heart") {
                const heartSize = field.font_size * scale * 0.3;
                return (
                  <div key={i}
                    className={`absolute left-0 right-0 cursor-pointer transition-all flex justify-center ${isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
                    style={{ top: (BLEED_MM + field.y_mm) * scale }}
                    onClick={(e) => { e.stopPropagation(); setSelectedFieldIndex(i); }}>
                    <svg width={heartSize} height={heartSize} viewBox="0 0 24 24" fill={fieldColour}>
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                );
              }

              // Names field — 3 lines: Name1 / connector / Name2
              if (field.field_type === "names") {
                const connector = field.names_connector || "&";
                const connectorSize = (field.names_connector_size || 18) * scale * 0.28;
                const nameSize = field.font_size * scale * 0.28;
                const connectorColour = field.names_connector_colour === "__highlight__" ? fieldColour : (field.names_connector_colour || "#1a1a1a");
                const connectorFont = field.names_connector_font || field.font_family;
                const lineSpacing = field.names_line_spacing || 1.2;
                const placeholder = field.placeholder || "Ella West & Myles Porter";
                const parts = placeholder.split(/\s*&\s*|\s*and\s*/i);
                const name1 = parts[0] || "Ella West";
                const name2 = parts[1] || "Myles Porter";

                return (
                  <div key={i}
                    className={`absolute left-0 right-0 cursor-pointer transition-all ${isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
                    style={{
                      top: (BLEED_MM + field.y_mm) * scale,
                      textAlign: "center",
                    }}
                    onClick={(e) => { e.stopPropagation(); setSelectedFieldIndex(i); }}>
                    {/* Name 1 */}
                    <p style={{
                      fontFamily: `'${field.font_family}', sans-serif`,
                      fontSize: nameSize,
                      color: fieldColour,
                      lineHeight: lineSpacing,
                      transform: scaleY !== 1 ? `scaleY(${scaleY})` : undefined,
                      WebkitTextStroke: field.text_stroke ? `${field.text_stroke * scale * 0.28}px ${fieldColour}` : undefined,
                      paintOrder: field.text_stroke ? "stroke fill" : undefined,
                    } as React.CSSProperties}>
                      {name1}
                    </p>
                    {/* Connector */}
                    <p style={{
                      fontFamily: `'${connectorFont}', sans-serif`,
                      fontSize: connectorSize,
                      color: connectorColour,
                      lineHeight: lineSpacing,
                      fontStyle: "italic",
                    }}>
                      {connector}
                    </p>
                    {/* Name 2 */}
                    <p style={{
                      fontFamily: `'${field.font_family}', sans-serif`,
                      fontSize: nameSize,
                      color: fieldColour,
                      lineHeight: lineSpacing,
                      transform: scaleY !== 1 ? `scaleY(${scaleY})` : undefined,
                      WebkitTextStroke: field.text_stroke ? `${field.text_stroke * scale * 0.28}px ${fieldColour}` : undefined,
                      paintOrder: field.text_stroke ? "stroke fill" : undefined,
                    } as React.CSSProperties}>
                      {name2}
                    </p>
                  </div>
                );
              }

              // Big Date field — stacked DD | MM | YY
              if (field.field_type === "big_date") {
                const fmt = field.big_date_format || "dmy";
                const parts = fmt === "mdy" ? ["07", "25", "28"] : ["25", "07", "28"];
                const displayDate = field.placeholder || parts.join("  |  ");
                return (
                  <div key={i}
                    className={`absolute left-0 right-0 cursor-pointer transition-all ${isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
                    style={{
                      top: (BLEED_MM + field.y_mm) * scale,
                      paddingLeft: BLEED_MM * scale + 8,
                      paddingRight: BLEED_MM * scale + 8,
                      textAlign: "center",
                    }}
                    onClick={(e) => { e.stopPropagation(); setSelectedFieldIndex(i); }}>
                    <p style={{
                      fontFamily: `'${field.font_family}', sans-serif`,
                      fontSize: field.font_size * scale * 0.28,
                      fontWeight: field.font_weight || 600,
                      letterSpacing: "0.15em",
                      color: fieldColour,
                      textTransform: field.is_uppercase ? "uppercase" : "none",
                      transform: scaleY !== 1 ? `scaleY(${scaleY})` : undefined,
                      WebkitTextStroke: field.text_stroke ? `${field.text_stroke * scale * 0.28}px ${fieldColour}` : undefined,
                      paintOrder: field.text_stroke ? "stroke fill" : undefined,
                    } as React.CSSProperties} className="leading-tight">
                      {displayDate}
                    </p>
                  </div>
                );
              }

              const displayText = field.placeholder || field.label || "Untitled";
              return (
                <div
                  key={i}
                  className={`absolute cursor-pointer transition-all ${isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
                  style={{
                    top: (BLEED_MM + field.y_mm) * scale,
                    left: `${(100 - (field.text_width_pct || 88)) / 2}%`,
                    right: `${(100 - (field.text_width_pct || 88)) / 2}%`,
                    textAlign: "center",
                  }}
                  onClick={(e) => { e.stopPropagation(); setSelectedFieldIndex(i); }}
                >
                  <p
                    className="text-foreground/80 hover:text-foreground transition-colors"
                    style={{
                      fontFamily: `'${field.font_family}', sans-serif`,
                      fontSize: field.font_size * scale * 0.28,
                      textAlign: "center",
                      textTransform: field.is_uppercase ? "uppercase" : "none",
                      fontWeight: field.font_weight || 400,
                      letterSpacing: field.letter_spacing ? `${field.letter_spacing}em` : field.is_uppercase ? "0.1em" : "normal",
                      lineHeight: field.line_spacing || 1.2,
                      whiteSpace: field.field_type === "textarea" ? "pre-wrap" : undefined,
                      color: fieldColour,
                      transform: scaleY !== 1 ? `scaleY(${scaleY})` : undefined,
                      WebkitTextStroke: field.text_stroke ? `${field.text_stroke * scale * 0.28}px ${fieldColour}` : undefined,
                      paintOrder: field.text_stroke ? "stroke fill" : undefined,
                    } as React.CSSProperties}
                  >
                    {displayText}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            {artW}×{artH}mm &middot; {isLandscape ? "Landscape" : "Portrait"} &middot; 3mm bleed
          </p>

          {/* Asset bank — only in collection context, grouped by category */}
          {collectionId && collectionAssets.length > 0 && (() => {
            // Group assets by their group field
            const grouped: Record<string, typeof collectionAssets> = {};
            for (const asset of collectionAssets) {
              const g = asset.group || "Design Assets";
              if (!grouped[g]) grouped[g] = [];
              grouped[g].push(asset);
            }

            function placeAssetOnArtboard(url: string) {
              const img = new window.Image();
              img.onload = () => {
                const ar = img.naturalWidth / img.naturalHeight;
                // Auto fit-width + align-top (includes bleed area)
                const totalW = artW + BLEED_MM * 2;
                const assetW = totalW;
                const assetH = assetW / ar;
                setPlacedAssets((prev) => [
                  ...prev,
                  {
                    url,
                    x_mm: -BLEED_MM, // Start from bleed edge
                    y_mm: -BLEED_MM, // Align to top bleed edge
                    width_mm: assetW,
                    height_mm: assetH,
                    aspect_ratio: ar,
                    rotation_deg: 0,
                    customer_move_x: false,
                    customer_move_y: false,
                    customer_nudge_limit_mm: 5,
                  },
                ]);
                setSelectedAssetIndex(placedAssets.length);
                setSelectedFieldIndex(null);
              };
              img.src = url;
            }

            return (
              <Card className="mt-6 w-full max-w-lg">
                <CardHeader className="py-3">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="h-3.5 w-3.5" />
                    {collectionName} Assets ({collectionAssets.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-[10px] text-muted-foreground mb-2">
                    {pickingThumbnail
                      ? "Click an asset to set as product thumbnail"
                      : "Click an asset to place it on the artboard"}
                  </p>
                  {Object.entries(grouped).map(([groupName, groupAssets]) => (
                    <div key={groupName} className="mb-3">
                      {Object.keys(grouped).length > 1 && (
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{groupName}</p>
                      )}
                      <div className="grid grid-cols-4 gap-2">
                        {groupAssets.map((asset, i) => (
                          <button
                            key={i}
                            type="button"
                            className={`aspect-square rounded overflow-hidden bg-muted border transition-colors ${
                              pickingThumbnail
                                ? "border-blue-300 hover:border-blue-500 ring-1 ring-blue-200"
                                : "border-border hover:border-foreground/50"
                            } ${thumbnailUrl === asset.url ? "ring-2 ring-green-500" : ""}`}
                            onClick={() => {
                              if (pickingThumbnail) {
                                setThumbnailUrl(asset.url);
                                setPickingThumbnail(false);
                              } else {
                                placeAssetOnArtboard(asset.url);
                              }
                            }}
                          >
                            <img src={asset.url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })()}

          {/* Selected asset controls */}
          {selectedAssetIndex !== null && placedAssets[selectedAssetIndex] && (() => {
            const sa = placedAssets[selectedAssetIndex];
            const updateAsset = (updates: Partial<PlacedAsset>) =>
              setPlacedAssets(placedAssets.map((a, i) => i === selectedAssetIndex ? { ...a, ...updates } : a));

            return (
              <Card className="mt-3 w-full max-w-lg">
                <CardContent className="py-3 space-y-3">
                  {/* Row 1: Fit to width + Rotation + Alignment */}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-xs h-7"
                      onClick={() => {
                        const newW = totalW; // full bleed width
                        const newH = newW / sa.aspect_ratio;
                        updateAsset({ width_mm: newW, height_mm: newH, x_mm: -BLEED_MM, y_mm: sa.y_mm });
                      }}>
                      Fit Width
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-7"
                      title={`Rotate 45° (currently ${sa.rotation_deg || 0}°)`}
                      onClick={() => {
                        const next = ((sa.rotation_deg || 0) + 45) % 360;
                        updateAsset({ rotation_deg: next });
                      }}>
                      ↻ {sa.rotation_deg || 0}°
                    </Button>
                    <Separator orientation="vertical" className="h-5" />
                    {/* Align buttons — all relative to bleed edge (0,0 is bleed origin) */}
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Align Left (bleed edge)"
                      onClick={() => updateAsset({ x_mm: -BLEED_MM })}>
                      <span className="text-[10px] font-mono">L</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Centre Horizontal"
                      onClick={() => updateAsset({ x_mm: (artW - sa.width_mm) / 2 })}>
                      <span className="text-[10px] font-mono">CH</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Align Right (bleed edge)"
                      onClick={() => updateAsset({ x_mm: artW - sa.width_mm + BLEED_MM })}>
                      <span className="text-[10px] font-mono">R</span>
                    </Button>
                    <Separator orientation="vertical" className="h-5" />
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Align Top (bleed edge)"
                      onClick={() => updateAsset({ y_mm: -BLEED_MM })}>
                      <span className="text-[10px] font-mono">T</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Centre Vertical"
                      onClick={() => updateAsset({ y_mm: (artH - sa.height_mm) / 2 })}>
                      <span className="text-[10px] font-mono">CV</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Align Bottom (bleed edge)"
                      onClick={() => updateAsset({ y_mm: artH - sa.height_mm + BLEED_MM })}>
                      <span className="text-[10px] font-mono">B</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" title="Delete"
                      onClick={() => { setPlacedAssets(placedAssets.filter((_, i) => i !== selectedAssetIndex)); setSelectedAssetIndex(null); }}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>

                  {/* Row 2: Size display */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{Math.round(sa.width_mm)}×{Math.round(sa.height_mm)}mm</span>
                    <span>at ({Math.round(sa.x_mm)}, {Math.round(sa.y_mm)})</span>
                  </div>

                  <Separator />

                  {/* Row 3: Customer control */}
                  <div>
                    <Label className="text-xs font-semibold">Customer Control</Label>
                    <p className="text-[10px] text-muted-foreground mb-2">
                      How much can the customer move this element?
                    </p>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input type="checkbox" checked={sa.customer_move_x}
                          onChange={(e) => updateAsset({ customer_move_x: e.target.checked })} />
                        Left/Right
                      </label>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input type="checkbox" checked={sa.customer_move_y}
                          onChange={(e) => updateAsset({ customer_move_y: e.target.checked })} />
                        Up/Down
                      </label>
                      <div className="flex items-center gap-1.5 ml-auto">
                        <Label className="text-[10px] text-muted-foreground">Limit</Label>
                        <Input type="number" className="h-7 w-16 text-xs" value={sa.customer_nudge_limit_mm}
                          onChange={(e) => updateAsset({ customer_nudge_limit_mm: Number(e.target.value) })} />
                        <span className="text-[10px] text-muted-foreground">mm</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>

        {/* Right sidebar — field properties */}
        <div className="w-56 shrink-0">
          {selectedField ? (
            <Card>
              <CardHeader className="py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {selectedField.field_type === "repeater" ? "Repeater Properties" : "Field Properties"}
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeField(selectedFieldIndex!)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {selectedField.field_type === "repeater" ? (
                  /* Repeater-specific properties */
                  <>
                    <div>
                      <Label className="text-xs">Section Label</Label>
                      <Input
                        value={selectedField.label}
                        onChange={(e) => updateField(selectedFieldIndex!, { label: e.target.value })}
                        className="h-8 text-sm"
                        placeholder="e.g., Wedding Party"
                      />
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-xs">Columns</Label>
                      <div className="flex gap-1 mt-1">
                        {([1, 2, 3] as const).map((cols) => (
                          <button key={cols} type="button"
                            onClick={() => updateField(selectedFieldIndex!, { repeater_columns: cols })}
                            className={`flex-1 py-1.5 rounded text-xs border flex items-center justify-center gap-1 transition-colors ${
                              selectedField.repeater_columns === cols
                                ? "border-foreground bg-foreground text-background"
                                : "border-border hover:border-foreground/50"
                            }`}>
                            {cols}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-xs font-semibold">Header Style</Label>
                    </div>
                    <div>
                      <Label className="text-xs">Font</Label>
                      <Select value={selectedField.repeater_header_font || "Montserrat"}
                        onValueChange={(v) => updateField(selectedFieldIndex!, { repeater_header_font: v })}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <div className="px-2 pb-1.5 pt-1 sticky top-0 bg-white z-10" onPointerDown={(e) => e.stopPropagation()}><Input placeholder="Search fonts..." value={fontSearch} onChange={(e) => setFontSearch(e.target.value)} className="h-7 text-xs" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} /></div>
                          {getFilteredFonts(selectedField?.font_family || "Montserrat").map((f) => (
                            <SelectItem key={f} value={f}>
                              <span style={{ fontFamily: `'${f}', sans-serif` }}>{f}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Size</Label>
                      <Input type="number" value={selectedField.repeater_header_size || 16}
                        onChange={(e) => updateField(selectedFieldIndex!, { repeater_header_size: Number(e.target.value) })}
                        className="h-8 text-sm" />
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-xs font-semibold">Body Style</Label>
                    </div>
                    <div>
                      <Label className="text-xs">Font</Label>
                      <Select value={selectedField.repeater_body_font || "Montserrat"}
                        onValueChange={(v) => updateField(selectedFieldIndex!, { repeater_body_font: v })}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <div className="px-2 pb-1.5 pt-1 sticky top-0 bg-white z-10" onPointerDown={(e) => e.stopPropagation()}><Input placeholder="Search fonts..." value={fontSearch} onChange={(e) => setFontSearch(e.target.value)} className="h-7 text-xs" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} /></div>
                          {getFilteredFonts(selectedField?.font_family || "Montserrat").map((f) => (
                            <SelectItem key={f} value={f}>
                              <span style={{ fontFamily: `'${f}', sans-serif` }}>{f}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Size</Label>
                      <Input type="number" value={selectedField.repeater_body_size || 12}
                        onChange={(e) => updateField(selectedFieldIndex!, { repeater_body_size: Number(e.target.value) })}
                        className="h-8 text-sm" />
                    </div>
                    <Separator />
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" checked={selectedField.is_required}
                        onChange={(e) => updateField(selectedFieldIndex!, { is_required: e.target.checked })} />
                      Required field
                    </label>
                  </>
                ) : (
                  /* Standard field properties */
                  <>
                    <div>
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={selectedField.label}
                        onChange={(e) => updateField(selectedFieldIndex!, { label: e.target.value })}
                        className="h-8 text-sm"
                        placeholder="e.g., Your Names"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Placeholder</Label>
                      {selectedField.field_type === "textarea" ? (
                        <textarea
                          value={selectedField.placeholder}
                          onChange={(e) => updateField(selectedFieldIndex!, { placeholder: e.target.value })}
                          className="w-full text-sm border rounded px-2 py-1.5 min-h-[60px] resize-y"
                          placeholder="e.g., Request the pleasure&#10;of your company"
                        />
                      ) : (
                      <Input
                        value={selectedField.placeholder}
                        onChange={(e) => updateField(selectedFieldIndex!, { placeholder: e.target.value })}
                        className="h-8 text-sm"
                        placeholder="e.g., Emily & James"
                      />
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select value={selectedField.field_type}
                        onValueChange={(v) => updateField(selectedFieldIndex!, { field_type: v as ExtendedFieldType })}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {fieldTypes.filter((ft) => ft.type !== "repeater").map(({ type, label }) => (
                            <SelectItem key={type} value={type}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-xs">Font</Label>
                      <Select value={selectedField.font_family}
                        onValueChange={(v) => updateField(selectedFieldIndex!, { font_family: v })}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <div className="px-2 pb-1.5 pt-1 sticky top-0 bg-white z-10" onPointerDown={(e) => e.stopPropagation()}><Input placeholder="Search fonts..." value={fontSearch} onChange={(e) => setFontSearch(e.target.value)} className="h-7 text-xs" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} /></div>
                          {getFilteredFonts(selectedField?.font_family || "Montserrat").map((f) => (
                            <SelectItem key={f} value={f}>
                              <span style={{ fontFamily: `'${f}', sans-serif` }}>{f}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Font Size</Label>
                      <Input type="number" value={selectedField.font_size}
                        onChange={(e) => updateField(selectedFieldIndex!, { font_size: Number(e.target.value) })}
                        className="h-8 text-sm" />
                    </div>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" checked={selectedField.is_uppercase || false}
                        onChange={(e) => updateField(selectedFieldIndex!, { is_uppercase: e.target.checked })} />
                      Uppercase
                    </label>
                    {/* Vertical squeeze/stretch */}
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Height</Label>
                        <span className="text-[10px] text-muted-foreground">{Math.round((selectedField.scale_y || 1) * 100)}%</span>
                      </div>
                      <input type="range" min="50" max="150" step="5"
                        value={Math.round((selectedField.scale_y || 1) * 100)}
                        onChange={(e) => updateField(selectedFieldIndex!, { scale_y: Number(e.target.value) / 100 })}
                        className="w-full h-1.5 mt-1" />
                    </div>
                    {/* Text width */}
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Text Width</Label>
                        <span className="text-[10px] text-muted-foreground">{selectedField.text_width_pct || 88}%</span>
                      </div>
                      <input type="range" min="20" max="100" step="2"
                        value={selectedField.text_width_pct || 88}
                        onChange={(e) => updateField(selectedFieldIndex!, { text_width_pct: Number(e.target.value) })}
                        className="w-full h-1.5 mt-1" />
                    </div>
                    {/* Kerning (letter spacing) */}
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Kerning</Label>
                        <span className="text-[10px] text-muted-foreground">{((selectedField.letter_spacing || 0) * 100).toFixed(0)}%</span>
                      </div>
                      <input type="range" min="-5" max="50" step="1"
                        value={Math.round((selectedField.letter_spacing || 0) * 100)}
                        onChange={(e) => updateField(selectedFieldIndex!, { letter_spacing: Number(e.target.value) / 100 })}
                        className="w-full h-1.5 mt-1" />
                    </div>
                    {/* Stroke */}
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Stroke</Label>
                        <span className="text-[10px] text-muted-foreground">{(selectedField.text_stroke || 0).toFixed(1)}px</span>
                      </div>
                      <input type="range" min="0" max="20" step="1"
                        value={Math.round((selectedField.text_stroke || 0) * 10)}
                        onChange={(e) => updateField(selectedFieldIndex!, { text_stroke: Number(e.target.value) / 10 })}
                        className="w-full h-1.5 mt-1" />
                    </div>
                    {/* Line Spacing */}
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Line Spacing</Label>
                        <span className="text-[10px] text-muted-foreground">{(selectedField.line_spacing || 1.2).toFixed(1)}×</span>
                      </div>
                      <input type="range" min="8" max="30" step="1"
                        value={Math.round((selectedField.line_spacing || 1.2) * 10)}
                        onChange={(e) => updateField(selectedFieldIndex!, { line_spacing: Number(e.target.value) / 10 })}
                        className="w-full h-1.5 mt-1" />
                    </div>
                    <Separator />
                    {/* Colour */}
                    <div>
                      {/* Highlight toggle */}
                      <label className="flex items-center gap-2 text-xs cursor-pointer mb-2">
                        <input type="checkbox" checked={selectedField.is_highlight_colour || false}
                          onChange={(e) => updateField(selectedFieldIndex!, { is_highlight_colour: e.target.checked })}
                          className="w-3.5 h-3.5" />
                        <span>Highlight field</span>
                        {selectedField.is_highlight_colour && (
                          <span className="w-3 h-3 rounded-full border border-border ml-auto" style={{ backgroundColor: highlightColour }} />
                        )}
                      </label>
                      {/* Per-field colour (only if NOT a highlight field) */}
                      {!selectedField.is_highlight_colour && (
                        <div className="flex items-center gap-2 mb-2">
                          <input type="color" value={selectedField.text_colour || "#1a1a1a"}
                            onChange={(e) => updateField(selectedFieldIndex!, { text_colour: e.target.value })}
                            className="w-7 h-7 rounded border border-border cursor-pointer p-0" />
                          <Input value={selectedField.text_colour || "#1a1a1a"}
                            onChange={(e) => updateField(selectedFieldIndex!, { text_colour: e.target.value })}
                            className="h-7 text-xs font-mono flex-1" />
                        </div>
                      )}
                    </div>
                    {/* Big Date format toggle */}
                    {selectedField.field_type === "big_date" && (
                      <div>
                        <Label className="text-xs">Date Format</Label>
                        <div className="flex gap-2 mt-1">
                          <button type="button" onClick={() => updateField(selectedFieldIndex!, { big_date_format: "dmy" })}
                            className={`flex-1 py-1.5 rounded text-xs border transition-colors ${(selectedField.big_date_format || "dmy") === "dmy" ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/50"}`}>
                            DD | MM | YY
                          </button>
                          <button type="button" onClick={() => updateField(selectedFieldIndex!, { big_date_format: "mdy" })}
                            className={`flex-1 py-1.5 rounded text-xs border transition-colors ${selectedField.big_date_format === "mdy" ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/50"}`}>
                            MM | DD | YY
                          </button>
                        </div>
                      </div>
                    )}
                    {/* Names field — connector settings */}
                    {selectedField.field_type === "names" && (
                      <>
                        <Separator />
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Connector</p>
                        <div>
                          <Label className="text-xs">Connector Text</Label>
                          <Input value={selectedField.names_connector || "&"}
                            onChange={(e) => updateField(selectedFieldIndex!, { names_connector: e.target.value })}
                            className="h-8 text-sm" placeholder="&" />
                        </div>
                        <div>
                          <Label className="text-xs">Connector Font Size</Label>
                          <Input type="number" value={selectedField.names_connector_size || 18}
                            onChange={(e) => updateField(selectedFieldIndex!, { names_connector_size: Number(e.target.value) })}
                            className="h-8 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Connector Font</Label>
                          <Select value={selectedField.names_connector_font || selectedField.font_family}
                            onValueChange={(v) => updateField(selectedFieldIndex!, { names_connector_font: v })}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {allFonts.slice(0, 50).map((f) => (
                                <SelectItem key={f} value={f}>
                                  <span style={{ fontFamily: `'${f}', sans-serif` }}>{f}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <input type="checkbox" checked={selectedField.names_connector_colour === "__highlight__"}
                              onChange={(e) => updateField(selectedFieldIndex!, {
                                names_connector_colour: e.target.checked ? "__highlight__" : "#1a1a1a"
                              })} />
                            Connector uses highlight colour
                          </label>
                          {selectedField.names_connector_colour !== "__highlight__" && (
                            <div className="flex items-center gap-2 mt-1">
                              <input type="color" value={selectedField.names_connector_colour || "#1a1a1a"}
                                onChange={(e) => updateField(selectedFieldIndex!, { names_connector_colour: e.target.value })}
                                className="w-8 h-8 rounded border border-border cursor-pointer" />
                              <Input value={selectedField.names_connector_colour || "#1a1a1a"}
                                onChange={(e) => updateField(selectedFieldIndex!, { names_connector_colour: e.target.value })}
                                className="h-8 text-sm flex-1" />
                            </div>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs">Line Spacing</Label>
                          <div className="flex items-center gap-2">
                            <input type="range" min="0.8" max="2.5" step="0.1"
                              value={selectedField.names_line_spacing || 1.2}
                              onChange={(e) => updateField(selectedFieldIndex!, { names_line_spacing: Number(e.target.value) })}
                              className="flex-1" />
                            <span className="text-xs text-muted-foreground w-8">{selectedField.names_line_spacing || 1.2}×</span>
                          </div>
                        </div>
                      </>
                    )}
                    <Separator />
                    {/* Reorder this field */}
                    <div>
                      <Label className="text-xs">Order</Label>
                      <div className="flex gap-1 mt-1">
                        <Button variant="outline" size="sm" className="flex-1 h-7 text-xs"
                          onClick={() => moveField(selectedFieldIndex!, -1)}
                          disabled={selectedFieldIndex === 0}>
                          <ChevronUp className="h-3 w-3 mr-0.5" /> Up
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 h-7 text-xs"
                          onClick={() => moveField(selectedFieldIndex!, 1)}
                          disabled={selectedFieldIndex === fields.length - 1}>
                          <ChevronDown className="h-3 w-3 mr-0.5" /> Down
                        </Button>
                      </div>
                    </div>
                    <Separator />
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" checked={selectedField.is_required}
                        onChange={(e) => updateField(selectedFieldIndex!, { is_required: e.target.checked })} />
                      Required field
                    </label>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-xs text-muted-foreground">
                  Select a field on the artboard to edit, or add one from the left panel.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Fields list */}
          {fields.length > 0 && (
            <Card className="mt-4">
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Fields ({fields.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {fields.map((f, i) => {
                    const Icon = fieldTypeIcons[f.field_type] || Type;
                    return (
                      <button key={i} type="button" onClick={() => setSelectedFieldIndex(i)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors ${selectedFieldIndex === i ? (f.field_type === "repeater" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700") : "hover:bg-muted"}`}>
                        <Icon className="h-3 w-3 shrink-0" />
                        <span className="truncate">{f.label || "Untitled"}</span>
                        {f.field_type === "repeater" && (
                          <span className="text-[9px] text-purple-400 ml-auto">{f.repeater_columns}col</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
          {showToast}
        </div>
      )}

      {/* Save To Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowSaveTemplateModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-1">Save as Template</h3>
            <p className="text-xs text-muted-foreground mb-4">Creates a new reusable template with the current text layout and fonts. No artwork or colours.</p>
            <Input
              autoFocus
              value={saveTemplateName}
              onChange={(e) => setSaveTemplateName(e.target.value)}
              placeholder="e.g. A6 Landscape Save the Date"
              className="mb-4"
              onKeyDown={(e) => { if (e.key === "Enter" && saveTemplateName.trim()) handleSaveAsTemplate(); }}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setShowSaveTemplateModal(false); setSaveTemplateName(""); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveAsTemplate} disabled={!saveTemplateName.trim()}>
                Save Template
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
