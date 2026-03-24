"use client";

import { useState, useEffect, useRef } from "react";
import type { LiveDesignerProps } from "./types";
import { useFontLoader } from "./use-font-loader";
import { useTextMeasurement } from "./use-text-measurement";
import { useArtboardLayout } from "./use-artboard-layout";

export function LiveDesigner({
  fields,
  collectionSlug,
  collectionName,
  artWidthMm,
  artHeightMm,
  highlightColour,
  customerValues,
  showHeart,
  selectedColour,
  onColourChange,
  onSwatchesExtracted,
  onFieldClick,
}: LiveDesignerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const fontFamilies = Array.from(
    new Set(fields.map((f) => f.font_family).filter(Boolean))
  );
  const { fontsReady, loadVersion } = useFontLoader(fontFamilies);
  const measure = useTextMeasurement();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize((prev) => {
          if (prev.width === width && prev.height === height) return prev;
          return { width, height };
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const computed = useArtboardLayout({
    fields,
    containerWidth: containerSize.width,
    containerHeight: containerSize.height,
    artWidthMm,
    artHeightMm,
    customerValues,
    showHeart,
    selectedColour,
    highlightColour,
    fontsReady,
    loadVersion,
    measure,
  });

  // Extract contextual swatches from artwork — up to 8
  useEffect(() => {
    if (!onSwatchesExtracted) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 150;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      const buckets: Record<string, { r: number; g: number; b: number; count: number }> = {};
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (luminance > 0.75) continue;
        if (luminance < 0.08) continue;
        const br = Math.round(r / 24) * 24;
        const bg = Math.round(g / 24) * 24;
        const bb = Math.round(b / 24) * 24;
        const key = `${br},${bg},${bb}`;
        if (!buckets[key]) buckets[key] = { r: br, g: bg, b: bb, count: 0 };
        buckets[key].count++;
      }

      const sorted = Object.values(buckets)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      const unique: string[] = [];
      for (const c of sorted) {
        const hex = `#${((1 << 24) + (Math.min(c.r, 255) << 16) + (Math.min(c.g, 255) << 8) + Math.min(c.b, 255)).toString(16).slice(1)}`;
        const isTooClose = unique.some((u) => {
          const ur = parseInt(u.slice(1, 3), 16);
          const ug = parseInt(u.slice(3, 5), 16);
          const ub = parseInt(u.slice(5, 7), 16);
          const dist = Math.sqrt((c.r - ur) ** 2 + (c.g - ug) ** 2 + (c.b - ub) ** 2);
          return dist < 45;
        });
        if (!isTooClose) unique.push(hex);
        if (unique.length >= 8) break;
      }
      onSwatchesExtracted(unique);
    };
    img.src = `/designs/${collectionSlug}/preview.webp`;
  }, [collectionSlug, onSwatchesExtracted]);

  const artworkUrl = `/designs/${collectionSlug}/preview.webp`;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-sm"
      style={{
        aspectRatio: `${artWidthMm} / ${artHeightMm}`,
        filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.08)) drop-shadow(0 1px 3px rgba(0,0,0,0.06))",
      }}
    >
      <img src={artworkUrl} alt={`${collectionName} design`}
        className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 pointer-events-none mix-blend-multiply z-[1]"
        style={{ backgroundColor: "rgba(254, 252, 248, 1)" }} />
      <img src="/texture-landscape.webp" alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-multiply opacity-15 z-[1]" />

      {computed.map((cf) => {
        if (cf.fieldType === "heart") {
          return (
            <div key={cf.label} className="absolute left-0 right-0 z-[2] cursor-pointer"
              style={{ top: cf.computedY, display: "flex", justifyContent: "center" }}
              onClick={() => onFieldClick?.(cf.label)}>
              <svg viewBox="0 0 24 24" fill={cf.colour}
                style={{ width: cf.finalFontPx, height: cf.finalFontPx }}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          );
        }

        // Only set fixed height when text has shrunk, to keep it centred in the original space
        const isShrunk = cf.finalFontPx < cf.baseFontPx * 0.95;
        const containerHeight = isShrunk ? cf.baseFontPx * 1.2 * (cf.scaleY || 1) : undefined;

        return (
          <div key={cf.label} className="absolute left-0 right-0 z-[2] cursor-pointer"
            style={{ top: cf.computedY, height: containerHeight, display: "flex", justifyContent: "center", alignItems: isShrunk ? "center" : undefined }}
            onClick={() => onFieldClick?.(cf.label)}>
            <p style={{
              fontFamily: `'${cf.fontFamily}', sans-serif`,
              fontSize: cf.finalFontPx,
              fontWeight: cf.fontWeight,
              textTransform: cf.isUppercase ? "uppercase" : "none",
              transform: cf.scaleY !== 1 ? `scaleY(${cf.scaleY})` : undefined,
              transformOrigin: "center",
              color: cf.colour,
              textAlign: "center",
              whiteSpace: "nowrap",
              lineHeight: 1.2,
              letterSpacing: cf.letterSpacing ? `${cf.letterSpacing}em` : undefined,
              WebkitTextStroke: cf.textStroke ? `${cf.textStroke * (cf.finalFontPx / cf.baseFontPx)}px ${cf.colour}` : undefined,
              paintOrder: cf.textStroke ? "stroke fill" : undefined,
              margin: 0,
              padding: 0,
            } as React.CSSProperties}>
              {cf.text}
            </p>
          </div>
        );
      })}

      {!fontsReady && containerSize.width > 0 && (
        <div className="absolute inset-0 bg-white/50 z-[3] flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

export default LiveDesigner;
