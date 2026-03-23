"use client";

import { usePathname } from "next/navigation";
import { Header } from "./header";
import { Footer } from "./footer";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDesignTool = pathname.startsWith("/design");

  if (isDesignTool) {
    // Design tool handles its own chrome
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
