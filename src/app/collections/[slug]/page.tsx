import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Product, ProductType, ProductCategory } from "@/lib/types/database";

const categoryOrder: ProductCategory[] = [
  "save_the_dates",
  "invitations",
  "on_the_day",
  "thank_yous",
];

const categoryLabels: Record<ProductCategory, string> = {
  save_the_dates: "Save the Dates",
  invitations: "Invitations",
  on_the_day: "On the Day",
  thank_yous: "Thank Yous",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("design_collections")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!data) return { title: "Collection Not Found" };
  return {
    title: data.name,
    description: data.description || `Browse the ${data.name} collection`,
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: collection } = await supabase
    .from("design_collections")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!collection) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("*, product_type:product_types(*)")
    .eq("design_collection_id", collection.id)
    .eq("is_published", true)
    .order("created_at", { ascending: true });

  type ProductWithType = Product & { product_type: ProductType };

  // Group products by category
  const grouped: Partial<Record<ProductCategory, ProductWithType[]>> = {};
  if (products) {
    for (const product of products as ProductWithType[]) {
      const cat = product.product_type.category as ProductCategory;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat]!.push(product);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Collection header */}
      <div className="mb-12">
        <Link
          href="/collections"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; All Collections
        </Link>
        <h1 className="mt-4 text-3xl sm:text-4xl font-light tracking-tight">
          {collection.name}
        </h1>
        {collection.description && (
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
            {collection.description}
          </p>
        )}
      </div>

      {/* Products grouped by category */}
      {categoryOrder.map((category) => {
        const categoryProducts = grouped[category];
        if (!categoryProducts?.length) return null;

        return (
          <section key={category} className="mb-12">
            <h2 className="text-xl font-medium mb-6">
              {categoryLabels[category]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-white shadow-md transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1 mb-3">
                    {product.mockup_images?.[0] ? (
                      <img
                        src={product.mockup_images[0]}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        Preview coming soon
                      </div>
                    )}
                    <img
                      src="/texture-landscape.webp"
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-multiply opacity-15"
                    />
                  </div>
                  <h3 className="font-medium group-hover:underline">
                    {product.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    From &pound;{Number(product.base_price).toFixed(2)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {(!products || products.length === 0) && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            Products for this collection are coming soon.
          </p>
        </div>
      )}
    </div>
  );
}
