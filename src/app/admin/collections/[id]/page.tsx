"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Circle, CheckCircle2, Clock, Upload, X, Image as ImageIcon, Pencil } from "lucide-react";
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

interface DesignTemplate {
  id: string;
  name: string;
  category: string;
  pricing_template: { name: string } | null;
}

interface CommitLogEntry {
  id: string;
  action: string;
  committed_at: string;
}

interface CollectionProduct {
  id: string;
  design_template: DesignTemplate;
  status: "todo" | "in_progress" | "complete";
  is_live: boolean;
  committed_at: string | null;
  commit_log: CommitLogEntry[];
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
  preview_images: string[];
  local_assets?: string[];
}

interface AssetItem {
  url: string;
  name: string;
  source: string;
}

const statusIcons = {
  todo: <Circle className="h-4 w-4 text-muted-foreground" />,
  in_progress: <Clock className="h-4 w-4 text-amber-500" />,
  complete: <CheckCircle2 className="h-4 w-4 text-green-500" />,
};

const categoryLabels: Record<string, string> = {
  save_the_dates: "Save the Dates",
  invitations: "Invitations",
  on_the_day: "On the Day",
  thank_yous: "Thank Yous",
};

export default function CollectionDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<CollectionProduct[]>([]);
  const [allTemplates, setAllTemplates] = useState<DesignTemplate[]>([]);
  const [allAssets, setAllAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function fetchData() {
    const [colRes, prodsRes, templatesRes, assetsRes] = await Promise.all([
      fetch(`/api/admin/collections/${id}`),
      fetch(`/api/admin/collections/${id}/products`),
      fetch("/api/admin/templates"),
      fetch(`/api/admin/collections/${id}/assets`),
    ]);
    setCollection(await colRes.json());
    setProducts(await prodsRes.json());
    setAllTemplates(await templatesRes.json());
    const assetData = await assetsRes.json();
    setAllAssets(Array.isArray(assetData) ? assetData : []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [id]);

  // Templates not yet in this collection
  const existingTemplateIds = new Set(products.map((p) => p.design_template?.id));
  const availableTemplates = allTemplates.filter((t) => !existingTemplateIds.has(t.id));

  // Completion percentage
  const total = products.length;
  const complete = products.filter((p) => p.status === "complete").length;
  const percentage = total > 0 ? Math.round((complete / total) * 100) : 0;

  // File upload handler
  async function uploadFiles(files: FileList | File[]) {
    if (!files.length) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("collection_id", id);
    for (const file of Array.from(files)) {
      formData.append("files", file);
    }

    await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    // Refresh collection to get new images
    const colRes = await fetch(`/api/admin/collections/${id}`);
    setCollection(await colRes.json());
    setUploading(false);
  }

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length) uploadFiles(files);
  }, [id]);

  // Remove an asset
  async function removeAsset(url: string) {
    if (!collection) return;
    const updated = collection.preview_images.filter((img) => img !== url);
    await fetch(`/api/admin/collections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preview_images: updated }),
    });
    setCollection({ ...collection, preview_images: updated });
  }

  async function addTemplate(templateId: string) {
    await fetch(`/api/admin/collections/${id}/products`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", template_id: templateId }),
    });
    fetchData();
  }

  async function updateProductStatus(productId: string, status: "todo" | "in_progress" | "complete") {
    await fetch(`/api/admin/collections/${id}/products`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, status }),
    });
    fetchData();
  }

  async function toggleCommit(product: CollectionProduct) {
    await fetch(`/api/admin/collections/${id}/products`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.id, is_live: !product.is_live }),
    });
    fetchData();
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (!collection) return <p className="text-muted-foreground">Collection not found.</p>;

  // Use assets from the dedicated assets API (covers Supabase Storage + local)
  const assets = allAssets.map((a) => a.url);

  // Group products by category
  const grouped: Record<string, CollectionProduct[]> = {};
  for (const product of products) {
    const cat = product.design_template?.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(product);
  }

  return (
    <div>
      <Button variant="ghost" className="mb-4" onClick={() => router.push("/admin/collections")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Collections
      </Button>

      {/* Header with percentage */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{collection.name}</h1>
          {collection.description && (
            <p className="text-sm text-muted-foreground mt-1">{collection.description}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold">{percentage}%</div>
          <p className="text-sm text-muted-foreground">{complete}/{total} complete</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2 mb-8">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Asset Bank */}
      <Card className="mb-8">
        <CardHeader className="py-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ImageIcon className="h-3.5 w-3.5" />
            Design Assets ({assets.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Drag & drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors mb-4 ${
              dragOver
                ? "border-foreground bg-muted/50"
                : "border-border hover:border-foreground/30"
            }`}
          >
            {uploading ? (
              <p className="text-sm text-muted-foreground">Uploading...</p>
            ) : (
              <>
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-1">
                  Drag & drop design assets here
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  PNG, JPG, SVG, WebP — up to 10MB each
                </p>
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>Browse files</span>
                  </Button>
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) uploadFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </>
            )}
          </div>

          {/* Asset grid */}
          {assets.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {assets.map((url, i) => (
                <div key={i} className="relative group aspect-square rounded overflow-hidden bg-muted border border-border">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeAsset(url)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add template */}
      {availableTemplates.length > 0 && (
        <div className="mb-6">
          <Select onValueChange={addTemplate}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Add a design template..." />
            </SelectTrigger>
            <SelectContent>
              {availableTemplates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} ({categoryLabels[t.category] || t.category})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Products grid by category */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No design templates added yet. Use the dropdown above to add templates to this collection.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(categoryLabels).map(([cat, label]) => {
            const items = grouped[cat];
            if (!items?.length) return null;

            return (
              <div key={cat}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {label}
                </h2>
                <div className="grid gap-3">
                  {items.map((product) => (
                    <Card key={product.id}>
                      <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-3 w-3 rounded-full ${product.is_live ? "bg-green-500" : "bg-red-400"}`}
                            title={product.is_live ? "Live" : "Not live"}
                          />
                          {statusIcons[product.status]}
                          <div>
                            <Link
                              href={`/admin/templates/${product.design_template?.id}?collection=${id}&cp=${product.id}`}
                              className="font-medium text-sm hover:underline"
                            >
                              {product.design_template?.name}
                            </Link>
                            {product.design_template?.pricing_template && (
                              <p className="text-xs text-muted-foreground">
                                {product.design_template.pricing_template.name}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select
                            value={product.status}
                            onValueChange={(v) => updateProductStatus(product.id, v as "todo" | "in_progress" | "complete")}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="complete">Complete</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant={product.is_live ? "outline" : "default"}
                            size="sm"
                            onClick={() => toggleCommit(product)}
                            disabled={product.status !== "complete" && !product.is_live}
                          >
                            {product.is_live ? "Uncommit" : "Commit to Shop"}
                          </Button>
                        </div>
                      </CardContent>

                      {product.commit_log?.length > 0 && (
                        <CardContent className="pt-0 pb-3">
                          <div className="text-xs text-muted-foreground space-y-0.5 border-t border-border pt-2">
                            {product.commit_log
                              .sort((a, b) => new Date(b.committed_at).getTime() - new Date(a.committed_at).getTime())
                              .slice(0, 3)
                              .map((log) => (
                                <p key={log.id}>
                                  {log.action === "committed" ? "Committed" : "Uncommitted"} on{" "}
                                  {new Date(log.committed_at).toLocaleDateString("en-GB", {
                                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                                  })}
                                </p>
                              ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
