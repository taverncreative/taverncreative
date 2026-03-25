"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Upload, Merge, CheckSquare, Square, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import JSZip from "jszip";

interface CollectionStats {
  total: number;
  complete: number;
  live: number;
  pct: number;
}

interface DesignCollection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_published: boolean;
  preview_images: string[];
  hero_image_url: string | null;
  _stats: CollectionStats;
}

interface UploadResult {
  designName: string;
  slug: string;
  collectionId: string;
  isNew: boolean;
  textFile: boolean;
}

export default function AdminCollections() {
  const router = useRouter();
  const [collections, setCollections] = useState<DesignCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DesignCollection | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  // Bulk upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, name: "" });
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [productType, setProductType] = useState("save_the_dates");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<{ textFiles: Map<string, File>; notextFiles: Map<string, File> } | null>(null);

  // Selection state for merge
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  // Search
  const [search, setSearch] = useState("");

  async function fetchCollections() {
    const res = await fetch("/api/admin/collections");
    setCollections(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchCollections(); }, []);

  function openCreate() {
    setEditing(null);
    setFormData({ name: "", description: "" });
    setDialogOpen(true);
  }

  function openEdit(collection: DesignCollection) {
    setEditing(collection);
    setFormData({ name: collection.name, description: collection.description || "" });
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
      router.push(`/admin/collections/${created.id}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this collection and all its products?")) return;
    await fetch(`/api/admin/collections/${id}`, { method: "DELETE" });
    fetchCollections();
  }

  // Extract design name from filename: "Autumn-01.png" -> "Autumn"
  function extractDesignName(filename: string): string {
    const base = filename.replace(/\.[^.]+$/, ""); // remove extension
    return base.replace(/-\d+$/, "").trim(); // remove trailing -01 etc
  }

  // Handle zip drop/select
  async function handleZipFiles(files: FileList) {
    const textFiles = new Map<string, File>();
    const notextFiles = new Map<string, File>();

    for (const file of Array.from(files)) {
      if (file.name.endsWith(".zip")) {
        // Extract zip
        const zip = await JSZip.loadAsync(file);
        for (const [zipPath, zipEntry] of Object.entries(zip.files)) {
          if (zipEntry.dir || !zipPath.match(/\.(png|jpg|jpeg|webp)$/i)) continue;
          const pathLower = zipPath.toLowerCase();
          const fileName = zipPath.split("/").pop() || "";
          const designName = extractDesignName(fileName);
          if (!designName) continue;

          const blob = await zipEntry.async("blob");
          const f = new File([blob], fileName, { type: "image/png" });

          if (pathLower.includes("no text") || pathLower.includes("notext") || pathLower.includes("no_text")) {
            notextFiles.set(designName, f);
          } else if (pathLower.includes("text")) {
            textFiles.set(designName, f);
          }
        }
      } else if (file.name.match(/\.(png|jpg|jpeg|webp)$/i)) {
        // Individual file — ask which type later
        const designName = extractDesignName(file.name);
        if (designName) notextFiles.set(designName, file);
      }
    }

    if (textFiles.size === 0 && notextFiles.size === 0) {
      alert("No valid image files found. Make sure your zip contains 'Text' and 'No Text' folders with PNG files.");
      return;
    }

    setPendingFiles({ textFiles, notextFiles });
    // Skip the dialog — process immediately
    processUploadDirect({ textFiles, notextFiles });
  }

  async function processUploadDirect(files: { textFiles: Map<string, File>; notextFiles: Map<string, File> }) {
    setUploading(true);
    setUploadResults([]);

    const { textFiles, notextFiles } = files;
    const allNames = new Set([...textFiles.keys(), ...notextFiles.keys()]);
    const total = allNames.size * 2;
    let current = 0;

    const results: UploadResult[] = [];

    for (const name of allNames) {
      const notextFile = notextFiles.get(name);
      if (notextFile) {
        setUploadProgress({ current: ++current, total, name: `${name} (artwork)` });
        const fd = new FormData();
        fd.append("file", notextFile);
        fd.append("designName", name);
        fd.append("fileType", "notext");
        const res = await fetch("/api/admin/bulk-upload", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          results.push({ ...data, textFile: false });
        }
      }

      const textFile = textFiles.get(name);
      if (textFile) {
        setUploadProgress({ current: ++current, total, name: `${name} (product)` });
        const fd = new FormData();
        fd.append("file", textFile);
        fd.append("designName", name);
        fd.append("fileType", "text");
        await fetch("/api/admin/bulk-upload", { method: "POST", body: fd });
        const existing = results.find((r) => r.designName === name);
        if (existing) existing.textFile = true;
      }
    }

    setUploadResults(results);
    setUploading(false);
    setPendingFiles(null);
    fetchCollections();
  }

  // Merge selected collections
  async function handleMerge() {
    const ids = Array.from(selected);
    if (ids.length < 2) return;
    const target = collections.find((c) => c.id === ids[0]);
    if (!confirm(`Merge ${ids.length} collections into "${target?.name}"?`)) return;

    await fetch("/api/admin/collections/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: ids[0], sourceIds: ids.slice(1) }),
    });
    setSelected(new Set());
    setSelectMode(false);
    fetchCollections();
  }

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  // Filter
  const filtered = collections.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p className="text-muted-foreground p-4">Loading...</p>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Collections</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {collections.length} collection{collections.length !== 1 ? "s" : ""} — upload assets, track completion
          </p>
        </div>
        <div className="flex gap-2">
          {selected.size >= 2 && (
            <Button variant="outline" onClick={handleMerge}>
              <Merge className="h-4 w-4 mr-2" />
              Merge ({selected.size})
            </Button>
          )}
          {selected.size >= 1 && (
            <Button variant="outline" onClick={async () => {
              if (!confirm(`Delete ${selected.size} collection${selected.size > 1 ? "s" : ""}?`)) return;
              for (const cid of selected) { await handleDelete(cid); }
              setSelected(new Set());
              setSelectMode(false);
            }}>
              <Trash2 className="h-4 w-4 mr-2 text-destructive" />
              Delete ({selected.size})
            </Button>
          )}
          {selected.size > 0 && (
            <Button variant="ghost" size="sm" onClick={() => { setSelectMode(false); setSelected(new Set()); }}>
              Cancel
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> New</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit Collection" : "New Collection"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Wildflower" required /></div>
                <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional" rows={2} /></div>
                <Button type="submit" className="w-full">{editing ? "Save" : "Create"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk Upload Drop Zone */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-foreground/30 transition-colors cursor-pointer"
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-foreground/40", "bg-muted/30"); }}
            onDragLeave={(e) => { e.currentTarget.classList.remove("border-foreground/40", "bg-muted/30"); }}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-foreground/40", "bg-muted/30"); handleZipFiles(e.dataTransfer.files); }}
            onClick={() => { const input = document.createElement("input"); input.type = "file"; input.multiple = true; input.accept = ".zip,.png,.jpg,.webp"; input.onchange = (e) => { const files = (e.target as HTMLInputElement).files; if (files) handleZipFiles(files); }; input.click(); }}
          >
            <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium text-sm">Drop ZIP files or images here</p>
            <p className="text-xs text-muted-foreground mt-1">
              ZIP should contain &quot;Text&quot; and &quot;No Text&quot; folders with PNG files
            </p>
          </div>

          {/* Upload progress */}
          {uploading && (
            <div className="mt-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-foreground transition-all" style={{ width: `${uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%` }} />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {uploadProgress.current}/{uploadProgress.total}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Processing: {uploadProgress.name}</p>
            </div>
          )}

          {/* Upload results */}
          {uploadResults.length > 0 && !uploading && (
            <div className="mt-4 p-3 rounded-lg bg-muted/30">
              <p className="text-sm font-medium mb-2">
                Upload complete — {uploadResults.filter((r) => r.isNew).length} new, {uploadResults.filter((r) => !r.isNew).length} updated
              </p>
              <div className="flex flex-wrap gap-1.5">
                {uploadResults.map((r) => (
                  <Badge key={r.slug} variant={r.isNew ? "default" : "secondary"} className="text-xs">
                    {r.designName} {r.isNew ? "(new)" : "(updated)"}
                  </Badge>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setUploadResults([])}>Dismiss</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload dialog removed — uploads process immediately */}

      {/* Search */}
      {collections.length > 10 && (
        <div className="mb-4">
          <Input placeholder="Search collections..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs h-8 text-sm" />
        </div>
      )}

      {/* Collection Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {search ? "No collections match your search." : "No collections yet. Upload a ZIP or create one manually."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((collection) => {
            const stats = collection._stats;
            const isSelected = selected.has(collection.id);

            return (
              <Card key={collection.id} className={`group relative overflow-hidden transition-all ${isSelected ? "ring-2 ring-foreground" : ""}`}>
                {/* Checkbox — always visible in corner */}
                <button className="absolute top-2 left-2 z-10 opacity-40 hover:opacity-100 transition-opacity" onClick={() => { if (!selectMode) setSelectMode(true); toggleSelect(collection.id); }}>
                  {isSelected
                    ? <CheckSquare className="h-5 w-5 text-foreground" />
                    : <Square className="h-5 w-5 text-muted-foreground" />}
                </button>

                {/* Thumbnail — show full design, no cropping */}
                <div className="aspect-[148/105] bg-white overflow-hidden flex items-center justify-center">
                  {collection.preview_images?.[0] ? (
                    <img src={collection.preview_images[0]} alt="" className="max-w-full max-h-full object-contain" />
                  ) : collection.hero_image_url ? (
                    <img src={collection.hero_image_url} alt="" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="text-xs text-muted-foreground">No assets</div>
                  )}
                </div>

                {/* Info */}
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm truncate">{collection.name}</h3>
                      {stats.total > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {stats.complete}/{stats.total} complete · {stats.live} live
                        </p>
                      )}
                    </div>
                    {stats.total > 0 && (
                      <span className={`text-xs font-semibold shrink-0 ${stats.pct === 100 ? "text-green-600" : stats.pct > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                        {stats.pct}%
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {stats.total > 0 && (
                    <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full transition-all ${stats.pct === 100 ? "bg-green-500" : "bg-amber-500"}`} style={{ width: `${stats.pct}%` }} />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 mt-2">
                    <Link href={`/admin/collections/${collection.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full h-7 text-xs">Open</Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(collection)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(collection.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
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
