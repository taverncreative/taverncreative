"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import type { ProductCategory } from "@/lib/types/database";

const categoryLabels: Record<ProductCategory, string> = {
  save_the_dates: "Save the Dates",
  invitations: "Invitations",
  on_the_day: "On the Day",
  thank_yous: "Thank Yous",
};

interface PricingTemplate {
  id: string;
  name: string;
}

interface DesignTemplate {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  description: string | null;
  pricing_template: PricingTemplate | null;
  pricing_template_id: string | null;
  design_template_fields: { id: string; label: string; field_type: string }[];
  cross_sells: { cross_sell_template: { id: string; name: string } }[];
  sort_order: number;
}

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<DesignTemplate[]>([]);
  const [pricingTemplates, setPricingTemplates] = useState<PricingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "invitations" as ProductCategory,
    pricing_template_id: "",
    sort_order: 0,
  });

  async function fetchAll() {
    const [templatesRes, pricingRes] = await Promise.all([
      fetch("/api/admin/templates"),
      fetch("/api/admin/pricing"),
    ]);
    setTemplates(await templatesRes.json());
    setPricingTemplates(await pricingRes.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    setDialogOpen(false);
    setFormData({ name: "", category: "invitations", pricing_template_id: "", sort_order: 0 });
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this design template?")) return;
    await fetch(`/api/admin/templates/${id}`, { method: "DELETE" });
    fetchAll();
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  // Group by category
  const grouped = templates.reduce(
    (acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    },
    {} as Record<ProductCategory, DesignTemplate[]>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Design Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Product skeletons with pricing and personalisation fields
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Design Template</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., 5x7 Invitation"
                  required
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) =>
                    setFormData({ ...formData, category: v as ProductCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pricing Template</Label>
                <Select
                  value={formData.pricing_template_id}
                  onValueChange={(v) =>
                    setFormData({ ...formData, pricing_template_id: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pricing..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pricingTemplates.map((pt) => (
                      <SelectItem key={pt.id} value={pt.id}>
                        {pt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Create Template
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-8">
        {(Object.entries(categoryLabels) as [ProductCategory, string][]).map(
          ([category, label]) => {
            const items = grouped[category];
            if (!items?.length) return null;

            return (
              <div key={category}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {label}
                </h2>
                <div className="grid gap-3">
                  {items.map((template) => (
                    <Card key={template.id}>
                      <CardHeader className="flex flex-row items-center justify-between py-3">
                        <div>
                          <CardTitle className="text-base">
                            {template.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            {template.pricing_template && (
                              <Badge variant="secondary" className="text-xs">
                                {template.pricing_template.name}
                              </Badge>
                            )}
                            {template.design_template_fields?.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {template.design_template_fields.length} fields
                              </span>
                            )}
                            {template.cross_sells?.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {template.cross_sells.length} cross-sells
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/templates/${template.id}`}>
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(template.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}
