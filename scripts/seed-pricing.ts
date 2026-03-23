/**
 * Seed script to pre-populate all pricing templates.
 * Run: npx tsx scripts/seed-pricing.ts
 *
 * Uses the local dev server API (must be running on port 3000).
 */

const PORT = process.env.PORT || 49465;
const BASE = `http://localhost:${PORT}/api/admin/pricing`;

// Standard breakpoints matching Print Junction tiers
const BREAKPOINTS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 250, 500];

function makeTiers(prices: Record<number, number>) {
  return BREAKPOINTS.filter((bp) => bp in prices).map((bp) => ({
    min_quantity: bp,
    max_quantity: null,
    unit_price: prices[bp],
  }));
}

// A6 Flat prices (with envelope +5p baked in)
const A6_FLAT_PRICES: Record<number, number> = {
  10: 0.90, 20: 0.80, 30: 0.75, 40: 0.70, 50: 0.70,
  60: 0.70, 70: 0.70, 80: 0.70, 90: 0.70, 100: 0.70,
  250: 0.65, 500: 0.65,
};

// A6 Flat prices WITHOUT envelope (for menus, insert cards)
const A6_FLAT_NO_ENV: Record<number, number> = {
  10: 0.85, 20: 0.75, 30: 0.70, 40: 0.65, 50: 0.65,
  60: 0.65, 70: 0.65, 80: 0.65, 90: 0.65, 100: 0.65,
  250: 0.60, 500: 0.60,
};

// 7x5 Flat prices (with envelope +5p)
const SEVEN_BY_FIVE_FLAT: Record<number, number> = {
  10: 1.50, 20: 1.35, 30: 1.30, 40: 1.25, 50: 1.25,
  60: 1.25, 70: 1.25, 80: 1.25, 90: 1.25, 100: 1.15,
  250: 1.05, 500: 1.05,
};

// 7x5 Folded / Concertina / Gatefold prices (with envelope +5p)
const SEVEN_BY_FIVE_FOLDED: Record<number, number> = {
  10: 2.65, 20: 2.45, 30: 2.35, 40: 2.30, 50: 2.30,
  60: 2.25, 70: 2.25, 80: 2.25, 90: 2.25, 100: 2.05,
  250: 1.85, 500: 1.85,
};

// Order of Service (A6 Folded pricing, no envelope)
const ORDER_OF_SERVICE: Record<number, number> = {
  10: 1.45, 20: 1.30, 30: 1.25, 40: 1.20, 50: 1.20,
  60: 1.20, 70: 1.20, 80: 1.20, 90: 1.20, 100: 1.10,
  250: 1.00, 500: 1.00,
};

// Place Cards (no envelope)
const PLACE_CARDS: Record<number, number> = {
  10: 0.55, 20: 0.50, 30: 0.45, 40: 0.45, 50: 0.45,
  60: 0.45, 70: 0.45, 80: 0.45, 90: 0.45, 100: 0.45,
  250: 0.40, 500: 0.40,
};

// Vellum Wraps
const VELLUM: Record<number, number> = {
  10: 1.00, 20: 1.00, 30: 1.00, 40: 1.00, 50: 1.00,
  60: 1.00, 70: 1.00, 80: 1.00, 90: 1.00, 100: 1.00,
  250: 0.95, 500: 0.95,
};

// Table Plan — single qty pricing (qty 1 at each size)
const TABLE_PLAN_A2: Record<number, number> = { 1: 60.00 };
const TABLE_PLAN_A1: Record<number, number> = { 1: 85.00 };

interface TemplateConfig {
  name: string;
  unit_weight_grams: number;
  shipping_override: boolean;
  shipping_override_note: string | null;
  tiers: { min_quantity: number; max_quantity: null; unit_price: number }[];
}

const templates: TemplateConfig[] = [
  {
    name: "A6 Flat (Save the Dates, RSVP, Info Cards)",
    unit_weight_grams: 5,
    shipping_override: false,
    shipping_override_note: null,
    tiers: makeTiers(A6_FLAT_PRICES),
  },
  {
    name: "7×5 Flat (Invitations, Evening Invites)",
    unit_weight_grams: 8,
    shipping_override: false,
    shipping_override_note: null,
    tiers: makeTiers(SEVEN_BY_FIVE_FLAT),
  },
  {
    name: "A6 Folded",
    unit_weight_grams: 10,
    shipping_override: false,
    shipping_override_note: null,
    tiers: makeTiers(SEVEN_BY_FIVE_FLAT), // same pricing as 7x5 flat with envelope
  },
  {
    name: "7×5 Folded",
    unit_weight_grams: 15,
    shipping_override: false,
    shipping_override_note: null,
    tiers: makeTiers(SEVEN_BY_FIVE_FOLDED),
  },
  {
    name: "Concertina",
    unit_weight_grams: 18,
    shipping_override: false,
    shipping_override_note: null,
    tiers: makeTiers(SEVEN_BY_FIVE_FOLDED), // same pricing as 7x5 folded
  },
  {
    name: "Gatefold",
    unit_weight_grams: 18,
    shipping_override: false,
    shipping_override_note: null,
    tiers: makeTiers(SEVEN_BY_FIVE_FOLDED), // same pricing as 7x5 folded
  },
  {
    name: "Order of Service",
    unit_weight_grams: 10,
    shipping_override: false,
    shipping_override_note: null,
    tiers: makeTiers(ORDER_OF_SERVICE),
  },
  {
    name: "Place Cards",
    unit_weight_grams: 3,
    shipping_override: false,
    shipping_override_note: null,
    tiers: makeTiers(PLACE_CARDS),
  },
  {
    name: "A7 Insert Cards",
    unit_weight_grams: 3,
    shipping_override: false,
    shipping_override_note: null,
    tiers: makeTiers(A6_FLAT_NO_ENV), // A6 flat pricing without envelope
  },
  {
    name: "Table Plan (A2 Mounted)",
    unit_weight_grams: 1000,
    shipping_override: true,
    shipping_override_note: "Requires special courier due to size",
    tiers: [{ min_quantity: 1, max_quantity: null, unit_price: 60.00 }],
  },
  {
    name: "Table Plan (A1 Mounted)",
    unit_weight_grams: 1500,
    shipping_override: true,
    shipping_override_note: "Requires special courier due to size",
    tiers: [{ min_quantity: 1, max_quantity: null, unit_price: 85.00 }],
  },
  {
    name: "Menus",
    unit_weight_grams: 5,
    shipping_override: false,
    shipping_override_note: null,
    tiers: makeTiers(A6_FLAT_NO_ENV), // A6 flat without envelope
  },
  {
    name: "Table Numbers",
    unit_weight_grams: 3,
    shipping_override: false,
    shipping_override_note: null,
    tiers: makeTiers(PLACE_CARDS), // same as place cards
  },
  {
    name: "Vellum Wraps",
    unit_weight_grams: 2,
    shipping_override: false,
    shipping_override_note: null,
    tiers: makeTiers(VELLUM),
  },
  {
    name: "Thank You Cards (A6 Folded)",
    unit_weight_grams: 10,
    shipping_override: false,
    shipping_override_note: null,
    tiers: makeTiers(SEVEN_BY_FIVE_FLAT), // A6 folded = same as 7x5 flat pricing, with envelope
  },
];

async function seed() {
  console.log(`Seeding ${templates.length} pricing templates...\n`);

  for (const t of templates) {
    const res = await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: t.name,
        unit_weight_grams: t.unit_weight_grams,
        shipping_override: t.shipping_override,
        shipping_override_note: t.shipping_override_note,
        tiers: t.tiers,
        upsell_option_ids: [],
      }),
    });

    if (res.ok) {
      console.log(`  ✓ ${t.name} (${t.tiers.length} tiers)`);
    } else {
      const err = await res.text();
      console.error(`  ✗ ${t.name}: ${err}`);
    }
  }

  console.log("\nDone!");
}

seed().catch(console.error);
