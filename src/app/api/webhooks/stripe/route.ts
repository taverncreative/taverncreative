import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Webhook verification failed: ${message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = event.data.object as any;
    const supabase = createAdminClient();

    // Parse cart data from metadata
    const cartData = JSON.parse(session.metadata?.cartData || "[]") as {
      productId: string;
      quantity: number;
      unitPrice: number;
      personalisationData: Record<string, string>;
    }[];

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        stripe_session_id: session.id,
        customer_email: session.customer_details?.email || "",
        status: "paid",
        total: (session.amount_total || 0) / 100,
        shipping_address: session.shipping_details?.address
          ? (session.shipping_details.address as unknown as Record<string, string>)
          : null,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Failed to create order:", orderError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    // Create order items
    if (cartData.length > 0) {
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(
          cartData.map((item) => ({
            order_id: order.id,
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            personalisation_data: item.personalisationData,
          }))
        );

      if (itemsError) {
        console.error("Failed to create order items:", itemsError);
      }
    }
  }

  return NextResponse.json({ received: true });
}
