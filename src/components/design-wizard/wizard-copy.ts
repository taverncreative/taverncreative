/**
 * Contextual copy engine for the design wizard.
 * Returns personalised responses based on the combination of choices.
 *
 * The goal: feel like a personal stylist, not a form.
 */

type WizardState = {
  weddingDate?: string;
  productTypes?: string[];
  style?: string;
  colour?: string;
  names?: string;
  venue?: string;
  season?: string;
  monthsUntil?: number;
};

// ──────────────────────────────────────────
// SEASONAL DETECTION
// ──────────────────────────────────────────

export function getSeason(dateStr: string): string {
  const d = new Date(dateStr);
  const m = d.getMonth(); // 0-indexed
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

export function getMonthsUntil(dateStr: string): number {
  const now = new Date();
  const wedding = new Date(dateStr);
  return Math.round((wedding.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
}

export function getSeasonEmoji(season: string): string {
  const map: Record<string, string> = {
    spring: "🌸",
    summer: "☀️",
    autumn: "🍂",
    winter: "❄️",
  };
  return map[season] || "";
}

// ──────────────────────────────────────────
// DATE STEP RESPONSES
// ──────────────────────────────────────────

export function getDateResponse(state: WizardState): string {
  const months = state.monthsUntil || 0;
  const season = state.season || "";

  if (months <= 1) return "That's so soon — how exciting! Let's get you sorted quickly.";
  if (months <= 3) return "Not long to go! We'll make this fast and easy for you.";
  if (months <= 6) return "Great timing — plenty of time to get everything perfect.";
  if (months <= 12) {
    if (season === "winter") return "A winter wedding — how romantic. Let's create something special.";
    if (season === "summer") return "A summer celebration — beautiful. Let's find your perfect style.";
    if (season === "spring") return "A spring wedding — the flowers will be gorgeous. Let's match that.";
    if (season === "autumn") return "Autumn weddings have the best colours. Let's make the most of that.";
    return "Wonderful — you've got great timing to plan everything just right.";
  }
  return "Plenty of time to get everything exactly how you want it. No rush.";
}

// ──────────────────────────────────────────
// PRODUCT TYPE STEP
// ──────────────────────────────────────────

export function getProductSuggestion(state: WizardState): {
  heading: string;
  subtext: string;
  suggested: string[];
} {
  const months = state.monthsUntil || 12;

  if (months <= 2) {
    return {
      heading: "What do you need right now?",
      subtext: "With your date coming up fast, here's what makes sense",
      suggested: ["invitations", "on_the_day"],
    };
  }
  if (months <= 4) {
    return {
      heading: "What are you looking for?",
      subtext: "You're at the perfect stage for invitations — but we can help with anything",
      suggested: ["invitations", "on_the_day", "save_the_dates"],
    };
  }
  if (months <= 8) {
    return {
      heading: "What can we help with?",
      subtext: "You're right on schedule — most couples start here",
      suggested: ["save_the_dates", "invitations"],
    };
  }
  return {
    heading: "You're nice and early — what shall we start with?",
    subtext: "Save the dates are perfect at this stage, but it's entirely up to you",
    suggested: ["save_the_dates"],
  };
}

// ──────────────────────────────────────────
// PRODUCT TYPE RESPONSES
// ──────────────────────────────────────────

export function getProductResponse(productTypes: string[]): string {
  if (productTypes.length > 2) return "Let's do the lot. We'll start with save the dates and work through everything.";

  const names = productTypes.map((p) => productTypeLabel(p));

  if (productTypes.includes("save_the_dates") && productTypes.includes("invitations")) {
    return `Perfect — ${names.join(" and ")}. We'll start with your save the dates.`;
  }
  if (productTypes.length === 1) {
    if (productTypes[0] === "save_the_dates") return "Great choice to start early. Let's find your perfect save the date.";
    if (productTypes[0] === "invitations") return "The main event — let's make your invitations unforgettable.";
    if (productTypes[0] === "on_the_day") return "The finishing touches that tie everything together. Let's go.";
    if (productTypes[0] === "thank_yous") return "A lovely way to wrap up. Let's make them special.";
  }
  return `Great — ${names.join(" and ")}. Let's find your style.`;
}

// ──────────────────────────────────────────
// STYLE STEP
// ──────────────────────────────────────────

export function getStyleHeading(state: WizardState): string {
  const product = state.productTypes?.[0] || "";
  if (product === "save_the_dates") return "What style catches your eye?";
  if (product === "invitations") return "How do you want your invitations to feel?";
  if (product === "on_the_day") return "What's the vibe for the day itself?";
  return "What's your design style?";
}

export function getStyleResponse(style: string, state: WizardState): string {
  const season = state.season || "";

  const responses: Record<string, Record<string, string>> = {
    botanical: {
      spring: "Botanical and spring — a match made in heaven.",
      summer: "Lush botanicals for a summer celebration. Beautiful choice.",
      autumn: "Rich botanical tones will look stunning with autumn colours.",
      winter: "Evergreen botanicals bring warmth to a winter wedding. Lovely.",
      default: "Natural, organic, beautiful. Great taste.",
    },
    minimal: {
      default: "Less is more. Clean, elegant, impactful.",
      winter: "Minimal and crisp — perfect for a winter celebration.",
    },
    modern: {
      default: "Bold and contemporary. We love it.",
    },
    traditional: {
      default: "Classic never goes out of style. Timeless elegance.",
      winter: "Traditional and winter — think rich textures and warmth.",
    },
    romantic: {
      spring: "Romantic and spring — dreamy combination.",
      summer: "Soft, romantic, sun-drenched. Gorgeous.",
      default: "Soft, flowing, full of feeling. Beautiful choice.",
    },
  };

  const styleResponses = responses[style] || {};
  return styleResponses[season] || styleResponses.default || "Lovely choice. Let's keep going.";
}

// ──────────────────────────────────────────
// COLOUR STEP
// ──────────────────────────────────────────

export function getColourHeading(style: string): string {
  if (style === "minimal") return "What palette feels right?";
  if (style === "botanical") return "What colours are in your flowers?";
  if (style === "romantic") return "What shades are you drawn to?";
  return "What colours do you have in mind?";
}

export function getColourOptions(style: string): { id: string; label: string; swatch: string; description: string }[] {
  // All options available but order changes based on style
  const all = [
    { id: "pinks", label: "Soft Pinks", swatch: "#e8b4b8", description: "Blush, rose and dusty pink" },
    { id: "purples", label: "Purples", swatch: "#9b87b2", description: "Lavender, mauve and plum" },
    { id: "greens", label: "Greens & Sage", swatch: "#a3b18a", description: "Sage, olive and forest" },
    { id: "neutrals", label: "Neutrals", swatch: "#c9b99a", description: "Ivory, taupe and warm grey" },
    { id: "blues", label: "Blues", swatch: "#7a9cc6", description: "Dusty blue, navy and sky" },
    { id: "terracotta", label: "Terracotta", swatch: "#c4836a", description: "Warm clay, rust and burnt orange" },
    { id: "burgundy", label: "Burgundy & Wine", swatch: "#722f37", description: "Rich reds and deep berry" },
    { id: "gold", label: "Gold & Champagne", swatch: "#c5a55a", description: "Warm gold, champagne and honey" },
    { id: "lavender", label: "Lavender", swatch: "#b4a7d6", description: "Soft lilac and pale violet" },
    { id: "coral", label: "Coral & Peach", swatch: "#e89b7b", description: "Warm peach, coral and apricot" },
    { id: "sage", label: "Sage", swatch: "#b2c1a4", description: "Muted sage and soft eucalyptus" },
    { id: "navy", label: "Navy", swatch: "#2c3e6b", description: "Deep navy and midnight blue" },
    { id: "dusty_rose", label: "Dusty Rose", swatch: "#c4929b", description: "Muted rose and antique pink" },
    { id: "other", label: "Other", swatch: "linear-gradient(135deg,#e8b4b8,#7a9cc6,#a3b18a)", description: "Tell us what you're thinking" },
  ];

  // Reorder based on style
  if (style === "botanical") return reorder(all, ["greens", "sage", "purples", "pinks"]);
  if (style === "minimal") return reorder(all, ["neutrals", "sage", "greens"]);
  if (style === "modern") return reorder(all, ["navy", "neutrals", "coral"]);
  if (style === "traditional") return reorder(all, ["neutrals", "gold", "burgundy"]);
  if (style === "romantic") return reorder(all, ["pinks", "dusty_rose", "lavender"]);
  return all;
}

function reorder<T extends { id: string }>(items: T[], preferredOrder: string[]): T[] {
  const preferred = preferredOrder.map((id) => items.find((i) => i.id === id)).filter((x): x is T => x !== undefined);
  const rest = items.filter((i) => !preferredOrder.includes(i.id));
  return [...preferred, ...rest];
}

export function getColourResponse(colour: string, style: string): string {
  if (colour === "undecided") {
    return "That's fine — we'll pick something versatile that works with anything.";
  }

  const combos: Record<string, Record<string, string>> = {
    pinks: {
      botanical: "Soft pink florals — absolutely gorgeous.",
      romantic: "Pink and romantic — a perfect match.",
      minimal: "A touch of blush keeps it soft without being busy.",
      default: "Beautiful choice. Blush tones are always elegant.",
    },
    purples: {
      botanical: "Lavender wildflowers — dreamy.",
      romantic: "Rich purples with romantic typography. Stunning.",
      default: "Purple adds such depth. Great choice.",
    },
    greens: {
      botanical: "All greenery — lush and natural. Love it.",
      minimal: "Sage and clean lines. Understated perfection.",
      default: "Fresh and organic. Beautiful palette.",
    },
    neutrals: {
      minimal: "Clean, timeless, elegant. Perfect.",
      traditional: "Classic neutrals — they never go wrong.",
      default: "Warm neutrals are always a safe bet. Elegant and versatile.",
    },
    bold: {
      modern: "Bold and modern — you're making a statement. We're here for it.",
      default: "Brave and beautiful. Let's make it pop.",
    },
    blues: {
      minimal: "Dusty blues and clean lines — so refined.",
      modern: "Blue and modern — sharp and sophisticated.",
      default: "Beautiful blues. Classic and calming.",
    },
    terracotta: {
      botanical: "Warm terracotta with botanicals — earthy and stunning.",
      romantic: "Warm tones with a romantic touch. Gorgeous.",
      default: "Warm, earthy, grounding. Beautiful palette.",
    },
    burgundy: {
      traditional: "Rich burgundy — opulent and timeless.",
      romantic: "Deep wine tones with romantic details. Breathtaking.",
      default: "Deep, rich, dramatic. Love it.",
    },
    gold: {
      traditional: "Gold and classic — regal and refined.",
      botanical: "Warm golds against greenery. Stunning combination.",
      default: "Warm, luxurious, celebratory. Beautiful.",
    },
    lavender: {
      romantic: "Lavender and romance — it's a dream.",
      botanical: "Soft lavender with botanicals. So peaceful.",
      default: "Soft and serene. Lovely palette.",
    },
    coral: {
      modern: "Coral and modern — fresh and exciting.",
      romantic: "Warm coral tones with romantic touches. Gorgeous.",
      default: "Warm and inviting. Great choice.",
    },
    sage: {
      botanical: "Sage and botanicals — natural harmony.",
      minimal: "Muted sage — understated and elegant.",
      default: "Soft and organic. Beautiful tone.",
    },
    navy: {
      modern: "Navy and modern — sharp and sophisticated.",
      traditional: "Deep navy — classic and commanding.",
      default: "Deep and distinguished. Great choice.",
    },
    dusty_rose: {
      romantic: "Dusty rose — soft, vintage, romantic. Perfect.",
      botanical: "Muted rose with natural elements. Gorgeous.",
      default: "Soft and timeless. Beautiful choice.",
    },
    other: {
      default: "Let's find something special for you.",
    },
  };

  const colourResponses = combos[colour] || {};
  return colourResponses[style] || colourResponses.default || "Lovely combination. Let's bring it to life.";
}

// ──────────────────────────────────────────
// DETAILS STEP
// ──────────────────────────────────────────

export function getDetailsHeading(productType: string): string {
  if (productType === "save_the_dates") return "Nearly there — just a couple of details";
  if (productType === "invitations") return "Let's add your details";
  if (productType === "on_the_day") return "A few quick details";
  if (productType === "thank_yous") return "Just your names and we're done";
  return "A few details and we're there";
}

export function getDetailsFields(productType: string): { key: string; label: string; placeholder: string; type: "text" | "date" | "time" | "textarea" }[] {
  if (productType === "save_the_dates") {
    return [
      { key: "Names", label: "Your names", placeholder: "Emily & James", type: "text" },
      { key: "Venue", label: "Where are you getting married?", placeholder: "Solton Manor, Dover", type: "text" },
    ];
  }
  if (productType === "invitations") {
    return [
      { key: "Names", label: "Your names", placeholder: "Emily & James", type: "text" },
      { key: "Invite Line", label: "Your invite wording", placeholder: "request the pleasure of your company", type: "text" },
      { key: "Time", label: "What time?", placeholder: "2:00 PM", type: "text" },
      { key: "Venue", label: "Where?", placeholder: "Solton Manor, Dover", type: "text" },
    ];
  }
  if (productType === "on_the_day") {
    return [
      { key: "Names", label: "Your names", placeholder: "Emily & James", type: "text" },
    ];
  }
  if (productType === "thank_yous") {
    return [
      { key: "Names", label: "Your names", placeholder: "Emily & James", type: "text" },
      { key: "Message", label: "Your thank you message", placeholder: "Thank you so much for sharing our special day", type: "textarea" },
    ];
  }
  return [
    { key: "Names", label: "Your names", placeholder: "Emily & James", type: "text" },
  ];
}

// ──────────────────────────────────────────
// PREVIEW RESPONSES
// ──────────────────────────────────────────

export function getPreviewIntro(state: WizardState): string {
  const names = state.names || "you";
  return `Here's what we've put together for ${names}`;
}

export function getRefineOptions(): { id: string; label: string }[] {
  return [
    { id: "different_style", label: "Try a different style" },
    { id: "different_colour", label: "Different colours" },
    { id: "change_font", label: "Change the font" },
    { id: "edit_wording", label: "Edit wording" },
  ];
}

export function getRefineResponse(action: string): string {
  const responses: Record<string, string> = {
    love_it: "Brilliant — let's get this ordered.",
    different_style: "No problem — here's a different take.",
    different_colour: "Let's try a different palette.",
    change_font: "Here are some font options.",
    edit_wording: "Go ahead — tap any text to edit it.",
    surprise_me: "How about this one?",
  };
  return responses[action] || "Here's another option.";
}

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────

export function productTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    save_the_dates: "Save the Dates",
    invitations: "Invitations",
    on_the_day: "On the Day",
    thank_yous: "Thank You Cards",
  };
  return labels[type] || type;
}

export function productTypeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    save_the_dates: "Let everyone know the date",
    invitations: "The main event — set the tone",
    on_the_day: "Menus, place cards & more",
    thank_yous: "Say thanks beautifully",
  };
  return descriptions[type] || "";
}
