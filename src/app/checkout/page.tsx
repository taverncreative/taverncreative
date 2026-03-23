"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Truck, Package } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";

const ENVELOPE_OPTIONS = [
  { id: "white", label: "White", hex: "#ffffff", border: true },
  { id: "ivory", label: "Ivory", hex: "#faf5e8" },
  { id: "kraft", label: "Kraft", hex: "#c4a87c" },
  { id: "blush", label: "Blush", hex: "#f5ddd5" },
  { id: "sage", label: "Sage", hex: "#c5cfc0" },
  { id: "navy", label: "Navy", hex: "#2c3e50" },
];

function getShippingOptions(subtotal: number) {
  const freeThreshold = 50;
  const standardPrice = subtotal >= freeThreshold ? 0 : 3.95;
  return [
    {
      id: "standard",
      label: "Standard Delivery",
      desc: "3-5 working days",
      price: standardPrice,
      free: standardPrice === 0,
    },
    {
      id: "express",
      label: "Express Delivery",
      desc: "1-2 working days",
      price: 7.95,
      free: false,
    },
  ];
}

export default function CheckoutPage() {
  const { cart, total: subtotal } = useCart();
  const [envelopeColour, setEnvelopeColour] = useState("white");
  const [shipping, setShipping] = useState("standard");
  const [checkingOut, setCheckingOut] = useState(false);

  const shippingOptions = getShippingOptions(subtotal);
  const selectedShipping = shippingOptions.find((s) => s.id === shipping);
  const shippingCost = selectedShipping?.price || 0;
  const orderTotal = subtotal + shippingCost;

  async function handlePayNow() {
    setCheckingOut(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.items,
          envelopeColour,
          shippingMethod: shipping,
          shippingCost,
        }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setCheckingOut(false);
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Link href="/collections" className="text-sm underline mt-2 inline-block">Browse collections</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Link href="/cart" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to order
      </Link>

      <h1 className="text-2xl font-light tracking-tight mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
        {/* Left — Options */}
        <div className="lg:col-span-3 space-y-8">

          {/* Envelope Colour */}
          <div>
            <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Envelope Colour
            </h2>
            <p className="text-xs text-muted-foreground mb-3">Included with every order — choose a colour to complement your design.</p>
            <div className="flex gap-3 flex-wrap">
              {ENVELOPE_OPTIONS.map((env) => (
                <button key={env.id} type="button" onClick={() => setEnvelopeColour(env.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${envelopeColour === env.id ? "border-foreground bg-foreground/[0.03]" : "border-border hover:border-foreground/30"}`}>
                  <div className="w-10 h-10 rounded-full border"
                    style={{ backgroundColor: env.hex, borderColor: env.border ? "#e5e5e5" : "transparent" }} />
                  <span className="text-[11px]">{env.label}</span>
                  {envelopeColour === env.id && <Check className="h-3 w-3" />}
                </button>
              ))}
            </div>
          </div>

          {/* Shipping */}
          <div>
            <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              Delivery
            </h2>
            <p className="text-xs text-muted-foreground mb-3">We deliver to the UK and Ireland. Free standard delivery on orders over £50.</p>
            <div className="space-y-2">
              {shippingOptions.map((opt) => (
                <button key={opt.id} type="button" onClick={() => setShipping(opt.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${shipping === opt.id ? "border-foreground bg-foreground/[0.03]" : "border-border hover:border-foreground/30"}`}>
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  <div className="text-right">
                    {opt.free ? (
                      <span className="text-sm font-medium text-green-600">Free</span>
                    ) : (
                      <span className="text-sm">£{opt.price.toFixed(2)}</span>
                    )}
                    {shipping === opt.id && <Check className="h-3.5 w-3.5 ml-2 inline-block" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Summary */}
        <div className="lg:col-span-2">
          <div className="border border-border/50 rounded-2xl p-5 space-y-4 lg:sticky lg:top-24">
            <h2 className="text-sm font-medium">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3">
              {cart.items.map((item) => {
                const isDS = item.personalisationData._doubleSided === "yes";
                return (
                  <div key={item.cartItemId} className="flex justify-between text-sm">
                    <div className="min-w-0">
                      <p className="truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} cards{isDS ? " · Double-sided" : ""}
                      </p>
                    </div>
                    <span className="shrink-0 ml-4">£{(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border/30 pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>£{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Envelope</span>
                <span className="capitalize">{envelopeColour}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>{shippingCost === 0 ? "Free" : `£${shippingCost.toFixed(2)}`}</span>
              </div>
            </div>

            <div className="border-t border-border/30 pt-3 flex justify-between font-medium text-base">
              <span>Total</span>
              <span>£{orderTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handlePayNow}
              disabled={checkingOut}
              className="w-full bg-foreground text-background py-3.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {checkingOut ? "Redirecting..." : `Pay Now — £${orderTotal.toFixed(2)}`}
            </button>

            <p className="text-[10px] text-muted-foreground text-center">
              Secure checkout powered by Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
