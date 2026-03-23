"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface DesignCollection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_published: boolean;
  preview_images: string[];
}

export default function AdminCollections() {
  const router = useRouter();
  const [collections, setCollections] = useState<DesignCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DesignCollection | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  async function fetchCollections() {
    const res = await fetch("/api/admin/collections");
    setCollections(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchCollections();
  }, []);

  function openCreate() {
    setEditing(null);
    setFormData({ name: "", description: "" });
    setDialogOpen(true);
  }

  function openEdit(collection: DesignCollection) {
    setEditing(collection);
    setFormData({
      name: collection.name,
      description: collection.description || "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await fetch(`/api/admin/collections/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setDialogOpen(false);
      fetchCollections();
    } else {
      const res = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const created = await res.json();
      setDialogOpen(false);
      // Go straight to the collection dashboard to upload assets
      router.push(`/admin/collections/${created.id}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this collection and all its products?")) return;
    await fetch(`/api/admin/collections/${id}`, { method: "DELETE" });
    fetchCollections();
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Collections</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Design packs — upload assets and track completion across templates
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Collection" : "New Collection"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Wildflower"
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this design collection..."
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full">
                {editing ? "Save Changes" : "Create Collection"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {collections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No collections yet. Create your first design collection (e.g., Wildflower).
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {collections.map((collection) => (
            <Card key={collection.id}>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  {/* Show first asset as thumbnail */}
                  {collection.preview_images?.length > 0 ? (
                    <div className="w-12 h-12 rounded overflow-hidden bg-muted shrink-0">
                      <img
                        src={collection.preview_images[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded bg-muted shrink-0 flex items-center justify-center text-xs text-muted-foreground">
                      No assets
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-base">{collection.name}</CardTitle>
                    {collection.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {collection.description}
                      </p>
                    )}
                    {collection.preview_images?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {collection.preview_images.length} asset{collection.preview_images.length !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/collections/${collection.id}`}>
                    <Button variant="outline" size="sm">
                      Open Dashboard
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(collection)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(collection.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
