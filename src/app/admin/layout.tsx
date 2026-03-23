import Link from "next/link";
import {
  LayoutDashboard,
  Palette,
  PoundSterling,
  Ruler,
  ShoppingCart,
  Sparkles,
} from "lucide-react";

const adminNav = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Upsell Options", href: "/admin/upsells", icon: Sparkles },
  { name: "Pricing Templates", href: "/admin/pricing", icon: PoundSterling },
  { name: "Design Templates", href: "/admin/templates", icon: Ruler },
  { name: "Collections", href: "/admin/collections", icon: Palette },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
];

// Fonts now loaded via custom-fonts.css (local .ttf/.otf files from public/Fonts/)

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-muted/20 p-4 hidden md:block">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-3">
          Admin
        </h2>
        <nav className="space-y-1">
          {adminNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 text-sm rounded-md text-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 p-6 lg:p-8">{children}</div>
    </div>
  );
}
