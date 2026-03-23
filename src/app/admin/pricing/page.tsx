"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PricingTier {
  id?: string;
  min_quantity: number;
  max_quantity: number | null;
  unit_price: number;
}

interface UpsellOption {
  id: string;
  name: string;
  price_per_unit: number;
}

interface PricingTemplateUpsell {
  upsell_option_id: string;
  upsell_options: UpsellOption;
}

interface PricingTemplate {
  id: string;
  name: string;
  unit_weight_grams: number;
  shipping_override: boolean;
  shipping_override_note: string | null;
  pricing_tiers: PricingTier[];
  pricing_template_upsells: PricingTemplateUpsell[];
}

export default function AdminPricing() {
  const [templates, setTemplates] = useState<PricingTemplate[]>([]);
  const [allUpsells, setAllUpsells] = useState<UpsellOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [unitWeightGrams, setUnitWeightGrams] = useState(0);
  const [shippingOverride, setShippingOverride] = useState(false);
  const [shippingOverrideNote, setShippingOverrideNote] = useState("");
  const [tiers, setTiers] = useState<PricingTier[]>([
    { min_quantity: 25, max_quantity: 49, unit_price: 1.5 },
    { min_quantity: 50, max_quantity: 99, unit_price: 1.25 },
    { min_quantity: 100, max_quantity: null, unit_price: 1.0 },
  ]);
  const [selectedUpsellIds, setSelectedUpsellIds] = useState<string[]>([]);

  async function fetchData() {
    const [pRes, uRes] = await Promise.all([
      fetch("/api/admin/pricing"),
      fetch("/api/admin/upsells"),
    ]);
    setTemplates(await pRes.json());
    setAllUpsells(await uRes.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  function openCreate() {
    setEditingId(null);
    setName("");
    setUnitWeightGrams(0);
    setShippingOverride(false);
    setShippingOverrideNote("");
    setTiers([
      { min_quantity: 25, max_quantity: 49, unit_price: 1.5 },
      { min_quantity: 50, max_quantity: 99, unit_price: 1.25 },
      { min_quantity: 100, max_quantity: null, unit_price: 1.0 },
    ]);
    setSelectedUpsellIds([]);
    setDialogOpen(true);
  }

  function openEdit(t: PricingTemplate) {
    setEditingId(t.id);
    setName(t.name);
    setUnitWeightGrams(t.unit_weight_grams || 0);
    setShippingOverride(t.shipping_override || false);
    setShippingOverrideNote(t.shipping_override_note || "");
    setTiers(
      t.pricing_tiers
        .sort((a, b) => a.min_quantity - b.min_quantity)
        .map((tier) => ({
          min_quantity: tier.min_quantity,
          max_quantity: tier.max_quantity,
          unit_price: Number(tier.unit_price),
        }))
    );
    setSelectedUpsellIds(
      (t.pricing_template_upsells || []).map((ptu) => ptu.upsell_option_id || (ptu.upsell_options as UpsellOption)?.id).filter(Boolean)
    );
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name,
      unit_weight_grams: unitWeightGrams,
      shipping_override: shippingOverride,
      shipping_override_note: shippingOverride ? shippingOverrideNote : null,
      tiers,
      upsell_option_ids: selectedUpsellIds,
    };

    if (editingId) {
      await fetch(`/api/admin/pricing/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setDialogOpen(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this pricing template?")) return;
    await fetch(`/api/admin/pricing/${id}`, { method: "DELETE" });
    fetchData();
  }

  function toggleUpsell(upsellId: string) {
    setSelectedUpsellIds((prev) =>
      prev.includes(upsellId) ? prev.filter((id) => id !== upsellId) : [...prev, upsellId]
    );
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pricing Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define quantity tiers, attach upsells, and set shipping weight
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Pricing Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Pricing Template" : "New Pricing Template"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Standard Invitation Pricing"
                  required
                />
              </div>

              {/* Quantity Tiers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">Quantity Tiers</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setTiers([...tiers, { min_quantity: 0, max_quantity: null, unit_price: 0 }])
                    }
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Tier
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Customer enters exact qty — system picks the highest breakpoint ≤ their order
                </p>
                <div className="space-y-2">
                  {tiers.map((tier, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-12">From</span>
                      <Input
                        type="number"
                        value={tier.min_quantity}
                        onChange={(e) => {
                          const updated = [...tiers];
                          updated[i].min_quantity = parseInt(e.target.value) || 0;
                          setTiers(updated);
                        }}
                        placeholder="Qty"
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">→</span>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          £
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          value={tier.unit_price}
                          onChange={(e) => {
                            const updated = [...tiers];
                            updated[i].unit_price = parseFloat(e.target.value) || 0;
                            setTiers(updated);
                          }}
                          className="w-24 pl-6"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">each</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setTiers(tiers.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upsells — pick from reusable pool */}
              <div>
                <Label className="text-sm font-semibold">Upsells</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select which upsell options apply to this pricing template
                </p>
                {allUpsells.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No upsell options created yet. Go to{" "}
                    <a href="/admin/upsells" className="underline">
                      Upsell Options
                    </a>{" "}
                    to create some first.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allUpsells.map((u) => {
                      const isSelected = selectedUpsellIds.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleUpsell(u.id)}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                            isSelected
                              ? "border-foreground bg-foreground text-background"
                              : "border-border hover:border-foreground/50"
                          }`}
                        >
                          {u.name} (+£{Number(u.price_per_unit).toFixed(2)})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Weight & Shipping */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Shipping</Label>
                <div>
                  <Label className="text-xs">Unit Weight (grams)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={unitWeightGrams}
                      onChange={(e) => setUnitWeightGrams(parseInt(e.target.value) || 0)}
                      className="w-28"
                      placeholder="e.g., 15"
                    />
                    <span className="text-xs text-muted-foreground">grams per unit</span>
                  </div>
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shippingOverride}
                    onChange={(e) => setShippingOverride(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-sm">Override standard shipping</span>
                    <p className="text-xs text-muted-foreground">
                      Use for oversized items that need special courier (e.g., table plans)
                    </p>
                  </div>
                </label>
                {shippingOverride && (
                  <div>
                    <Label className="text-xs">Shipping Note</Label>
                    <Input
                      value={shippingOverrideNote}
                      onChange={(e) => setShippingOverrideNote(e.target.value)}
                      placeholder="e.g., Requires special courier due to size"
                    />
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full">
                {editingId ? "Save Changes" : "Create Pricing Template"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No pricing templates yet. Create one to define your quantity tiers.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => {
            const upsells = (template.pricing_template_upsells || [])
              .map((ptu) => ptu.upsell_options)
              .filter(Boolean);
            return (
              <Card key={template.id}>
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {template.unit_weight_grams > 0 && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Package className="h-3 w-3" />
                        {template.unit_weight_grams}g
                      </Badge>
                    )}
                    {template.shipping_override && (
                      <Badge variant="outline" className="text-xs gap-1 border-amber-400 text-amber-600">
                        <Truck className="h-3 w-3" />
                        Special shipping
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(template)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-4">
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Tiers
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {template.pricing_tiers
                          .sort((a, b) => a.min_quantity - b.min_quantity)
                          .map((tier, i) => (
                            <span
                              key={i}
                              className="text-xs bg-muted px-2 py-1 rounded"
                            >
                              {tier.min_quantity}+ → £{Number(tier.unit_price).toFixed(2)}
                            </span>
                          ))}
                      </div>
                    </div>
                    {upsells.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                          Upsells
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {upsells.map((upsell, i) => (
                            <span
                              key={i}
                              className="text-xs bg-muted px-2 py-1 rounded"
                            >
                              {upsell.name} +£{Number(upsell.price_per_unit).toFixed(2)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
