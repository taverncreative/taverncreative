import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Product, DesignCollection, ProductCategory } from "@/lib/types/database";

const categoryMap: Record<string, { dbCategory: ProductCategory; label: string; tagline: string }> = {
  "save-the-dates": {
    dbCategory: "save_the_dates",
    label: "Save the Dates",
    tagline: "Let them know the date — beautifully",
  },
  invitations: {
    dbCategory: "invitations",
    label: "Invitations",
    tagline: "Set the tone for your celebration",
  },
  "on-the-day": {
    dbCategory: "on_the_day",
    label: "On the Day",
    tagline: "Every detail, designed to match",
  },
  "thank-yous": {
    dbCategory: "thank_yous",
    label: "Thank Yous",
    tagline: "Say thanks beautifully",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const config = categoryMap[category];
  if (!config) return { title: "Not Found" };
  return {
    title: `${config.label} | TavernCreative`,
    description: `Browse our ${config.label.toLowerCase()} designs. Personalise online in seconds. Premium quality wedding stationery.`,
  };
}

// Psychology: pick 1-2 products for "Popular" badge
// Uses a stable hash so it doesn't change on reload
function isPopular(index: number, total: number): boolean {
  if (total < 4) return false;
  return index % 7 === 2;
}

export default async function ShopCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const config = categoryMap[category];
  if (!config) notFound();

  const supabase = await createClient();

  const { data: productTypes } = await supabase
    .from("product_types")
    .select("id")
    .eq("category", config.dbCategory);

  const typeIds = productTypes?.map((t) => t.id) || [];

  const { data: products } = await supabase
    .from("products")
    .select(
      "*, design_collection:design_collections(*), product_type:product_types(*)"
    )
    .in("product_type_id", typeIds)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  type ProductWithRelations = Product & {
    design_collection: DesignCollection;
  };

  const productList = (products || []) as ProductWithRelations[];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight">
          {config.label}
        </h1>
        <p className="mt-3 text-muted-foreground">{config.tagline}</p>
        {productList.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground/60">
            {productList.length} design{productList.length !== 1 ? "s" : ""} available
          </p>
        )}
      </div>

      {productList.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            No {config.label.toLowerCase()} available yet. Check back soon.
          </p>
          <Link
            href="/design"
            className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            Design yours now &rarr;
          </Link>
        </div>
      ) : (
        <>
          {/* Uniform grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {productList.map((product, i) => {
              const popular = isPopular(i, productList.length);

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group block"
                >
                  {/* Card with drop shadow + hover lift */}
                  <div className="relative rounded-lg overflow-hidden shadow-md transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1">
                    {product.mockup_images?.[0] ? (
                      <div className="relative aspect-[148/105]">
                        <img
                          src={product.mockup_images[0]}
                          alt={product.name}
                          className="w-full h-full object-contain bg-white"
                        />
                        {/* Paper texture overlay */}
                        <img
                          src="/texture-landscape.png"
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-multiply opacity-15"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[148/105] flex items-center justify-center bg-muted/20 text-muted-foreground text-xs">
                        Preview coming soon
                      </div>
                    )}

                    {/* Popular badge */}
                    {popular && (
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-foreground/90 text-background text-[10px] font-medium tracking-wide uppercase">
                        Popular
                      </span>
                    )}
                  </div>

                  <div className="mt-3 px-0.5">
                    <h3 className="font-medium text-sm group-hover:underline">
                      {product.name}
                    </h3>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        From &pound;{Number(product.base_price).toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground/40 italic">
                        per card
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* CTA at bottom */}
          <div className="mt-16 text-center">
            <p className="text-muted-foreground text-sm mb-4">
              Can&apos;t decide? Try our design tool — see your names on any design in seconds.
            </p>
            <Link
              href="/design"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              Start designing &rarr;
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
