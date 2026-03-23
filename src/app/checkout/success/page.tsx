"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/providers/cart-provider";

export default function CheckoutSuccess() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 py-16 text-center">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
      <h1 className="text-2xl font-semibold tracking-tight">
        Order Confirmed
      </h1>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Thank you for your order! We&apos;ll start working on your
        personalised stationery right away. You&apos;ll receive a
        confirmation email shortly.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild>
          <Link href="/collections">Continue Shopping</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/account">View Your Orders</Link>
        </Button>
      </div>
    </div>
  );
}
