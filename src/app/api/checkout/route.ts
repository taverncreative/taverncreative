import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import type { CartItem } from "@/lib/types/cart";

export async function POST(request: NextRequest) {
  const { items } = (await request.json()) as { items: CartItem[] };

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    currency: "gbp",
    line_items: items.map((item) => ({
      price_data: {
        currency: "gbp",
        unit_amount: Math.round(item.unitPrice * 100), // Stripe uses pence
        product_data: {
          name: item.productName,
          description: `${item.designCollectionName} — ${Object.entries(
            item.personalisationData
          )
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ")}`,
        },
      },
      quantity: item.quantity,
    })),
    metadata: {
      cartData: JSON.stringify(
        items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          personalisationData: item.personalisationData,
        }))
      ),
    },
    shipping_address_collection: {
      allowed_countries: ["GB", "IE"],
    },
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/cart`,
  });

  return NextResponse.json({ url: session.url });
}
