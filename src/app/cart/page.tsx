"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, ShoppingBag, ChevronDown } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { useState } from "react";

function formatPrice(amount: number): string {
  if (amount >= 1) return `£${amount.toFixed(2)}`;
  return `${(amount * 100).toFixed(0)}p`;
}

/** Filter out internal personalisation keys (prefixed with _) */
function visiblePersonalisation(data: Record<string, string>): [string, string][] {
  return Object.entries(data).filter(([key]) => !key.startsWith("_"));
}

export default function CartPage() {
  const router = useRouter();
  const { cart, removeItem, updateQuantity, total } = useCart();
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
        <h1 className="text-2xl font-light tracking-tight">Nothing here yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">Start designing your perfect wedding stationery.</p>
        <Link href="/collections" className="inline-block mt-6 px-6 py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
          Start Designing
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h1 className="text-2xl font-light tracking-tight mb-8">Your Order</h1>

      <div className="space-y-8">
        {cart.items.map((item) => {
          const isDoubleSided = item.personalisationData._doubleSided === "yes";
          const highlightColour = item.personalisationData._highlightColour || "#1a1a1a";
          const showHeart = item.personalisationData._showHeart === "yes";
          const visible = visiblePersonalisation(item.personalisationData);
          const baseUnitPrice = isDoubleSided ? item.unitPrice - 0.18 : item.unitPrice;
          const dsTotal = isDoubleSided ? 0.18 * item.quantity : 0;

          return (
            <div key={item.cartItemId} className="border border-border/50 rounded-2xl overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                {/* Design preview */}
                <div className="sm:w-64 shrink-0 bg-[#faf9f7] relative overflow-hidden">
                  <div className="relative w-full" style={{ aspectRatio: "148 / 105" }}>
                    {item.collectionSlug && (
                      <img
                        src={`/designs/${item.collectionSlug}/preview.webp`}
                        alt={item.productName}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <img
                      src="/texture-landscape.webp"
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-multiply opacity-25"
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 p-5 sm:p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="font-medium text-base">{item.productName}</h2>
                      <p className="text-xs text-muted-foreground">{item.designCollectionName} Collection</p>
                    </div>
                    <p className="font-medium text-base">£{(item.unitPrice * item.quantity).toFixed(2)}</p>
                  </div>

                  {/* Clean personalisation display */}
                  {visible.length > 0 && (
                    <div className="text-sm text-muted-foreground space-y-0.5 mb-4">
                      {visible.map(([key, value]) => (
                        <p key={key}>{value}</p>
                      ))}
                    </div>
                  )}

                  {/* Specs */}
                  <div className="border-t border-border/30 pt-3 space-y-2 text-sm">
                    {/* Quantity */}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Quantity</span>
                      <div className="flex items-center gap-3">
                        <select
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.cartItemId, Number(e.target.value))}
                          className="bg-transparent border border-border rounded-lg px-2 py-1 text-sm outline-none cursor-pointer"
                        >
                          {[10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 500].map((qty) => (
                            <option key={qty} value={qty}>{qty}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Double-sided */}
                    {isDoubleSided && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Double-sided</span>
                        <span className="text-muted-foreground">+£{dsTotal.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Accent colour */}
                    {highlightColour !== "#1a1a1a" && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Accent colour</span>
                        <div className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: highlightColour }} />
                      </div>
                    )}

                    {/* Heart */}
                    {showHeart && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Heart icon</span>
                        <span style={{ color: highlightColour }}>♥</span>
                      </div>
                    )}
                  </div>

                  {/* Price breakdown */}
                  <div className="border-t border-border/30 pt-3 mt-3 space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>{item.quantity} × {formatPrice(baseUnitPrice)}</span>
                      <span>£{(baseUnitPrice * item.quantity).toFixed(2)}</span>
                    </div>
                    {isDoubleSided && (
                      <div className="flex justify-between">
                        <span>Double-sided ({item.quantity} × 18p)</span>
                        <span>£{dsTotal.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/30">
                    <Link href={`/products/${item.productSlug}?mode=personalise&draft=cart-${item.cartItemId}`}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="h-3 w-3" /> Edit Design
                    </Link>
                    {confirmRemove === item.cartItemId ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-500">Remove?</span>
                        <button onClick={() => { removeItem(item.cartItemId); setConfirmRemove(null); }}
                          className="text-xs text-red-500 font-medium hover:text-red-600">Yes</button>
                        <button onClick={() => setConfirmRemove(null)}
                          className="text-xs text-muted-foreground hover:text-foreground">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmRemove(item.cartItemId)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors">
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order summary */}
      <div className="mt-10 border-t border-border/50 pt-8">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-lg font-medium">Subtotal</span>
          <span className="text-lg font-medium">£{total.toFixed(2)}</span>
        </div>
        <p className="text-xs text-muted-foreground mb-6">Shipping and envelope options on the next step</p>

        <button
          onClick={() => router.push("/checkout")}
          className="w-full bg-foreground text-background py-3.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Continue to Checkout
        </button>

        <div className="text-center mt-4">
          <Link href="/collections" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
