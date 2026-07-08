import Link from "next/link";
import { EmptyShopNotice } from "@/components/status";
import { getCurrentShop, getDashboardStats } from "@/lib/data";
import { formatMoney } from "@/lib/format";

export default async function DashboardPage() {
  const { shop } = await getCurrentShop();
  if (!shop) return <EmptyShopNotice />;

  const stats = await getDashboardStats(shop.id);

  return (
    <>
      <header className="pageHead">
        <div>
          <h1>{shop.name}</h1>
          <p>Release 1 dashboard for listings, imports, and quote requests.</p>
        </div>
        <Link className="button buttonPrimary" href={`/shop/${shop.slug}/pricelist`} target="_blank">
          Open price list
        </Link>
      </header>
      <section className="grid3">
        <div className="stat">
          <span>Active listings</span>
          <strong>{stats.productCount}</strong>
        </div>
        <div className="stat">
          <span>Total quotes</span>
          <strong>{stats.quoteCount}</strong>
        </div>
        <div className="stat">
          <span>Quoted value</span>
          <strong>{formatMoney(stats.quoteValue)}</strong>
        </div>
      </section>
      <section className="panel" style={{ marginTop: 18 }}>
        <h2>Release 1 workflow</h2>
        <p className="muted">
          Add or import listings, publish your seller profile, then receive quote requests in the quote inbox.
        </p>
      </section>
    </>
  );
}
