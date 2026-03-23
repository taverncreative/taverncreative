"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { OrderStatus } from "@/lib/types/database";

interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    personalisation_data: Record<string, string>;
    product: { name: string };
  }[];
}

const statusColours: Record<OrderStatus, string> = {
  pending: "secondary",
  paid: "default",
  in_production: "default",
  shipped: "default",
  delivered: "default",
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  in_production: "In Production",
  shipped: "Shipped",
  delivered: "Delivered",
};

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    wedding_date: "",
    partner_name: "",
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser({ email: user.email || "" });

      // Load profile
      const { data: customer } = await supabase
        .from("customers")
        .select("*")
        .eq("id", user.id)
        .single();

      if (customer) {
        setProfile({
          first_name: customer.first_name || "",
          last_name: customer.last_name || "",
          wedding_date: customer.wedding_date || "",
          partner_name: customer.partner_name || "",
        });
      }

      // Load orders
      const { data: orderData } = await supabase
        .from("orders")
        .select(
          "*, order_items(*, product:products(name))"
        )
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (orderData) {
        setOrders(orderData as unknown as Order[]);
      }
    }
    load();
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("customers").upsert({
      id: user.id,
      email: user.email || "",
      first_name: profile.first_name || null,
      last_name: profile.last_name || null,
      wedding_date: profile.wedding_date || null,
      partner_name: profile.partner_name || null,
    });

    setSaving(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return <p className="text-muted-foreground p-8">Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-light tracking-tight">My Account</h1>
        <Button variant="ghost" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Profile */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">Your Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={profile.first_name}
                  onChange={(e) =>
                    setProfile({ ...profile, first_name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={profile.last_name}
                  onChange={(e) =>
                    setProfile({ ...profile, last_name: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="partner">Partner&apos;s Name</Label>
                <Input
                  id="partner"
                  value={profile.partner_name}
                  onChange={(e) =>
                    setProfile({ ...profile, partner_name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="wedding_date">Wedding Date</Label>
                <Input
                  id="wedding_date"
                  type="date"
                  value={profile.wedding_date}
                  onChange={(e) =>
                    setProfile({ ...profile, wedding_date: e.target.value })
                  }
                />
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Details"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Orders */}
      <h2 className="text-lg font-medium mb-4">Your Orders</h2>
      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No orders yet. Browse our collections to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={statusColours[order.status] as "default" | "secondary"}>
                      {statusLabels[order.status]}
                    </Badge>
                    <p className="text-sm font-medium mt-1">
                      &pound;{Number(order.total).toFixed(2)}
                    </p>
                  </div>
                </div>
                <Separator className="my-2" />
                <div className="space-y-1">
                  {order.order_items?.map((item) => (
                    <p key={item.id} className="text-sm text-muted-foreground">
                      {item.product?.name} &times; {item.quantity}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
