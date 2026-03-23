"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers/cart-provider";
import { getUnitPrice, getTotal } from "@/lib/pricing";
import { X, ChevronDown, Check, Heart } from "lucide-react";

interface TemplateField {
  label: string;
  placeholder: string;
  field_type: string;
  is_required: boolean;
  sort_order: number;
  font_size: number;
  text_align: string; // contains font family
  y_mm: number;
  options: Record<string, unknown> | null;
}

interface ProductDetailsProps {
  productId: string;
  productName: string;
  productSlug: string;
  collectionName: string;
  collectionSlug: string;
  mockupImage: string | null;
  pricingTiers: { min_quantity: number; unit_price: number }[];
  basePrice: number;
  templateFields: TemplateField[];
  highlightColour: string;
  customerSwatches: string[];
}

const QTY_PRESETS = [25, 50, 75, 100, 150];

export function ProductDetails({
  productId,
  productName,
  productSlug,
  collectionName,
  collectionSlug,
  mockupImage,
  pricingTiers,
  basePrice,
  templateFields,
  highlightColour: defaultHighlightColour,
  customerSwatches,
}: ProductDetailsProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(25);
  const [customQty, setCustomQty] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [showDesigner, setShowDesigner] = useState(false);
  const [designConfirmed, setDesignConfirmed] = useState(false);

  // Categorise template fields
  const namesField = templateFields.find((f) => f.label.toLowerCase() === "names");
  const dateField = templateFields.find((f) => f.label.toLowerCase() === "date");
  const venueField = templateFields.find((f) => f.label.toLowerCase() === "venue");
  const heartField = templateFields.find((f) => f.field_type === "heart");

  // Optional wording fields — non-required text fields that aren't names/date/venue/heart
  const optionalWordingFields = templateFields.filter((f) => {
    if (f.field_type === "heart") return false;
    const l = f.label.toLowerCase();
    if (l === "names" || l === "date" || l === "venue") return false;
    return true; // includes both required and non-required text like "Save The Date", "Invitations To Follow"
  });

  // Personalisation state — initialise from template placeholders
  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [venue, setVenue] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    optionalWordingFields.forEach((f) => {
      // Pre-populate with placeholder if it exists (this is the template default)
      initial[f.label] = f.placeholder || "";
    });
    return initial;
  });
  const [showHeart, setShowHeart] = useState(!!heartField);
  const [selectedColour, setSelectedColour] = useState(defaultHighlightColour);
  const [showOptional, setShowOptional] = useState(false);

  const effectiveQty = quantity;
  const unitPrice = pricingTiers.length > 0
    ? getUnitPrice(pricingTiers, effectiveQty)
    : basePrice;
  const totalPrice = pricingTiers.length > 0
    ? getTotal(pricingTiers, effectiveQty)
    : effectiveQty * basePrice;
  const isValidQty = totalPrice !== null;

  const namesDisplay = firstName && secondName
    ? `${firstName} & ${secondName}`
    : firstName || secondName || "";

  const formatDateForCard = useCallback((dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return `${day} | ${month} | ${year}`;
  }, []);

  // Check if required fields are filled
  const canConfirm = !!(firstName && secondName && weddingDate);

  function selectPreset(qty: number) {
    setQuantity(qty);
    setIsCustom(false);
    setCustomQty("");
  }

  function handleCustomChange(val: string) {
    setCustomQty(val);
    const num = parseInt(val, 10);
    if (num > 0) {
      setQuantity(num);
      setIsCustom(true);
    }
  }

  function handleConfirmDesign() {
    setDesignConfirmed(true);
    setShowDesigner(false);

    // Swap the product image to show personalised version
    const imageContainer = document.getElementById("product-image");
    if (imageContainer) {
      const dateDisplay = formatDateForCard(weddingDate);
      // Build text overlays from ALL template fields with actual values
      let overlayHTML = "";
      for (const field of templateFields) {
        const opts = field.options || {};
        const isHighlight = opts.is_highlight_colour as boolean;
        const colour = isHighlight ? selectedColour : "#1a1a1a";
        const fontFamily = field.text_align || "Montserrat";
        const fontWeight = (opts.font_weight as number) || 400;
        const isUppercase = opts.is_uppercase as boolean;
        const scaleY = (opts.scale_y as number) || 1;
        const yPct = ((field.y_mm || 0) / 105) * 100; // 105mm = A6 height
        const fontSizePct = ((field.font_size || 14) / 105) * 100;

        let displayText = "";

        if (field.label.toLowerCase() === "names") {
          displayText = namesDisplay || field.placeholder;
        } else if (field.label.toLowerCase() === "date") {
          displayText = dateDisplay || field.placeholder;
        } else if (field.label.toLowerCase() === "venue") {
          displayText = venue || field.placeholder;
        } else if (field.field_type === "heart") {
          if (!showHeart) continue;
          overlayHTML += `<div style="position:absolute;left:0;right:0;top:${yPct}%;text-align:center;">
            <svg width="${fontSizePct * 0.45}vw" height="${fontSizePct * 0.45}vw" viewBox="0 0 24 24" fill="${colour}" style="max-width:${field.font_size * 1.5}px;max-height:${field.font_size * 1.5}px;">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>`;
          continue;
        } else {
          displayText = fieldValues[field.label] || field.placeholder;
        }

        if (!displayText) continue;

        overlayHTML += `<div style="position:absolute;left:0;right:0;top:${yPct}%;text-align:center;padding:0 8%;">
          <p style="font-family:'${fontFamily}',sans-serif;font-size:clamp(8px,${fontSizePct * 0.45}vw,${field.font_size * 1.8}px);color:${colour};font-weight:${fontWeight};${isUppercase ? "text-transform:uppercase;letter-spacing:0.1em;" : ""}${scaleY !== 1 ? `transform:scaleY(${scaleY});` : ""}line-height:1.2;">${displayText}</p>
        </div>`;
      }

      imageContainer.innerHTML = `
        <div class="relative overflow-hidden" style="box-shadow:0 4px 24px rgba(0,0,0,0.10),0 1px 4px rgba(0,0,0,0.06);">
          <img src="/designs/${collectionSlug}/preview.png" alt="${productName}" class="w-full h-auto block" />
          <div class="absolute inset-0">${overlayHTML}</div>
          <div class="absolute inset-0 pointer-events-none mix-blend-multiply" style="background-color:rgba(254,253,251,1);"></div>
          <img src="/texture-landscape.png" alt="" class="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-multiply opacity-70" />
        </div>
      `;
    }
  }

  function handleAddToCart() {
    const dateDisplay = formatDateForCard(weddingDate);
    addItem({
      productId,
      productName,
      productSlug,
      designCollectionName: collectionName,
      mockupImage,
      quantity: effectiveQty,
      unitPrice: unitPrice || basePrice,
      personalisationData: {
        Names: namesDisplay,
        Date: dateDisplay,
        Venue: venue,
        ...fieldValues,
        _highlightColour: selectedColour,
        _showHeart: showHeart ? "yes" : "no",
      },
    });
    router.push("/cart");
  }

  return (
    <div className="mt-6">
      {/* Quantity selector */}
      <div>
        <p className="text-sm font-medium mb-2">Quantity</p>
        <div className="flex flex-wrap gap-2">
          {QTY_PRESETS.map((qty) => (
            <button key={qty} type="button" onClick={() => selectPreset(qty)}
              className={`px-4 py-2 rounded-lg text-sm border transition-all ${quantity === qty && !isCustom ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40"}`}>
              {qty}
            </button>
          ))}
          <input type="number" placeholder="Custom" value={customQty}
            onChange={(e) => handleCustomChange(e.target.value)}
            onFocus={() => setIsCustom(true)}
            className={`w-20 px-3 py-2 rounded-lg text-sm border text-center transition-all outline-none ${isCustom ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/40"}`}
            min={1} />
        </div>
      </div>

      {/* Price */}
      <div className="mt-5 flex items-baseline gap-3">
        {isValidQty ? (
          <>
            <span className="text-2xl font-medium">£{totalPrice!.toFixed(2)}</span>
            {unitPrice !== null && (
              <span className="text-sm text-muted-foreground">
                {unitPrice >= 1 ? `£${unitPrice.toFixed(2)} per card` : `${(unitPrice * 100).toFixed(0)}p per card`}
              </span>
            )}
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Minimum order: {pricingTiers[0]?.min_quantity || 10} cards</span>
        )}
      </div>
      {isValidQty && <p className="text-xs text-muted-foreground mt-1.5">Includes {effectiveQty} matching envelopes</p>}

      {/* CTA */}
      {!designConfirmed ? (
        <button type="button" onClick={() => setShowDesigner(true)} disabled={!isValidQty}
          className="w-full mt-5 bg-foreground text-background py-3.5 rounded-xl text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          Begin Your Design
        </button>
      ) : (
        <div className="mt-5 space-y-2">
          <button type="button" onClick={handleAddToCart}
            className="w-full bg-foreground text-background py-3.5 rounded-xl text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2">
            <Check className="h-4 w-4" />
            Add to Cart — £{totalPrice!.toFixed(2)}
          </button>
          <button type="button" onClick={() => setShowDesigner(true)}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
            Edit your design
          </button>
        </div>
      )}

      {/* Trust signals */}
      <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-muted-foreground">
        <span>No commitment</span><span>·</span><span>Preview before you pay</span><span>·</span><span>Secure checkout</span>
      </div>

      {/* ─── DESIGN MODAL ─── */}
      {showDesigner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDesigner(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white rounded-t-2xl border-b border-border/50 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-medium">Personalise Your Design</h3>
                <p className="text-xs text-muted-foreground">{collectionName}</p>
              </div>
              <button type="button" onClick={() => setShowDesigner(false)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Names — two boxes with & */}
              <div>
                <label className="text-sm font-medium block mb-2">Your Names <span className="text-red-400">*</span></label>
                <div className="flex items-center gap-2">
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name" className="flex-1 px-3 py-2.5 rounded-lg border border-border text-sm outline-none focus:border-foreground/50 transition-colors" />
                  <span className="text-muted-foreground text-sm font-light">&amp;</span>
                  <input type="text" value={secondName} onChange={(e) => setSecondName(e.target.value)}
                    placeholder="Partner&apos;s name" className="flex-1 px-3 py-2.5 rounded-lg border border-border text-sm outline-none focus:border-foreground/50 transition-colors" />
                </div>
              </div>

              {/* Date picker */}
              <div>
                <label className="text-sm font-medium block mb-2">Wedding Date <span className="text-red-400">*</span></label>
                <input type="date" value={weddingDate} onChange={(e) => setWeddingDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none focus:border-foreground/50 transition-colors" />
              </div>

              {/* Venue */}
              {venueField && (
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Venue / Location {venueField.is_required && <span className="text-red-400">*</span>}
                  </label>
                  <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)}
                    placeholder={venueField.placeholder || "e.g. Solton Manor, Dover"}
                    className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none focus:border-foreground/50 transition-colors" />
                </div>
              )}

              {/* Optional Wording — collapsed */}
              {optionalWordingFields.length > 0 && (
                <div className="border-t border-border/50 pt-4">
                  <button type="button" onClick={() => setShowOptional(!showOptional)}
                    className="flex items-center justify-between w-full text-sm font-medium hover:text-foreground transition-colors">
                    <span>Optional Wording</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showOptional ? "rotate-180" : ""}`} />
                  </button>
                  {showOptional && (
                    <div className="mt-3 space-y-3">
                      {optionalWordingFields.map((field) => (
                        <div key={field.label}>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-muted-foreground">{field.label}</label>
                            {fieldValues[field.label] && (
                              <button type="button" onClick={() => setFieldValues({ ...fieldValues, [field.label]: "" })}
                                className="text-[10px] text-muted-foreground hover:text-red-400 transition-colors">
                                Remove
                              </button>
                            )}
                          </div>
                          <input type="text" value={fieldValues[field.label] || ""}
                            onChange={(e) => setFieldValues({ ...fieldValues, [field.label]: e.target.value })}
                            placeholder={field.placeholder || `Add ${field.label.toLowerCase()}...`}
                            className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:border-foreground/50 transition-colors" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Heart toggle */}
              {heartField && (
                <div className="flex items-center justify-between border-t border-border/50 pt-4">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-muted-foreground" fill={showHeart ? selectedColour : "none"} stroke={showHeart ? selectedColour : "currentColor"} />
                    <span className="text-sm">Show heart</span>
                  </div>
                  <button type="button" onClick={() => setShowHeart(!showHeart)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${showHeart ? "bg-foreground" : "bg-muted"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${showHeart ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
              )}

              {/* Colour swatches */}
              {customerSwatches.length > 0 && (
                <div className="border-t border-border/50 pt-4">
                  <label className="text-sm font-medium block mb-2">Accent Colour</label>
                  <div className="flex flex-wrap gap-2.5">
                    {customerSwatches.map((hex) => (
                      <button key={hex} type="button" onClick={() => setSelectedColour(hex)}
                        className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${selectedColour === hex ? "border-foreground scale-110 shadow-md" : "border-transparent shadow-sm"}`}
                        style={{ backgroundColor: hex }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white rounded-b-2xl border-t border-border/50 px-6 py-4">
              <button type="button" onClick={handleConfirmDesign} disabled={!canConfirm}
                className="w-full bg-foreground text-background py-3 rounded-xl text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Confirm Design
              </button>
              {!canConfirm && (
                <p className="text-[11px] text-muted-foreground text-center mt-2">
                  Enter both names and your wedding date to continue
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
