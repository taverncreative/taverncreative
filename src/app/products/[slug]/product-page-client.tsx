"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useCart } from "@/components/providers/cart-provider";
import { getUnitPrice, getTotal } from "@/lib/pricing";
import {
  ChevronDown, Check, Heart, Sparkles, Clock, Truck, Palette, BookOpen,
  ArrowLeft, Share2, Bookmark, Save, X,
} from "lucide-react";
import type { DesignerField } from "@/components/live-designer/types";

const LiveDesigner = dynamic(
  () => import("@/components/live-designer/live-designer"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full aspect-[148/105] bg-muted/30 animate-pulse rounded-sm" />
    ),
  }
);

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

const DOUBLE_SIDED_SURCHARGE = 0.18;
const QTY_PRESETS = [25, 50, 75, 100, 150];

interface ProductPageClientProps {
  productId: string;
  productName: string;
  productSlug: string;
  collectionName: string;
  collectionSlug: string;
  styleDesc: string;
  designerFields: DesignerField[];
  artWidthMm: number;
  artHeightMm: number;
  highlightColour: string;
  customerSwatches: string[];
  pricingTiers: { min_quantity: number; unit_price: number }[];
  basePrice: number;
}

export function ProductPage({
  productId, productName, productSlug, collectionName, collectionSlug, styleDesc,
  designerFields, artWidthMm, artHeightMm, highlightColour, customerSwatches,
  pricingTiers, basePrice,
}: ProductPageClientProps) {
  const router = useRouter();
  const { addItem } = useCart();

  // Mode
  const [mode, setMode] = useState<"browse" | "personalise">("browse");

  // Quantity
  const [quantity, setQuantity] = useState(25);
  const [customQty, setCustomQty] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [customFocused, setCustomFocused] = useState(false);

  // Personalisation
  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [dateFormatUS, setDateFormatUS] = useState(false);
  const [venue, setVenue] = useState("");
  const [showHeart, setShowHeart] = useState(!!designerFields.find((f) => f.field_type === "heart"));
  const [selectedColour, setSelectedColour] = useState(highlightColour);
  const [showOptional, setShowOptional] = useState(false);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [designSwatches, setDesignSwatches] = useState<string[]>([]);
  const [toast, setToast] = useState("");

  // Double-sided
  const [isDoubleSided, setIsDoubleSided] = useState(false);
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [backRepeaters, setBackRepeaters] = useState([{ title: "", body: "" }]);
  const [backColumns, setBackColumns] = useState(1);

  // Back overflow estimation
  const totalBackChars = backRepeaters.reduce((sum, r) => sum + (r.title?.length || 0) + (r.body?.length || 0), 0);
  const sectionCount = backRepeaters.filter(r => r.title || r.body).length;
  const estimatedFill = backColumns === 2
    ? sectionCount * 0.05 + totalBackChars * 0.0005
    : sectionCount * 0.08 + totalBackChars * 0.0006;
  const backFillRatio = Math.min(estimatedFill, 1.5);
  const backIsWarning = backFillRatio > 0.75;
  const backIsOverflow = backFillRatio > 0.90;
  const shrinkFactor = backFillRatio > 0.6 ? Math.max(0.75, 1 - (backFillRatio - 0.6) * 0.6) : 1;
  const backTitleSize = Math.max(11, 14 * shrinkFactor);
  const backBodySize = Math.max(10, 12 * shrinkFactor);

  // Split fields into: special types (handled separately), required text, optional text
  const isSpecialField = (f: DesignerField) =>
    f.field_type === "heart" || f.field_type === "tri_details" || f.field_type === "big_date" ||
    f.label.toLowerCase() === "names" || f.label.toLowerCase() === "date" || f.label.toLowerCase() === "venue";

  const requiredTextFields = designerFields.filter((f) => f.is_required && !isSpecialField(f));
  const optionalWordingFields = designerFields.filter((f) => !f.is_required && !isSpecialField(f) && f.field_type !== "heart");

  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    [...requiredTextFields, ...optionalWordingFields].forEach((f) => { initial[f.label] = f.placeholder || ""; });
    return initial;
  });

  // Pricing
  const baseTierPrice = pricingTiers.length > 0 ? getUnitPrice(pricingTiers, quantity) : basePrice;
  const effectiveUnitPrice = (baseTierPrice || basePrice) + (isDoubleSided ? DOUBLE_SIDED_SURCHARGE : 0);
  const baseCardPrice = baseTierPrice || basePrice;
  const totalPrice = effectiveUnitPrice * quantity;
  const isValidQty = pricingTiers.length > 0 ? getTotal(pricingTiers, quantity) !== null : quantity > 0;

  // Customer values for artboard
  const namesDisplay = firstName && secondName ? `${firstName} & ${secondName}` : firstName || secondName || "";
  const formatDateForCard = useCallback((dateStr: string, usFormat: boolean) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return usFormat ? `${month} | ${day} | ${year}` : `${day} | ${month} | ${year}`;
  }, []);
  const customerValues: Record<string, string> = { ...fieldValues };
  if (namesDisplay) customerValues["Names"] = namesDisplay;
  if (weddingDate) customerValues["Date"] = formatDateForCard(weddingDate, dateFormatUS);
  if (venue) customerValues["Venue"] = venue;

  const hasVenueField = !!designerFields.find((f) => f.label.toLowerCase() === "venue");
  const hasHeartField = !!designerFields.find((f) => f.field_type === "heart");
  const triDetailsField = designerFields.find((f) => f.field_type === "tri_details");

  // Build tri_details combined text for the artboard
  if (triDetailsField) {
    const parts: string[] = [];
    if (namesDisplay) parts.push(namesDisplay);
    if (weddingDate) {
      const d = new Date(weddingDate);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = String(d.getFullYear()).slice(-2);
      parts.push(dateFormatUS ? `${month}.${day}.${year}` : `${day}.${month}.${year}`);
    }
    if (venue) parts.push(venue);
    if (parts.length > 0) {
      customerValues[triDetailsField.label] = parts.join("  |  ");
    }
  }

  function handleArtboardFieldClick(fieldLabel: string) {
    if (mode === "browse") { setMode("personalise"); }
    setHighlightedField(fieldLabel);
    const isOptional = optionalWordingFields.some((f) => f.label === fieldLabel);
    if (isOptional && !showOptional) setShowOptional(true);
    setTimeout(() => {
      const input = document.querySelector(`[data-field="${fieldLabel}"]`) as HTMLInputElement;
      if (input) { input.scrollIntoView({ behavior: "smooth", block: "center" }); input.focus(); }
    }, 150);
    setTimeout(() => setHighlightedField(null), 2000);
  }

  function handleAddToCart() {
    const hasNamesField = designerFields.some((f) => f.label.toLowerCase() === "names" || f.field_type === "tri_details");
    if (hasNamesField && (!firstName || !secondName)) { setError("Please enter both names"); return; }
    const hasDateField = designerFields.some((f) => f.label.toLowerCase() === "date" || f.field_type === "tri_details" || f.field_type === "big_date");
    if (hasDateField && !weddingDate) { setError("Please select your wedding date"); return; }
    // Check required text fields aren't still showing placeholder text
    for (const f of requiredTextFields) {
      const val = fieldValues[f.label] || "";
      if (!val || val === f.placeholder) { setError(`Please update "${f.label}"`); return; }
    }
    setError("");
    addItem({
      productId, productName, productSlug, designCollectionName: collectionName,
      collectionSlug, mockupImage: `/designs/${collectionSlug}/product.png`, quantity, unitPrice: effectiveUnitPrice,
      personalisationData: {
        Names: namesDisplay, Date: formatDateForCard(weddingDate, dateFormatUS), Venue: venue,
        ...fieldValues, _highlightColour: selectedColour, _showHeart: showHeart ? "yes" : "no",
        _doubleSided: isDoubleSided ? "yes" : "no",
        _backRepeaters: isDoubleSided ? JSON.stringify(backRepeaters) : "", _backColumns: String(backColumns),
      },
    });
    router.push("/cart");
  }

  function handleSaveFavourite() {
    const favs = JSON.parse(localStorage.getItem("tc-favourites") || "[]");
    if (!favs.some((f: { slug: string }) => f.slug === productSlug)) {
      favs.push({ slug: productSlug, name: productName, collection: collectionName });
      localStorage.setItem("tc-favourites", JSON.stringify(favs));
    }
    showToast("Saved to favourites");
  }

  function handleSaveDraft() {
    localStorage.setItem(`tc-draft-${productSlug}`, JSON.stringify({
      firstName, secondName, weddingDate, dateFormatUS, venue, showHeart, selectedColour,
      fieldValues, isDoubleSided, backRepeaters, backColumns, quantity,
    }));
    showToast("Draft saved");
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: productName, url });
    } else {
      navigator.clipboard.writeText(url);
      showToast("Link copied");
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }

  const inputHighlight = (label: string) => highlightedField === label ? "ring-2 ring-blue-400 ring-offset-1" : "";

  // ── Quantity selector (reused in both modes) ──
  const QuantitySelector = () => (
    <div>
      <p className="text-sm font-medium mb-2">Quantity</p>
      <div className="flex flex-wrap gap-2">
        {QTY_PRESETS.map((qty) => (
          <button key={qty} type="button"
            onClick={() => { setQuantity(qty); setIsCustom(false); setCustomQty(""); }}
            className={`px-4 py-2 rounded-lg text-sm border transition-all ${quantity === qty && !isCustom ? "text-white" : "border-border hover:border-foreground/40"}`}
            style={quantity === qty && !isCustom ? { backgroundColor: highlightColour, borderColor: highlightColour } : undefined}>
            {qty}
          </button>
        ))}
        <input type="text" inputMode="numeric" placeholder="Custom" value={customQty}
          onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ""); setCustomQty(v); setIsCustom(true); const n = parseInt(v, 10); if (n > 0) setQuantity(n); }}
          onFocus={() => { setIsCustom(true); setCustomFocused(true); }}
          onBlur={() => setCustomFocused(false)}
          className={`w-20 px-3 py-2 rounded-lg text-sm border text-center outline-none ${isCustom ? "border-foreground bg-foreground/5" : "border-border"}`} />
      </div>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start" suppressHydrationWarning>
        {/* ══════ LEFT COLUMN — Artboard + actions ══════ */}
        <div className="space-y-4">
          {/* Front/Back toggle */}
          {isDoubleSided && (
            <div className="flex gap-2 justify-center">
              {(["front", "back"] as const).map((side) => (
                <button key={side} type="button" onClick={() => setActiveSide(side)}
                  className={`px-5 py-1.5 rounded-lg text-xs border capitalize transition-colors ${activeSide === side ? "border-foreground bg-foreground text-background" : "border-border"}`}>
                  {side}
                </button>
              ))}
            </div>
          )}

          {/* Artboard */}
          {activeSide === "front" ? (
            <LiveDesigner
              fields={designerFields} collectionSlug={collectionSlug} collectionName={collectionName}
              artWidthMm={artWidthMm} artHeightMm={artHeightMm} highlightColour={highlightColour}
              customerSwatches={customerSwatches} customerValues={customerValues}
              showHeart={showHeart} selectedColour={selectedColour}
              onValueChange={() => {}} onColourChange={setSelectedColour}
              onSwatchesExtracted={setDesignSwatches} onFieldClick={handleArtboardFieldClick}
            />
          ) : (
            <div className="relative w-full overflow-hidden rounded-sm"
              style={{ aspectRatio: `${artWidthMm} / ${artHeightMm}`, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.08))", backgroundColor: "#faf9f7" }}>
              <img src="/texture-landscape.png" alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-multiply opacity-25" />
              <div className="relative z-[2] h-full flex flex-col items-center justify-center p-[8%] overflow-hidden">
                {isDoubleSided ? (
                  <div className={`w-full ${backColumns === 2 ? "grid grid-cols-2 gap-4" : ""}`}>
                    {backRepeaters.map((rep, i) => (
                      <div key={i} className="text-center mb-3">
                        <p className="font-semibold uppercase tracking-[0.1em]"
                          style={{ fontFamily: "'Montserrat', sans-serif", color: selectedColour, fontSize: backTitleSize, overflowWrap: "break-word" }}>
                          {rep.title || "Title"}
                        </p>
                        <p className="text-gray-600 mt-1 leading-relaxed"
                          style={{ fontFamily: "'Montserrat', sans-serif", fontSize: backBodySize, overflowWrap: "break-word", wordBreak: "break-word" }}>
                          {rep.body || "Your text here..."}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <img src="/TClogoA6back.png" alt="TavernCreative" className="w-full h-full object-contain absolute inset-0 opacity-30" />
                )}
              </div>
            </div>
          )}

          {/* Spec pills beneath artboard */}
          <div className="flex justify-center gap-2">
            {["300gsm Card", "A6", "Personalised", "Envelopes"].map((pill) => (
              <span key={pill} className="text-xs px-4 py-1.5 rounded-full border text-muted-foreground" style={{ borderColor: highlightColour + "40" }}>{pill}</span>
            ))}
          </div>

          {/* Save / Draft / Share */}
          <div className="flex items-center justify-center gap-6">
            <button type="button" onClick={handleSaveFavourite} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Bookmark className="h-3.5 w-3.5" /> Save
            </button>
            <button type="button" onClick={handleSaveDraft} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Save className="h-3.5 w-3.5" /> Save Draft
            </button>
            <button type="button" onClick={handleShare} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
          </div>
        </div>

        {/* ══════ RIGHT COLUMN — Browse or Personalise ══════ */}
        <div>
          {mode === "browse" ? (
            /* ── BROWSE MODE ── */
            <div className="space-y-7">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">{collectionName} Collection</p>
                <h1 className="text-2xl sm:text-3xl font-medium tracking-tight mb-3">{productName}</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Announce your wedding with our stunning {collectionName} design, featuring {styleDesc}. Personalise with your names, date and venue for a design that&apos;s uniquely yours.
                </p>
              </div>

              <QuantitySelector />

              <div className="flex items-baseline gap-3">
                {isValidQty || customFocused ? (
                  <>
                    <span className="text-2xl font-medium">£{totalPrice.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground italic">
                      {effectiveUnitPrice >= 1 ? `£${effectiveUnitPrice.toFixed(2)} per card` : `${(effectiveUnitPrice * 100).toFixed(0)}p per card`}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Minimum order: {pricingTiers[0]?.min_quantity || 10} cards</span>
                )}
              </div>

              <button type="button" onClick={() => setMode("personalise")} disabled={!isValidQty}
                className="w-1/2 text-white py-3.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: highlightColour }}>
                Personalise Design
              </button>

              <div className="space-y-4 pt-2">
                {[
                  { icon: Palette, title: "Design it your way", desc: "Personalise fonts, colours, and wording to match your wedding" },
                  { icon: Sparkles, title: "Premium quality", desc: "Printed on luxurious 300gsm card stock with a smooth, tactile finish" },
                  { icon: Clock, title: "Fast turnaround", desc: "Dispatched within 3-5 working days of approving your design" },
                  { icon: Truck, title: "Free delivery", desc: "Complimentary UK delivery on all orders over £50" },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border/50 divide-y divide-border/50">
                {[
                  { title: "Product Details", content: `A6 (${Math.min(artWidthMm, artHeightMm)}×${Math.max(artWidthMm, artHeightMm)}mm) printed on 300gsm premium card stock with a smooth, tactile finish. Each card comes with a matching white envelope. Your personalised design is printed using professional digital printing for vibrant, long-lasting colours.` },
                  { title: "Shipping & Returns", content: "Free UK delivery on orders over £50. Standard delivery (3-5 working days) from £3.95. We're happy to reprint if there's an issue with your order — just get in touch within 14 days." },
                  { title: "How It Works", content: "1. Personalise your design with your names, date and venue. 2. Choose your quantity and add to cart. 3. Complete checkout — we'll print and dispatch within 3-5 working days." },
                ].map(({ title, content }) => (
                  <details key={title} className="group">
                    <summary className="flex items-center justify-between py-4 cursor-pointer text-sm font-medium list-none">
                      {title}
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="text-xs text-muted-foreground leading-relaxed pb-4">{content}</p>
                  </details>
                ))}
              </div>
            </div>
          ) : (
            /* ── PERSONALISE MODE ── */
            <div className="space-y-4">
              <button type="button" onClick={() => setMode("browse")}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to product details
              </button>

              {/* Front-side fields — template-driven, hidden when editing back */}
              {(activeSide === "front" || !isDoubleSided) && (<div className="space-y-4">

              {/* Required fields from the template */}
              {(() => {
                const hasNamesField = designerFields.some((f) => f.label.toLowerCase() === "names" && f.field_type !== "tri_details");
                const hasDateField = designerFields.some((f) => f.label.toLowerCase() === "date" && f.field_type !== "tri_details");
                const hasTriDetails = !!triDetailsField;

                return (
                  <>
                    {/* Names input — shown if template has a Names field OR tri_details */}
                    {(hasNamesField || hasTriDetails) && (
                      <div>
                        <label className="text-sm font-medium block mb-2">Your Names <span className="text-red-400">*</span></label>
                        <div className="flex items-center gap-2">
                          <input type="text" value={firstName} data-field="Names"
                            onChange={(e) => { setFirstName(e.target.value); setError(""); }}
                            placeholder="Name one"
                            className={`flex-1 px-3 py-2.5 rounded-lg border border-border text-sm outline-none focus:border-foreground/50 transition-all ${inputHighlight("Names")}`} />
                          <span className="text-muted-foreground text-sm font-light">&amp;</span>
                          <input type="text" value={secondName}
                            onChange={(e) => { setSecondName(e.target.value); setError(""); }}
                            placeholder="Name two"
                            className={`flex-1 px-3 py-2.5 rounded-lg border border-border text-sm outline-none focus:border-foreground/50 transition-all ${inputHighlight("Names")}`} />
                        </div>
                      </div>
                    )}

                    {/* Date input — shown if template has a Date/big_date field OR tri_details */}
                    {(hasDateField || hasTriDetails || designerFields.some((f) => f.field_type === "big_date")) && (
                      <div>
                        <label className="text-sm font-medium block mb-2">Wedding Date <span className="text-red-400">*</span></label>
                        <input type="date" value={weddingDate} data-field="Date"
                          onChange={(e) => { setWeddingDate(e.target.value); setError(""); }}
                          className={`w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none focus:border-foreground/50 transition-all ${inputHighlight("Date")}`} />
                        <button type="button" onClick={() => setDateFormatUS(!dateFormatUS)}
                          className="mt-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                          {dateFormatUS ? "MM | DD | YY" : "DD | MM | YY"} — <span className="underline">switch to {dateFormatUS ? "DD | MM | YY" : "MM | DD | YY"}</span>
                        </button>
                      </div>
                    )}

                    {/* Venue/Location — shown if template has a Venue field OR tri_details */}
                    {(hasVenueField || hasTriDetails) && (
                      <div>
                        <label className="text-sm font-medium block mb-2">{hasTriDetails ? "Location" : "Additional Information"}</label>
                        <input type="text" value={venue} data-field="Venue"
                          onChange={(e) => setVenue(e.target.value)}
                          placeholder={hasTriDetails ? "e.g. Solton Manor, Dover" : "Venue, invitation to follow, location etc."}
                          className={`w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none focus:border-foreground/50 transition-all ${inputHighlight("Venue")}`} />
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Required text fields from the template (not Names/Date/Venue/special) */}
              {requiredTextFields.map((field) => (
                <div key={field.label}>
                  <label className="text-sm font-medium block mb-2">{field.label} <span className="text-red-400">*</span></label>
                  <input type="text" data-field={field.label}
                    value={fieldValues[field.label] || ""}
                    onChange={(e) => setFieldValues({ ...fieldValues, [field.label]: e.target.value })}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                    className={`w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none focus:border-foreground/50 transition-all ${inputHighlight(field.label)}`} />
                </div>
              ))}

              {/* Optional wording */}
              {optionalWordingFields.length > 0 && (
                <div className="border-t border-border/50 pt-4">
                  <button type="button" onClick={() => setShowOptional(!showOptional)}
                    className="flex items-center justify-between w-full text-sm font-medium">
                    <span>Optional Edits</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showOptional ? "rotate-180" : ""}`} />
                  </button>
                  {showOptional && (
                    <div className="mt-3 space-y-3">
                      {optionalWordingFields.map((field) => (
                        <div key={field.label}>
                          <label className="text-xs text-muted-foreground mb-1 block">{field.label}</label>
                          <input type="text" data-field={field.label}
                            value={fieldValues[field.label] || ""}
                            onChange={(e) => setFieldValues({ ...fieldValues, [field.label]: e.target.value })}
                            placeholder={field.placeholder || `Add ${field.label.toLowerCase()}...`}
                            className={`w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:border-foreground/50 transition-all ${inputHighlight(field.label)}`} />
                        </div>
                      ))}
                      {/* Heart toggle — inside Optional Edits */}
                      {hasHeartField && (
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" fill={showHeart ? selectedColour : "none"} stroke={showHeart ? selectedColour : "currentColor"} />
                            <span className="text-sm">Show heart</span>
                          </div>
                          <button type="button" onClick={() => setShowHeart(!showHeart)}
                            className={`w-10 h-5 rounded-full transition-colors relative ${showHeart ? "bg-foreground" : "bg-muted"}`}>
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${showHeart ? "left-5" : "left-0.5"}`} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Accent colour */}
              {activeSide === "front" && (
                <div className="border-t border-border/50 pt-4 space-y-3">
                  <p className="text-sm font-medium">Accent Colour</p>
                  {designSwatches.length > 0 && (
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-1.5">From this design</p>
                      <div className="flex gap-2 flex-wrap">
                        {designSwatches.map((c) => (
                          <button key={c} type="button" onClick={() => setSelectedColour(c)}
                            className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                            style={{ backgroundColor: c, borderColor: selectedColour === c ? "#000" : "transparent", transform: selectedColour === c ? "scale(1.15)" : "scale(1)" }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Popular colours</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {WEDDING_PALETTE.map(({ hex, label }) => (
                        <button key={hex} type="button" onClick={() => setSelectedColour(hex)} title={label}
                          className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                          style={{ backgroundColor: hex, borderColor: selectedColour === hex ? "#000" : "transparent", transform: selectedColour === hex ? "scale(1.15)" : "scale(1)" }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              </div>
              )}

              {/* Double-sided */}
              <div className="border-t border-border/50 pt-4">
                {!isDoubleSided ? (
                  <button type="button" onClick={() => { setIsDoubleSided(true); setActiveSide("back"); }}
                    className="w-full flex items-center justify-between py-3 px-4 rounded-xl border border-border hover:border-foreground/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Make it double-sided</span>
                    </div>
                    <span className="text-xs text-muted-foreground">+18p per card</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-foreground" />
                        <span className="text-sm font-medium">Double-sided</span>
                        <span className="text-xs text-muted-foreground">+18p per card</span>
                      </div>
                      <button type="button" onClick={() => { setIsDoubleSided(false); setActiveSide("front"); }}
                        className="text-xs text-muted-foreground hover:text-red-400 transition-colors">Remove</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Back-side inputs */}
              {activeSide === "back" && isDoubleSided && (
                <div className="space-y-3 border-t border-border/50 pt-4">
                  <div className="flex gap-2">
                    {[1, 2].map((cols) => (
                      <button key={cols} type="button" onClick={() => setBackColumns(cols)}
                        className={`px-3 py-1 rounded text-xs border transition-colors ${backColumns === cols ? "border-foreground bg-foreground text-background" : "border-border"}`}>
                        {cols} column{cols > 1 ? "s" : ""}
                      </button>
                    ))}
                  </div>
                  {backRepeaters.map((rep, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">Section {i + 1}</span>
                        {backRepeaters.length > 1 && (
                          <button type="button" onClick={() => setBackRepeaters(backRepeaters.filter((_, j) => j !== i))}
                            className="text-[10px] text-muted-foreground hover:text-red-400">Remove</button>
                        )}
                      </div>
                      <input type="text" value={rep.title}
                        onChange={(e) => { const u = [...backRepeaters]; u[i] = { ...u[i], title: e.target.value }; setBackRepeaters(u); }}
                        placeholder="Title (e.g., Ceremony, Reception)"
                        className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:border-foreground/50" />
                      <textarea value={rep.body}
                        onChange={(e) => { const u = [...backRepeaters]; u[i] = { ...u[i], body: e.target.value }; setBackRepeaters(u); }}
                        placeholder="Details..." rows={2} maxLength={300}
                        className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:border-foreground/50 resize-none" />
                      {rep.body.length > 250 && <p className="text-[10px] text-muted-foreground text-right">{300 - rep.body.length} chars left</p>}
                    </div>
                  ))}
                  {backRepeaters.length < 4 && !backIsOverflow && (
                    <button type="button" onClick={() => setBackRepeaters([...backRepeaters, { title: "", body: "" }])}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors">+ Add another section</button>
                  )}
                  {backIsOverflow && <p className="text-xs text-red-500">Content exceeds printable area — shorten text or remove a section</p>}
                  {backIsWarning && !backIsOverflow && <p className="text-xs text-amber-600">Running out of space — consider shorter text</p>}
                </div>
              )}

              {/* Error */}
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}
        </div>
      </div>

      {/* ══════ FLOATING PRICE BAR (personalise mode only) ══════ */}
      {mode === "personalise" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border/50 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="text-xl font-medium" style={{ color: highlightColour }}>£{totalPrice.toFixed(2)}</span>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                <button type="button" onClick={() => setMode("browse")}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                  {quantity}× {productName} — £{(baseCardPrice * quantity).toFixed(2)}
                </button>
                {isDoubleSided && (
                  <button type="button" onClick={() => { setIsDoubleSided(false); setActiveSide("front"); }}
                    className="text-[11px] text-muted-foreground hover:text-red-400 transition-colors flex items-center gap-0.5">
                    Double-sided — +£{(DOUBLE_SIDED_SURCHARGE * quantity).toFixed(2)} <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            </div>
            <button type="button" onClick={handleAddToCart} disabled={!isValidQty}
              className="text-white px-6 sm:px-8 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 shrink-0 flex items-center gap-2"
              style={{ backgroundColor: highlightColour }}>
              <Check className="h-4 w-4" />
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-lg text-xs shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </>
  );
}
