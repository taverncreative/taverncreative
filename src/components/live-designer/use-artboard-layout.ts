import { useMemo } from "react";
import type { DesignerField, ComputedField } from "./types";

const RENDER_MULTIPLIER = 0.28;
const MAX_GAP_RATIO = 0.06;
const MIN_GAP_PX = 4;

interface LayoutInput {
  fields: DesignerField[];
  containerWidth: number;
  containerHeight: number;
  artWidthMm: number;
  artHeightMm: number;
  customerValues: Record<string, string>;
  showHeart: boolean;
  selectedColour: string;
  highlightColour: string;
  fontsReady: boolean;
  loadVersion: number;
  measure: (
    text: string,
    fontFamily: string,
    fontSize: number,
    fontWeight: number,
    isUppercase: boolean,
    letterSpacing?: number
  ) => { width: number; height: number };
}

function getDisplayText(
  field: DesignerField,
  values: Record<string, string>
): string {
  const val = values[field.label];
  if (val) return val;
  return field.placeholder || field.label;
}

/**
 * Check if a font is actually available for rendering.
 * Returns false if the font hasn't loaded yet.
 */
function isFontAvailable(fontFamily: string, fontSize: number): boolean {
  try {
    return document.fonts.check(`${Math.round(fontSize)}px '${fontFamily}'`);
  } catch {
    return false;
  }
}

/**
 * Conservative width estimate when font isn't loaded yet.
 * Script/decorative fonts are typically wider than sans-serif,
 * so we estimate generously to ensure shrink triggers.
 */
function estimateWidth(
  text: string,
  fontSize: number,
  isUppercase: boolean
): number {
  const t = isUppercase ? text.toUpperCase() : text;
  // Average character width ≈ 0.6× font size for proportional fonts
  // Script fonts can be wider (0.7×), so use 0.65 as safe middle
  return t.length * fontSize * 0.65;
}

export function useArtboardLayout({
  fields,
  containerWidth,
  containerHeight,
  artWidthMm,
  customerValues,
  showHeart,
  selectedColour,
  highlightColour,
  fontsReady,
  loadVersion,
  measure,
  artHeightMm,
}: LayoutInput): ComputedField[] {
  return useMemo(() => {
    if (containerWidth <= 0 || containerHeight <= 0) return [];

    const visibleFields = fields.filter((f) => {
      if (f.field_type === "heart" && !showHeart) return false;
      return true;
    });

    // Phase 1: Compute base font sizes, measure, and auto-shrink
    const measured = visibleFields.map((field, i) => {
      const text = getDisplayText(field, customerValues);
      const baseFontPx =
        field.font_size * RENDER_MULTIPLIER * containerWidth / artWidthMm;
      const fontWeight = field.font_weight || 400;
      const isUppercase = !!field.is_uppercase;
      const fontFamily = field.font_family || "Montserrat";
      const defaultWidthPct = 0.70;
      let widthPct = field.text_width_pct || defaultWidthPct;
      // DB stores as percentage (e.g., 74), convert to decimal if > 1
      if (widthPct > 1) widthPct = widthPct / 100;
      const allowedWidth = containerWidth * widthPct;

      if (field.field_type === "heart") {
        const heartSize = Math.max(baseFontPx * 0.6, 10);
        return {
          index: i,
          label: field.label,
          text: "♥",
          fontFamily,
          baseFontPx,
          finalFontPx: heartSize,
          fontWeight,
          isUppercase: false,
          scaleY: field.scale_y || 1,
          colour: field.is_highlight_colour
            ? selectedColour || highlightColour
            : field.text_colour || "#1a1a1a",
          fieldType: field.field_type,
          renderedWidth: heartSize,
          renderedHeight: heartSize * 1.2,
          computedY: 0,
          letterSpacing: 0,
          textStroke: 0,
        };
      }

      let finalFontPx = baseFontPx;
      let measuredWidth: number;
      let measuredHeight: number;

      // Check if the actual font is loaded
      const fontReady = isFontAvailable(fontFamily, baseFontPx);

      if (fontReady) {
        // Font is loaded — use real measurement (include kerning)
        const m = measure(text, fontFamily, baseFontPx, fontWeight, isUppercase, field.letter_spacing);
        measuredWidth = m.width;
        measuredHeight = m.height;
      } else {
        // Font NOT loaded — use conservative estimate that will trigger shrink
        measuredWidth = estimateWidth(text, baseFontPx, isUppercase);
        measuredHeight = baseFontPx * 1.3;
      }

      // Auto-shrink: if text exceeds allowed width, reduce font size
      if (measuredWidth > allowedWidth && !field.allow_wrap && measuredWidth > 0) {
        const ratio = allowedWidth / measuredWidth;
        finalFontPx = Math.max(baseFontPx * ratio, baseFontPx * 0.3);
      }

      // Re-measure at final size for accurate height
      if (finalFontPx !== baseFontPx && fontReady) {
        const final = measure(text, fontFamily, finalFontPx, fontWeight, isUppercase, field.letter_spacing);
        measuredHeight = final.height;
      } else if (finalFontPx !== baseFontPx) {
        measuredHeight = finalFontPx * 1.3;
      }

      const renderedHeight = measuredHeight * (field.scale_y || 1);

      return {
        index: i,
        label: field.label,
        text,
        fontFamily,
        baseFontPx,
        finalFontPx,
        fontWeight,
        isUppercase,
        scaleY: field.scale_y || 1,
        colour: field.is_highlight_colour
          ? selectedColour || highlightColour
          : field.text_colour || "#1a1a1a",
        fieldType: field.field_type,
        renderedWidth: measuredWidth,
        renderedHeight,
        computedY: 0,
        letterSpacing: field.letter_spacing || 0,
        textStroke: field.text_stroke || 0,
      };
    });

    // Phase 2: Position using admin Y coordinates (y_mm → pixels)
    // The customer sees exactly what the admin designed
    const BLEED_MM = 3;
    const totalH = artHeightMm + BLEED_MM * 2;
    const pxPerMm = containerHeight / artHeightMm;

    for (let idx = 0; idx < measured.length; idx++) {
      const field = measured[idx];
      const sourceField = visibleFields[idx];
      // Convert y_mm to pixels, accounting for bleed offset
      // Admin y_mm is relative to the bleed area, customer artboard shows card only (no bleed)
      // So subtract bleed to get position relative to card edge
      const yMm = sourceField.y_mm || 0;
      field.computedY = Math.max(0, (yMm - BLEED_MM) * pxPerMm);
    }

    return measured;
  }, [
    fields,
    containerWidth,
    containerHeight,
    artWidthMm,
    customerValues,
    showHeart,
    selectedColour,
    highlightColour,
    fontsReady,
    loadVersion,
    measure,
    artHeightMm,
  ]);
}
