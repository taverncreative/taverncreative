import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { DesignCollection } from "@/lib/types/database";

export const metadata = {
  title: "Collections",
  description: "Browse our wedding stationery design collections",
};

export default async function CollectionsPage() {
  const supabase = await createClient();
  const { data: collections } = await supabase
    .from("design_collections")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight">
          Our Collections
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          Each collection is a complete design suite — from save the dates
          through to thank you cards, all beautifully coordinated.
        </p>
      </div>

      {!collections || collections.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            Collections are coming soon. Check back shortly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((collection: DesignCollection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.slug}`}
              className="group"
            >
              <div className="relative aspect-[4/3] rounded-xl bg-muted/40 overflow-hidden shadow-md transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1 mb-4">
                {collection.hero_image_url ? (
                  <img
                    src={collection.hero_image_url}
                    alt={collection.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <span className="text-4xl font-light">
                      {collection.name[0]}
                    </span>
                  </div>
                )}
                <img
                  src="/texture-landscape.png"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-multiply opacity-15"
                />
              </div>
              <h2 className="text-lg font-medium group-hover:underline">
                {collection.name}
              </h2>
              {collection.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {collection.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
