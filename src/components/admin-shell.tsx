import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/server/actions";
import type { Shop } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/app", label: "Overview" },
  { href: "/app/products", label: "Products" },
  { href: "/app/imports", label: "Imports" },
  { href: "/app/quotes", label: "Quotes" },
  { href: "/app/settings", label: "Settings" }
];

export function AdminShell({ shop, children }: { shop: Shop | null; children: ReactNode }) {
  return (
    <div className="adminShell">
      <aside className="sidebar">
        <Link className="brandMark" href="/app">
          <span>U</span>
          <strong>Uncapped.gg</strong>
        </Link>
        <nav>
          {NAV_ITEMS.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        {shop ? (
          <Link className="publicLink" href={`/shop/${shop.slug}`} target="_blank">
            View public shop
          </Link>
        ) : null}
        <form action={signOut}>
          <button className="button buttonGhost" type="submit">
            Sign out
          </button>
        </form>
      </aside>
      <main className="adminMain">{children}</main>
    </div>
  );
}
