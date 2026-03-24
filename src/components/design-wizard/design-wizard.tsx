"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Sparkles, Paintbrush, Heart, Zap, BookOpen, Gift, Check } from "lucide-react";
import { MonthSelector } from "./month-selector";
import { SelectionTiles } from "./selection-tiles";
import { StepContainer } from "./step-container";
import { ArtboardPreview } from "./artboard-preview";
import {
  getSeason,
  getMonthsUntil,
  getDateResponse,
  getProductResponse,
  getStyleHeading,
  getStyleResponse,
  getColourHeading,
  getColourOptions,
  getColourResponse,
  getDetailsHeading,
  getDetailsFields,
  getPreviewIntro,
  getRefineOptions,
  getRefineResponse,
  productTypeLabel,
  productTypeDescription,
} from "./wizard-copy";
import { initSound, playClick, playPop, playSuccess } from "./sound";
import { useCart } from "@/components/providers/cart-provider";
import { createClient } from "@/lib/supabase/client";

// ──────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────

interface WizardState {
  weddingDate: string;
  weddingMonthLabel: string;
  monthsUntil: number;
  season: string;
  productTypes: string[];
  currentProductType: string;
  style: string;
  colour: string;
  personalisation: Record<string, string>;
  excludeCollectionIds: string[];
}

interface MatchResult {
  collection: { id: string; name: string; slug: string; description: string };
  template: {
    id: string; name: string; slug: string; category: string;
    width_mm: number; height_mm: number; bleed_mm: number;
    is_double_sided: boolean; fold: string;
  };
  fields: { label: string; placeholder: string; customer_value: string; font_size: number; text_align: string; y_mm: number; field_type: string }[];
  pricing: { pricing_tiers: { min_quantity: number; unit_price: number }[]; pricing_upsells: { id: string; name: string; price_per_unit: number }[] } | null;
  product: { id: string; slug: string; base_price: number } | null;
  alternatives: { id: string; name: string; description: string }[];
}

type Step = "month" | "product" | "style" | "colour" | "details" | "generating" | "preview";

interface Tile { id: string; label: string; step: string; }

const STEP_ORDER: Step[] = ["month", "product", "style", "colour", "details", "generating", "preview"];
function stepIdx(s: Step) { return STEP_ORDER.indexOf(s); }

const productIcons: Record<string, typeof Calendar> = {
  save_the_dates: Calendar, invitations: BookOpen, on_the_day: Sparkles, thank_yous: Gift,
};

const styleData = [
  { id: "botanical", label: "Botanical", desc: "Lush florals and organic textures", icon: Sparkles, image: "/designs/eucalyptus/thumbnail.webp", gradient: "from-green-800/40 to-emerald-900/60" },
  { id: "minimal", label: "Minimal", desc: "Clean lines, breathing room", icon: Zap, image: "/designs/outlines/thumbnail.webp", gradient: "from-gray-700/40 to-slate-800/60" },
  { id: "modern", label: "Modern", desc: "Bold type, geometric shapes", icon: Paintbrush, image: "/designs/confetti/thumbnail.webp", gradient: "from-rose-800/40 to-pink-900/60" },
  { id: "traditional", label: "Traditional", desc: "Classic elegance", icon: BookOpen, image: "/designs/calligraphy/thumbnail.webp", gradient: "from-amber-800/40 to-yellow-900/60" },
  { id: "romantic", label: "Romantic", desc: "Soft, flowing, full of feeling", icon: Heart, image: "/designs/whimsical/thumbnail.webp", gradient: "from-pink-800/40 to-rose-900/60" },
];

const FONT_OPTIONS = ["Montserrat", "Playfair Display", "Great Vibes", "Cormorant Garamond", "Raleway"];

const stepAccents: Record<Step, string> = {
  month: "from-blue-500/5 via-transparent to-violet-500/5",
  product: "from-emerald-500/5 via-transparent to-cyan-500/5",
  style: "from-rose-500/5 via-transparent to-amber-500/5",
  colour: "from-violet-500/5 via-transparent to-pink-500/5",
  details: "from-cyan-500/5 via-transparent to-blue-500/5",
  generating: "from-violet-500/8 via-transparent to-blue-500/8",
  preview: "from-emerald-500/5 via-transparent to-cyan-500/5",
};

// ──────────────────────────────────────────
// COMPONENT
// ──────────────────────────────────────────

export function DesignWizard() {
  const router = useRouter();
  const { addItem } = useCart();
  const [step, setStep] = useState<Step>("month");
  const [direction, setDirection] = useState(1);
  const [contextMessage, setContextMessage] = useState("");
  const [state, setState] = useState<WizardState>({
    weddingDate: "", weddingMonthLabel: "", monthsUntil: 0, season: "",
    productTypes: [], currentProductType: "",
    style: "", colour: "",
    personalisation: {}, excludeCollectionIds: [],
  });
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [detailsIndex, setDetailsIndex] = useState(0);
  const [detailValue, setDetailValue] = useState("");
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [selectedFont, setSelectedFont] = useState<string | undefined>(undefined);

  useEffect(() => {
    initSound();
    prefillFromAccount();
  }, []);

  async function prefillFromAccount() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: customer } = await supabase
        .from("customers")
        .select("first_name, partner_name, wedding_date")
        .eq("id", user.id)
        .maybeSingle();

      if (!customer) return;

      const prefill: Record<string, string> = {};
      if (customer.first_name && customer.partner_name) {
        prefill.Names = `${customer.first_name} & ${customer.partner_name}`;
      }
      if (Object.keys(prefill).length > 0) {
        setState((prev) => ({ ...prev, personalisation: { ...prev.personalisation, ...prefill } }));
      }
    } catch {
      // Not logged in — that's fine
    }
  }

  function goTo(next: Step, msg?: string) {
    setDirection(stepIdx(next) >= stepIdx(step) ? 1 : -1);
    if (msg) setContextMessage(msg);
    setStep(next);
  }

  function addTile(label: string, tileStep: string) {
    setTiles((prev) => [...prev.filter((t) => t.step !== tileStep), { id: `${tileStep}-${Date.now()}`, label, step: tileStep }]);
    playPop();
  }

  function handleTileClick(tileStep: string) {
    setTiles((prev) => prev.filter((t) => stepIdx(t.step as Step) < stepIdx(tileStep as Step)));
    goTo(tileStep as Step);
  }

  // ── HANDLERS ──

  function handleMonth(label: string, dateStr: string) {
    playClick();
    const season = getSeason(dateStr);
    const monthsUntil = getMonthsUntil(dateStr);
    const s = { ...state, weddingDate: dateStr, weddingMonthLabel: label, season, monthsUntil };
    setState(s);
    addTile(label, "month");
    goTo("product", getDateResponse(s));
  }

  function handleProduct(type: string) {
    playClick();
    const s = { ...state, productTypes: [type], currentProductType: type };
    setState(s);
    addTile(productTypeLabel(type), "product");
    goTo("style", getProductResponse([type]));
  }

  function handleStyle(id: string) {
    playClick();
    const s = { ...state, style: id };
    setState(s);
    addTile(styleData.find((x) => x.id === id)?.label || id, "style");
    goTo("colour", getStyleResponse(id, s));
  }

  function handleColour(colour: string) {
    playClick();
    const s = { ...state, colour };
    setState(s);
    const opt = getColourOptions(state.style).find((c) => c.id === colour);
    addTile(opt?.label || colour, "colour");

    // If we already have personalisation data (going back from preview), skip details
    const fields = getDetailsFields(s.currentProductType);
    const allFilled = fields.every((f) => s.personalisation[f.key]);
    if (allFilled) {
      setContextMessage(getColourResponse(colour, state.style));
      goTo("generating", "Updating your design...");
      fetchMatch(s);
    } else {
      setDetailsIndex(0);
      setDetailValue(s.personalisation[fields[0]?.key] || "");
      goTo("details", getColourResponse(colour, state.style));
    }
  }

  function handleDetailSubmit() {
    if (!detailValue.trim()) return;
    playClick();
    const fields = getDetailsFields(state.currentProductType);
    const field = fields[detailsIndex];
    const newP = { ...state.personalisation, [field.key]: detailValue.trim() };
    const s = { ...state, personalisation: newP };
    setState(s);

    const nextIdx = detailsIndex + 1;
    if (nextIdx >= fields.length) {
      goTo("generating", "Creating your design...");
      fetchMatch(s);
    } else {
      setDetailsIndex(nextIdx);
      setDetailValue(s.personalisation[fields[nextIdx]?.key] || "");
    }
  }

  const fetchMatch = useCallback(async (s: WizardState) => {
    try {
      const res = await fetch("/api/design/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType: s.currentProductType,
          style: s.style,
          colour: s.colour,
          personalisation: {
            ...s.personalisation,
            Date: s.weddingDate ? new Date(s.weddingDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "",
          },
          excludeCollectionIds: s.excludeCollectionIds,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setContextMessage("Let's try adjusting your preferences.");
        goTo("style");
      } else {
        setMatch(data);
        setSelectedFont(undefined);
        setShowFontPicker(false);
        playSuccess();
        setContextMessage(getPreviewIntro({ names: s.personalisation.Names }));
        goTo("preview");
      }
    } catch {
      goTo("style", "Something went wrong. Let's try again.");
    }
  }, []);

  function handleRefine(action: string) {
    playClick();
    setContextMessage(getRefineResponse(action));
    if (action === "different_style") {
      const exc = [...state.excludeCollectionIds];
      if (match?.collection.id) exc.push(match.collection.id);
      const s = { ...state, excludeCollectionIds: exc };
      setState(s);
      goTo("generating", "Trying a different style...");
      fetchMatch(s);
    } else if (action === "different_colour") {
      handleTileClick("colour");
    } else if (action === "edit_wording") {
      setDetailsIndex(0);
      const fields = getDetailsFields(state.currentProductType);
      setDetailValue(state.personalisation[fields[0]?.key] || "");
      goTo("details", "Edit your details");
    } else if (action === "change_font") {
      setShowFontPicker(!showFontPicker);
    }
  }

  function handleFontSelect(font: string) {
    playClick();
    setSelectedFont(font);
    setShowFontPicker(false);
  }

  function handleLoveIt() {
    if (!match?.product) {
      playSuccess();
      setContextMessage("This design isn't available for purchase yet — but it will be soon!");
      return;
    }
    playSuccess();
    addItem({
      productId: match.product.id,
      productName: `${match.collection.name} ${match.template.name}`,
      productSlug: match.product.slug,
      designCollectionName: match.collection.name,
      mockupImage: `/designs/${match.collection.slug}/thumbnail.webp`,
      quantity: 25,
      unitPrice: match.product.base_price,
      personalisationData: state.personalisation,
    });
    router.push("/cart");
  }

  // ── DERIVED ──

  const colourOptions = getColourOptions(state.style);
  const detailsFields = getDetailsFields(state.currentProductType);
  const currentDetailField = detailsFields[detailsIndex];
  const productTypes = (["save_the_dates", "invitations", "on_the_day", "thank_yous"] as const)
    .filter((t) => !(t === "save_the_dates" && state.monthsUntil < 3));

  // ── RENDER ──

  return (
    <div className="h-full flex flex-col relative">
      {/* Animated gradient background */}
      <motion.div
        key={step}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className={`absolute inset-0 bg-gradient-to-br ${stepAccents[step]} pointer-events-none`}
      />

      {/* Tiles */}
      <div className="pt-2 pb-3 z-10 relative">
        <SelectionTiles tiles={tiles} onTileClick={handleTileClick} />
      </div>

      {/* Context message */}
      <AnimatePresence mode="wait">
        {contextMessage && step !== "month" && step !== "generating" && (
          <motion.p
            key={contextMessage}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center text-white/40 text-sm px-4 mb-3 max-w-md mx-auto relative z-10"
          >
            {contextMessage}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Steps */}
      <div className="flex-1 relative overflow-hidden">
        <StepContainer stepKey={step === "details" ? `details-${detailsIndex}` : step} direction={direction}>

          {/* MONTH */}
          {step === "month" && <MonthSelector onSelect={handleMonth} />}

          {/* PRODUCT TYPE */}
          {step === "product" && (
            <div className="w-full max-w-md mx-auto text-center">
              <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="text-2xl sm:text-3xl font-light text-white mb-8">
                What are you looking for?
              </motion.h2>
              <div className="grid grid-cols-2 gap-3">
                {productTypes.map((type, i) => {
                  const Icon = productIcons[type] || Sparkles;
                  return (
                    <motion.button key={type}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 25 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleProduct(type)}
                      className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5 hover:bg-white/[0.08] hover:border-white/20 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-white/60" />
                      </div>
                      <span className="text-sm font-medium text-white">{productTypeLabel(type)}</span>
                      <span className="text-[11px] text-white/30">{productTypeDescription(type)}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STYLE — with real design images */}
          {step === "style" && (
            <div className="w-full max-w-lg mx-auto text-center">
              <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="text-2xl sm:text-3xl font-light text-white mb-8">
                {getStyleHeading(state)}
              </motion.h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {styleData.map((s, i) => (
                  <motion.button key={s.id}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 25 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleStyle(s.id)}
                    className="relative overflow-hidden rounded-2xl border border-white/10 aspect-[3/4] group">
                    <img
                      src={s.image}
                      alt={s.label}
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${s.gradient}`} />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                      <p className="text-sm font-medium text-white">{s.label}</p>
                      <p className="text-[10px] text-white/50">{s.desc}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* COLOUR */}
          {step === "colour" && (
            <div className="w-full max-w-lg mx-auto text-center">
              <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="text-2xl sm:text-3xl font-light text-white mb-8">
                {getColourHeading(state.style)}
              </motion.h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {colourOptions.map((c, i) => (
                  <motion.button key={c.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 25 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleColour(c.id)}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm px-3.5 py-3 hover:bg-white/[0.08] hover:border-white/20 transition-colors">
                    <div
                      className="w-7 h-7 rounded-full shrink-0 border border-white/10"
                      style={{ background: c.swatch }}
                    />
                    <div className="text-left min-w-0">
                      <p className="text-xs font-medium text-white truncate">{c.label}</p>
                      <p className="text-[10px] text-white/30 truncate">{c.description}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* DETAILS */}
          {step === "details" && currentDetailField && (
            <div key={`detail-${detailsIndex}`} className="w-full max-w-sm mx-auto text-center">
              <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="text-2xl sm:text-3xl font-light text-white mb-3">
                {detailsIndex === 0 ? getDetailsHeading(state.currentProductType) : currentDetailField.label}
              </motion.h2>
              {detailsIndex === 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  className="text-white/30 text-sm mb-8">{currentDetailField.label}</motion.p>
              )}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                {currentDetailField.type === "textarea" ? (
                  <textarea autoFocus value={detailValue}
                    onChange={(e) => setDetailValue(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-white/15 focus:border-white/50 text-white text-xl text-center py-3 outline-none resize-none min-h-[80px] placeholder:text-white/15 transition-colors"
                    placeholder={currentDetailField.placeholder}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleDetailSubmit(); } }}
                  />
                ) : (
                  <input autoFocus type="text" value={detailValue}
                    onChange={(e) => setDetailValue(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-white/15 focus:border-white/50 text-white text-2xl text-center py-3 outline-none placeholder:text-white/15 transition-colors"
                    placeholder={currentDetailField.placeholder}
                    onKeyDown={(e) => { if (e.key === "Enter") handleDetailSubmit(); }}
                  />
                )}
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} transition={{ delay: 0.5 }}
                  className="text-white/20 text-xs mt-4">Press Enter</motion.p>
              </motion.div>
            </div>
          )}

          {/* GENERATING */}
          {step === "generating" && (
            <div className="text-center">
              <motion.div className="relative w-12 h-12 mx-auto mb-4">
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-white/10 border-t-white/40"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full border-2 border-white/5 border-b-white/20"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="text-white/30 text-sm">{contextMessage || "Creating your design..."}</motion.p>
            </div>
          )}

          {/* PREVIEW */}
          {step === "preview" && match && (
            <div className="w-full max-w-2xl mx-auto text-center flex flex-col items-center gap-5 px-4">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-white/20 text-xs uppercase tracking-[0.2em]">
                {match.collection.name}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 60, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 150, damping: 18 }}
                className="w-full max-w-lg"
              >
                <div className="overflow-hidden shadow-2xl shadow-white/5">
                  <ArtboardPreview
                    template={match.template}
                    fields={match.fields}
                    collectionName={match.collection.name}
                    collectionSlug={match.collection.slug}
                    fontOverride={selectedFont}
                    mounted
                  />
                </div>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleLoveIt}
                className="flex items-center gap-2 rounded-full bg-white text-black px-8 py-3 text-sm font-medium hover:bg-white/90 transition-colors"
              >
                <Check className="h-4 w-4" />
                Love it — let&apos;s go
              </motion.button>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-2 justify-center"
              >
                {getRefineOptions().map((opt) => (
                  <button key={opt.id} onClick={() => handleRefine(opt.id)}
                    className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-white/40 hover:text-white/70 hover:border-white/25 transition-all">
                    {opt.label}
                  </button>
                ))}
              </motion.div>

              <AnimatePresence>
                {showFontPicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap gap-2 justify-center overflow-hidden"
                  >
                    {FONT_OPTIONS.map((font) => (
                      <button
                        key={font}
                        onClick={() => handleFontSelect(font)}
                        className={`rounded-full border px-4 py-1.5 text-xs transition-all ${
                          selectedFont === font
                            ? "border-white/40 text-white bg-white/10"
                            : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/25"
                        }`}
                        style={{ fontFamily: `'${font}', sans-serif` }}
                      >
                        {font}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {match.pricing?.pricing_tiers?.[0] && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                  className="text-white/20 text-xs">
                  From <span className="text-white/50">£{Number(match.pricing.pricing_tiers[0].unit_price).toFixed(2)}</span> per card
                </motion.p>
              )}
            </div>
          )}
        </StepContainer>
      </div>
    </div>
  );
}
