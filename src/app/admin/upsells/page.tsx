"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface UpsellOption {
  id: string;
  name: string;
  price_per_unit: number;
}

export default function AdminUpsells() {
  const [upsells, setUpsells] = useState<UpsellOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  async function fetchUpsells() {
    const res = await fetch("/api/admin/upsells");
    setUpsells(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchUpsells();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await fetch("/api/admin/upsells", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        price_per_unit: parseFloat(newPrice) || 0,
      }),
    });
    setNewName("");
    setNewPrice("");
    fetchUpsells();
  }

  function startEdit(u: UpsellOption) {
    setEditingId(u.id);
    setEditName(u.name);
    setEditPrice(String(Number(u.price_per_unit)));
  }

  async function saveEdit() {
    if (!editingId) return;
    await fetch(`/api/admin/upsells/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        price_per_unit: parseFloat(editPrice) || 0,
      }),
    });
    setEditingId(null);
    fetchUpsells();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this upsell option? It will be removed from all pricing templates using it.")) return;
    await fetch(`/api/admin/upsells/${id}`, { method: "DELETE" });
    fetchUpsells();
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Upsell Options</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create reusable upsells like &ldquo;Make it double sided&rdquo; or &ldquo;Add wax seal&rdquo;. Attach them to pricing templates.
        </p>
      </div>

      {/* Create new */}
      <form onSubmit={handleCreate} className="flex items-end gap-3 mb-6">
        <div className="flex-1">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g., Make it double sided"
          />
        </div>
        <div className="w-32 relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            +£
          </span>
          <Input
            type="number"
            step="0.01"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            placeholder="0.30"
            className="pl-7"
          />
        </div>
        <span className="text-xs text-muted-foreground pb-2">per unit</span>
        <Button type="submit" disabled={!newName.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </form>

      {upsells.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No upsell options yet. Create one above.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {upsells.map((u) => (
            <Card key={u.id}>
              <CardContent className="py-3 flex items-center justify-between">
                {editingId === u.id ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 h-8"
                    />
                    <span className="text-sm text-muted-foreground">+£</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-24 h-8"
                    />
                    <span className="text-xs text-muted-foreground">each</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={saveEdit}>
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{u.name}</span>
                      <span className="text-sm text-muted-foreground">
                        +£{Number(u.price_per_unit).toFixed(2)} per unit
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(u)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(u.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
