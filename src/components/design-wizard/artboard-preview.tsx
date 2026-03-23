"use client";

/**
 * Customer-facing artboard preview.
 * Shows the real design artwork with customer text overlaid.
 * `mounted` mode: fills container width, looks like a mounted card on screen.
 */

interface ArtboardPreviewProps {
  template: {
    width_mm: number;
    height_mm: number;
    bleed_mm: number;
    is_double_sided: boolean;
    fold: string;
  };
  fields: {
    label: string;
    customer_value: string;
    placeholder?: string;
    font_size: number;
    text_align: string; // contains font_family from admin
    y_mm: number;
    field_type: string;
  }[];
  collectionName: string;
  collectionSlug?: string;
  mounted?: boolean;
  fontOverride?: string;
}

export function ArtboardPreview({
  template,
  fields,
  collectionName,
  collectionSlug,
  mounted,
  fontOverride,
}: ArtboardPreviewProps) {
  const w = template.width_mm || 127;
  const h = template.height_mm || 178;
  const isLandscape = w > h;

  // Background artwork from collection
  const artworkUrl = collectionSlug
    ? `/designs/${collectionSlug}/preview.png`
    : undefined;

  if (mounted) {
    return (
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: `${w} / ${h}` }}
      >
        {/* Background artwork */}
        {artworkUrl ? (
          <img
            src={artworkUrl}
            alt={`${collectionName} design`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-white" />
        )}

        {/* Off-white warm tint */}
        <div className="absolute inset-0 pointer-events-none mix-blend-multiply z-[1]" style={{ backgroundColor: "rgba(254, 253, 251, 1)" }} />
        {/* Paper texture overlay */}
        <img
          src="/texture-landscape.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-multiply opacity-70 z-[1]"
        />

        {/* Customer text overlay */}
        {fields.map((field, i) => {
          const fontFamily = fontOverride || field.text_align || "Montserrat";
          const displayText = field.customer_value || field.placeholder || field.label;
          const fontSizePct = ((field.font_size || 14) / h) * 100;
          const yPct = ((field.y_mm || 0) / h) * 100;

          // Skip rendering if the field matches the original design text
          // (customer_value should be their actual text)
          if (!field.customer_value && artworkUrl) return null;

          return (
            <div
              key={i}
              className="absolute left-0 right-0 px-[8%]"
              style={{ top: `${yPct}%`, textAlign: "center" }}
            >
              <p
                className="leading-tight"
                style={{
                  fontFamily: `'${fontFamily}', sans-serif`,
                  fontSize: `clamp(8px, ${fontSizePct * 0.45}vw, ${field.font_size * 1.8}px)`,
                  color: "#1a1a1a",
                  textShadow: artworkUrl
                    ? "0 0 4px rgba(255,255,255,0.8), 0 0 8px rgba(255,255,255,0.6)"
                    : "none",
                }}
              >
                {displayText}
              </p>
            </div>
          );
        })}
      </div>
    );
  }

  // Non-mounted (fallback) — fixed pixel size
  const maxW = 400;
  const maxH = 500;
  const scale = Math.min(maxW / w, maxH / h);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative overflow-hidden shadow-lg"
        style={{ width: w * scale, height: h * scale }}
      >
        {artworkUrl ? (
          <img
            src={artworkUrl}
            alt={`${collectionName} design`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-white" />
        )}
        {fields.map((field, i) => {
          const fontFamily = fontOverride || field.text_align || "Montserrat";
          const fontSize = (field.font_size || 14) * scale * 0.28;
          const displayText = field.customer_value || field.placeholder || field.label;

          if (!field.customer_value && artworkUrl) return null;

          return (
            <div
              key={i}
              className="absolute left-0 right-0"
              style={{ top: (field.y_mm || 0) * scale, paddingLeft: 12, paddingRight: 12, textAlign: "center" }}
            >
              <p
                className="leading-tight"
                style={{
                  fontFamily: `'${fontFamily}', sans-serif`,
                  fontSize: Math.max(fontSize, 8),
                  color: "#1a1a1a",
                }}
              >
                {displayText}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
