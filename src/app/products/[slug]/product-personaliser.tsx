"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/components/providers/cart-provider";
import type { PersonalisationField } from "@/lib/types/database";

interface ProductInfo {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  designCollectionName: string;
  mockupImage: string | null;
}

interface Props {
  product: ProductInfo;
  fields: PersonalisationField[];
}

const quantityPresets = [25, 50, 75, 100, 150];

export function ProductPersonaliser({ product, fields }: Props) {
  const router = useRouter();
  const { addItem } = useCart();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(50);
  const [customQty, setCustomQty] = useState("");
  const [added, setAdded] = useState(false);

  function updateField(label: string, value: string) {
    setFormData((prev) => ({ ...prev, [label]: value }));
  }

  function handleAddToCart() {
    // Validate required fields
    for (const field of fields) {
      if (field.is_required && !formData[field.label]?.trim()) {
        alert(`Please fill in "${field.label}"`);
        return;
      }
    }

    const qty = customQty ? parseInt(customQty) : quantity;
    if (qty < 1) return;

    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      designCollectionName: product.designCollectionName,
      mockupImage: product.mockupImage,
      quantity: qty,
      unitPrice: product.basePrice,
      personalisationData: formData,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="mt-8">
      {fields.length > 0 && (
        <>
          <Separator className="mb-6" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Personalise Your Design
          </h3>
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.id}>
                <Label htmlFor={field.id} className="text-sm">
                  {field.label}
                  {field.is_required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>

                {field.field_type === "text" && (
                  <Input
                    id={field.id}
                    value={formData[field.label] || ""}
                    onChange={(e) =>
                      updateField(field.label, e.target.value)
                    }
                    placeholder={field.placeholder || ""}
                    className="mt-1"
                  />
                )}

                {field.field_type === "textarea" && (
                  <Textarea
                    id={field.id}
                    value={formData[field.label] || ""}
                    onChange={(e) =>
                      updateField(field.label, e.target.value)
                    }
                    placeholder={field.placeholder || ""}
                    rows={3}
                    className="mt-1"
                  />
                )}

                {field.field_type === "date" && (
                  <Input
                    id={field.id}
                    type="date"
                    value={formData[field.label] || ""}
                    onChange={(e) =>
                      updateField(field.label, e.target.value)
                    }
                    className="mt-1"
                  />
                )}

                {field.field_type === "time" && (
                  <Input
                    id={field.id}
                    type="time"
                    value={formData[field.label] || ""}
                    onChange={(e) =>
                      updateField(field.label, e.target.value)
                    }
                    className="mt-1"
                  />
                )}

                {field.field_type === "select" && field.options && (
                  <Select
                    value={formData[field.label] || ""}
                    onValueChange={(v) => updateField(field.label, v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue
                        placeholder={field.placeholder || "Select..."}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(field.options as unknown as { value: string; label: string }[]).map(
                        (opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Quantity */}
      <Separator className="my-6" />
      <div>
        <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Quantity
        </Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {quantityPresets.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setQuantity(q);
                setCustomQty("");
              }}
              className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                quantity === q && !customQty
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground/50"
              }`}
            >
              {q}
            </button>
          ))}
          <Input
            type="number"
            min="1"
            placeholder="Custom"
            value={customQty}
            onChange={(e) => setCustomQty(e.target.value)}
            className="w-24"
          />
        </div>
      </div>

      {/* Price */}
      <div className="mt-6 flex items-baseline justify-between">
        <p className="text-lg font-medium">
          &pound;
          {(
            product.basePrice * (customQty ? parseInt(customQty) || 0 : quantity)
          ).toFixed(2)}
        </p>
        <p className="text-sm text-muted-foreground">
          &pound;{product.basePrice.toFixed(2)} per item
        </p>
      </div>

      {/* Add to cart */}
      <Button
        className="w-full mt-4"
        size="lg"
        onClick={handleAddToCart}
        disabled={added}
      >
        {added ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Added to Cart
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4 mr-2" />
            Add to Cart
          </>
        )}
      </Button>
    </div>
  );
}
