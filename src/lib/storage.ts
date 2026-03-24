/**
 * Supabase Storage URL helpers.
 * All design assets and fonts are stored in Supabase Storage buckets.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

/** Get public URL for a design asset (images in the design-assets bucket) */
export function getDesignAssetUrl(path: string): string {
  // If already a full URL, return as-is
  if (path.startsWith("http")) return path;
  // Strip leading /designs/ if present (legacy local path format)
  const clean = path.replace(/^\/designs\//, "");
  return `${SUPABASE_URL}/storage/v1/object/public/design-assets/${clean}`;
}

/** Get public URL for a font file */
export function getFontUrl(filename: string): string {
  if (filename.startsWith("http")) return filename;
  return `${SUPABASE_URL}/storage/v1/object/public/fonts/${encodeURIComponent(filename)}`;
}

/** Get the preview image URL for a collection (clean artwork, no text) */
export function getCollectionPreviewUrl(slug: string): string {
  return getDesignAssetUrl(`${slug}/preview.webp`);
}

/** Get the product image URL for a collection (with text) */
export function getCollectionProductUrl(slug: string): string {
  return getDesignAssetUrl(`${slug}/product.webp`);
}

/** Get the thumbnail URL for a collection */
export function getCollectionThumbnailUrl(slug: string): string {
  return getDesignAssetUrl(`${slug}/thumbnail.webp`);
}

/** Get the texture overlay URL */
export function getTextureUrl(): string {
  return getDesignAssetUrl("texture-landscape.webp");
}

/** Get the back design URL (landscape or portrait) */
export function getBackDesignUrl(orientation: "landscape" | "portrait"): string {
  return getDesignAssetUrl(`back-${orientation}.png`);
}
