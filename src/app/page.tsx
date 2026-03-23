import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
  {
    name: "Save the Dates",
    description: "Share the news with something beautiful",
    href: "/shop/save-the-dates",
    colour: "bg-rose-50",
  },
  {
    name: "Invitations",
    description: "Set the tone for your perfect day",
    href: "/shop/invitations",
    colour: "bg-amber-50",
  },
  {
    name: "On the Day",
    description: "Menus, place cards, order of service & more",
    href: "/shop/on-the-day",
    colour: "bg-emerald-50",
  },
  {
    name: "Thank Yous",
    description: "Say thanks in style",
    href: "/shop/thank-yous",
    colour: "bg-sky-50",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-foreground">
              Wedding stationery,{" "}
              <span className="font-semibold">designed in seconds</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Answer a few quick questions and we&apos;ll create a personalised
              design for you — no fuss, no forms, just beautiful stationery
              with your details on it.
            </p>
            <div className="mt-8 flex gap-4">
              <Button asChild size="lg">
                <Link href="/design">
                  Start designing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/collections">
                  Browse collections
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Moment */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight">
            Shop by moment
          </h2>
          <p className="mt-2 text-muted-foreground">
            Everything you need, from the first announcement to the last
            thank you
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group"
            >
              <div
                className={`${category.colour} rounded-xl p-8 h-48 flex flex-col justify-end transition-all group-hover:shadow-md group-hover:-translate-y-1`}
              >
                <h3 className="text-lg font-medium text-foreground">
                  {category.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Collections preview */}
      <section className="bg-muted/20 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight">
              Our collections
            </h2>
            <p className="mt-2 text-muted-foreground">
              Each collection is a complete suite — save the dates through
              to thank you cards, all in one beautiful design
            </p>
          </div>

          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Collections coming soon — check back shortly.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/collections">View All Collections</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
