"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { OrderStatus } from "@/lib/types/database";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  personalisation_data: Record<string, string>;
  product: { name: string; slug: string };
}

interface Order {
  id: string;
  customer_email: string;
  status: OrderStatus;
  total: number;
  shipping_address: Record<string, string> | null;
  created_at: string;
  order_items: OrderItem[];
}

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "in_production", label: "In Production" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  async function fetchOrders() {
    const res = await fetch("/api/admin/orders");
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  async function updateStatus(orderId: string, status: OrderStatus) {
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading orders...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Orders</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No orders yet. They&apos;ll appear here once customers start
            purchasing.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader
                className="flex flex-row items-center justify-between py-4 cursor-pointer"
                onClick={() =>
                  setExpandedOrder(
                    expandedOrder === order.id ? null : order.id
                  )
                }
              >
                <div>
                  <CardTitle className="text-base">
                    #{order.id.slice(0, 8)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {order.customer_email} &middot;{" "}
                    {new Date(order.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-medium">
                    &pound;{Number(order.total).toFixed(2)}
                  </p>
                  <Select
                    value={order.status}
                    onValueChange={(v) =>
                      updateStatus(order.id, v as OrderStatus)
                    }
                  >
                    <SelectTrigger className="w-40" onClick={(e) => e.stopPropagation()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              {expandedOrder === order.id && (
                <CardContent className="pt-0 pb-4">
                  <Separator className="mb-4" />
                  <div className="space-y-4">
                    {order.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="border border-border rounded-md p-3"
                      >
                        <div className="flex justify-between mb-2">
                          <p className="font-medium text-sm">
                            {item.product?.name}
                          </p>
                          <p className="text-sm">
                            {item.quantity} &times; &pound;
                            {Number(item.unit_price).toFixed(2)}
                          </p>
                        </div>
                        {Object.keys(item.personalisation_data).length >
                          0 && (
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {Object.entries(
                              item.personalisation_data
                            ).map(([key, value]) => (
                              <p key={key}>
                                <span className="font-medium">{key}:</span>{" "}
                                {value}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {order.shipping_address && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                          Shipping Address
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {Object.values(order.shipping_address)
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
