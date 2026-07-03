import Link from "next/link";
import { notFound } from "next/navigation";
import { getShopBySlug } from "@/lib/data";

export default async function PublicShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  return (
    <main className="publicShell">
      <nav className="publicNav">
        <strong>{shop.name}</strong>
        <div>
          <Link href={`/shop/${shop.slug}/pricelist`}>Price list</Link>
        </div>
      </nav>
      <section className="hero">
        {shop.logo_url ? <img alt="" src={shop.logo_url} style={{ maxHeight: 72, maxWidth: 180 }} /> : null}
        <h1>{shop.name}</h1>
        <p>{shop.tagline || "Browse parts, build a quote list, and send a request directly to this shop."}</p>
        <div className="heroActions">
          <Link className="button buttonPrimary" href={`/shop/${shop.slug}/pricelist`}>
            Open price list
          </Link>
          {shop.messenger_url ? (
            <Link className="button buttonGhost" href={shop.messenger_url} target="_blank">
              Message on Messenger
            </Link>
          ) : null}
          {shop.facebook_page_url ? (
            <Link className="button buttonGhost" href={shop.facebook_page_url} target="_blank">
              Facebook Page
            </Link>
          ) : null}
        </div>
        <p className="muted" style={{ marginTop: 20 }}>
          {[shop.address, shop.phone].filter(Boolean).join(" · ")}
        </p>
      </section>
    </main>
  );
}

