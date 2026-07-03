import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteRequestForm } from "@/components/action-forms";
import { getActiveProducts, getShopBySlug } from "@/lib/data";

export default async function PublicPriceListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  const products = await getActiveProducts(shop.id);

  return (
    <main className="publicShell">
      <nav className="publicNav">
        <Link href={`/shop/${shop.slug}`}>
          <strong>{shop.name}</strong>
        </Link>
        <div>
          {shop.messenger_url ? (
            <Link href={shop.messenger_url} target="_blank">
              Messenger
            </Link>
          ) : null}
          {shop.facebook_page_url ? (
            <Link href={shop.facebook_page_url} target="_blank">
              Facebook
            </Link>
          ) : null}
        </div>
      </nav>
      <section className="publicContent">
        <header className="pageHead">
          <div>
            <h1>Price list</h1>
            <p>Select quantities beside the parts you want quoted, then send a quote request.</p>
          </div>
        </header>
        {products.length ? (
          <QuoteRequestForm shop={shop} products={products} />
        ) : (
          <section className="notice">This shop has not published products yet.</section>
        )}
      </section>
    </main>
  );
}

