/**
 * Pricing calculator for the storefront.
 * Customer enters an exact quantity. We find the highest breakpoint ≤ that qty
 * and return the unit price for that tier.
 */

interface PricingTier {
  min_quantity: number;
  unit_price: number;
}

/**
 * Given sorted pricing tiers and a customer quantity,
 * returns the unit price from the matching tier.
 * Returns null if qty is below the minimum breakpoint (minimum order not met).
 */
export function getUnitPrice(
  tiers: PricingTier[],
  quantity: number
): number | null {
  // Sort ascending by breakpoint
  const sorted = [...tiers].sort((a, b) => a.min_quantity - b.min_quantity);

  if (sorted.length === 0) return null;

  // Below minimum breakpoint
  if (quantity < sorted[0].min_quantity) return null;

  // Find highest breakpoint ≤ quantity
  let matched = sorted[0];
  for (const tier of sorted) {
    if (tier.min_quantity <= quantity) {
      matched = tier;
    } else {
      break;
    }
  }

  return Number(matched.unit_price);
}

/**
 * Returns total price for a given quantity.
 * Returns null if below minimum order.
 */
export function getTotal(
  tiers: PricingTier[],
  quantity: number
): number | null {
  const unitPrice = getUnitPrice(tiers, quantity);
  if (unitPrice === null) return null;
  return Math.round(quantity * unitPrice * 100) / 100;
}

/**
 * Returns the minimum order quantity (lowest breakpoint).
 */
export function getMinimumOrder(tiers: PricingTier[]): number {
  if (tiers.length === 0) return 0;
  return Math.min(...tiers.map((t) => t.min_quantity));
}
